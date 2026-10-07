# Algorithm Complexity and Asymptotic Analysis

## Core idea
Complexity describes how resource use grows with input size. Time counts relevant operations; space counts required memory. State the input measure, computational model, and whether the bound is worst-case, average-case, expected, or amortized.

## Essential concepts
- `O(f(n))` gives an asymptotic upper bound.
- `Ω(f(n))` gives an asymptotic lower bound.
- `Θ(f(n))` gives matching upper and lower bounds.
- Common growth rates are `1`, `log n`, `n`, `n log n`, `n²`, `2^n`, and `n!`.
- Auxiliary space excludes the input itself unless explicitly stated; recursion stacks still count.
- Amortized analysis bounds a sequence of operations without requiring a probability distribution.

## Worked examples
A loop visiting every array element takes `Θ(n)` time. Two nested loops each running `n` times usually take `Θ(n²)`. If the inner loop only runs up to the outer index, the total is still `1 + 2 + ... + n = Θ(n²)`.

```python
while n > 1:
    n //= 2
```
This runs `Θ(log n)` times because every iteration halves the remaining value.

A dynamic array occasionally copies all elements while growing. If capacity doubles, total copying across `n` appends is bounded by a geometric series, so append is amortized `O(1)` even though an individual append can cost `O(n)`.

## Practical interpretation
Asymptotic analysis ignores constant factors and smaller terms, but these can matter at realistic sizes. Cache behavior, allocations, networking, and input distribution can change measured performance. Profile to locate actual bottlenecks.

## Common mistakes
Big-O does not automatically mean worst-case. Sequential loops add costs; nested loops require examining iteration counts. Arithmetic on arbitrarily large integers is not always constant-time.

## Revision check
**Question:** What is `3n² + 10n + 7` asymptotically?
**Answer:** `Θ(n²)`.

## Connected concepts

- [[02-Algorithms/08-recursion-and-divide-and-conquer|Recursion and Divide and Conquer]] — Recurrences describe recursive runtime.
- [[03-Data-Structures/09-arrays-and-dynamic-arrays|Arrays and Dynamic Arrays]] — Geometric resizing demonstrates amortized analysis.
- [[12-Compilers-and-Computation-Theory/50-automata-computability-and-complexity|Automata, Computability, and Complexity Classes]] — Complexity classes formalize resource requirements for decision problems.

[Back to contents](../README.md)
