# Operating Systems

## Core idea
An operating system manages hardware resources and provides abstractions such as processes, files, sockets, and virtual memory. It also enforces isolation between programs and mediates privileged operations.

## Essential responsibilities
- **Process management:** create, schedule, and terminate execution contexts.
- **Memory management:** map virtual addresses, protect memory, and manage physical pages.
- **Storage management:** provide filesystems and coordinate persistent data access.
- **Device management:** operate hardware through drivers and I/O mechanisms.
- **Protection:** control access to resources through credentials and permissions.

The kernel runs with privileges unavailable to ordinary application code. User-space programs request services through [[06-Operating-Systems/34-input-output-and-interrupts|system calls]]. A library function may perform no system call, one call, or several calls depending on its implementation.

## Worked example: reading a file
An application calls a read interface. The kernel checks the handle and permissions, obtains bytes from cached data or the storage device, and copies or maps data for the application. If data is unavailable, the calling thread may block while other threads run.

A read request can return fewer bytes than requested; robust code handles partial reads, end-of-file, and errors according to the interface contract.

## Kernel designs
Monolithic kernels place many services within kernel space. Microkernel designs move more services into separate processes and communicate through messages. Actual systems often use hybrid approaches. The design affects isolation, communication overhead, and maintainability.

## Mechanism and policy
Mechanism supplies a capability, such as selecting a runnable thread. Policy decides how to use it, such as favoring interactive tasks or sharing CPU fairly. Separating them can make systems more adaptable.

## Common mistakes
A context switch is different from a user-to-kernel mode transition. Free memory is not the only useful memory: caches can improve performance and be reclaimed. Administrator privileges do not make malformed operations inherently correct.

## Revision check
**Question:** Why do applications use system calls?
**Answer:** They need controlled access to kernel-managed resources and privileged operations.

## Connected concepts

- [[06-Operating-Systems/30-processes-and-threads|Processes and Threads]] — Processes and threads are the kernel’s execution abstractions.
- [[06-Operating-Systems/32-virtual-memory|Virtual Memory]] — Address translation and protection provide process isolation.
- [[06-Operating-Systems/33-filesystems-and-storage|Filesystems and Storage]] — Filesystems provide persistent naming and storage.
- [[06-Operating-Systems/34-input-output-and-interrupts|Input/Output, Interrupts, and DMA]] — Device operations cross the application–kernel boundary.

[Back to contents](../README.md)
