# Memory Management

## Core idea
Memory management controls allocation, lifetime, and reclamation of storage. Bugs arise when references and resource lifetimes disagree.

## Essential concepts
**Stack allocation** commonly supports scoped function-call storage. **Heap allocation** supports objects with more flexible lifetimes. These are implementation conventions rather than universal placement guarantees for every language.

Manual management requires explicitly freeing allocated memory. Garbage collection reclaims unreachable objects. Reference counting reclaims objects when their count reaches zero, but cycles may need additional handling. Ownership systems track who controls a value's lifetime and restrict conflicting access.

## Typical failure modes
- **Memory leak:** storage remains retained after it is no longer useful.
- **Use-after-free:** access occurs after storage has been released.
- **Double free:** the same allocation is released more than once.
- **Dangling reference:** a reference outlives its target.
- **Buffer overflow:** an access crosses the allocated region's bounds.

## Worked example: deterministic resource release
```python
with open('notes.txt', encoding='utf-8') as handle:
    text = handle.read()
```
The context manager closes the file when the block exits, including exceptional exits. Closing a file releases an operating-system resource; it is separate from reclaiming the Python object's memory.

In languages with RAII, resource cleanup is tied to object lifetime. A guard object can own a file, lock, or socket and release it when its scope ends.

## Garbage-collection tradeoffs
Tracing collectors find objects reachable from roots such as active stack references and globals. Unreachable cycles can be collected. Collector behavior can affect latency, throughput, and memory overhead. A cache retaining every object is still a leak in practical terms even if all retained objects are reachable.

## Common mistakes
Garbage collection does not automatically close external resources promptly. Keeping a small view may retain a much larger underlying buffer. Allocation rate can matter as much as peak retained memory.

## Revision check
**Question:** Can a garbage-collected program leak memory?
**Answer:** Yes, by retaining references to objects it no longer needs.

## Connected concepts

- [[06-Operating-Systems/32-virtual-memory|Virtual Memory]] — Virtual memory maps and protects the storage used by allocations.
- [[04-Programming/25-concurrency-and-synchronization|Concurrency and Synchronization]] — Shared lifetimes become harder to manage across concurrent tasks.

[Back to contents](../README.md)
