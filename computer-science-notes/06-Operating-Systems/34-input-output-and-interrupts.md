# Input/Output, Interrupts, and DMA

## Core idea
Input/output moves data between processors, memory, and devices. Efficient I/O coordinates work without forcing the CPU to wait unnecessarily for slow hardware.

## Essential concepts
**Polling** repeatedly checks whether a device is ready. **Interrupts** notify the processor of an event. **Direct memory access (DMA)** lets a device or controller transfer data to or from memory with limited CPU involvement after setup.

Blocking I/O waits until the operation can make progress or complete according to its contract. Nonblocking I/O returns promptly when it cannot proceed. Asynchronous I/O reports completion later. These terms describe different interface properties and should not be treated as synonyms.

## Worked example: partial writes
A socket write may accept only part of a buffer. Correct code tracks the unsent suffix:

```text
offset = 0
while offset < buffer_length:
    sent = write(buffer[offset:])
    if temporarily_unavailable:
        wait_for_writability
    else if error_or_closed:
        handle_failure
    else:
        offset += sent
```
The precise handling of zero progress, errors, and readiness depends on the interface. Readiness indicates that an operation may proceed; it does not guarantee the whole message fits.

## Event-driven systems
An event loop monitors many descriptors and dispatches ready work. This is effective for many mostly idle connections. Callbacks or tasks must avoid lengthy blocking work that delays unrelated events. CPU-heavy work may need a separate execution pool.

## Interrupt and DMA tradeoffs
Very frequent interrupts create overhead. Batching and interrupt moderation can improve throughput at some latency cost. DMA buffers may require alignment, pinning, and cache-coherence handling according to the platform.

## Common mistakes
Assuming one read equals one application message breaks stream protocols. Busy-waiting can waste CPU. Asynchronous APIs do not guarantee lower total latency when setup and scheduling overhead dominate.

## Revision check
**Question:** What work does DMA reduce?
**Answer:** The CPU's need to copy or individually transfer every data unit between a device and memory.

## Connected concepts

- [[06-Operating-Systems/30-processes-and-threads|Processes and Threads]] — Blocking I/O changes a thread from runnable to waiting.
- [[07-Networking/36-tcp-and-udp|TCP and UDP]] — Socket operations must handle partial transfers and stream framing.

[Back to contents](../README.md)
