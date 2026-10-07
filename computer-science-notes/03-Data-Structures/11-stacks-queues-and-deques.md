# Stacks, Queues, and Deques

## Core idea
These structures restrict access order. A **stack** is last-in, first-out (LIFO); a **queue** is first-in, first-out (FIFO); a **deque** supports insertion and removal at both ends.

## Essential operations
A stack provides `push`, `pop`, and usually `peek`. A queue provides `enqueue` and `dequeue`. Well-chosen implementations make endpoint operations constant-time or amortized constant-time. Removing the first element of a conventional dynamic array is linear-time because other elements shift.

A circular buffer uses indices modulo capacity to reuse freed positions. It needs an explicit way to distinguish empty and full states, such as a stored count or one unused slot.

## Worked example: balanced delimiters
```python
def balanced(text):
    matching = {')': '(', ']': '[', '}': '{'}
    stack = []
    for ch in text:
        if ch in '([{':
            stack.append(ch)
        elif ch in matching:
            if not stack or stack.pop() != matching[ch]:
                return False
    return not stack
```
Every closing delimiter must match the most recently opened, unmatched delimiter. Time is `O(n)` and auxiliary space is `O(n)` in the worst case. This example treats all delimiters literally; parsing source code also requires handling strings and comments.

## Applications
Stacks support depth-first traversal, expression evaluation, undo operations, and function calls. Queues support breadth-first traversal, work dispatch, and buffering. Deques support sliding-window algorithms and work-stealing designs, though concurrent implementations require synchronization.

## Common mistakes
Check underflow before removal. A priority queue does not preserve ordinary FIFO order. An unbounded producer can grow a queue until memory is exhausted; bounded queues need backpressure or a rejection policy.

## Revision check
**Question:** Which structure naturally supports level-order tree traversal?
**Answer:** A FIFO queue.

## Connected concepts

- [[02-Algorithms/20-graph-algorithms|Core Graph Algorithms]] — BFS uses a queue; DFS uses recursion or an explicit stack.

[Back to contents](../README.md)
