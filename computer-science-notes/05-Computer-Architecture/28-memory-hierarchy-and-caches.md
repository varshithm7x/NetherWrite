# Memory Hierarchy and Caches

## Core idea
Memory systems trade speed, capacity, and cost. Registers and caches are small and fast; main memory is larger and slower; persistent storage usually has much higher access latency.

## Essential concepts
**Temporal locality** means recently used data is likely to be reused. **Spatial locality** means nearby data is likely to be accessed. Caches transfer blocks called cache lines, so accessing one value often fetches its neighbors.

Cache placement may be direct-mapped, fully associative, or set-associative. Replacement chooses which resident line to evict. Write-through updates a lower level on writes; write-back delays propagation until eviction or another required event.

## Worked example: average access time
For a single modeled cache level:

```text
AMAT = hit time + miss rate × miss penalty
```
With hit time `1 ns`, miss rate `5%`, and additional miss penalty `80 ns`, average access time is `1 + 0.05 × 80 = 5 ns`. Multiple cache levels require accounting for local versus overall miss rates.

## Access patterns
Sequential array traversal usually uses spatial locality well. Pointer chasing often accesses unrelated addresses and limits prefetching. Traversing a matrix in its actual storage order avoids repeatedly skipping across distant cache lines. Blocking or tiling makes working subsets fit in cache.

## Multicore behavior
Cache coherence coordinates multiple cached copies of the same memory. [[04-Programming/25-concurrency-and-synchronization|False sharing]] occurs when independent variables used by different cores occupy one cache line, causing coherence traffic despite no intended logical sharing. Coherence does not replace language-level synchronization or define all ordering guarantees.

## Common mistakes
Larger caches do not eliminate compulsory misses or poor algorithms. A cache hit is not the same as an application-level result-cache hit. Benchmark warm-up affects results.

## Revision check
**Question:** Why can changing matrix loop order improve speed without changing Big-O?
**Answer:** It changes locality and cache misses while preserving the number of logical operations.

## Connected concepts

- [[03-Data-Structures/09-arrays-and-dynamic-arrays|Arrays and Dynamic Arrays]] — Contiguous arrays tend to improve spatial locality.
- [[04-Programming/25-concurrency-and-synchronization|Concurrency and Synchronization]] — False sharing makes independent concurrent updates contend through cache lines.

[Back to contents](../README.md)
