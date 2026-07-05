---
name: write-sql
description: >
  Author correct, performant, and readable SQL queries. Use this skill whenever the
  task involves writing, fixing, optimizing, or reviewing a SQL query — including
  aggregations, joins, window functions, CTEs, and incremental/date-bounded queries —
  even if the user does not say the word "SQL" but describes pulling, counting,
  joining, or summarizing rows from a database or warehouse.
---

# Write SQL

A disciplined workflow for producing SQL that is correct first, fast second, and
readable always.

## Workflow

1. **Know the shape before you write.** If the schema is not already established in
   the conversation, introspect it first (see the `introspect-schema` skill). Never
   guess column names or types — a wrong guess produces a query that runs and returns
   plausible-but-wrong numbers, which is worse than an error.
2. **State the grain.** Before writing, say in one line what one row of the result
   represents (e.g. "one row per customer per day"). Most SQL bugs are grain bugs.
3. **Build up with CTEs.** Express the query as a sequence of named `WITH` steps, each
   doing one thing. This is the SQL equivalent of a Unix pipeline: readable, testable
   stage by stage, and easy to inspect by selecting from an intermediate CTE.
4. **Be explicit.** Qualify every column with its table/alias. List columns instead of
   `SELECT *` in anything that will be reused. Name every derived column.
5. **Check the join cardinality.** For each join, know whether it is 1:1, 1:many, or
   many:many, and confirm it can't fan out and inflate aggregates. When in doubt,
   aggregate to the right grain in a CTE before joining.
6. **Bound the scan.** Add the most selective filter (usually a date range on a
   partition column) as early as possible. Default to a small date window while
   iterating, then widen once the logic is verified.
7. **Verify, then optimize.** Confirm correctness on a small sample first. Only then
   look at the plan and optimize. See `scripts/explain.sh` for a quick way to inspect
   a query plan.

## Style

- Uppercase keywords, lowercase identifiers, one clause per line.
- Leading commas or trailing commas — pick one and be consistent within a query.
- Prefer `COUNT(*) FILTER (WHERE ...)` over `SUM(CASE WHEN ... THEN 1 END)` where the
  engine supports it; it reads better and is just as fast.
- Prefer window functions over self-joins for running totals, rankings, and
  "compared to previous row" logic.

## Common pitfalls

- **Fan-out on join** inflating `SUM`/`COUNT`: aggregate before joining.
- **`NULL` in `NOT IN`** silently returning zero rows: use `NOT EXISTS` instead.
- **Timezone drift** in date filters: be explicit about the timezone of the boundary.
- **Implicit grain change** after a join: re-state the grain after each CTE.

## Output

Return the query in a fenced ```sql block, preceded by a one-line statement of the
result grain, and followed by a short note on any assumptions made (date window,
timezone, dedup strategy). If correctness depends on a schema detail you couldn't
confirm, flag it explicitly rather than guessing.
