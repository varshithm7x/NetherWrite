# Software Design and Maintainability

## Core idea
Software design assigns responsibilities and dependencies so a system remains understandable and changeable. Good structure supports current requirements while limiting the cost of plausible future changes.

## Essential concepts
**Cohesion** measures how closely a module's responsibilities belong together. **Coupling** describes dependence between modules. Information hiding keeps change-prone details behind stable interfaces. Dependency inversion makes high-level policy depend on suitable abstractions rather than embedding low-level implementation choices.

Separation of concerns distinguishes responsibilities such as presentation, domain rules, and persistence. It does not require a separate class or service for every small function.

## Worked example: notification service
Instead of hardcoding an email provider throughout order logic, define a notification capability:

```python
class OrderService:
    def __init__(self, repository, notifier):
        self.repository = repository
        self.notifier = notifier

    def confirm(self, order):
        self.repository.save(order)
        self.notifier.send_confirmation(order)
```
This clarifies dependencies and permits focused tests. It also exposes a failure question: what if saving succeeds but notification fails? A durable outbox and background delivery may be warranted when the workflow requires reliable notification.

## Refactoring
[[11-Software-Engineering/47-software-testing|Refactoring]] changes structure while preserving intended observable behavior. Make small changes, keep useful validation, and clarify contracts first. A design pattern is a reusable response to a recurring problem, not a mandatory architectural ornament.

## Tradeoffs
Abstractions add indirection and maintenance cost. Introduce them where variation, complexity, or boundaries justify them. Duplication can signal a shared concept, but merging superficially similar code can couple unrelated behavior. A clear implementation is often preferable to speculative generality.

## Common mistakes
Large “manager” classes accumulate unrelated responsibilities. Hidden global dependencies complicate testing. Catching every error and continuing can violate invariants. Comments should explain intent and constraints rather than merely restating code.

## Revision check
**Question:** Why hide a storage format behind a repository interface?
**Answer:** Callers can use domain operations without depending on serialization and database details.

## Connected concepts

- [[04-Programming/21-object-oriented-programming|Object-Oriented Programming]] — Composition and interfaces isolate responsibilities.
- [[11-Software-Engineering/47-software-testing|Software Testing]] — Behavioral tests support refactoring without relying on internal structure.

[Back to contents](../README.md)
