# Relational Databases

## Core idea
A relational database models data using relations, commonly presented as tables. Rows represent records; columns represent attributes. Constraints express rules that valid stored data must satisfy.

## Essential concepts
A **candidate key** minimally identifies a row. A **primary key** is the chosen candidate key. A **foreign key** references eligible key values in another or the same table, enforcing referential integrity according to its definition.

A schema defines tables, columns, types, and constraints. SQL tables may permit duplicate rows, unlike mathematical relations, unless constraints prevent them. [[09-Databases/42-sql-queries-and-joins|NULL]] represents missing or unknown information and changes comparison semantics.

## Worked example: course enrollment
```sql
CREATE TABLE students (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE courses (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL
);

CREATE TABLE enrollments (
    student_id INTEGER REFERENCES students(id),
    course_id INTEGER REFERENCES courses(id),
    PRIMARY KEY (student_id, course_id)
);
```
The junction table models a many-to-many relationship: a student can take many courses, and a course can contain many students. Its composite primary key prevents duplicate enrollment pairs. Exact constraint enforcement and configuration depend on the database.

## Relational operations
Selection filters rows. Projection chooses attributes. Joins combine related records. Union combines compatible results, with duplicate handling determined by the operation. These ideas underpin SQL query processing even though SQL has additional behavior.

## Design choices
Use database constraints for durable invariants rather than relying only on application checks that concurrent requests can bypass. Choose keys based on stability and meaning; generated surrogate keys are useful but do not remove the need for business uniqueness constraints.

## Common mistakes
Storing comma-separated related IDs makes querying and integrity harder. A primary key does not imply rows are returned in that order. Foreign keys express permitted references, not user authorization.

## Revision check
**Question:** How is a many-to-many relationship usually represented?
**Answer:** With a junction table containing foreign keys to both participating entities.

## Connected concepts

- [[09-Databases/43-database-normalization|Database Normalization]] — Functional dependencies guide the decomposition of relational schemas.
- [[09-Databases/42-sql-queries-and-joins|SQL Queries and Joins]] — SQL retrieves and combines records under the schema’s constraints.

[Back to contents](../README.md)
