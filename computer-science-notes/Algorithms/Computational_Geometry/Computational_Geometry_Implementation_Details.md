# Computational Geometry - Implementation Details

## Topic: Algorithms

### Basic Geometric Primitives and Operations

#### 1. Point Representation
```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return f"({self.x}, {self.y})"
```

#### 2. Cross Product (for orientation, collinearity)
The 2D cross product of vectors `(p1, p2)` and `(p1, p3)` gives information about the orientation of `p3` with respect to the directed line segment `(p1, p2)`.
-   `> 0`: `p1->p2->p3` is a counter-clockwise turn.
-   `< 0`: `p1->p2->p3` is a clockwise turn.
-   `= 0`: `p1`, `p2`, `p3` are collinear.

```python
def cross_product(p1, p2, p3):
    return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x)
```

#### 3. Distance between two points
```python
import math

def dist_sq(p1, p2): # Squared distance to avoid sqrt for comparisons
    return (p1.x - p2.x)**2 + (p1.y - p2.y)**2

def distance(p1, p2):
    return math.sqrt(dist_sq(p1, p2))
```

### Convex Hull: Graham Scan Algorithm

-   **Problem:** Find the smallest convex polygon that contains a given set of `n` points.
-   **Time Complexity:** O(N log N)
-   **Steps:**
    1.  Find the point with the lowest Y-coordinate (and leftmost if ties), let's call it `P0`. `P0` is guaranteed to be on the convex hull.
    2.  Sort all other points by the polar angle they make with `P0`. If two points have the same angle, the closer one comes first.
    3.  Initialize a [[Stacks_Overview|stack]] with `P0`, `P1`, `P2` (first three points in sorted order).
    4.  Iterate through the sorted points. For each new point `Pi`:
        -   While the [[Stacks_Overview|stack]] has at least two points and the sequence (second-top, top, `Pi`) makes a non-left (clockwise or collinear) turn, pop the top point from the [[Stacks_Overview|stack]].
        -   Push `Pi` onto the [[Stacks_Overview|stack]].
    5.  The points remaining in the [[Stacks_Overview|stack]] form the convex hull.

```python
def graham_scan(points):
    n = len(points)
    if n < 3: return points # Convex hull requires at least 3 points

    # 1. Find P0 (point with minimum y-coordinate)
    p0 = min(points, key=lambda p: (p.y, p.x))
    points.remove(p0)

    # 2. Sort points by polar angle with P0
    # Use cross product for sorting to avoid float arithmetic
    # and to handle collinear points (closer one first)
    points.sort(key=lambda p: (math.atan2(p.y - p0.y, p.x - p0.x), dist_sq(p0, p)))

    # Handle cases where multiple points are collinear with P0 and the last one is desired
    # This step is often implicitly handled by a robust sort or explicit check in the loop
    
    # 3. Initialize stack
    stack = [p0, points[0]]
    if n > 2: # Add P2 if it exists and is not collinear with P0, P1
        # Remove points[0] if it's collinear and within segment P0-points[1]
        # This is a simplification; a more robust sort handles this better.
        pass # For simplicity, assuming points[0] and points[1] are distinct enough

    # 4. Process remaining points
    for i in range(1, len(points)):
        while len(stack) > 1 and cross_product(stack[-2], stack[-1], points[i]) <= 0:
            stack.pop() # Pop if not a left turn (i.e., clockwise or collinear)
        stack.append(points[i])
    
    return stack
```

### Point in Polygon Test: Ray Casting Algorithm

-   **Problem:** Determine if a point `P` is inside a polygon `poly`.
-   **Time Complexity:** O(N) for a polygon with N vertices.

```python
def is_inside_polygon(polygon, p_test):
    n = len(polygon)
    inside = False

    # Start from the ray going right (positive x direction)
    # The polygon vertices are expected to be ordered (e.g., counter-clockwise)
    for i in range(n):
        p1 = polygon[i]
        p2 = polygon[(i + 1) % n] # Next vertex
        
        # Check if point is on horizontal segment
        if p1.y == p2.y == p_test.y and min(p1.x, p2.x) <= p_test.x <= max(p1.x, p2.x):
            return True # Point is on a horizontal edge

        # Check if point is on vertical segment
        if p1.x == p2.x == p_test.x and min(p1.y, p2.y) <= p_test.y <= max(p1.y, p2.y):
             return True # Point is on a vertical edge

        # Check for intersection with horizontal ray
        if ((p1.y > p_test.y) != (p2.y > p_test.y)): # Ray crosses the edge vertically
            # Calculate intersection x-coordinate
            intersect_x = (p2.x - p1.x) * (p_test.y - p1.y) / (p2.y - p1.y) + p1.x
            
            if p_test.x < intersect_x: # If ray crosses edge to the right of point
                inside = not inside
            elif p_test.x == intersect_x: # Point is on an edge (non-horizontal, non-vertical)
                return True

    return inside
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*