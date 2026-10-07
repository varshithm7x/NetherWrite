# Linked Lists

## Core idea
A linked list stores elements in nodes connected by references. Nodes need not occupy adjacent memory. A singly linked list stores a next pointer; a doubly linked list also stores a previous pointer.

## Operations and costs
- Accessing the `i`th element requires traversal: `O(i)` from the head, hence `O(n)` in the worst case.
- Inserting after a known node takes `O(1)` pointer updates.
- Removing a known node from a doubly linked list takes `O(1)` when the necessary links are available.
- Removing a singly linked node usually requires its predecessor; finding that predecessor can take `O(n)`.
- Searching by value takes `O(n)`.

## Worked example: inserting at the head
```python
class Node:
    def __init__(self, value, next_node=None):
        self.value = value
        self.next = next_node

head = Node(20)
head = Node(10, head)  # 10 -> 20 -> None
```
Updating the head does not require shifting existing elements. For a tail append to be constant-time, maintain a tail pointer rather than traversing the whole list.

## Important invariants
The head identifies the first node, the tail identifies the last node when present, and the final next pointer is null for a noncircular list. In a doubly linked list, adjacent next and previous pointers must agree. Sentinel nodes can simplify boundary cases by representing fixed endpoints.

## Cycle detection
Floyd's algorithm advances one pointer by one step and another by two. If a cycle exists, they eventually meet. It uses `O(n)` time and `O(1)` auxiliary space.

## Common mistakes
“Linked-list insertion is constant-time” assumes the insertion location is already known. Pointer overhead and poor locality can outweigh the benefit of cheap updates. Losing a pointer before reconnecting the chain can make nodes unreachable.

## Revision check
**Question:** What makes tail append constant-time?
**Answer:** Keeping a valid tail pointer and updating it after insertion.

## Connected concepts

- [[04-Programming/24-memory-management|Memory Management]] — Node allocation and lifetime determine pointer safety.
- [[03-Data-Structures/11-stacks-queues-and-deques|Stacks, Queues, and Deques]] — Linked nodes can implement endpoint-based stacks and queues.

[Back to contents](../README.md)
