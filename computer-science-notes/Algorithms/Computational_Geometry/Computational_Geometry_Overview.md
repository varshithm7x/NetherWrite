# Computational Geometry - Overview

## Topic: Algorithms

### Introduction to Computational Geometry
Computational Geometry is a branch of computer science dedicated to the study of algorithms that solve problems stated in terms of geometry. It deals with algorithms for geometric objects like points, lines, polygons, and polyhedra, and is crucial in fields such as computer graphics, [[Robotics_Overview|robotics]], geographic information systems (GIS), and computer-aided design (CAD).

### Fundamental Geometric Primitives
-   **Points:** Basic building blocks, usually represented by coordinates (x, y) in 2D or (x, y, z) in 3D.
-   **Lines/Line Segments:** Defined by two points.
-   **Vectors:** Direction and magnitude.
-   **Polygons:** Closed shapes formed by a sequence of line segments (edges) connected end-to-end.
-   **Convex Hull:** The smallest convex polygon that encloses a given set of points.

### Common Problems in Computational Geometry

#### 1. Convex Hull Problem
-   **Problem:** Given a set of `n` points, find the smallest convex polygon that contains all the points.
-   **Algorithms:** Graham Scan (O(N log N)), Jarvis March (O(NH) where H is number of points on hull), Monotone Chain (O(N log N)).

#### 2. Line Segment Intersection
-   **Problem:** Given a set of `n` line segments, find all intersection points.
-   **Naive Approach:** O(N^2) by checking every pair of segments.
-   **Bentley-Ottmann Algorithm (Sweep Line Algorithm):** O(N log N + K) where K is the number of intersections. This is a powerful technique.

#### 3. Closest Pair of Points
-   **Problem:** Given a set of `n` points, find the two points that are closest to each other.
-   **Naive Approach:** O(N^2).
-   **[[Divide_and_Conquer_Overview|Divide and Conquer]] Algorithm:** O(N log N).

#### 4. Point in Polygon Test
-   **Problem:** Given a polygon and a point, determine if the point lies inside, outside, or on the boundary of the polygon.
-   **Algorithms:**
    -   **Ray Casting Algorithm (or Winding Number Algorithm):** Cast a ray from the point in any direction and count the number of times it intersects the polygon's edges. If odd, inside; if even, outside. Special handling for boundary conditions. O(N) for simple polygons.
    -   **Crossing Number Algorithm:** Count how many times a ray from the point crosses the edges.

#### 5. Voronoi Diagrams and Delaunay Triangulations
-   **Voronoi Diagram:** For a given set of points (sites), partitions the plane into regions such that all points in a region are closer to one site than to any other site.
-   **Delaunay Triangulation:** A triangulation of a set of points such that no point is inside the circumcircle of any triangle in the triangulation. It is the dual of the Voronoi diagram.
-   **Algorithms:** Fortune's Algorithm (O(N log N)).

### Techniques and Approaches
-   **Sweep Line Algorithm:** Imagines a vertical (or horizontal) line sweeping across the plane, processing geometric events as it encounters them. Efficiently solves problems like line segment intersection and Voronoi diagrams.
-   **[[Divide_and_Conquer_Overview|Divide and Conquer]]:** Recursively breaks down geometric problems into smaller subproblems.
-   **Randomization:** Used in algorithms for constructing convex hulls, Delaunay triangulations.
-   **Geometric Hashing:** For pattern matching in geometric contexts.

### Importance of Robustness
Computational geometry algorithms often deal with floating-point numbers, which can lead to precision issues. Robustness (handling numerical inaccuracies and degenerate cases) is a major concern. Techniques like using exact arithmetic or careful perturbation are sometimes necessary.

---
*Note: This is a manually-generated study resource for CS Engineering students.*