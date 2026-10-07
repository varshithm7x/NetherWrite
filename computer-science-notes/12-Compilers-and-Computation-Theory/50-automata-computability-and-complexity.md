# Automata, Computability, and Complexity Classes

## Core idea
Theory of computation studies what abstract machines can recognize or compute, and what resources solutions require. It separates language structure, computability, and computational complexity.

## Essential machine models
A deterministic finite automaton (DFA) has finitely many states and one defined next state for each relevant state-symbol pair. Nondeterministic finite automata recognize the same regular-language class, though equivalent DFAs can be larger.

Pushdown automata add a stack and recognize context-free languages in the nondeterministic model. A Turing machine provides a general abstract model of computation with an unbounded tape. These models differ in expressive power, not just implementation speed.

## Worked example: even numbers of ones
A DFA for binary strings with an even number of `1` symbols needs two states:

```text
E: even count, initial and accepting
O: odd count
on 0: stay in current state
on 1: switch E <-> O
```
The empty string is accepted because zero is even. Finite state is sufficient because only parity must be remembered, not the entire count.

## Computability
A decision problem asks for a yes/no answer. A decidable problem has an algorithm that halts with the correct answer on every input. The general halting problem is undecidable: no program can correctly decide termination for every program-input pair.

## Complexity classes
P contains decision problems solvable in polynomial time by deterministic computation. NP contains problems whose yes-certificates can be verified in polynomial time. NP-hard problems are at least as hard as all NP problems under the stated reduction. NP-complete problems are both in NP and NP-hard. NP does not mean “non-polynomial.”

## Common mistakes
Undecidable and computationally expensive are different. Hardness claims require a reduction and a model. Finite experiments do not establish an asymptotic lower bound. General practical regex engines can support features beyond formal regular languages.

## Revision check
**Question:** What distinguishes NP-hard from NP-complete?
**Answer:** NP-complete additionally requires membership in NP.

## Connected concepts

- [[02-Algorithms/07-algorithm-complexity|Algorithm Complexity and Asymptotic Analysis]] — Complexity classes distinguish resource bounds from mere computability.
- [[12-Compilers-and-Computation-Theory/49-compilers-and-language-processing|Compilers and Language Processing]] — Finite automata and language grammars have practical compiler applications.

[Back to contents](../README.md)
