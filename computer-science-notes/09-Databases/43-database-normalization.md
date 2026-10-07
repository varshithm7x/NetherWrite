# Database Normalization

## Core idea
Normalization organizes relational schemas to reduce redundant facts and the inconsistencies they can cause. It reasons from keys and functional dependencies, not merely from how many columns a table has.

## Essential concepts
A functional dependency `X → Y` means any two valid rows agreeing on `X` must agree on `Y`. An insertion anomaly blocks recording one fact without an unrelated fact. An update anomaly requires changing the same fact in many places. A deletion anomaly accidentally removes independent information.

Common normal forms:
- **1NF:** values follow the relational attribute domains, without repeating groups under the usual introductory interpretation.
- **2NF:** in 1NF, with no nonprime attribute partially dependent on a candidate key.
- **3NF:** for every nontrivial dependency `X → A`, `X` is a superkey or `A` is prime, meaning part of some candidate key.
- **BCNF:** every determinant of a nontrivial functional dependency is a superkey.

## Worked example
Suppose `Enrollment(student_id, course_id, student_name, course_title)` has key `(student_id, course_id)` and dependencies:

```text
student_id -> student_name
course_id  -> course_title
```
Names and titles depend on only part of the composite key. Split into `Student(student_id, student_name)`, `Course(course_id, course_title)`, and `Enrollment(student_id, course_id)`.

Now changing a course title updates one course row rather than every enrollment. A new course can exist without any student enrollment.

## Decomposition goals
A **lossless join** decomposition lets the original valid relation be reconstructed without spurious rows. **Dependency preservation** permits constraints to be enforced without joining decomposed tables. Higher normalization is not automatically better if important constraints become difficult to enforce.

## Common mistakes
Inferring dependencies from a small sample can be wrong; dependencies express domain rules. Denormalization may improve measured workloads but adds consistency responsibilities. A single-column primary key does not automatically guarantee 3NF.

## Revision check
**Question:** What is the main danger of repeated department names in employee rows?
**Answer:** Updates can leave conflicting versions of the same department fact.

## Connected concepts

- [[09-Databases/41-relational-databases|Relational Databases]] — Candidate keys and functional dependencies define normalization rules.

[Back to contents](../README.md)
