# Database Indexes and Query Plans

## Core idea
An index is an additional access structure that helps locate rows without scanning every record. It trades storage and write maintenance for faster selected queries.

## Essential concepts
B-tree-family indexes support ordered lookup and range scans. Hash indexes target equality lookup where supported. Composite indexes order combinations of columns. A covering index contains enough information to answer a query without fetching all base-table data, subject to database visibility requirements.

Selectivity describes how narrowly a condition filters rows. Low-selectivity queries returning much of a table may be faster with a scan than many indexed fetches.

## Worked example: composite ordering
```sql
CREATE INDEX orders_customer_created
ON orders(customer_id, created_at);

SELECT id, created_at
FROM orders
WHERE customer_id = 42
  AND created_at >= '2025-01-01'
ORDER BY created_at;
```
Equality on the leading column and a range on the second column fit the index's ordering. A query only on `created_at` may not benefit as directly; some databases can use alternative strategies, but the leading-prefix principle is a useful starting point.

## Query plans
EXPLAIN describes a chosen plan. Execution-analysis variants may actually run the query and report observed rows and timing, so treat mutations carefully. Compare estimated and actual row counts to identify stale statistics or unusual distributions.

Typical plan elements include scans, index lookups, nested-loop joins, hash joins, sort operations, and aggregations. The optimizer chooses among them using cost estimates rather than a universal rule that indexes are always best.

## Common mistakes
Indexing every column increases write cost and storage. Applying a function to an indexed column may prevent ordinary index use unless an appropriate expression index or transformation exists. Deep offset pagination can still scan many entries; keyset pagination often scales better.

## Revision check
**Question:** Why can a table scan beat an index lookup?
**Answer:** When many rows qualify, sequential scanning can cost less than scattered row fetches.

## Connected concepts

- [[03-Data-Structures/13-trees-and-binary-search-trees|Trees and Binary Search Trees]] — Balanced ordered trees motivate B-tree-family index structures.
- [[09-Databases/42-sql-queries-and-joins|SQL Queries and Joins]] — Query predicates and ordering determine whether an index is useful.

[Back to contents](../README.md)
