# Sorting Algorithms

## Core idea
Sorting rearranges records by a key. Algorithm selection depends on input size, existing order, memory limits, stability requirements, and the nature of the keys.

## Comparison of common algorithms
| Algorithm | Typical or expected time | Worst time | Main property |
|---|---|---|---|
| Insertion sort | `O(n²)` generally | `O(n²)` | `O(n)` on already sorted input |
| Merge sort | `Θ(n log n)` | `Θ(n log n)` | Can be stable; needs merge storage |
| Quicksort | Expected `O(n log n)` with suitable randomization | `O(n²)` | Efficient partitioning |
| Heapsort | `Θ(n log n)` | `Θ(n log n)` | Constant auxiliary array storage |
| Counting sort | `Θ(n + k)` | `Θ(n + k)` | Requires bounded integer key range |

A stable sort preserves the relative order of records with equal keys. An in-place algorithm uses limited auxiliary storage, though recursion stacks may still be relevant.

## Worked example: stability
Records `('Ada', 80), ('Lin', 90), ('Mira', 80)` sorted stably by score become `('Ada', 80), ('Mira', 80), ('Lin', 90)`. Ada stays ahead of Mira because their keys are equal.

Insertion sort grows a sorted prefix and shifts larger elements before inserting the next key. It performs well on small or nearly sorted inputs because the number of shifts depends on disorder.

## Lower bounds
General comparison sorting needs `Ω(n log n)` comparisons in the worst case: a decision tree must distinguish `n!` possible orders. Counting and radix sort use key structure beyond comparisons, so they do not contradict this bound.

## Common mistakes
Quicksort's good average behavior does not remove its quadratic worst case. Counting sort is unsuitable when the key range is enormous relative to `n`. Stability depends on implementation details.

## Revision check
**Question:** Why choose stable sorting for successive key sorts?
**Answer:** A later sort preserves earlier ordering within groups whose later key is equal.

## Connected concepts

- [[02-Algorithms/08-recursion-and-divide-and-conquer|Recursion and Divide and Conquer]] — Merge sort decomposes input into independently sorted halves.
- [[03-Data-Structures/14-heaps-and-priority-queues|Heaps and Priority Queues]] — Heap ordering supports worst-case logarithmic extraction.
- [[02-Algorithms/07-algorithm-complexity|Algorithm Complexity and Asymptotic Analysis]] — Comparison-count lower bounds explain the n log n barrier.

[Back to contents](../README.md)
