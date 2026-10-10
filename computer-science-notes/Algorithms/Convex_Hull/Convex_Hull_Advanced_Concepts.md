# Convex Hull - Advanced Concepts

## Lower Bounds for Convex Hull
Discusses the theoretical lower bound for computing convex hulls, typically O(n log n) due to the sorting bottleneck, and when this bound can be circumvented (e.g., for special input distributions).

## Convex Hull in Higher Dimensions
Extends the concept of convex hulls to 3D and higher dimensions. Discusses algorithms like the Beneath-and-Beyond method and their increased computational complexity.

## Dynamic Convex Hull
Algorithms for maintaining the convex hull of a set of points as points are inserted or deleted, often using specialized data structures like balanced binary search trees or dynamic geometric data structures.

## Smallest Enclosing Circle
Related problems, such as finding the smallest circle that encloses a given set of points (Min-Disk problem), and its connection to convex hull properties.

## Convex Hull of Moving Points
Challenges and algorithms for computing the convex hull when the points are continuously moving, which is relevant in simulations and real-time tracking applications.

## Chan's Algorithm
An optimal output-sensitive algorithm for computing the convex hull, achieving O(n log h) time complexity, where h is the number of vertices on the hull.
