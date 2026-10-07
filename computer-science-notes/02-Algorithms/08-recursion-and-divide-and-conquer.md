# Recursion and Divide and Conquer

## Core idea
Recursion solves a problem by calling the same procedure on smaller instances. Divide and conquer splits an instance into subproblems, solves them, and combines their answers.

## Essential concepts
A recursive algorithm needs a **base case**, a **progress measure** moving toward that case, and a **combination rule**. Each active call generally stores parameters and local state in a stack frame. Recursion depth and total call count are different quantities.

Typical divide-and-conquer recurrence:

```text
T(n) = a T(n/b) + f(n)
```
Here `a` is the number of subproblems, `n/b` their size, and `f(n)` the splitting and combining work. Recursion trees or suitable recurrence theorems can derive the growth rate.

## Worked example: merge sort
Merge sort recursively sorts two halves and merges their sorted results in linear time:

```text
T(n) = 2 T(n/2) + Θ(n)
```
Each level performs `Θ(n)` work, and there are `Θ(log n)` levels, giving `Θ(n log n)` time. A typical array implementation needs `Θ(n)` auxiliary storage plus `Θ(log n)` stack depth.

## Repeated subproblems
Naive recursive Fibonacci branches into overlapping subproblems:

```python
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)
```
Its running time grows exponentially. [[02-Algorithms/18-dynamic-programming|Memoization]] stores already-computed answers and reduces the number of distinct computed states to `n + 1`; an iterative version also avoids recursion depth limits.

## Common mistakes
A base case is insufficient if inputs never approach it. Recursive slicing can create hidden allocations. Tail-call optimization is language-dependent and should not be assumed. Divide and conquer is especially useful when subproblems are largely independent; dynamic programming handles repeated states.

## Revision check
**Question:** Does logarithmic recursion depth imply logarithmic runtime?
**Answer:** No. Merge sort has logarithmic depth but `Θ(n log n)` total work.

## Connected concepts

- [[02-Algorithms/16-sorting-algorithms|Sorting Algorithms]] — Merge sort is a direct application of divide and conquer.
- [[02-Algorithms/18-dynamic-programming|Dynamic Programming]] — Memoization avoids repeated recursive subproblems.

[Back to contents](../README.md)
