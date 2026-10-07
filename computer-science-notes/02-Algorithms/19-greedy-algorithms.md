# Greedy Algorithms

## Core idea
A greedy algorithm repeatedly makes a locally preferred choice without reconsidering earlier choices. It can be very efficient, but correctness requires showing that its choices can lead to a global optimum.

## Essential concepts
**Optimal substructure** means an optimal solution contains optimal solutions to appropriate subproblems. A **greedy-choice property** additionally means some optimal solution begins with the proposed local choice. Optimal substructure alone does not justify greediness.

Common proof methods include an **exchange argument**, which transforms an optimal solution to include the greedy choice, and a **stays-ahead argument**, which shows the greedy partial solution never falls behind a competitor.

## Worked example: interval scheduling
To select the maximum number of nonoverlapping intervals, sort by increasing finishing time and repeatedly select the next compatible interval.

```python
def select_intervals(intervals):
    chosen = []
    end = float('-inf')
    for start, finish in sorted(intervals, key=lambda item: item[1]):
        if start >= end:
            chosen.append((start, finish))
            end = finish
    return chosen
```
Assume positive-length intervals and that touching endpoints are compatible. Sorting takes `O(n log n)`; selection takes `O(n)`.

Why it works: replacing an optimum's first selected interval with the earliest-finishing interval cannot leave less time for the remaining selections. Apply the same argument to the remaining compatible intervals.

## Applications and limits
Kruskal's algorithm, Prim's algorithm, and Huffman coding use justified greedy choices. Weighted interval scheduling usually requires [[02-Algorithms/18-dynamic-programming|dynamic programming]] because choosing the earliest finish can sacrifice a much more valuable interval.

## Common mistakes
A convincing heuristic is not a proof. Greedy methods can fail when choices interact through hidden future costs. Tie-breaking may affect which optimum is returned, even when it does not affect the optimal value.

## Revision check
**Question:** Is picking the shortest interval a valid general strategy?
**Answer:** No. A short interval can overlap two mutually compatible intervals and reduce the final count.

## Connected concepts

- [[02-Algorithms/18-dynamic-programming|Dynamic Programming]] — Dynamic programming handles cases without a valid greedy-choice property.
- [[02-Algorithms/20-graph-algorithms|Core Graph Algorithms]] — Minimum spanning tree algorithms use justified greedy edge choices.

[Back to contents](../README.md)
