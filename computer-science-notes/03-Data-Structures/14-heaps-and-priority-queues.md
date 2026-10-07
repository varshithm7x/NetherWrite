# Heaps and Priority Queues

## Core idea
A priority queue removes the item with highest or lowest priority. A binary heap implements this abstraction using a complete binary tree with a local ordering invariant.

## Essential concepts
In a min-heap, each parent is no greater than either child. Therefore, the root holds a minimum, but the remaining elements are not globally sorted. A max-heap reverses the ordering.

Using a zero-based array:

```text
left child  = 2i + 1
right child = 2i + 2
parent      = floor((i - 1)/2), for i > 0
```
Insertion appends an element and moves it upward. Removing the minimum replaces the root with the last element and moves that element downward. Both take `O(log n)`; inspecting the root takes `O(1)`.

## Worked example
```python
import heapq

heap = [9, 4, 7, 1]
heapq.heapify(heap)
heapq.heappush(heap, 3)
print(heapq.heappop(heap))  # 1
print(heapq.heappop(heap))  # 3
```
Bottom-up heap construction takes `O(n)`, because most nodes are near the leaves and require little work. Building via `n` separate insertions instead has an `O(n log n)` upper bound.

## Applications
A heap supports scheduling, merging sorted streams, [[02-Algorithms/20-graph-algorithms|Dijkstra's algorithm]], and retaining the largest `k` items. For top-`k`, maintain a min-heap of at most `k` candidates; processing `n` items takes `O(n log k)` for `k >= 2`.

## Common mistakes
A heap does not provide fast arbitrary-key search. Equal priorities need a tie-breaker if the payloads are not comparable. Updating priorities requires locating entries, maintaining an index map, or using lazy replacement and skipping stale entries.

## Revision check
**Question:** Is a heap's backing array sorted?
**Answer:** No. Only parent–child ordering and the complete-tree structure are guaranteed.

## Connected concepts

- [[02-Algorithms/20-graph-algorithms|Core Graph Algorithms]] — Dijkstra uses a priority queue to select the next tentative distance.
- [[02-Algorithms/16-sorting-algorithms|Sorting Algorithms]] — Heapsort repeatedly extracts an extreme element.

[Back to contents](../README.md)
