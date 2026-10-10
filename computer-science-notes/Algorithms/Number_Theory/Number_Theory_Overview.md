# Number Theory - Overview

## Topic: Algorithms

### Introduction to Number Theory for Algorithms
Number Theory is a branch of pure mathematics concerned with the properties of integers. In the context of algorithms and computer science, number theory provides fundamental concepts and tools for solving problems related to prime numbers, modular arithmetic, divisibility, and cryptography. Many advanced algorithms, particularly in security and data processing, rely on these number-theoretic principles.

### Key Concepts

#### 1. Divisibility and Prime Numbers
-   **Divisibility:** An integer `a` divides an integer `b` (denoted `a | b`) if there exists an integer `k` such that `b = ak`.
-   **Prime Number:** A natural number greater than 1 that has no positive divisors other than 1 and itself.
-   **Composite Number:** A natural number greater than 1 that is not prime.
-   **Fundamental Theorem of Arithmetic:** Every integer greater than 1 can be uniquely represented as a product of prime numbers (up to the order of the factors).

#### 2. Greatest Common Divisor (GCD) and Least Common Multiple (LCM)
-   **GCD(a, b):** The largest positive integer that divides both `a` and `b` without leaving a remainder.
-   **LCM(a, b):** The smallest positive integer that is a multiple of both `a` and `b`.
-   **Relationship:** `GCD(a, b) * LCM(a, b) = |a * b|`.

#### 3. Modular Arithmetic
-   **Congruence:** `a` is congruent to `b` modulo `n` (denoted `a ≡ b (mod n)`) if `a - b` is divisible by `n`. This means `a` and `b` have the same remainder when divided by `n`.
-   **Properties:** Modular arithmetic forms a ring. Operations like addition, subtraction, and multiplication behave similarly to regular arithmetic, but division is more complex and requires modular inverses.
-   **Applications:** Hashing, cryptography, checksums.

#### 4. Modular Inverse
-   The modular multiplicative inverse of an integer `a` modulo `n` is an integer `x` such that `(a * x) ≡ 1 (mod n)`.
-   A modular inverse `x` exists if and only if `a` and `n` are coprime (i.e., `GCD(a, n) = 1`).
-   **Fermat's Little Theorem:** If `p` is a prime number, then for any integer `a` not divisible by `p`, `a^(p-1) ≡ 1 (mod p)`. This means `a^(p-2) ≡ a^-1 (mod p)`.
-   **Extended Euclidean Algorithm:** Can find modular inverses even when `n` is not prime (as long as `GCD(a, n) = 1`).

### Common Number Theory Algorithms

#### 1. Primality Testing
-   **Naive Trial Division:** Check divisibility by all numbers up to `sqrt(N)`. O(sqrt(N)).
-   **Sieve of Eratosthenes:** Generates all prime numbers up to a given limit `N`. O(N log log N).
-   **Miller-Rabin Primality Test:** A probabilistic (Monte Carlo) test that determines whether a given number is composite or likely prime. O(k * log^3 N) where `k` is the number of iterations.

#### 2. Integer Factorization
-   **Trial Division:** Same as naive primality test, repeatedly divide by smallest prime factors.
-   **Pollard's Rho Algorithm:** A probabilistic algorithm for integer factorization.
-   **Elliptic Curve Factorization Method (ECM):** A more advanced algorithm for finding factors.

#### 3. Euclidean Algorithm (for GCD)
-   **Principle:** `GCD(a, b) = GCD(b, a % b)`. Base case: `GCD(a, 0) = a`.
-   **Time Complexity:** O(log(min(a, b))).

#### 4. Extended Euclidean Algorithm
-   **Principle:** Finds integers `x` and `y` such that `a*x + b*y = GCD(a, b)`.
-   **Use Cases:** Finding modular inverses.

#### 5. Exponentiation by Squaring (Modular Exponentiation)
-   **Principle:** Efficiently computes `(base^exp) % mod`. Instead of `exp` multiplications, it performs O(log exp) multiplications.
-   **Time Complexity:** O(log exp).

---
*Note: This is a manually-generated study resource for CS Engineering students.*