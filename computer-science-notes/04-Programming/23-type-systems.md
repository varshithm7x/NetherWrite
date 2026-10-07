# Type Systems

## Core idea
A type system classifies values and operations to detect invalid combinations and document program structure. Types can encode useful guarantees, but the guarantees depend on the language and the strength of its checks.

## Essential concepts
- **Static checking:** analyzes types before execution.
- **Dynamic checking:** validates relevant operations during execution.
- **Type inference:** derives types without requiring every annotation to be written.
- **Nominal typing:** compatibility depends on declared type identities or relationships.
- **Structural typing:** compatibility depends on available members or structure.
- **Generics:** express reusable code parameterized by types.
- **Union or sum types:** represent alternatives; product types represent combined fields.

“Strongly typed” is an imprecise phrase unless the intended behavior, such as implicit coercion rules, is specified.

## Worked example: explicit absence
```typescript
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function describe(result: Result<number>): string {
  if (result.ok) {
    return `Value: ${result.value}`;
  }
  return `Error: ${result.error}`;
}
```
The discriminant `ok` identifies which fields are available. This models success and failure more clearly than returning an unexplained sentinel such as `-1`.

## What types cannot automatically prove
Ordinary types often cannot guarantee that an index is in range, a database row still exists, a request is authorized, or a network service is available. Refinement types and dependent types can express richer properties, usually with additional reasoning requirements.

## Runtime boundaries
External JSON does not become valid merely because code casts it to a type. Parse and validate untrusted values before using them. Static type information may be erased from the executable, depending on the language.

## Common mistakes
Disabling checks with unchecked casts weakens guarantees. Nullability must be handled deliberately. Static typing and runtime validation solve related but different problems.

## Revision check
**Question:** Does type inference make a language dynamically typed?
**Answer:** No. Inferred types can still be checked statically.

## Connected concepts

- [[12-Compilers-and-Computation-Theory/49-compilers-and-language-processing|Compilers and Language Processing]] — Semantic analysis checks types and resolves names during compilation.

[Back to contents](../README.md)
