# Concurrency and Synchronization

## Core idea
Concurrency means multiple tasks can make progress during overlapping periods. Parallelism means tasks execute simultaneously. Concurrent code must coordinate access to shared state and reason about possible interleavings.

## Essential concepts
A **race condition** makes correctness depend on timing. A **data race**, in languages with that formal concept, involves conflicting unsynchronized memory accesses and can have especially serious consequences.

A mutex permits one holder to enter a critical section. A semaphore counts permits. A condition variable lets a thread wait for a predicate, usually while releasing an associated lock. Atomic operations provide specified indivisible operations and memory-order guarantees; they do not make an entire algorithm automatically correct.

## Worked example: lost updates
Two threads both execute `counter = counter + 1`. They can each read `10`, each calculate `11`, and each write `11`, losing one increment.

```python
from threading import Lock

lock = Lock()
counter = 0

def increment():
    global counter
    with lock:
        counter += 1
```
The lock protects the read-modify-write operation. All accesses that rely on the same invariant must follow a consistent synchronization discipline.

## Deadlock
The classic necessary conditions are mutual exclusion, hold-and-wait, no forced preemption of resources, and circular wait. Acquiring multiple locks in a fixed global order prevents circular wait. Timeouts may aid recovery but do not by themselves prove freedom from deadlock.

## Design alternatives
Message passing and immutable data reduce shared mutable state. Structured concurrency ties task lifetimes to a containing scope and simplifies cancellation and cleanup. Async execution is useful for waiting on I/O; it does not inherently speed CPU-heavy work.

## Common mistakes
Check a condition-variable predicate in a loop. A thread-safe container does not make multi-operation business logic atomic. Language runtime locks do not justify ignoring synchronization.

## Revision check
**Question:** Can concurrent tasks run on one CPU core?
**Answer:** Yes, through interleaving; simultaneous parallel execution requires additional execution capacity.

## Connected concepts

- [[06-Operating-Systems/30-processes-and-threads|Processes and Threads]] — Threads share process memory and therefore need coordination.
- [[09-Databases/44-transactions-and-isolation|Transactions and Isolation]] — Database isolation handles concurrent access at the transaction level.

[Back to contents](../README.md)
