# Explore-data recipes

Dense command reference. Load when you need the exact invocation; the workflow
itself is in `../SKILL.md`.

## Contents
- Pick a tool
- Shape and orientation
- Column summaries
- Frequency and cardinality
- Group summaries
- Distribution and percentiles
- Duplicates and keys
- Dates and ranges
- Sampling

## Pick a tool

| You want | Use | Why |
|---|---|---|
| One-shot orientation | `scripts/profile.sh` | shape + columns + nulls + sample in one call |
| Types, nulls, min/max/mean per column | `csvstat` | quoting-aware, no scripting |
| Group aggregates | `datamash` | fast, streaming — **requires sorted input** |
| Ad-hoc filtering/joining while exploring | `csvsql` | full SQL over a CSV, no DB to set up |
| Files too big for the above | `awk`, `sort`, `uniq` | constant memory, streams |

`csvkit` is quoting-aware and correct; `awk`/`cut` are fast but break on quoted
commas. On real-world CSVs, prefer csvkit until it's too slow, then switch
deliberately.

## Shape and orientation

```sh
csvstat --count data.csv               # row count (quoting-aware)
wc -l < data.csv                       # line count — differs if fields contain newlines
head -1 data.csv | tr ',' '\n' | nl    # numbered column list
csvlook data.csv | head -20            # aligned preview
csvcut -n data.csv                     # column names with their 1-based indices
```

`csvcut -n` is the fastest way to get the index numbers that `datamash` and
`csvcut -c` need.

## Column summaries

```sh
csvstat data.csv                       # every column: type, nulls, unique, min/max/mean/stddev
csvstat -c amount_usd data.csv         # one column only — much faster on wide files
csvstat --nulls data.csv               # just "does this column contain nulls"
```

Read the *type* line first. A numeric column typed as text means dirty values
(currency symbols, thousands separators, `N/A`) — that's a `scrub-data` job
before any analysis.

## Frequency and cardinality

```sh
# frequency table for a categorical column
csvcut -c status data.csv | tail -n +2 | sort | uniq -c | sort -rn

# how many distinct values (cardinality) — high cardinality = probably an ID
csvcut -c customer_id data.csv | tail -n +2 | sort -u | wc -l

# values appearing exactly once — often typos in an otherwise clean enum
csvcut -c status data.csv | tail -n +2 | sort | uniq -c | awk '$1 == 1'
```

`tail -n +2` drops the header so it isn't counted as a value.

## Group summaries

**`datamash groupby` requires input sorted by the group column.** On unsorted
input it silently emits one group per contiguous run — wrong numbers, no error.
Always sort first:

```sh
# mean and count of column 4, grouped by column 2
csvsort -c 2 data.csv | datamash -t, --headers groupby 2 mean 4 count 4

# multiple stats at once
csvsort -c 2 data.csv | datamash -t, --headers groupby 2 count 4 mean 4 median 4 sstdev 4

# equivalent in SQL when the grouping gets complicated
csvsql --query "SELECT status, COUNT(*) n, AVG(amount_usd) avg FROM data GROUP BY status" data.csv
```

`csvsql` is slower but handles multi-key grouping, filters, and joins without
the sort precondition — prefer it once the datamash invocation stops being
obvious.

## Distribution and percentiles

```sh
# percentiles (datamash needs the column sorted for perc, same as groupby)
csvcut -c amount_usd data.csv | tail -n +2 | sort -n | \
  datamash min 1 q1 1 median 1 q3 1 max 1

# quick histogram, 10 buckets, no plotting tool needed
csvcut -c amount_usd data.csv | tail -n +2 | \
  awk -v n=10 '{v[NR]=$1; if(NR==1||$1<min)min=$1; if(NR==1||$1>max)max=$1}
    END{w=(max-min)/n
        for(i=1;i<=NR;i++){k=int((v[i]-min)/w); if(k>=n)k=n-1; b[k]++}
        for(j=0;j<n;j++){bar=""; for(c=0;c<int(b[j]*40/NR);c++) bar=bar"#"
                         printf "%8.2f %5d %s\n", min+j*w, b[j]+0, bar}}'
```

The `if(k>=n)k=n-1` clamp matters: the maximum value computes to bucket index
`n`, one past the end, and would be silently dropped without it. Sanity-check any
histogram by confirming the bucket counts sum to the row count.

For anything shapelier than a rough histogram, hand off to `chart-viz` — a
bimodal distribution is obvious in a plot and invisible in summary statistics.

## Duplicates and keys

```sh
# is this column actually unique (a candidate key)?
csvcut -c order_id data.csv | tail -n +2 | sort | uniq -d | head

# fully duplicated rows
tail -n +2 data.csv | sort | uniq -d | head

# duplicate count without listing them
tail -n +2 data.csv | sort | uniq -d | wc -l
```

A "unique" ID with duplicates usually means the export joined something and
fanned out — check before aggregating, or every sum is inflated.

## Dates and ranges

```sh
csvstat -c created_at data.csv         # csvstat detects Date type and reports min/max

# gaps: which days have no rows at all
csvcut -c created_at data.csv | tail -n +2 | cut -d' ' -f1 | sort -u > /tmp/present.txt
seq 0 179 | xargs -I{} date -d "2026-01-01 +{} days" +%Y-%m-%d | sort > /tmp/expected.txt
comm -13 /tmp/present.txt /tmp/expected.txt | head
```

Missing days matter: an unnoticed gap becomes a fake dip in every time series
chart built from this data.

## Sampling

```sh
shuf -n 20 <(tail -n +2 data.csv)      # random rows — files are often sorted, head lies
{ head -1 data.csv; tail -n +2 data.csv | shuf -n 1000; } > sample.csv   # keep the header
```

Sample first, then iterate the whole pipeline on the sample, then run it once on
the full file. On a large file this is the difference between a 2-second loop and
a 2-minute one.
