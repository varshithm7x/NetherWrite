# Number Theory - Advanced Concepts

## Topic: Algorithms

### 1. Miller-Rabin Primality Test
-   **Principle:** A probabilistic primality test. It is used to determine whether a given number `n` is composite or probably prime. It doesn't definitively prove primality (like AKS primality test), but the probability of error can be made arbitrarily small.
-   **How it works:** Based on Fermat's Little Theorem and properties of quadratic residues. It checks if `n` passes a series of "witness" tests. If `n` fails any test, it's composite. If it passes enough tests, it's considered probably prime.
-   **Time Complexity:** O(k * log^3 n), where `k` is the number of test iterations.
-   **Applications:** Cryptography (e.g., RSA key generation).

### 2. Chinese Remainder Theorem (CRT)
-   **Principle:** Solves a system of linear congruences with pairwise coprime moduli. Given a system of congruences:
    `x ≡ a1 (mod n1)`
    `x ≡ a2 (mod n2)`
    ...
    `x ≡ ak (mod nk)`
    where `n1, n2, ..., nk` are pairwise coprime, the CRT guarantees a unique solution for `x` modulo `N = n1*n2*...*nk`.
-   **Applications:** Cryptography, large integer arithmetic, coding theory.

### 3. Pollard's Rho Algorithm (for Integer Factorization)
-   **Principle:** A probabilistic algorithm for finding a non-trivial factor of a composite number `n`. It's particularly effective for finding small prime factors.
-   **How it works:** Based on Floyd's cycle-finding algorithm and the birthday paradox. It generates a sequence of numbers `x_i` modulo `n` and checks `GCD(|x_i - x_j|, n)`. If the GCD is greater than 1, it's a factor of `n`.
-   **Time Complexity:** O(sqrt(p)) where `p` is the smallest prime factor of `n`. This is significantly faster than trial division for large `n` if `p` is small.

### 4. Euler's Totient Function (φ(n))
-   **Definition:** `φ(n)` is the count of positive integers up to a given integer `n` that are relatively prime to `n`. (i.e., `GCD(k, n) = 1` for `1 <= k <= n`).
-   **Properties:**
    -   If `p` is a prime number, `φ(p) = p - 1`.
    -   If `p` is a prime number and `k >= 1`, `φ(p^k) = p^k - p^(k-1) = p^k * (1 - 1/p)`.
    -   If `a` and `b` are coprime, `φ(ab) = φ(a)φ(b)`.
-   **Euler's Totient Theorem:** If `a` and `n` are coprime positive integers, then `a^φ(n) ≡ 1 (mod n)`. This is a generalization of Fermat's Little Theorem.
-   **Applications:** RSA cryptography.

### 5. Discrete Logarithm Problem
-   **Problem:** Given integers `a`, `b`, and `n`, find an integer `x` such that `a^x ≡ b (mod n)`. This `x` is called the discrete logarithm of `b` to the base `a` modulo `n`.
-   **Importance:** It's computationally hard (for sufficiently large prime `n`), which forms the basis for many cryptographic systems like Diffie-Hellman key exchange and ElGamal encryption.
-   **Algorithms:** Baby-step giant-step algorithm, Pollard's Rho for discrete logarithm. These are significantly faster than brute-force but still exponential in the worst case relative to the size of `n`.

### 6. Primitive Roots Modulo n
-   **Definition:** An integer `g` is a primitive root modulo `n` if every integer `a` coprime to `n` is congruent to a power of `g` modulo `n`. That is, `g` is a generator of the multiplicative group of integers modulo `n`.
-   **Properties:** A primitive root modulo `n` exists if and only if `n` is 1, 2, 4, `p^k`, or `2*p^k` where `p` is an odd prime and `k >= 1`.
-   **Applications:** Public-key cryptography (e.g., Diffie-Hellman).

---
*Note: This is a manually-generated study resource for CS Engineering students.*