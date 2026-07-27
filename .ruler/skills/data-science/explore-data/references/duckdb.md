# DuckDB recipes

SQL directly over CSV/JSON/Parquet files — no server, no load step, no schema
declaration. Reach for this when csvkit gets slow (roughly 10⁵ rows and up) or
when the question is easier to say in SQL than in a pipeline.

## Contents
- When to use which
- Reading files
- Exploring
- The silent-drop guardrail
- Parquet
- Larger than memory
- Writing results out

## When to use which

| Situation | Use |
|---|---|
| Small file, messy, needs repair | csvkit (`csvclean`, `csvformat`) — quoting-aware repair tools |
| Any file, aggregate/join/filter | DuckDB |
| Big file (10⁵ rows+) | DuckDB — csvkit becomes impractical |
| Re-reading the same data repeatedly | convert to Parquet once, then DuckDB |
| One-shot orientation | `scripts/profile.sh` |

Measured on 2M rows (84 MB), the same GROUP BY: `csvsql` did not finish in three
minutes; DuckDB on the CSV took 3.3s; DuckDB on the Parquet copy took 0.01s.
That gap is the whole argument — below ~10⁵ rows it doesn't matter and csvkit's
repair tooling is more useful.

## Reading files

DuckDB queries a path as if it were a table:

```sh
duckdb -c "SELECT * FROM 'data.csv' LIMIT 5"
duckdb -c "SELECT * FROM 'data.parquet' LIMIT 5"
duckdb -c "SELECT * FROM 'events.ndjson' LIMIT 5"
duckdb -c "SELECT * FROM 'monthly/*.csv' LIMIT 5"     # glob = one virtual table
```

No CLI binary? The Python module ships the same engine:

```sh
python3 -c "import duckdb; print(duckdb.sql(\"SELECT * FROM 'data.csv' LIMIT 5\"))"
```

Explicit control over parsing when inference guesses wrong:

```sh
duckdb -c "SELECT * FROM read_csv('data.csv',
             header=true, delim=',', sample_size=-1,
             types={'order_id':'VARCHAR'})"
```

`sample_size=-1` scans the whole file for type inference instead of the first
rows — worth it when a column is numeric for 20k rows and then contains `N/A`.
Pin ID columns to `VARCHAR`: inferred as integers, leading zeros vanish.

## Exploring

```sh
duckdb -c "DESCRIBE SELECT * FROM 'data.csv'"          # column names and types
duckdb -c "SUMMARIZE SELECT * FROM 'data.csv'"         # per column: min/max/avg/nulls/approx unique
duckdb -c "SELECT COUNT(*) FROM 'data.csv'"
```

`SUMMARIZE` is the DuckDB answer to `csvstat` and is dramatically faster on
anything large.

```sh
# frequency table
duckdb -c "SELECT status, COUNT(*) n FROM 'data.csv' GROUP BY 1 ORDER BY n DESC"

# is this column a key? (`rows` is reserved — alias it something else)
duckdb -c "SELECT COUNT(*) n_rows, COUNT(DISTINCT order_id) distinct_ids FROM 'data.csv'"

# percentiles
duckdb -c "SELECT quantile_cont(amount_usd, [0.25,0.5,0.75,0.95]) FROM 'data.csv'"

# date gaps, without leaving SQL
duckdb -c "
  WITH days AS (SELECT UNNEST(generate_series(DATE '2026-01-01', DATE '2026-06-29', INTERVAL 1 DAY))::DATE d)
  SELECT d FROM days
  WHERE d NOT IN (SELECT DISTINCT created_at::DATE FROM 'data.csv') ORDER BY d"
```

## The silent-drop guardrail

`ignore_errors=true` makes a malformed file readable — by **discarding the bad
rows without saying so**. Verified: on a file with one ragged row it returned 203
of 204 rows and reported nothing.

Never use it without counting:

```sh
# capture what was rejected instead of discarding it blind
duckdb -c "
  SELECT * FROM read_csv('data.csv', ignore_errors=true,
                         store_rejects=true, rejects_table='rejects');
  SELECT COUNT(*) AS rejected FROM rejects;"

# or reconcile explicitly: file lines - 1 header should equal the row count
duckdb -c "SELECT COUNT(*) FROM read_csv('data.csv', ignore_errors=true)"
wc -l < data.csv
```

Same discipline as `scrub-data`'s field-count check: a tool that silently drops
data is more dangerous than one that errors, because the result still looks
plausible.

## Parquet

Columnar, typed, compressed. Convert once when a file will be read more than
twice:

```sh
duckdb -c "COPY (SELECT * FROM 'data.csv') TO 'data.parquet' (FORMAT parquet)"
```

Measured: 84 MB CSV → 22.6 MB Parquet, and queries dropped from 3.3s to 0.01s
because Parquet stores columns separately (a query touching 2 of 6 columns reads
only those) and carries types, so nothing is re-parsed on every read.

Keep the CSV if it's the raw download — `obtain-data`'s immutability rule still
applies. Parquet is a derived artifact.

## Larger than memory

DuckDB spills to disk rather than failing:

```sh
duckdb -c "SET memory_limit='4GB'; SET temp_directory='/tmp/duckdb';
           SELECT region, COUNT(*) FROM 'huge/*.parquet' GROUP BY 1"
```

This is usually a better first move than sampling — try the real query, and only
fall back to a documented sample if it genuinely won't complete.

## Writing results out

```sh
duckdb -c "COPY (SELECT ...) TO 'out/summary.csv' (HEADER, DELIMITER ',')"
duckdb -c "COPY (SELECT ...) TO 'out/summary.parquet' (FORMAT parquet)"
duckdb -c "COPY (SELECT ...) TO 'out/rows.ndjson' (FORMAT json)"
```

Writing to a named file per step is what makes a DuckDB stage drop into a
`make-pipeline` rule unchanged.
