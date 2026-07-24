---
name: model-data
description: >
  Model data with statistical discipline from the command line — regression,
  classification, clustering, forecasting, or a plain hypothesis test. Use for the "M"
  (model) step of the OSEMN workflow, whenever the task is to estimate an effect,
  predict, test a difference, or fit any statistical model — even if the user just says
  "is X related to Y?" or "what will Z be next month?".
---

# Model data

Fit models that earn their conclusions. Correct beats clever: a defensible interval
from a simple model outperforms a sharper number nobody can trust.

## Workflow

1. **State the question and the metric before fitting anything.** One line: what is
   being estimated or predicted, and what number decides whether the model is any good
   (RMSE, AUC, coverage, …). If this can't be written down, return to `explore-data`.
2. **Fit the dumb baseline first.** Mean/median for regression, majority class for
   classification, last value for forecasts. Every later model is judged against it —
   a model that can't beat the baseline is reported as exactly that.
3. **Hold out data before looking.** Split train/test at the command line: for
   independent rows, `awk 'NR==1 || rand()<0.8'` per stream; for time series, sort by
   date and cut instead of random-splitting (e.g. `sort -t, -k3 data.csv` then take
   the first 80% of rows as train, the rest as test) — a random split leaks future
   information into training when order matters. Touch the test set once, at the end.
4. **Simple → complex.** Start with the least flexible model that could answer the
   question (linear/logistic regression, a two-sample test). Escalate only when
   residuals prove the simple model wrong. `Rscript -e` and `python -c` keep fits
   scriptable; Vowpal Wabbit when the data outgrows memory.
5. **Check assumptions, not just scores.** Residual plots (via `chart-viz`),
   heteroscedasticity, leakage, train/test drift. A good score with bad residuals is a
   bug that hasn't been found yet.
6. **Report effect size with uncertainty.** Confidence/credible interval or
   cross-validation spread — never a bare point estimate, never a bare p-value.
   Translate to consequences ("≈15% fewer churned accounts, 95% CI 8–22%").
7. **Record the exact commands.** The full pipeline from input file to reported number
   reruns from the transcript. Seed anything stochastic.

## Guardrails

- **No silent garden of forking paths:** report how many models/specifications were
  tried, not just the winner.
- The grain of the modeling table is stated before fitting (as in `write-sql`), and
  fitting stops if the data can't answer the question — say so instead of torturing it.

## Output

The fitted result: question, baseline vs. model performance on held-out data, effect
size with uncertainty, assumption checks performed, and the reproducible command
pipeline. This is what `stakeholder-narrative` translates for humans.
