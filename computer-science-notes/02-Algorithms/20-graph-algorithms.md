# Core Graph Algorithms

## Core idea
Graph algorithms answer reachability, ordering, connectivity, and optimization questions. Select an algorithm based on edge direction, weights, and the required result.

## Essential algorithms
- **Breadth-first search (BFS):** explores by distance in edges using a queue. Finds shortest paths in unweighted or equal-weight graphs.
- **Depth-first search (DFS):** explores deeply using recursion or an explicit stack. Supports component detection and cycle reasoning.
- **Topological sorting:** orders DAG vertices so every edge goes forward. Kahn's method repeatedly removes zero-indegree vertices.
- **Dijkstra:** finds shortest paths with nonnegative edge weights; a [[03-Data-Structures/14-heaps-and-priority-queues|binary-heap]] adjacency-list implementation typically takes `O((V + E) log V)`.
- **Bellman–Ford:** allows negative weights and detects reachable negative cycles; takes `O(VE)`.
- **Kruskal:** builds an undirected minimum spanning tree by adding safe edges in increasing weight order, using disjoint sets to detect cycles.

## Worked example: BFS distances
```python
from collections import deque

def distances(graph, source):
    distance = {source: 0}
    queue = deque([source])
    while queue:
        vertex = queue.popleft()
        for neighbor in graph.get(vertex, []):
            if neighbor not in distance:
                distance[neighbor] = distance[vertex] + 1
                queue.append(neighbor)
    return distance
```
Marking discovery when enqueueing prevents repeated queue entries. With adjacency lists, BFS takes `O(V + E)` over the reachable subgraph and uses `O(V)` auxiliary space.

## Important distinctions
A shortest-path tree minimizes distances from one source. A minimum spanning tree minimizes total selected edge weight while connecting all vertices. These objectives generally produce different trees.

## Common mistakes
Dijkstra is not generally correct with negative edges. A DAG must include all vertices in its topological result; processing fewer vertices indicates a cycle. Disconnected undirected graphs have minimum spanning forests rather than a single spanning tree.

## Revision check
**Question:** Which algorithm finds the fewest-hop path?
**Answer:** BFS when every edge has the same cost.

## Connected concepts

- [[03-Data-Structures/15-graph-representation|Graphs and Their Representations]] — Adjacency representations determine traversal cost.
- [[03-Data-Structures/11-stacks-queues-and-deques|Stacks, Queues, and Deques]] — Queues and stacks control traversal order.
- [[03-Data-Structures/14-heaps-and-priority-queues|Heaps and Priority Queues]] — Heaps accelerate nonnegative weighted shortest paths.

[Back to contents](../README.md)
