# Boolean Algebra and Logic Gates

## Core idea
Boolean algebra operates on values `0` and `1`, usually interpreted as false and true. It supports digital circuit design, conditional expressions, and formal reasoning about programs.

## Essential concepts
| Operation | Meaning | Example |
|---|---|---|
| AND | True when both operands are true | `1 AND 0 = 0` |
| OR | True when at least one operand is true | `1 OR 0 = 1` |
| NOT | Complements its operand | `NOT 1 = 0` |
| XOR | True when operands differ | `1 XOR 1 = 0` |

Useful identities include `A AND 1 = A`, `A OR 0 = A`, and `A OR A = A`. De Morgan's laws are:

```text
NOT (A AND B) = (NOT A) OR (NOT B)
NOT (A OR B)  = (NOT A) AND (NOT B)
```
NAND and NOR are individually functionally complete: either gate type can be combined to express every Boolean function.

## Worked example: a half adder
A half adder adds two input bits `A` and `B`:

```text
sum   = A XOR B
carry = A AND B
```
For inputs `1` and `1`, the sum output is `0` and carry is `1`, representing binary `10`. A full adder also accepts an incoming carry; chaining full adders produces a ripple-carry adder.

## Circuit behavior
Combinational circuits compute outputs from current inputs. Sequential circuits include stored state, typically using flip-flops. Real gates have propagation delays, so a Boolean expression alone does not describe timing or transient glitches.

## Common mistakes
Bitwise operators act separately on integer bits; logical operators evaluate truth conditions. In many languages, logical AND and OR short-circuit, which matters when operands have side effects. XOR is different from inclusive OR.

## Revision check
**Question:** Rewrite `NOT (x OR y)`.
**Answer:** `(NOT x) AND (NOT y)`.

## Connected concepts

- [[05-Computer-Architecture/26-computer-architecture|Computer Architecture]] — Boolean circuits implement arithmetic and control logic in processors.

[Back to contents](../README.md)
