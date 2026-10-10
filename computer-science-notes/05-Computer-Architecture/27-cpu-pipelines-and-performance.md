 # CPU Pipelines and Performance

## Core idea
Pipelining overlaps instruction stages to improve throughput. It can complete more instructions per unit time without necessarily reducing the latency of an individual instruction.

## Essential concepts
A simplified five-stage pipeline uses fetch, decode, execute, memory access, and write-back. Under ideal conditions, a filled pipeline may finish roughly one instruction each cycle, although real machines vary considerably.

Hazards interrupt this ideal:
- **Structural hazards:** instructions compete for a hardware resource.
- **Data hazards:** an instruction depends on a result that is not ready.
- **Control hazards:** the next instruction depends on a branch outcome.

Forwarding supplies results before final write-back where possible. Stalls insert delays. Branch prediction guesses a path; misprediction discards speculative work and redirects execution.

## Worked example: dependency
```text
LOAD R1, [address]
ADD  R2, R1, R3
```
The addition needs the loaded value. If the memory result is unavailable, the processor may stall or execute unrelated work first. A cache miss can make the delay much larger than a normal instruction latency.

## Parallel execution inside a core
Superscalar processors issue multiple operations per cycle when dependencies and resources permit. Out-of-order execution schedules ready operations ahead of stalled ones. Register renaming removes false dependencies caused by reuse of architectural register names; true value dependencies remain.

## Amdahl's law
If fraction `p` of a program receives speedup `s`, overall speedup is:

```text
1 / ((1 - p) + p/s)
```
If `80%` is accelerated infinitely, total speedup is limited to `5×`. This assumes the remaining work is unchanged and ignores new overhead.

## Common mistakes
Throughput and latency are different metrics. Branchless code is not universally faster. Microbenchmarks can be distorted by warm caches, compiler elimination, and unrealistic data distributions.

## Revision check
**Question:** Can pipelining help dependent instructions as much as independent ones?
**Answer:** Usually less, because dependencies restrict overlap.

## Connected concepts

- [[05-Computer-Architecture/28-memory-hierarchy-and-caches|Memory Hierarchy and Caches]] — Cache misses stall dependent instructions and affect average CPI.
- [[04-Programming/25-concurrency-and-synchronization|Concurrency and Synchronization]] — Amdahl’s law also limits speedup from parallel execution.

[Back to contents](../README.md)
