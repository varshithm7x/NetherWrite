# SQL Queries and Joins

## Core idea
SQL describes desired results declaratively. The database chooses an [[09-Databases/45-database-indexes-and-query-plans|execution strategy]], so equivalent-looking queries can have different physical costs.

## Essential clauses
`FROM` and `JOIN` define participating sources. `WHERE` filters rows. `GROUP BY` creates groups. `HAVING` filters groups. `SELECT` chooses result expressions. `ORDER BY` orders the final result. This is a useful conceptual processing sequence, not a requirement for literal physical execution.

An inner join keeps matching pairs. A left outer join keeps every left-side row and uses NULLs when no right-side match exists. A cross join forms every pair. Join multiplicity can increase the number of rows substantially.

## Worked example: enrollment counts
```sql
SELECT s.id, s.name, COUNT(e.course_id) AS course_count
FROM students AS s
LEFT JOIN enrollments AS e ON e.student_id = s.id
GROUP BY s.id, s.name
HAVING COUNT(e.course_id) >= 2
ORDER BY course_count DESC, s.id;
```
The left join retains students without enrollments before grouping. `COUNT(e.course_id)` counts non-NULL enrollment values; `COUNT(*)` would also count the unmatched placeholder row. HAVING then keeps students enrolled in at least two courses.

## NULL and three-valued logic
`x = NULL` does not test whether `x` is missing; use `x IS NULL`. Comparisons involving NULL usually yield UNKNOWN. WHERE keeps TRUE rows, so FALSE and UNKNOWN are filtered out. `NOT IN` with NULL-containing results can therefore surprise callers.

## Common mistakes
Putting a required right-table predicate in WHERE after a left join can remove unmatched left rows. Without ORDER BY, row order is not guaranteed. Joining several one-to-many relationships can inflate aggregates; pre-aggregate or otherwise control multiplicity. Bind user-supplied values through parameters.

## Revision check
**Question:** What distinguishes WHERE from HAVING?
**Answer:** WHERE filters individual input rows; HAVING filters groups after aggregation.

## Connected concepts

- [[09-Databases/41-relational-databases|Relational Databases]] — Join multiplicity follows the relationships between tables.
- [[09-Databases/45-database-indexes-and-query-plans|Database Indexes and Query Plans]] — Access structures and optimizer choices determine query cost.

[Back to contents](../README.md)
