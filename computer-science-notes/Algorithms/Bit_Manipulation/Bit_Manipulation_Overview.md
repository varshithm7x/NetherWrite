# Bit Manipulation - Overview

## Topic: Algorithms

### Introduction to Bit Manipulation
Bit manipulation is the act of algorithmically manipulating bits or other smaller pieces of data. It involves operations at the bit level of data, which is the lowest level of representation in a computer. Mastering bit manipulation can lead to highly optimized and efficient solutions, especially in scenarios where memory or processing speed is critical.

### Why is Bit Manipulation Important?
1.  **Performance:** Bitwise operations are typically faster than arithmetic operations (addition, multiplication) or division. This can lead to significant performance improvements in time-critical code.
2.  **Memory Efficiency:** Packing multiple boolean flags or small integer values into a single integer can save memory.
3.  **Specific Problem Solving:** Many problems inherently require bit-level thinking (e.g., working with masks, flags, powers of 2).
4.  **Hardware Interaction:** Essential for low-level programming, device drivers, and embedded systems that interact directly with hardware registers.

### Key Bitwise Operators

1.  **AND (`&`):**
    -   Sets each bit to 1 if both corresponding bits are 1; otherwise, it sets it to 0.
    -   `0 & 0 = 0`, `0 & 1 = 0`, `1 & 0 = 0`, `1 & 1 = 1`
    -   **Use:** Checking if a bit is set, clearing a bit, masking.

2.  **OR (`|`):**
    -   Sets each bit to 1 if at least one of the corresponding bits is 1; otherwise, it sets it to 0.
    -   `0 | 0 = 0`, `0 | 1 = 1`, `1 | 0 = 1`, `1 | 1 = 1`
    -   **Use:** Setting a bit, combining flags.

3.  **XOR (`^`):**
    -   Sets each bit to 1 if the corresponding bits are different; otherwise, it sets it to 0.
    -   `0 ^ 0 = 0`, `0 ^ 1 = 1`, `1 ^ 0 = 1`, `1 ^ 1 = 0`
    -   **Use:** Toggling a bit, finding the unique element, swapping numbers without temporary variable.

4.  **NOT (`~`):** (Unary operator)
    -   Inverts all the bits of its operand. (Flips 0 to 1 and 1 to 0).
    -   **Use:** Inverting a bitmask. (Note: In C++/Java, `~x` is equivalent to `-x-1`).

5.  **Left Shift (`<<`):**
    -   Shifts all bits to the left by a specified number of positions. Vacated bits on the right are filled with 0s.
    -   `x << y` is equivalent to `x * 2^y`.
    -   **Use:** Multiplying by powers of 2, creating bitmasks.

6.  **Right Shift (`>>`):**
    -   Shifts all bits to the right by a specified number of positions.
    -   `x >> y` is equivalent to `x / 2^y` (integer division).
    -   **Use:** Dividing by powers of 2, inspecting bits.
    -   **Important:** In C++/Java, there are two types: logical right shift (fills with 0s) and arithmetic right shift (fills with sign bit). Python's `>>` is generally arithmetic (maintains sign).

### Bitwise Tricks and Patterns
-   **Checking if a number is even/odd:** `(num & 1) == 0` for even, `(num & 1) == 1` for odd.
-   **Checking if a number is a power of 2:** `(num > 0) and (num & (num - 1) == 0)`.
-   **Swapping two numbers:** `a = a ^ b; b = a ^ b; a = a ^ b;`
-   **Counting set bits (Hamming weight):** Many specialized algorithms exist (e.g., Brian Kernighan's algorithm).
-   **Setting the Nth bit:** `num | (1 << N)`
-   **Clearing the Nth bit:** `num & (~(1 << N))`
-   **Toggling the Nth bit:** `num ^ (1 << N)`
-   **Extracting the Nth bit:** `(num >> N) & 1`

### State Representation
Bitmasks are commonly used to represent sets of options, states, or visited nodes in algorithms, particularly in [[Dynamic_Programming_Overview|dynamic programming]] (Bitmask DP) or [[Graphs_Overview|graph]] problems with a small number of elements.

---
*Note: This is a manually-generated study resource for CS Engineering students.*# Bit Manipulation - Overview

