# Backtracking - Interview Questions

## Topic: Algorithms

### Common Interview Questions on Backtracking

1.  **N-Queens Problem:** Place `N` non-attacking queens on an `N×N` chessboard. Return all distinct solutions.
    *   *Hint:* Use a recursive function `solve(row)` that [[Tries_Overview|tries]] to place a queen in the current `row`. Maintain sets/[[Arrays_Overview|arrays]] to check for column and diagonal conflicts efficiently.

2.  **Permutations:** Given a collection of distinct numbers, return all possible permutations.
    *   *Hint:* Use a recursive helper function. For each position, iterate through the available numbers, place one, mark it as used, recurse, then unmark and try another.

3.  **Combinations:** Given two integers `n` and `k`, return all possible combinations of `k` numbers chosen from the range `[1, n]`.
    *   *Hint:* Similar to permutations, but the order does not matter, and elements are not used more than once. Use a `start` parameter in recursion to avoid duplicate combinations.

4.  **Subset Sum Problem:** Given a set of integers `nums` and a target sum `target`, determine if there is a subset of `nums` that sums up to `target`.
    *   *Hint:* For each number, you have two choices: include it in the subset or exclude it. Recursively explore both paths, decrementing the target sum if the number is included.

5.  **Sudoku Solver:** Write a program to solve a Sudoku puzzle by filling the empty cells.
    *   *Hint:* Use a backtracking approach. Find an empty cell, try placing digits from 1-9. If a digit is valid, place it and recurse. If recursion returns false, backtrack (remove digit and try next).

6.  **Generate Parentheses:** Given `n` pairs of parentheses, write a function to generate all combinations of well-formed parentheses.
    *   *Hint:* Use recursion with two counters, `open` and `close`, for the number of open and close parentheses used. Add '(' if `open < n`. Add ')' if `close < open`. Base case when `open == n` and `close == n`.

7.  **Combination Sum / Combination Sum II:** Given a set of candidate numbers (`candidates`) and a target number (`target`), find all unique combinations in `candidates` where the candidate numbers sum to `target`. In Combination Sum II, each number in `candidates` may only be used once in the combination.
    *   *Hint:* For Combination Sum, sort `candidates` and use a `start_index` to avoid duplicate combinations and ensure order. For Combination Sum II, handle duplicates by skipping elements if they are the same as the previous one and were not used.

### Whiteboarding Exercise

**Problem:** Given an `m x n` `grid` representing a maze, where `0` means empty space and `1` means a wall. You start at `(0, 0)` and want to reach `(m-1, n-1)`. Find *all* possible paths from start to end. You can only move up, down, left, or right.

**Discussion Points:**
*   How would you represent the current path?
*   What is the base case (when a path is found)?
*   How do you ensure you don't go out of bounds or through walls?
*   How do you prevent infinite loops (visiting the same cell twice in one path)? (Hint: Mark cells as visited/unvisited during recursion).
*   How do you handle backtracking (undoing the "visited" mark)?

---
*Note: This is a manually-generated study resource for CS Engineering students.*