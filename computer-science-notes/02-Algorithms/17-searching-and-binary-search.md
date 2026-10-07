# Searching and Binary Search

## Core idea
Searching finds an item or a boundary in a collection. Linear search needs no ordering. Binary search repeatedly halves a sorted or otherwise monotonic search space.

## Essential concepts
Linear search takes `O(n)` worst-case time. Binary search takes `O(log n)` comparisons when midpoint access is constant-time. On linked lists, locating midpoints is expensive, so comparison count alone does not guarantee logarithmic runtime.

A **lower bound** returns the first index whose value is at least a target. An **upper bound** returns the first index whose value is greater than the target. These definitions handle duplicates consistently.

## Worked example: lower bound
```python
def lower_bound(values, target):
    lo, hi = 0, len(values)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if values[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo
```
The interval is half-open: `[lo, hi)`. Values before `lo` are known to be too small; values at or after `hi` are known to meet the threshold. The answer may equal `len(values)` when no element qualifies.

For `[1, 3, 3, 7]` and target `3`, the answer is index `1`. For target `8`, the answer is `4`.

## Binary search on an answer
Suppose a predicate is false below some boundary and true from that boundary onward. Binary search can find the first feasible value, such as the minimum capacity required for a scheduling constraint. Total runtime includes the cost of evaluating the predicate.

## Common mistakes
Mixed inclusive and exclusive bounds cause off-by-one errors. Updating a bound to `mid` can fail to progress under an inappropriate convention. Fixed-width integer languages should avoid overflowing `lo + hi`.

## Revision check
**Question:** What must be true for binary search on a predicate?
**Answer:** Its truth values must change monotonically across the searched range.

## Connected concepts

- [[03-Data-Structures/09-arrays-and-dynamic-arrays|Arrays and Dynamic Arrays]] — Constant-time midpoint access makes array binary search efficient.

[Back to contents](../README.md)
