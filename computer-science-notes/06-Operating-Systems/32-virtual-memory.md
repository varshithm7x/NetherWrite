# Virtual Memory

## Core idea
Virtual memory gives each process a logical address space whose pages map to physical memory or other backing arrangements. It enables isolation, controlled sharing, flexible allocation, and address spaces larger than resident RAM.

## Essential concepts
A virtual address is divided into a page number and offset. Page tables translate page numbers to physical frames and record permissions and status. The translation lookaside buffer (TLB) caches recent translations.

A TLB miss means a translation is not in the TLB; it does not necessarily mean the page is absent from RAM. A page fault occurs when an access requires operating-system handling, such as loading a nonresident page or rejecting a prohibited access.

## Worked example: address decomposition
With `4 KiB` pages, the offset uses `12` bits because `4096 = 2^12`. Virtual address `0x12345` has page number `0x12` and offset `0x345`. The page table selects a physical frame; the offset stays unchanged.

## Demand paging and replacement
Demand paging brings pages into memory when needed. If frames are scarce, replacement selects a page to evict. Clean backed pages can often be discarded; dirty pages may require writing back. FIFO can exhibit Belady's anomaly, where more frames produce more faults. Ideal least-recently-used replacement has the stack property, but exact tracking can be costly.

## Copy-on-write
Processes may initially share read-only mappings. When one writes, the system creates a private copy of the affected page. This can reduce unnecessary copying after process creation.

## Thrashing
If active working sets exceed available memory, repeated faults and evictions can dominate useful work. Reducing concurrency or increasing available memory may help.

## Common mistakes
Virtual memory is not simply “extra RAM on disk.” Not all page faults involve disk I/O. Allocating a virtual region does not guarantee every page is immediately physically resident.

## Revision check
**Question:** What distinguishes a TLB miss from a page fault?
**Answer:** A TLB miss concerns cached translation; a page fault requires handling a mapping or access condition.

## Connected concepts

- [[05-Computer-Architecture/28-memory-hierarchy-and-caches|Memory Hierarchy and Caches]] — The TLB is a cache of address translations.
- [[04-Programming/24-memory-management|Memory Management]] — Allocation lifetime and page residency are different memory concerns.

[Back to contents](../README.md)
