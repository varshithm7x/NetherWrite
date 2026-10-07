# Software Testing

## Core idea
Testing evaluates behavior against expectations and provides evidence about correctness. Good tests target meaningful contracts, failure modes, and boundaries rather than repeating implementation details.

## Test categories
Unit tests examine a focused component. Integration tests verify collaborating components and boundaries such as databases or filesystems. End-to-end tests exercise complete user paths. Their scope matters more than whether dependencies are mocked.

Regression tests preserve a fixed behavior after a bug is found. Property-based tests generate inputs and check general invariants. Fuzzing explores input handling, especially malformed or unexpected cases. Performance tests measure behavior under defined workloads.

## Worked example: binary search properties
For `lower_bound(values, target)` on a sorted list, useful properties are:

```text
0 <= answer <= len(values)
all elements before answer are < target
all elements from answer onward are >= target
```
These properties test the contract across empty lists, duplicates, missing targets, and boundary values. A slow linear implementation can serve as an independent oracle for small generated inputs.

## Designing effective tests
Arrange the starting state, perform an action, and assert observable outcomes. Use deterministic inputs or controlled randomness for repeatability. Test failures and cleanup as well as success. Keep external-service tests isolated when possible, but exercise real protocol behavior where mocks could hide integration mistakes.

## Coverage interpretation
Line and branch coverage identify unexecuted code, not proven correctness. A test can execute a line without meaningfully checking its result. Mutation testing changes code deliberately to see whether tests detect behavioral defects.

## Common mistakes
Excessive mocking can assert internal calls while missing wrong user outcomes. Timing-based sleeps create flaky tests; prefer explicit readiness signals. Snapshot tests can conceal mistakes if updates are accepted without inspection. Tests should not depend on incidental ordering unless ordering is part of the contract.

## Revision check
**Question:** What is a strong test for a parser?
**Answer:** Check valid interpretations, malformed-input handling, boundary cases, and properties such as round-trip behavior where applicable.

## Connected concepts

- [[02-Algorithms/17-searching-and-binary-search|Searching and Binary Search]] — Lower-bound invariants are useful property-based test assertions.
- [[08-Security-and-Cryptography/39-computer-security-principles|Computer Security Principles]] — Malformed-input tests exercise security-sensitive boundaries.

[Back to contents](../README.md)
