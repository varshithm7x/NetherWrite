# Computational Geometry - Interview Questions

## Topic: Algorithms

### Common Interview Questions on Computational Geometry

1.  **Convex Hull (Graham Scan or Monotone Chain):** Given a set of points in a 2D plane, find the convex hull of these points.
    *   *Hint:* Explain the steps for Graham Scan, especially finding `P0` and [[Sorting_Overview|sorting]] by polar angle using cross products.

2.  **Point in Polygon Test:** Given a point `P` and a simple polygon (defined by an ordered list of vertices), determine if `P` is inside, outside, or on the boundary of the polygon.
    *   *Hint:* The ray casting algorithm is a common approach. Discuss how to handle horizontal edges and points on edges.

3.  **Line Segment Intersection:** Determine if two given line segments `(P1, P2)` and `(P3, P4)` intersect. If they do, find the intersection point.
    *   *Hint:* Use cross products to check the orientation of points. If `(P1, P2, P3)` and `(P1, P2, P4)` have different orientations, and `(P3, P4, P1)` and `(P3, P4, P2)` have different orientations, then they intersect. Handle collinear cases.

4.  **Closest Pair of Points:** Given a set of `N` points in a 2D plane, find the pair of points with the smallest Euclidean distance.
    *   *Hint:* Explain the [[Divide_and_Conquer_Overview|divide and conquer]] approach, especially the crucial "strip" step where you only need to check points within a certain y-distance of each other.

5.  **Smallest Enclosing Circle:** Given a set of `N` points, find the smallest circle that encloses all of them.
    *   *Hint:* This is often solved with Welzl's algorithm (randomized incremental). The smallest enclosing circle is either defined by two points as a diameter or by three points on its circumference.

6.  **Visibility Polygon:** Given a point `P` and a simple polygon, compute the visibility polygon of `P` from `P` within the polygon.
    *   *Hint:* This is a more advanced problem, often involving angular sweep around `P` and handling intersections with polygon edges.

### Whiteboarding Exercise

**Problem:** You are given `N` rectangles in a 2D plane, each defined by its bottom-left and top-right coordinates `(x1, y1, x2, y2)`. Find the total area covered by all rectangles. Overlapping areas should only be counted once.

**Discussion Points:**
*   Why is simply summing the areas of all rectangles incorrect?
*   How can a sweep-line algorithm be adapted to solve this problem?
*   What would be the events in your sweep line? (Vertical lines at `x1` and `x2`).
*   What data structure would you use to maintain the "active" segments along the sweep line and calculate the covered length? (Hint: A [[Segment_Trees_Overview|segment tree]] or interval [[Trees_Overview|tree]] can be very useful here).
*   How do you combine the covered lengths between events to calculate the total area?

---
*Note: This is a manually-generated study resource for CS Engineering students.*