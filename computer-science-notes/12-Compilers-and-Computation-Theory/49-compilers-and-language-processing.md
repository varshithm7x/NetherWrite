# Compilers and Language Processing

## Core idea
A compiler transforms a program into another representation while preserving the required behavior. The target may be machine code, bytecode, another language, or an intermediate representation.

## Typical stages
1. **Lexing:** groups source characters into tokens such as identifiers and operators.
2. **Parsing:** recognizes grammatical structure and builds a syntax tree.
3. **Semantic analysis:** checks names, scopes, [[04-Programming/23-type-systems|types]], and other language rules.
4. **Intermediate representation:** expresses operations in a form suited for analysis.
5. **Optimization:** transforms code under valid semantic assumptions.
6. **Code generation:** selects and arranges target instructions.

Linking resolves references among compiled units and libraries. Loading prepares executable code and data for execution.

## Worked example: an expression
```text
Source: x = 2 + 3 * 4
Tokens: identifier, '=', integer, '+', integer, '*', integer
Tree: assignment(x, add(2, multiply(3, 4)))
```
Operator precedence makes multiplication a subtree of addition. Constant folding may replace the arithmetic with `14`, if that transformation preserves the language's numeric and evaluation semantics.

## Scope and symbol tables
A symbol table tracks declarations and their meanings. Lexical scope resolves names according to source nesting. Shadowing introduces a new declaration with the same spelling in an inner scope; it is different from changing the outer variable's value.

## Execution strategies
An interpreter executes a representation directly. A just-in-time compiler generates executable code during program execution. Systems can combine interpretation, profiling, and compilation. These terms describe implementation approaches rather than rigid categories of languages.

## Common mistakes
Syntactic validity does not imply semantic validity. Optimization must preserve permitted observable behavior, including relevant exceptions or effects. Floating-point reassociation can change results. A regular-expression tokenizer does not by itself parse arbitrary nested grammatical structure.

## Revision check
**Question:** Why separate parsing from semantic analysis?
**Answer:** A program can have valid grammatical structure while referencing undeclared names or using incompatible types.

## Connected concepts

- [[04-Programming/23-type-systems|Type Systems]] — Type checking is part of semantic analysis.
- [[12-Compilers-and-Computation-Theory/50-automata-computability-and-complexity|Automata, Computability, and Complexity Classes]] — Automata and grammars underpin lexing and parsing.

[Back to contents](../README.md)
