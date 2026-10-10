# Number Theory - Implementation Details

## Topic: Algorithms

### 1. Sieve of Eratosthenes (for finding primes)

-   **Description:** An efficient algorithm for finding all prime numbers up to a specified integer `N`.
-   **Principle:** It iteratively marks as composite (i.e., not prime) the multiples of each prime, starting with the first prime number 2.
-   **Time Complexity:** O(N log log N)

```python
def sieve_of_eratosthenes(n):
    primes = [True] * (n + 1)
    primes[0] = primes[1] = False # 0 and 1 are not prime

    p = 2
    while (p * p <= n):
        # If primes[p] is not changed, then it is a prime
        if primes[p] == True:
            # Update all multiples of p
            for i in range(p * p, n + 1, p):
                primes[i] = False
        p += 1
    
    # Collect all prime numbers
    prime_numbers = []
    for p in range(n + 1):
        if primes[p]:
            prime_numbers.append(p)
    return prime_numbers
```

### 2. Euclidean Algorithm (for GCD)

-   **Description:** An efficient method for computing the greatest common divisor (GCD) of two integers.
-   **Principle:** Based on the property `GCD(a, b) = GCD(b, a % b)`.
-   **Time Complexity:** O(log(min(a, b)))

#### Iterative Implementation
```python
def gcd_iterative(a, b):
    while b:
        a, b = b, a % b
    return a
```

#### Recursive Implementation
```python
def gcd_recursive(a, b):
    if b == 0:
        return a
    return gcd_recursive(b, a % b)
```

### 3. Extended Euclidean Algorithm (for Modular Inverse)

-   **Description:** Extends the Euclidean algorithm to find integers `x` and `y` such that `a*x + b*y = GCD(a, b)`. It's crucial for finding modular inverses.
-   **Time Complexity:** O(log(min(a, b)))

```python
def extended_gcd(a, b):
    if a == 0:
        return b, 0, 1 # Returns (gcd, x, y) such that b*x + a*y = gcd
    
    gcd, x1, y1 = extended_gcd(b % a, a)
    
    # Update x and y using results of recursive call
    x = y1 - (b // a) * x1
    y = x1
    
    return gcd, x, y

# Function to find modular inverse a^-1 (mod m)
def mod_inverse(a, m):
    gcd, x, y = extended_gcd(a, m)
    if gcd != 1:
        # Modular inverse does not exist
        return None
    else:
        # x might be negative, ensure it's positive
        return (x % m + m) % m
```

### 4. Exponentiation by Squaring (Modular Exponentiation)

-   **Description:** An efficient algorithm for computing large positive integer powers of a number modulo another number.
-   **Principle:** Instead of performing `exp` multiplications, it performs approximately `log(exp)` multiplications by exploiting the property that `a^b = (a^(b/2))^2` if `b` is even, and `a^b = a * (a^((b-1)/2))^2` if `b` is odd.
-   **Time Complexity:** O(log exp)

```python
def power(base, exp, mod):
    res = 1
    base %= mod # Update base if it is more than or equal to mod

    while exp > 0:
        # If exp is odd, multiply base with result
        if exp % 2 == 1:
            res = (res * base) % mod
        
        # exp must be even now
        exp //= 2 # exp = exp/2
        base = (base * base) % mod # base = base^2
    
    return res
```

---
*Note: This is a manually-generated study resource for CS Engineering students.*