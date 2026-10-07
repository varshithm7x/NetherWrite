# Graphs and Their Representations

## Core idea
A graph consists of vertices and edges. It models relationships such as roads, dependencies, links, and social connections. Edges may be directed or undirected, weighted or unweighted.

## Essential concepts
A path follows edges between vertices. A cycle returns to its starting vertex without repeating intermediate vertices in the usual simple-cycle definition. An undirected graph is connected when every pair of vertices has a path. Directed graphs distinguish weak connectivity from strong connectivity.

A directed acyclic graph (DAG) contains no directed cycle and supports topological ordering. A tree is an undirected connected graph with no cycles and has exactly `V - 1` edges.

## Representation tradeoffs
| Representation | Storage | Edge existence | Visit neighbors |
|---|---|---|---|
| Adjacency matrix | `Θ(V²)` | `O(1)` | `O(V)` |
| Adjacency list | `Θ(V + E)` | Often `O(degree)` | `O(degree)` |
| Edge list | `Θ(E)` plus vertices | Usually `O(E)` | Usually `O(E)` |

For undirected adjacency lists, each edge usually appears twice. A set-based neighbor collection can improve expected membership checks while adding overhead.

## Worked example
```python
graph = {
    'A': ['B', 'C'],
    'B': ['A', 'D'],
    'C': ['A'],
    'D': ['B'],
}
```
This graph has four vertices and three undirected edges. It is connected and acyclic, so it is a tree. Its adjacency lists contain six neighbor entries because each edge is represented in both directions.

## Common mistakes
State whether self-loops and parallel edges are allowed. Include isolated vertices rather than inferring all vertices from edges. Edge count formulas differ between directed and undirected graphs. Graph representations determine algorithm costs.

## Revision check
**Question:** Which representation usually suits a sparse graph?
**Answer:** Adjacency lists, because space scales with existing edges.

## Connected concepts

- [[02-Algorithms/20-graph-algorithms|Core Graph Algorithms]] — Traversal and shortest-path algorithms operate on these representations.

[Back to contents](../README.md)
