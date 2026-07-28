# Chart-viz recipes

Dense command reference. Load when you need the exact invocation; the principles
(one message per chart, honest axes, less ink) are in `../SKILL.md`.

## Contents
- Pick a renderer
- Terminal plots
- gnuplot
- matplotlib
- Sparklines

## Pick a renderer

| Situation | Use |
|---|---|
| Glance at a shape mid-pipeline, no file wanted | gnuplot `dumb` terminal |
| Quick PNG from a CSV, no Python | gnuplot |
| Stakeholder-facing figure, full control | matplotlib |
| One number's trend inline in a table | sparkline |

Exploratory plots are throwaway — speed beats polish. Only a figure that will be
*shown to someone* earns styling time.

## Terminal plots

Renders as ASCII directly in the terminal — no file, no image viewer:

```sh
csvcut -c amount_usd data.csv | tail -n +2 | \
  gnuplot -e "set terminal dumb 78 22; set title 'amount distribution';
              plot '-' using 1 bins=20 with boxes notitle"
```

Ideal inside a pipeline or over SSH: you see the shape (bimodal? skewed?
outliers?) without leaving the shell or producing an artifact to clean up.

## gnuplot

Time series from a CSV:

```sh
gnuplot <<'EOF'
set datafile separator ","
set terminal pngcairo size 900,500 font "sans,11"
set output "out/trend.png"
set title "Order value rose through Q2" font "sans,13"
set xlabel "Date"; set ylabel "Mean order value (USD)"
set xdata time; set timefmt "%Y-%m-%d"; set format x "%b %d"
set yrange [0:*]                # honest axis — start at zero
set grid ytics lc rgb "#dddddd"
unset key                       # one series needs no legend
plot "clean/daily.csv" using 1:2 with lines lw 2 lc rgb "#4C72B0"
EOF
```

Bar chart by category:

```sh
gnuplot <<'EOF'
set datafile separator ","
set terminal pngcairo size 800,450
set output "out/by_status.png"
set style data histograms; set style fill solid 0.9 border -1
set boxwidth 0.7; set yrange [0:*]
set xtics rotate by -30
plot "summary.csv" using 2:xtic(1) notitle lc rgb "#4C72B0"
EOF
```

`set yrange [0:*]` is the honest-axis rule in one line: floor at zero, let the
top auto-scale. Skipping it lets gnuplot pick a floor that exaggerates
differences — the most common way a technically-correct chart misleads.

## matplotlib

For anything stakeholder-facing, where you need control over annotation:

```python
python3 - <<'EOF'
import csv, matplotlib
matplotlib.use("Agg")                     # no display needed; write straight to file
import matplotlib.pyplot as plt

rows = list(csv.DictReader(open("summary.csv")))
labels = [r["day"] for r in rows]
values = [float(r["mean_amount"]) for r in rows]

fig, ax = plt.subplots(figsize=(7, 4))
ax.bar(labels, values, color="#4C72B0")
ax.set_ylim(0, max(values) * 1.15)        # honest axis
ax.set_ylabel("Mean order value (USD)")
ax.set_title("Order value is highest on weekends", loc="left")
ax.text(0.99, 0.02, f"n={sum(1 for _ in open('data.csv'))-1} orders",
        transform=ax.transAxes, ha="right", va="bottom", fontsize=8, color="gray")
for s in ("top", "right"):
    ax.spines[s].set_visible(False)       # less ink
fig.tight_layout()
fig.savefig("out/chart.png", dpi=120)
EOF
```

`matplotlib.use("Agg")` before importing `pyplot` is required on a headless
machine — without it the import fails or hangs looking for a display.

## Sparklines

A trend inline in text, no image at all:

```sh
csvcut -c mean_amount summary.csv | tail -n +2 | \
  awk 'BEGIN{b[0]="▁";b[1]="▂";b[2]="▃";b[3]="▄";b[4]="▅";b[5]="▆";b[6]="▇";b[7]="█"}
       {v[NR]=$1; if(NR==1||$1<min)min=$1; if(NR==1||$1>max)max=$1}
       END{r=(max-min)?max-min:1
           for(i=1;i<=NR;i++){k=int((v[i]-min)/r*7); if(k>7)k=7; printf "%s", b[k]} print ""}'
```

Build the block array element by element rather than `split("▁▂▃…", b, "")` —
awk splits by *byte*, and each block character is three UTF-8 bytes, so the
split version emits mojibake fragments instead of bars.

Useful in a summary table or a commit message where a PNG would be overkill.
State the min and max alongside it — a sparkline shows shape, not scale.
