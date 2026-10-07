# Arrays and Dynamic Arrays

## Core idea
An array stores indexed elements in a contiguous logical sequence. Fixed-size arrays reserve a fixed capacity; dynamic arrays resize their backing storage when necessary. They are effective when fast indexing and sequential traversal matter.

## Operations and costs
| Operation | Typical cost |
|---|---|
| Read or replace by index | `O(1)` |
| Scan or search unsorted elements | `O(n)` |
| Append to dynamic array | Amortized `O(1)` |
| Insert or delete in the middle | `O(n)` |
| Resize and copy storage | `O(n)` |

For fixed-size elements, an address can be computed as `base + index × element_size`. Some languages store references in the array, so objects themselves need not be contiguous.

## Worked example: geometric growth
Suppose capacity grows `1 → 2 → 4 → 8 → 16`. Before reaching sixteen elements, copies involve `1 + 2 + 4 + 8 = 15` old elements. Total work remains linear in the number of appends, producing constant amortized append cost.

Growing by one slot each time would copy `1 + 2 + ... + (n-1)` elements, giving quadratic total work.

## Useful patterns
Two-pointer scans can compact an array in place or process sorted sequences. Prefix sums store accumulated totals so a range sum can be answered by subtracting two prefix values. A sliding window maintains information about a moving contiguous interval.

## Common mistakes
Amortized constant time is not a bound for every append. Resizing can invalidate pointers or iterators in some languages. Deleting while traversing may skip elements. Frequent front insertion is costly because later elements must shift.

## Revision check
**Question:** Why are arrays often faster to scan than linked lists?
**Answer:** Contiguous access usually improves [[05-Computer-Architecture/28-memory-hierarchy-and-caches|cache locality]] and allows hardware prefetching; linked lists require following pointers.

## Connected concepts

- [[03-Data-Structures/10-linked-lists|Linked Lists]] — Compare indexed access and locality against pointer-based insertion.
- [[05-Computer-Architecture/28-memory-hierarchy-and-caches|Memory Hierarchy and Caches]] — Contiguous traversal exploits spatial locality.

[Back to contents](../README.md)
