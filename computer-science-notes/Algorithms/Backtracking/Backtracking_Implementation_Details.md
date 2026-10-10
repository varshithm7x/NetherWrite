# Backtracking - Implementation Details

## Topic: Algorithms

### General Structure of a Backtracking Algorithm

A backtracking function typically looks like this:

```python
def solve(state):
    if is_a_solution(state):
        add_solution_to_results(state)
        return

    # Iterate through possible choices
    for choice in generate_choices(state):
        # Apply choice
        new_state = apply_choice(state, choice)

        # Check if choice is valid (pruning)
        if is_valid(new_state):
            solve(new_state) # Recurse
        
        # Backtrack: undo the choice (if state was modified in place)
        # This step is crucial if the state object is mutated and passed by reference.
        # If new_state was a copy, explicit undoing is not needed.
        undo_choice(state, choice)
```

### Example 1: N-Queens Problem

-   **Problem:** Place `N` non-attacking queens on an `N×N` chessboard.
-   **State:** A list `board` where `board[row]` stores the column of the queen in that `row`.
-   **Choices:** For each `row`, try placing a queen in each possible `column`.
-   **Constraints:** Check if placing a queen in `(row, col)` conflicts with any previously placed queens.

```python
def solve_n_queens(n):
    results = []
    board = [-1] * n # board[row] = column of queen in that row

    def is_safe(row, col):
        for prev_row in range(row):
            # Check column conflict (same column)
            if board[prev_row] == col:
                return False
            # Check diagonal conflicts (abs(col_diff) == abs(row_diff))
            if abs(board[prev_row] - col) == abs(prev_row - row):
                return False
        return True

    def backtrack(row):
        if row == n: # All queens placed successfully
            results.append(list(board)) # Add a copy of the solution
            return

        for col in range(n):
            if is_safe(row, col):
                board[row] = col # Make a choice
                backtrack(row + 1) # Recurse
                board[row] = -1 # Backtrack (undo choice) - not strictly necessary here but good practice
    
    backtrack(0)
    return results

# Convert numerical solutions to chessboard representation
def format_n_queens_solution(solution):
    formatted = []
    for row_placement in solution:
        row_str = ""
        for col_idx in range(len(row_placement)):
            row_str += "Q" if row_placement == col_idx else "."
        formatted.append(row_str)
    return formatted
```

### Example 2: Permutations of an [[Arrays_Overview|Array]]

-   **Problem:** Given a collection of distinct numbers, return all possible permutations.
-   **State:** The current permutation being built.
-   **Choices:** For each position, pick an unchosen number from the input set.
-   **Constraints:** Each number must be used exactly once.

```python
def permute(nums):
    results = []
    n = len(nums)
    
    def backtrack(current_permutation, remaining_nums):
        if len(current_permutation) == n: # Base case: a full permutation is formed
            results.append(list(current_permutation))
            return

        for i in range(len(remaining_nums)):
            # Choose: pick an element
            choice = remaining_nums[i]
            current_permutation.append(choice)
            
            # Recurse: explore with the choice
            backtrack(current_permutation, remaining_nums[:i] + remaining_nums[i+1:])
            
            # Backtrack: undo the choice
            current_permutation.pop()
    
    backtrack([], nums)
    return results
```

### Example 3: Sudoku Solver

-   **Problem:** Solve a Sudoku puzzle by filling the empty cells.
-   **State:** The current state of the 9x9 Sudoku board.
-   **Choices:** For an empty cell, try placing digits from 1 to 9.
-   **Constraints:** Check if the placed digit is valid according to Sudoku rules (no duplicates in row, column, or 3x3 subgrid).

```python
# Conceptual Sudoku Solver
def solve_sudoku(board):
    # Find an empty cell (row, col)
    # If no empty cell, puzzle is solved, return True

    # For each digit from 1 to 9:
        # If digit is valid in (row, col):
            # Place digit
            # If solve_sudoku(board) returns True: (Recurse)
                # return True (found a solution)
            # Else:
                # board[row][col] = '.' (Backtrack: undo choice)
    # Return False (no digit works for this cell)
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*