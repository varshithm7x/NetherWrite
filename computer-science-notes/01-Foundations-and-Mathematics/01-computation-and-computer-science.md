# Computation and Computer Science

## Core idea
Computer science studies how information is represented, transformed, stored, and communicated. A **computational problem** specifies a relationship between inputs and valid outputs; an **algorithm** supplies a finite, unambiguous procedure for producing those outputs. A program implements that procedure using a particular language and execution environment.

## Essential concepts
- **Correctness:** every allowed input produces an output satisfying the specification. Termination is also required for total correctness.
- **Abstraction:** hide implementation details behind a useful model, such as a queue or file interface.
- **State:** information that can affect future behavior, including variables, memory, and external resources.
- **Determinism:** identical inputs and initial state lead to identical results. Randomized algorithms also depend on random choices.
- **Computability versus efficiency:** some problems have no general algorithm; others are computable but impractical at large sizes.

## Worked example: finding a maximum
```python
def maximum(values):
    if not values:
        raise ValueError("requires a nonempty sequence")
    best = values[0]
    for value in values[1:]:
        if value > best:
            best = value
    return best
```
The loop invariant is that `best` equals the maximum of the processed prefix. Initialization establishes the invariant, each comparison preserves it, and completion makes the prefix the whole sequence. The algorithm makes `n - 1` comparisons. Python's slice creates an extra list for list inputs; iterating by index or iterator avoids that allocation.

## Why this matters
Specifications distinguish a genuine solution from code that merely works on a few examples. Abstractions let large systems be built from components whose internal details can change independently.

## Common mistakes
A fast program can still be incorrect. A successful test does not prove correctness for every input. Input assumptions, such as nonempty data or sorted order, must be explicit.

## Revision check
**Question:** Can a correct algorithm be unusable?
**Answer:** Yes. Excessive runtime, memory, energy, or communication can make a correct solution impractical.

## Connected concepts

- [[02-Algorithms/07-algorithm-complexity|Algorithm Complexity and Asymptotic Analysis]] — Correctness and resource efficiency are separate requirements for an algorithm.
- [[12-Compilers-and-Computation-Theory/50-automata-computability-and-complexity|Automata, Computability, and Complexity Classes]] — Computability explains which problems admit algorithms at all.

[Back to contents](../README.md)
