# Computer Architecture

## Core idea
Computer architecture describes the programmer-visible machine and how hardware executes operations. It connects instructions, processors, memory, and input/output devices.

## Essential concepts
An **instruction set architecture (ISA)** specifies instructions, registers, addressing behavior, and other software-visible features. A **microarchitecture** implements that ISA using particular pipelines, execution units, [[05-Computer-Architecture/28-memory-hierarchy-and-caches|caches]], and control mechanisms.

Registers provide small, fast storage within the processor. Main memory holds instructions and data for active programs. A program counter identifies the current or next instruction according to the machine's conventions. Instructions typically load data, perform arithmetic or logic, branch, and store results.

## Execution cycle
A simplified processor fetches an instruction, decodes it, obtains operands, executes it, and commits the result. Real processors overlap these stages and may execute work out of order while preserving the required architectural behavior.

## Worked example: performance equation
```text
CPU time = instruction count × cycles per instruction / clock frequency
```
A program with `2 × 10^9` executed instructions, average CPI `1.5`, and a `3 × 10^9` Hz clock takes approximately one second of modeled CPU execution time. This estimate assumes the average CPI captures stalls and excludes unrelated elapsed-time effects.

## Architectural tradeoffs
RISC and CISC describe broad ISA design traditions, not simple performance rankings. Modern implementations may translate instructions into internal operations. SIMD applies one instruction to multiple data lanes. Multicore systems run independent instruction streams.

Von Neumann-style systems use a shared conceptual memory for code and data. Harvard-style designs separate instruction and data storage or access paths; modern processors often combine features at different hierarchy levels.

## Common mistakes
Clock frequency alone does not determine performance. A compatible ISA does not imply identical timing or cache behavior. More cores help only when work can be divided effectively.

## Revision check
**Question:** What separates ISA from microarchitecture?
**Answer:** ISA defines the software-visible contract; microarchitecture is a particular hardware implementation.

## Connected concepts

- [[05-Computer-Architecture/27-cpu-pipelines-and-performance|CPU Pipelines and Performance]] — Pipelining is a microarchitectural technique for overlapping execution.
- [[05-Computer-Architecture/28-memory-hierarchy-and-caches|Memory Hierarchy and Caches]] — Caches bridge the speed gap between the CPU and main memory.

[Back to contents](../README.md)
# Computer Architecture

## Core idea
Computer architecture describes the programmer-visible machine and how hardware executes operations. It connects instructions, processors, memory, and input/output devices.

## Essential concepts
An **instruction set architecture (ISA)** specifies instructions, registers, addressing behavior, and other software-visible features. A **microarchitecture** implements that ISA using particular pipelines, execution units, [[05-Computer-Architecture/28-memory-hierarchy-and-caches|caches]], and control mechanisms.

Registers provide small, fast storage within the processor. Main memory holds instructions and data for active programs. A program counter identifies the current or next instruction according to the machine's conventions. Instructions typically load data, perform arithmetic or logic, branch, and store results.

## Execution cycle
A simplified processor fetches an instruction, decodes it, obtains operands, executes it, and commits the result. Real processors overlap these stages and may execute work out of order while preserving the required architectural behavior.

## Worked example: performance equation
```text
CPU time = instruction count × cycles per instruction / clock frequency
```
A program with `2 × 10^9` executed instructions, average CPI `1.5`, and a `3 × 10^9` Hz clock takes approximately one second of modeled CPU execution time. This estimate assumes the average CPI captures stalls and excludes unrelated elapsed-time effects.

## Architectural tradeoffs
RISC and CISC describe broad ISA design traditions, not simple performance rankings. Modern implementations may translate instructions into internal operations. SIMD applies one instruction to multiple data lanes. Multicore systems run independent instruction streams.

Von Neumann-style systems use a shared conceptual memory for code and data. Harvard-style designs separate instruction and data storage or access paths; modern processors often combine features at different hierarchy levels.

## Common mistakes
Clock frequency alone does not determine performance. A compatible ISA does not imply identical timing or cache behavior. More cores help only when work can be divided effectively.

## Revision check
**Question:** What separates ISA from microarchitecture?
**Answer:** ISA defines the software-visible contract; microarchitecture is a particular hardware implementation.

## Connected concepts

- [[05-Computer-Architecture/27-cpu-pipelines-and-performance|CPU Pipelines and Performance]] — Pipelining is a microarchitectural technique for overlapping execution.
- [[05-Computer-Architecture/28-memory-hierarchy-and-caches|Memory Hierarchy and Caches]] — Caches bridge the speed 
gap between the CPU and main memory.

[Back to contents](../README.md)
