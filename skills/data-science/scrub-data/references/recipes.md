# Scrub-data recipes

Dense command reference. Load when you need the exact invocation; the workflow
itself is in `../SKILL.md`.

## Contents
- Pick a tool
- Encoding and line endings
- Structure: delimiters, quoting, headers
- Columns
- Rows
- Values and types
- Missing data
- Deduplication
- Reshaping
- Format conversion

## Pick a tool

| The mess | Use |
|---|---|
| Wrong encoding, mojibake | `iconv` — before anything else touches the bytes |
| Quoted commas, ragged rows | `csvclean`, `csvformat` |
| Select/reorder/rename columns | `csvcut` |
| Filter rows by a condition | `csvgrep`, or `awk` when it's numeric |
| Nested JSON → rows | `jq` |
| Anything easier to say in SQL | `csvsql --query` |
| Multi-GB, simple transform | `awk`/`sed` — streams in constant memory |

## Encoding and line endings

```sh
file -i data.csv                            # what encoding is it actually
iconv -f UTF-8 -t UTF-8 data.csv >/dev/null # exit != 0 means it's NOT valid UTF-8
iconv -f WINDOWS-1252 -t UTF-8 data.csv > utf8.csv

sed -i 's/\r$//' utf8.csv                   # strip CRLF (Windows) line endings
sed -i '1s/^\xEF\xBB\xBF//' utf8.csv        # strip a UTF-8 BOM from the header
```

**Do this before reaching for csvkit at all.** `csvstat`/`csvcut` abort on a
non-UTF-8 file with `Your file is not "utf-8-sig" encoded` and refuse to
inspect anything, so encoding repair necessarily precedes inspection.

A BOM leaves the first column named `﻿id` rather than `id`. csvkit handles
this itself (it reads `utf-8-sig` by default), but `awk`, `cut`, and
`csv.DictReader(open(f, encoding="utf-8"))` all see the BOM as part of the name
and fail to match it — Python raises `KeyError: 'id'` on a column that's plainly
there. Strip it, or open with `encoding="utf-8-sig"`.

## Structure: delimiters, quoting, headers

```sh
csvclean --length-mismatch data.csv              # report rows whose field count is wrong
csvclean --length-mismatch --omit-error-rows data.csv > valid.csv   # drop them
csvformat -D';' -T data.csv                 # semicolon-delimited input → tab-delimited out
csvformat -U1 data.csv                      # quote every field on output

in2csv -f fixed -s schema.csv data.txt      # fixed-width → CSV, per a schema file
sed -i '1i id,name,amount' headerless.csv   # add a header row to a headerless file
tail -n +2 data.csv                         # drop the header
```

`csvclean` is the fastest way to find out *which* rows are ragged rather than
guessing — it prints the offending row numbers with an explanation
(`Expected 5 columns, found 6 columns`). In csvkit 2.x it writes the cleaned
data to **stdout** and requires an explicit check flag; older guides describing
`data_out.csv`/`data_err.csv` side files predate that change.

## Columns

```sh
csvcut -c id,amount,created_at data.csv     # select by name
csvcut -c 1,4,3 data.csv                    # select and reorder by index
csvcut -C notes,internal data.csv           # drop columns (capital C = complement)

# rename a column (header-only edit, leaves data untouched)
sed '1s/\bamount\b/amount_usd/' data.csv > renamed.csv

# lowercase and snake_case every header
sed '1s/.*/\L&/; 1s/ /_/g' data.csv > clean_headers.csv
```

## Rows

```sh
csvgrep -c status -m active data.csv        # keep rows where status contains "active"
csvgrep -c status -m active -i data.csv     # -i inverts: drop those rows
csvgrep -c email -r '^[^@]+@[^@]+$' data.csv  # regex match

awk -F, 'NR==1 || $4 > 100' data.csv        # numeric filter, keeping the header
awk -F, 'NR==1 || ($5=="false" && $6=="false")' data.csv
```

`csvgrep` is quoting-aware; the `awk` forms are faster but assume no embedded
commas. Use `awk` only after confirming the columns you're testing are clean.

## Values and types

**Never strip commas from a CSV with line-based `sed`.** A pattern like
`s/,\([0-9][0-9][0-9]\)/\1/g` matches *field separators* followed by a 3-digit
value just as happily as thousands separators inside a number, silently merging
columns: `1,2026-05-24,100.00,active` becomes `12026-05-24100.00,active` — four
fields collapsed to two, no error. Go field-by-field instead:

```sh
# strip currency symbols and thousands separators — CSV-aware, structure-safe
python3 -c "
import csv, re, sys
CURRENCY = re.compile(r'^\s*-?\\\$?\s*-?[\d,]+(\.\d+)?\s*$')
r = csv.reader(sys.stdin); w = csv.writer(sys.stdout)
w.writerow(next(r))
for row in r:
    w.writerow([c.replace('\\\$','').replace(',','').strip() if CURRENCY.match(c) else c
                for c in row])" < data.csv > numeric.csv

# trim leading/trailing whitespace in every field
sed 's/[[:space:]]*,[[:space:]]*/,/g; s/^[[:space:]]*//; s/[[:space:]]*$//' data.csv

# normalize a boolean-ish column to true/false
awk -F, -v OFS=, 'NR>1{ if($5=="Y"||$5=="1"||$5=="yes") $5="true";
                        else if($5=="N"||$5=="0"||$5=="no") $5="false" } 1' data.csv

# normalize dates to ISO 8601
awk -F, -v OFS=, 'NR>1{ cmd="date -d \""$3"\" +%Y-%m-%d"; cmd|getline $3; close(cmd) } 1' data.csv
```

The `date -d` form spawns a subprocess per row — fine for thousands of rows,
unusable for millions. At that scale reach for a single `python -c` pass instead.

## Missing data

```sh
csvstat --nulls data.csv                    # which columns contain nulls at all

# normalize the many spellings of "missing" to a genuinely empty field.
# Compare whole fields — a regex with \b silently skips "-" (a word boundary
# needs a word character beside it, and "-" isn't one), leaving those rows dirty.
python3 -c "
import csv, sys
MISSING = {'N/A','NA','n/a','null','NULL','none','None','-','--','?'}
r = csv.reader(sys.stdin); w = csv.writer(sys.stdout)
w.writerow(next(r))
for row in r:
    w.writerow(['' if c.strip() in MISSING else c for c in row])" < data.csv > normalized.csv

awk -F, 'NR==1 || $4 != ""' data.csv        # drop rows missing a required field
awk -F, -v OFS=, 'NR>1 && $4=="" { $4=0 } 1' data.csv   # fill with a sentinel
```

Decide *and record* which of drop / fill / flag you chose — the choice changes
every downstream number, and it's the first thing a reviewer will ask about.

## Deduplication

```sh
{ head -1 data.csv; tail -n +2 data.csv | sort -u; } > deduped.csv   # fully identical rows

# dedupe on a key column, keeping the first occurrence
awk -F, 'NR==1 || !seen[$1]++' data.csv > deduped.csv

# keep the LAST occurrence per key (typical for change logs — sort by time first)
csvsort -c updated_at data.csv | awk -F, 'NR==1{print; next} {rows[$1]=$0} END{for(k in rows) print rows[k]}'
```

## Reshaping

```sh
# wide → long with awk (one row per id/metric pair)
awk -F, -v OFS=, 'NR==1{for(i=2;i<=NF;i++) h[i]=$i; print "id","metric","value"; next}
                  {for(i=2;i<=NF;i++) print $1, h[i], $i}' wide.csv > long.csv

# long → wide is far easier in SQL
csvsql --query "SELECT id,
                  MAX(CASE WHEN metric='revenue' THEN value END) AS revenue,
                  MAX(CASE WHEN metric='cost'    THEN value END) AS cost
                FROM long GROUP BY id" long.csv
```

`csvsql` infers column types and round-trips integers as floats (`1` becomes
`1.0`). Harmless for analysis, but it will corrupt ID columns that must stay
exact strings — pass `--no-inference` when the values are identifiers, not
quantities.

## Format conversion

```sh
in2csv data.xlsx > data.csv                 # Excel → CSV (first sheet)
in2csv --sheet "Q3" data.xlsx > q3.csv      # a named sheet
in2csv data.json > data.csv                 # flat JSON array → CSV
csvjson data.csv > data.json                # CSV → JSON
csvjson --stream data.csv > data.ndjson     # newline-delimited JSON

# nested JSON → CSV via jq (flatten the fields you actually want)
jq -r '.results[] | [.id, .user.name, .amount] | @csv' api.json > flat.csv
jq -r '(.results[0] | keys_unsorted), (.results[] | [.[]]) | @csv' api.json > flat.csv

# HTML table → CSV
in2csv -f html page.html > table.csv
```

For a genuine `.xlsx`/`.xlsm` with formulas, merged cells, or multiple related
sheets, hand off to the `xlsx` skill instead of forcing it through `in2csv` —
these CLI tools see a flattened export, not the workbook's structure.
