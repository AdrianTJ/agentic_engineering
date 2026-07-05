---
name: introspect-schema
description: >
  Discover the structure of a database before querying it — tables, columns, types,
  keys, and row counts. Use this skill whenever you need to write a query but the
  schema is not already known, or whenever the user asks what tables/columns exist,
  how things relate, or what a column contains.
---

# Introspect schema

Establish ground truth about the data before writing any query against it.

## Workflow

1. List the relevant tables and their approximate row counts (to gauge scan cost).
2. For the tables in play, list columns with types and nullability.
3. Identify primary keys and the columns used to join tables together.
4. For any column whose meaning is unclear, sample a few distinct values rather than
   assuming. A column named `status` could be an enum, free text, or an integer code.
5. Summarize findings as a compact reference the query author can rely on, including
   the join graph (which key links which tables).

## Output

A short schema brief: tables in scope, key columns and types, the join keys between
them, and any surprises (unexpected nulls, suspicious value distributions). This brief
is what the `write-sql` skill consumes.
