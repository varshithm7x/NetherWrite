# Hash Tables

## Core idea
A hash table maps keys to values by converting each key into a hash and selecting a storage location. It supports fast exact-key lookup, but it does not normally preserve sorted order.

## Essential concepts
- A **collision** occurs when different keys map to the same bucket or probe position.
- **Separate chaining** stores multiple entries per bucket.
- **Open addressing** stores entries within the table and searches a probe sequence.
- **Load factor** is the number of entries divided by table capacity.
- Resizing rebuilds placement because locations depend on the capacity.
- Equal keys must produce equal hashes; equal hashes do not imply equal keys.

Expected lookup, insertion, and deletion are `O(1)` under appropriate hashing and load-factor assumptions. Worst-case costs can be `O(n)`. A resize usually costs `O(n)` but can be amortized across many insertions.

## Worked example: frequency counting
```python
def frequencies(values):
    counts = {}
    for value in values:
        counts[value] = counts.get(value, 0) + 1
    return counts
```
For `['a', 'b', 'a']`, the result is `{'a': 2, 'b': 1}`. With well-behaved hashing, processing `n` values takes expected `O(n)` time and `O(k)` space for `k` distinct keys.

## Design considerations
Chaining tolerates high load but adds pointer or container overhead. Open addressing often offers good locality, but performance degrades as free slots disappear. Deletion may require tombstones or a deletion strategy that preserves probe reachability.

## Common mistakes
Mutating a key in a way that changes its hash can make it unfindable. Hash-table lookup is unsuitable for efficient ordered range queries. Noncryptographic hashes do not provide cryptographic integrity. Adversarial keys can cause collision-based performance attacks in unprotected designs.

## Revision check
**Question:** Why does collision handling also compare keys?
**Answer:** Different keys can have the same hash, so the hash alone cannot establish equality.

## Connected concepts

- [[01-Foundations-and-Mathematics/05-combinatorics-and-counting|Combinatorics and Counting]] — Counting proves collisions exist when the key space exceeds the hash space.
- [[09-Databases/45-database-indexes-and-query-plans|Database Indexes and Query Plans]] — Database hash indexes apply hashing to equality lookup.

[Back to contents](../README.md)
