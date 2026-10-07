# Dynamic Programming

## Core idea
Dynamic programming solves repeated subproblems once and reuses their answers. It is useful when a problem has overlapping subproblems and a recurrence whose states capture all information needed for future decisions.

## Design steps
1. Define a state precisely.
2. Express its answer using smaller states.
3. Specify base cases and impossible states.
4. Choose an evaluation order that respects dependencies.
5. Store choices if the actual solution must be reconstructed.

[[02-Algorithms/08-recursion-and-divide-and-conquer|Memoization]] evaluates states on demand with a cache. Tabulation fills a table in dependency order. Runtime is approximately the number of evaluated states multiplied by the work per state.

## Worked example: minimum coins
Given positive denominations and unlimited coins, find the minimum number making an amount:

```python
def minimum_coins(coins, amount):
    dp = [0] + [float('inf')] * amount
    for total in range(1, amount + 1):
        for coin in coins:
            if coin <= total:
                dp[total] = min(dp[total], 1 + dp[total - coin])
    return -1 if dp[amount] == float('inf') else dp[amount]
```
For denominations `[1, 3, 4]` and amount `6`, the answer is `2`, using `3 + 3`. Runtime is `O(amount × number_of_denominations)` and space is `O(amount)`.

## Other applications
The longest common subsequence uses prefix-pair states. Zero-one knapsack tracks item choices and capacity. DAG paths can use a topological evaluation order. Rolling arrays reduce memory when only recent layers are needed.

## Common mistakes
An incomplete state definition may merge situations with different futures. Incorrect loop order can accidentally allow repeated use of a zero-one item. Numeric-capacity algorithms may be pseudopolynomial: capacity can be exponentially large relative to its bit length.

## Revision check
**Question:** Why is greedy coin selection wrong for `[1, 3, 4]` and `6`?
**Answer:** It chooses `4 + 1 + 1`, while `3 + 3` uses fewer coins.

## Connected concepts

- [[02-Algorithms/08-recursion-and-divide-and-conquer|Recursion and Divide and Conquer]] — Memoization caches answers to repeated recursive states.
- [[02-Algorithms/19-greedy-algorithms|Greedy Algorithms]] — The coin-change example shows when local choices fail.
- [[02-Algorithms/20-graph-algorithms|Core Graph Algorithms]] — DAG path recurrences can be evaluated in topological order.

[Back to contents](../README.md)
