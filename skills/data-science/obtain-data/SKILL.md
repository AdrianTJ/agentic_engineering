---
name: obtain-data
description: >
  Acquire data from the outside world — APIs, web pages, databases, spreadsheets,
  and compressed archives — into local files. Use for the "O" (obtain) step of the
  OSEMN workflow whenever data needs to be downloaded, scraped, queried out, or
  decompressed before analysis can start.
---

# Obtain data

Get data onto disk reliably and reproducibly.

## Tool palette

- `curl` / `wget` — fetch files and hit HTTP APIs; capture headers when debugging.
- `jq` — extract the useful payload from JSON API responses.
- `pup` or `scrape` — pull structured data out of HTML.
- `csvkit`'s `in2csv` / `sql2csv` — convert spreadsheets and query databases to CSV.
- `tar`, `unzip`, `gunzip` — decompress archives.

## Workflow

1. Save raw responses to disk before parsing, so a flaky network or API doesn't cost
   you the data and so the fetch is reproducible.
2. For paginated APIs, fetch pages into separate files, then concatenate.
3. Record provenance: the URL/query, timestamp, and any parameters, in a sidecar note.
4. Be a good citizen: respect rate limits and `robots.txt`; never bypass access
   controls or authentication.

## Output

Raw data on disk plus a provenance note, ready for the `scrub-data` skill.
