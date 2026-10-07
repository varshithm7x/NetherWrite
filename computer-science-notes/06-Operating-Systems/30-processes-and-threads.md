# Processes and Threads

## Core idea
A process owns an execution environment and resources, including an address space. A thread is an execution stream within a process. Multiple threads commonly share process memory while maintaining their own stacks and execution state.

## Essential concepts
Typical states include new, runnable, running, blocked, and terminated. Runnable means ready for CPU time; blocked means waiting for an event such as I/O completion or a synchronization condition.

A context switch saves one execution context and restores another. Switching processes may also change memory mappings; actual cost depends on hardware and operating-system behavior.

## Communication choices
Processes can communicate through pipes, sockets, message queues, or shared memory. Shared memory avoids some copying but requires coordination. Threads communicate easily through shared objects, which also creates race and lifetime hazards.

## Worked example: a server
A server may accept requests and dispatch each to a worker pool. Worker threads share a connection queue and configuration. A bounded pool limits thread count; a bounded queue limits accumulated work. The design needs a response when arrivals exceed processing capacity, such as backpressure or rejection.

A process-per-worker design increases isolation: one worker crash is less likely to corrupt another worker's memory. It may increase communication and resource overhead.

## Lifecycle issues
On POSIX-style systems, a child that exits may retain a small status record until its parent waits for it; this is a zombie process. An orphaned child has lost its original parent and is reparented according to system rules. These concepts are distinct.

## Common mistakes
Sharing an address space does not mean every operation is thread-safe. More workers can reduce performance through contention, switching, and memory pressure. Threads blocked on I/O differ from threads busy-waiting and consuming CPU.

## Revision check
**Question:** What do threads in one process normally share?
**Answer:** The process address space and many resources, while retaining separate stacks and execution state.

## Connected concepts

- [[04-Programming/25-concurrency-and-synchronization|Concurrency and Synchronization]] — Shared process state requires a synchronization discipline.
- [[06-Operating-Systems/31-cpu-scheduling|CPU Scheduling]] — Runnable threads compete under the CPU scheduling policy.

[Back to contents](../README.md)
