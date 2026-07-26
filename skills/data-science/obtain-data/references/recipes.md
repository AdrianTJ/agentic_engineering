# Obtain-data recipes

Dense command reference. Load when you need the exact invocation; the workflow
(save raw first, record provenance, respect the source) is in `../SKILL.md`.

## Contents
- Fetching
- Authentication
- Pagination
- Retries and rate limits
- JSON to rows
- HTML tables
- Databases and spreadsheets
- Archives
- Provenance

## Fetching

```sh
curl -fsSL "$URL" -o raw/response.json      # -f fails on HTTP errors, -sS hides progress but keeps errors
curl -fsSL "$URL" -D raw/headers.txt -o raw/response.json   # capture headers for debugging
curl -w '%{http_code} %{size_download}B %{time_total}s\n' -o raw/out.json -sS "$URL"
```

Without `-f`, curl writes a 404 error page into your output file and exits `0` —
the pipeline then "succeeds" on an HTML error document. Always use `-f` in a
script.

## Authentication

```sh
curl -fsSL -H "Authorization: Bearer $API_TOKEN" "$URL" -o raw/out.json
curl -fsSL -u "$USER:$API_KEY" "$URL" -o raw/out.json
curl -fsSL --netrc "$URL" -o raw/out.json   # credentials from ~/.netrc, never in the command
```

Read secrets from the environment, never inline. A token in a command lands in
shell history, `ps` output, and any log of the run — see `connections/*.md` for
how this repo declares which env var holds what.

## Pagination

```sh
# page-number APIs — one file per page, concatenate after
for p in $(seq 1 20); do
  curl -fsSL "$URL?page=$p&per_page=100" -o "raw/page_$p.json"
  [ "$(jq 'length' "raw/page_$p.json")" -lt 100 ] && break     # short page = last page
done

# cursor APIs — follow the token until it's null
cursor=""; i=0
while :; do
  curl -fsSL "$URL?limit=100&cursor=$cursor" -o "raw/page_$i.json"
  cursor=$(jq -r '.next_cursor // empty' "raw/page_$i.json")
  [ -z "$cursor" ] && break
  i=$((i+1))
done

# Link-header APIs (GitHub style)
next=$(grep -oP '(?<=<)[^>]+(?=>; rel="next")' raw/headers.txt)
```

Fetch into separate files and merge afterwards. A single appended file that dies
mid-run leaves you unable to tell which pages you actually have.

## Retries and rate limits

```sh
curl -fsSL --retry 5 --retry-delay 2 --retry-all-errors "$URL" -o raw/out.json
sleep 1                                      # between pages; be a good citizen

# honour an explicit rate-limit header rather than guessing
remaining=$(grep -i '^x-ratelimit-remaining:' raw/headers.txt | tr -d '\r' | awk '{print $2}')
[ "${remaining:-1}" -eq 0 ] && sleep 60
```

## JSON to rows

```sh
jq -r '.results[] | [.id, .name, .amount] | @csv' raw/out.json > clean/flat.csv

# with a header row derived from the first object's keys
jq -r '(.results[0] | keys_unsorted), (.results[] | [.[]]) | @csv' raw/out.json > clean/flat.csv

# merge many page files into one array first
jq -s 'map(.results[]) ' raw/page_*.json > raw/all.json

# newline-delimited JSON (one object per line)
jq -r '[.id, .amount] | @csv' raw/events.ndjson > clean/events.csv
```

`@csv` quotes and escapes correctly; string interpolation (`"\(.a),\(.b)"`) does
not, and breaks the moment a value contains a comma or quote.

## HTML tables

```sh
in2csv -f html --table "results" page.html > clean/table.csv
curl -fsSL "$URL" | pup 'table#data tr json{}' > raw/rows.json
```

Check `robots.txt` and the site's terms before scraping, throttle between
requests, and never work around an authentication or access control.

## Databases and spreadsheets

```sh
sql2csv --db "$DATABASE_URL" --query "SELECT * FROM orders WHERE created_at >= '2026-01-01'" > raw/orders.csv
sqlite3 -header -csv local.db "SELECT * FROM orders;" > raw/orders.csv
in2csv data.xlsx > raw/orders.csv
in2csv --sheet "Q3" data.xlsx > raw/q3.csv
```

Bound the query with a date filter at the source. Pulling a whole table to
filter it locally wastes the transfer and often the database's patience.

## Archives

```sh
tar -tzf archive.tar.gz | head          # list BEFORE extracting — check for absolute paths
tar -xzf archive.tar.gz -C raw/
unzip -l archive.zip | head
unzip -q archive.zip -d raw/
gunzip -c data.csv.gz > raw/data.csv    # -c keeps the original .gz
zcat data.csv.gz | head -5              # peek without extracting
```

## Provenance

```sh
cat > raw/PROVENANCE.md <<EOF
- URL:        $URL
- Fetched:    $(date -u +%Y-%m-%dT%H:%M:%SZ)
- Parameters: page_size=100, since=2026-01-01
- Rows:       $(tail -n +2 raw/orders.csv | wc -l)
- SHA256:     $(sha256sum raw/orders.csv | cut -d' ' -f1)
EOF
```

The checksum is what later lets you prove the file you analyzed is the file you
downloaded. Write this at fetch time — reconstructing it afterwards is guesswork.
