# Backtracking - Overview

## Topic: Algorithms

### Introduction to Backtracking
Backtracking is a general algorithmic technique for solving computational problems, especially constraint satisfaction problems and optimization problems. It systematically searches for solutions by trying to build a solution incrementally, one piece at a time. Whenever a partial solution is found that cannot possibly be completed to a valid solution, the algorithm "backs up" (backtracks) to a previous state and [[Tries_Overview|tries]] a different choice.

### Analogy: Navigating a Maze
Imagine you're trying to find a path through a maze.
1.  You start at the beginning and try one path.
2.  If you hit a dead end, you retrace your steps (backtrack) to the last junction where you had another option.
3.  You then try that other option.
4.  You continue this until you either find the exit or exhaust all possible paths.

### Key Characteristics
-   **Systematic Search:** Backtracking explores all potential partial solutions and eliminates those that do not meet the problem's constraints.
-   **Depth-First Search (DFS) Approach:** It typically performs a depth-first traversal of the "state-space [[Trees_Overview|tree]]" – a [[Trees_Overview|tree]] that represents all possible sequences of choices.
-   **Pruning:** The essence of backtracking is "pruning" the search space. When a partial solution violates constraints, the algorithm avoids exploring any further paths stemming from that invalid partial solution. This significantly reduces the total search time compared to brute-force.

### Components of a Backtracking Algorithm
A typical backtracking algorithm involves:
1.  **State Representation:** How to represent the current partial solution.
2.  **Base Case/Goal Check:** A condition to determine if a complete, valid solution has been found.
3.  **Choices/Candidates:** For the current state, what are the possible valid choices to extend the partial solution?
4.  **Constraints/Pruning:** Rules to check if a choice, when added to the current partial solution, leads to an invalid state. If it does, discard this path and backtrack.
5.  **Recursion:** The algorithm recursively [[Tries_Overview|tries]] each valid choice.
6.  **Backtrack:** If a choice leads to a dead end (no solution, or invalid state), undo the choice and try another.

### When to Use Backtracking
Backtracking is suitable for problems where:
-   You need to find all possible solutions (or at least one solution).
-   The solution can be built step-by-step.
-   There are clear constraints that can be checked at each step to prune the search space.

### Common Problems Solved by Backtracking
-   **N-Queens Problem:** Place N queens on an N×N chessboard such that no two queens attack each other.
-   **Sudoku Solver:** Fill a 9×9 grid so that each row, column, and 3×3 subgrid contains all digits from 1 to 9.
-   **Knight's Tour Problem:** Find a sequence of moves of a knight on a chessboard such that the knight visits every square exactly once.
-   **Permutations and Combinations:** Generating all possible permutations or combinations of a set of elements.
-   **Subset Sum Problem:** Find a subset of a given set whose sum equals a given target.
-   **Maze Solving:** Finding a path from a start to an end point in a maze.

### Complexity
The time complexity of backtracking algorithms is often exponential because, in the worst case, they might explore a significant portion of the entire search space. However, effective pruning (checking constraints early) can drastically reduce the actual runtime.

---
*Note: This is a manually-generated study resource for CS Engineering students.*