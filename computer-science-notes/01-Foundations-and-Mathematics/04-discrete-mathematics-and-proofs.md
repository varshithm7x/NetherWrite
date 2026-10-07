# Discrete Mathematics and Proof Techniques

## Core idea
Discrete mathematics studies countable structures such as integers, sets, graphs, and logical propositions. It provides the vocabulary for defining algorithms and proving their properties.

## Essential concepts
- A **set** contains distinct elements. Union combines membership; intersection keeps shared elements; difference removes elements in another set.
- A **relation** is a set of ordered pairs. An equivalence relation is reflexive, symmetric, and transitive; it partitions a set into equivalence classes.
- A **function** assigns one output to each input. Injective functions never map different inputs to the same output; surjective functions cover the codomain; bijections satisfy both.
- `∀x P(x)` means every relevant `x` satisfies `P`; `∃x P(x)` means at least one does.
- Negating a universal statement produces an existential statement: `NOT ∀x P(x)` is `∃x NOT P(x)`.

## Proof techniques
**Direct proof:** start from assumptions and derive the claim. **Contrapositive:** prove `NOT Q implies NOT P` instead of `P implies Q`. **Contradiction:** assume the claim is false and derive an impossibility. **Induction:** prove a base case and a step from `n` to `n + 1`.

## Worked example: induction
Claim: `1 + 2 + ... + n = n(n + 1)/2` for positive integers.

The base case `n = 1` holds. Assume the claim for `n`. Adding `n + 1` gives:

```text
n(n + 1)/2 + (n + 1)
= (n + 1)(n + 2)/2
```
This is the formula for the next integer, completing the proof.

## Common mistakes
Examples support intuition but do not prove a universal claim. The converse of an implication need not hold. Induction requires both a base case and a valid step covering the stated domain.

## Revision check
**Question:** Negate “every request succeeds.”
**Answer:** “At least one request does not succeed.”

## Connected concepts

- [[02-Algorithms/07-algorithm-complexity|Algorithm Complexity and Asymptotic Analysis]] — Proofs and induction establish algorithmic bounds.
- [[12-Compilers-and-Computation-Theory/50-automata-computability-and-complexity|Automata, Computability, and Complexity Classes]] — Formal languages and machine models build on sets and logic.

[Back to contents](../README.md)
