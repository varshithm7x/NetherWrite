# Object-Oriented Programming

## Core idea
Object-oriented programming organizes behavior around objects that combine state and operations. Its main value is managing responsibilities and invariants through well-defined [[04-Programming/23-type-systems|interface]]s.

## Essential concepts
- **Encapsulation:** control access to state so operations can preserve valid conditions.
- **Abstraction:** expose useful behavior while hiding implementation details.
- **Inheritance:** define a type using another type's structure or behavior.
- **Polymorphism:** let different implementations satisfy the same interface.
- **Composition:** build an object using collaborating objects; often more flexible than a deep inheritance hierarchy.

A class defines a kind of object in class-based languages. An instance is a particular object. Interface compatibility may be explicitly declared or determined structurally, depending on the language.

## Worked example: preserving an invariant
```python
class BankAccount:
    def __init__(self):
        self._balance = 0

    def deposit(self, cents):
        if cents <= 0:
            raise ValueError("amount must be positive")
        self._balance += cents

    def withdraw(self, cents):
        if cents <= 0 or cents > self._balance:
            raise ValueError("invalid withdrawal")
        self._balance -= cents

    @property
    def balance(self):
        return self._balance
```
The methods preserve a nonnegative balance when callers respect the interface. Python's underscore is a convention rather than strict access control. Real accounts also need transaction integrity, authorization, and durable records.

## Substitutability
A subtype should preserve the behavioral promises of its interface. A subclass that rejects ordinary operations promised by its parent can break callers even if method names match. This is the motivation behind the Liskov substitution principle.

## Common mistakes
Using inheritance solely to reuse a few lines creates brittle coupling. Exposing every field through unrestricted setters can undermine invariants. Objects do not automatically make code modular; responsibilities still require careful design.

## Revision check
**Question:** Why prefer composition for interchangeable storage backends?
**Answer:** A service can depend on a storage interface and receive different implementations without inheriting backend details.

## Connected concepts

- [[11-Software-Engineering/48-software-design-and-maintainability|Software Design and Maintainability]] — Encapsulation and composition help assign maintainable responsibilities.
- [[04-Programming/23-type-systems|Type Systems]] — Interfaces and subtyping define how objects can be substituted.

[Back to contents](../README.md)
