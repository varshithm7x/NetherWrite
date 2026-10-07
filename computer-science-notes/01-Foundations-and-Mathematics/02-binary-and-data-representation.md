# Binary and Data Representation

## Core idea
Computers store bit patterns; interpretation determines whether a pattern represents an integer, instruction, character, or other value. With `k` bits there are `2^k` distinct patterns. A byte conventionally contains eight bits.

## Essential concepts
- **Unsigned integers:** `k` bits represent `0` through `2^k - 1`.
- **Two's complement:** signed `k`-bit integers represent `-2^(k-1)` through `2^(k-1) - 1`. Negation can be computed by inverting bits and adding one, within the fixed width.
- **Hexadecimal:** one hex digit represents four bits; `0x2A` equals decimal `42`.
- **Endianness:** determines byte order for multibyte values, not the mathematical value itself.
- **Text encoding:** Unicode defines code points; UTF-8 encodes them using one to four bytes. A visible character can contain multiple code points.
- **Floating point:** stores a sign, exponent, and significand. Many decimal fractions have no exact finite binary representation.

## Worked examples
Eight-bit `00001101` represents unsigned `13`. The pattern `11111101` represents unsigned `253` or signed two's-complement `-3`.

For the 32-bit integer `0x12345678`, big-endian byte order is `12 34 56 78`; little-endian order is `78 56 34 12`.

```python
print(0.1 + 0.2 == 0.3)  # False with ordinary Python floats
print(abs((0.1 + 0.2) - 0.3) < 1e-12)  # True
```
For numerical comparisons, choose absolute and relative tolerances appropriate to the domain. Exact monetary arithmetic often uses integer minor units or decimal arithmetic.

## Common mistakes
Overflow behavior depends on the language and integer type. A UTF-8 byte count is not a character count. Endianness only matters when interpreting an agreed multibyte representation.

## Revision check
**Question:** What is the signed eight-bit range?
**Answer:** `-128` to `127`; there are still exactly `256` bit patterns.

## Connected concepts

- [[01-Foundations-and-Mathematics/03-boolean-algebra-and-logic-gates|Boolean Algebra and Logic Gates]] — Logic gates operate directly on binary values.
- [[05-Computer-Architecture/26-computer-architecture|Computer Architecture]] — The instruction set determines how hardware interprets encoded instructions.

[Back to contents](../README.md)
