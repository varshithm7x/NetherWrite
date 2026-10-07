# Combinatorics and Counting

## Core idea
Counting methods determine the size of search spaces, the number of valid configurations, and the likelihood of events. The crucial distinction is whether order matters and whether repetition is allowed.

## Essential concepts
- **Product rule:** independent stages with `a` and `b` choices produce `a × b` combinations.
- **Sum rule:** mutually exclusive alternatives with `a` and `b` choices produce `a + b` possibilities.
- **Permutations:** ordered selections of `r` different elements from `n` have `n!/(n-r)!` possibilities.
- **Combinations:** unordered selections have `C(n,r) = n!/[r!(n-r)!]` possibilities.
- **Repetition:** a length-`r` sequence drawn from `n` choices has `n^r` possibilities when repetitions are permitted.
- **Inclusion–exclusion:** `|A ∪ B| = |A| + |B| - |A ∩ B|` prevents double counting.

## Worked examples
A four-digit code with leading zeros and repetition allowed has `10^4 = 10,000` possibilities. If repetition is forbidden, it has `10 × 9 × 8 × 7 = 5,040` possibilities.

Choosing a three-person team from ten people gives `C(10,3) = 120`. Assigning three distinct roles instead gives `10 × 9 × 8 = 720`.

Every subset of an `n`-element set corresponds to an `n`-bit inclusion vector, so there are `2^n` subsets. This explains why exhaustive subset search grows exponentially.

## Pigeonhole principle
Putting more than `m` items into `m` containers forces at least one container to hold two or more items. Therefore, hashing a larger key space into a smaller finite hash space necessarily permits collisions.

## Common mistakes
Do not apply the sum rule to overlapping alternatives without correction. “Independent stages” for counting means choices remain available as specified; statistical independence is a separate concept.

## Revision check
**Question:** How many edges can a simple undirected graph on `n` vertices have?
**Answer:** At most `C(n,2) = n(n-1)/2`.

## Connected concepts

- [[03-Data-Structures/12-hash-tables|Hash Tables]] — The pigeonhole principle explains why collisions cannot always be avoided.
- [[01-Foundations-and-Mathematics/06-probability-and-statistics|Probability and Statistics for Computing]] — Counting outcomes supplies probabilities for finite sample spaces.

[Back to contents](../README.md)
