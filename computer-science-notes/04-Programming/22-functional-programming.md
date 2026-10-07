# Functional Programming

## Core idea
Functional programming emphasizes computation through functions, [[04-Programming/25-concurrency-and-synchronization|immutable values]], and explicit data transformation. It can reduce hidden dependencies and make behavior easier to test and reason about.

## Essential concepts
A **pure function** returns the same result for the same inputs and has no externally observable side effects. **Referential transparency** allows an expression to be replaced by its value without changing program behavior. **Higher-order functions** accept functions as arguments or return them.

Immutability means an existing value does not change. Persistent data structures can create updated versions while sharing unchanged parts, avoiding full copying. Immutability is different from making a variable name non-reassignable.

## Worked example: transforming data
```python
def total_discounted(prices, fraction):
    discounted = (price * (1 - fraction) for price in prices)
    return sum(discounted)

print(total_discounted([100, 50], 0.10))  # 135.0
```
The function does not modify the input sequence. Its generator computes intermediate values lazily, so it avoids storing a separate transformed list. Floating-point arithmetic here is illustrative; exact pricing may require decimal values or integer units.

## Effects at boundaries
A useful design keeps calculation separate from file access, networking, clocks, and randomness. Read external data, pass explicit values to pure logic, then perform the required output effect. Pure functions can still be slow or fail on unsupported inputs; purity does not imply total correctness.

## Closures and evaluation
A closure retains access to variables from its lexical environment. Captured mutable state can make a closure impure. Lazy evaluation delays work until a value is needed; eager evaluation computes immediately. Either strategy has memory and performance tradeoffs.

## Common mistakes
Copying large structures on every update may be expensive. Recursive functional code can exceed stack limits without optimization. `map` and `filter` alone do not guarantee purity if their callbacks have effects.

## Revision check
**Question:** Is a function reading the current clock pure?
**Answer:** No. Its result depends on external state beyond its explicit inputs.

## Connected concepts

- [[04-Programming/25-concurrency-and-synchronization|Concurrency and Synchronization]] — Immutable values reduce shared-state synchronization hazards.

[Back to contents](../README.md)
