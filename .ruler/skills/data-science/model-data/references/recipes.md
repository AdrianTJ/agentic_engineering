# Model-data recipes

Dense command reference. Load when you need the exact invocation; the discipline
(baseline first, hold out before looking, report uncertainty) is in `../SKILL.md`
and is not optional.

## Contents
- Dependencies
- Pick a method
- Splitting
- Baselines
- Regression
- Classification
- Evaluation
- Uncertainty
- Clustering and reduction
- Out-of-memory data

## Dependencies

The baseline, split, evaluation, and bootstrap recipes below use only the Python
standard library and core CLI tools — they run anywhere. The regression,
classification, clustering, and reduction recipes need extra packages that are
**not** installed by default.

Prefer `uv` to run them with dependencies supplied per-invocation, rather than
mutating a shared environment:

```sh
uv run --with scikit-learn --with numpy python model.py
uv run --with scikit-learn python -c "from sklearn.linear_model import LinearRegression; ..."
```

`uv` resolves and caches on first use (a few seconds), then reuses it; the system
Python is left untouched, so nothing you install for one analysis breaks another.
Where `uv` isn't available, check before assuming and install explicitly:

```sh
python3 -c "import sklearn" || pip install numpy scipy scikit-learn
```

Either way, confirm the import works *before* a long run — failing mid-analysis
with `ModuleNotFoundError` wastes the whole pass. Vowpal Wabbit (`vw`) is a
separate system package, not a Python one.

## Pick a method

| The question | Start with | Escalate to |
|---|---|---|
| "How much / how many?" | linear regression | gradient boosting |
| "Which class?" | logistic regression | tree ensemble |
| "Is this difference real?" | two-sample t-test / bootstrap | a model with covariates |
| "What will it be next period?" | last-value or seasonal-naive | ARIMA / Prophet |
| "Are there natural groups?" | k-means on scaled features | HDBSCAN |
| "Too many columns" | PCA | UMAP |

Escalate only when residuals or a held-out score prove the simple model
inadequate — not because the complex one sounds better.

## Splitting

```sh
# random split — ONLY when rows are independent
awk -F, 'NR==1{print > "train.csv"; print > "test.csv"; next}
         { if (rand() < 0.8) print > "train.csv"; else print > "test.csv" }' data.csv

# temporal split — whenever order matters. Never random-split a time series.
csvsort -c created_at data.csv > sorted.csv
n=$(( $(tail -n +2 sorted.csv | wc -l) * 80 / 100 ))
{ head -1 sorted.csv; tail -n +2 sorted.csv | head -n "$n"; } > train.csv
{ head -1 sorted.csv; tail -n +2 sorted.csv | tail -n +"$((n+1))"; } > test.csv

# grouped split — keep all rows for one entity on the same side, or you leak
csvcut -c customer_id data.csv | tail -n +2 | sort -u | shuf > ids.txt
head -n "$(( $(wc -l < ids.txt) * 80 / 100 ))" ids.txt > train_ids.txt
```

Random-splitting rows that share a customer, session, or patient leaks
information across the boundary and inflates every score. Split by *entity*.

## Baselines

Fit these before anything else; a model that can't beat them is reported as
exactly that.

```sh
# regression: predict the training mean for everything
python3 -c "
import csv,statistics as st
tr=[float(r['amount_usd']) for r in csv.DictReader(open('train.csv'))]
te=[float(r['amount_usd']) for r in csv.DictReader(open('test.csv'))]
m=st.mean(tr); rmse=(sum((x-m)**2 for x in te)/len(te))**.5
print(f'baseline mean={m:.2f} test RMSE={rmse:.3f}')"

# classification: always predict the majority class
csvcut -c label train.csv | tail -n +2 | sort | uniq -c | sort -rn | head -1

# forecasting: predict the last observed value (surprisingly hard to beat)
```

## Regression

```sh
python3 -c "
import csv, numpy as np
rows=list(csv.DictReader(open('train.csv')))
X=np.array([[1.0, float(r['x1']), float(r['x2'])] for r in rows])
y=np.array([float(r['amount_usd']) for r in rows])
beta,*_=np.linalg.lstsq(X,y,rcond=None)
print('coefficients:', beta)
resid=y-X@beta
print('train RMSE:', (resid@resid/len(y))**.5)"
```

With `scipy` available, `scipy.stats.linregress` gives you the standard error and
p-value directly, which is what you actually need to report an effect size with
uncertainty rather than a bare coefficient.

## Classification

```sh
python3 -c "
import csv, numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, confusion_matrix
tr=list(csv.DictReader(open('train.csv'))); te=list(csv.DictReader(open('test.csv')))
f=lambda rs: np.array([[float(r['x1']), float(r['x2'])] for r in rs])
g=lambda rs: np.array([int(r['label']) for r in rs])
m=LogisticRegression(max_iter=1000).fit(f(tr), g(tr))
p=m.predict_proba(f(te))[:,1]
print('AUC:', roc_auc_score(g(te), p))
print(confusion_matrix(g(te), (p>0.5).astype(int)))"
```

Report the confusion matrix, not just AUC. On imbalanced data a 0.95 AUC can
still mean the model never once predicts the minority class you care about.

## Evaluation

```sh
# RMSE / MAE / R² from two columns of actual,predicted
python3 -c "
import sys,csv,statistics as st
rows=[(float(a),float(p)) for a,p in csv.reader(sys.stdin) if a!='actual']
n=len(rows); err=[a-p for a,p in rows]
rmse=(sum(e*e for e in err)/n)**.5; mae=sum(abs(e) for e in err)/n
ybar=st.mean(a for a,_ in rows)
r2=1-sum(e*e for e in err)/sum((a-ybar)**2 for a,_ in rows)
print(f'n={n} RMSE={rmse:.4f} MAE={mae:.4f} R2={r2:.4f}')" < predictions.csv
```

Always print `n` alongside the metric. A great score on 12 held-out rows is
noise, and the row count is the fastest way to see that.

## Uncertainty

Never report a bare point estimate. Bootstrap needs no distributional
assumptions and works for any statistic:

```sh
python3 -c "
import csv,random,statistics as st
random.seed(0)
vals=[float(r['amount_usd']) for r in csv.DictReader(open('data.csv'))]
boots=[st.mean(random.choices(vals,k=len(vals))) for _ in range(2000)]
boots.sort()
lo,hi=boots[50],boots[1949]   # 2.5th and 97.5th percentile of 2000
print(f'mean={st.mean(vals):.2f}  95% CI [{lo:.2f}, {hi:.2f}]')"
```

Seed the RNG so the interval is reproducible, and say how many resamples you
used — an unseeded CI that moves between runs undermines the whole point.

## Clustering and reduction

```sh
python3 -c "
import csv, numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
rows=list(csv.DictReader(open('data.csv')))
X=StandardScaler().fit_transform(np.array([[float(r['x1']),float(r['x2'])] for r in rows]))
for k in range(2,7):
    km=KMeans(n_clusters=k,n_init=10,random_state=0).fit(X)
    print(k, round(km.inertia_,1))"
```

**Scale before clustering.** k-means uses Euclidean distance, so an unscaled
column measured in thousands silently dominates one measured in units, and the
clusters just re-describe that column.

## Out-of-memory data

```sh
# Vowpal Wabbit: streams from disk, single pass, constant memory
awk -F, 'NR>1 {print $4" | x1:"$2" x2:"$3}' train.csv > train.vw
vw -d train.vw -f model.vw --loss_function squared
vw -d test.vw -i model.vw -p predictions.txt

# or: sample down to what fits, model that, and state the sampling rate
```

Sampling to memory and being explicit about it beats a heroic streaming pipeline
you can't verify. Only reach for the streaming tool once you've confirmed the
sampled answer is actually insufficient.
