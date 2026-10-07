# CPU Scheduling

## Core idea
CPU scheduling selects which runnable task executes next. Different policies balance responsiveness, throughput, fairness, deadlines, and switching overhead.

## Important metrics
- **Turnaround time:** completion time minus arrival time.
- **Waiting time:** time spent runnable but not executing.
- **Response time:** time from arrival until the first useful response or first execution, depending on the stated definition.
- **Throughput:** completed work per unit time.
- **Utilization:** fraction of time a resource is busy.

## Scheduling policies
First-come, first-served is simple but can make short tasks wait behind long ones. Shortest-job-first minimizes average waiting time in the classic nonpreemptive model when all jobs are available and runtimes are known. Shortest-remaining-time-first is its preemptive counterpart. Round robin gives each runnable task a time quantum. Priority scheduling can favor urgent work but risks starvation.

## Worked example
Three CPU-only jobs arrive at time zero with durations `A=8`, `B=4`, `C=2`.

```text
FCFS order A, B, C:
waiting times = 0, 8, 12; average = 20/3

Shortest-first order C, B, A:
waiting times = 0, 2, 6; average = 8/3
```
The example excludes context-switch overhead and assumes known durations.

## Practical concerns
A tiny round-robin quantum improves opportunities for response but increases switching overhead. A very large quantum approaches FCFS behavior. Aging gradually improves waiting tasks' priorities to reduce starvation. Priority inheritance can reduce priority inversion when a high-priority task waits for a lock held by a lower-priority task.

Real-time scheduling distinguishes hard deadlines from soft deadlines. Meeting deadlines requires assumptions about execution cost, arrivals, and resource blocking; high average throughput alone is insufficient.

## Common mistakes
Blocked tasks are not eligible merely because their priority is high. Scheduling policies optimize different goals. A task can starve without the system being deadlocked.

## Revision check
**Question:** What does round robin trade against response time?
**Answer:** Smaller quanta generally increase context-switch overhead.

## Connected concepts

- [[06-Operating-Systems/30-processes-and-threads|Processes and Threads]] — Scheduling chooses among runnable execution contexts.

[Back to contents](../README.md)
