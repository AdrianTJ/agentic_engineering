---
name: chart-viz
description: >
  Produce clear, honest charts from data. Use whenever the task is to visualize,
  plot, or graph data, or when a result would land better as a chart than as a table —
  for exploratory analysis or for stakeholder-facing figures.
---

# Chart viz

Make charts that reveal the data and never mislead.

## Principles

- **One message per chart.** State it in the title as a sentence, not a label
  ("Revenue grew 30% after launch", not "Revenue by month").
- **Pick the encoding from the question.** Trend over time → line. Comparison across
  categories → bar. Distribution → histogram/box. Relationship → scatter. Composition
  → stacked bar, used sparingly.
- **Honest axes.** Start bar-chart y-axes at zero. Don't truncate to exaggerate.
  Label units. Note the sample size when it's small.
- **Less ink.** Drop gridlines, borders, and legends that a direct label could replace.

## Workflow

1. Confirm the chart's single message and audience (exploratory vs stakeholder).
2. Choose the encoding that matches the question.
3. Render it; for command-line/exploratory work, quick tools (gnuplot, `Rio`, or a
   short matplotlib script) are fine. For stakeholder output, match the deck's style.
4. Sanity-check that the visual conclusion matches the underlying numbers.

## Output

The chart (as an image file or inline figure) plus its one-sentence message and a note
of the data source.
