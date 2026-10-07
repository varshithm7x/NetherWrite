# Transactions and Isolation

## Core idea
A transaction groups database operations into a logical unit. It protects invariants when work fails or multiple users act concurrently.

## ACID properties
- **Atomicity:** committed work is applied as a unit; failed work is rolled back under the database's transaction model.
- **Consistency:** valid transactions preserve declared and application-level invariants.
- **Isolation:** concurrent execution obeys the chosen isolation contract.
- **Durability:** committed changes survive failures covered by the configured durability guarantee.

Consistency here is different from distributed replica consistency.

## Worked example: account transfer
```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```
A correct implementation must additionally verify account existence, sufficient funds, affected row counts, and concurrency behavior. One strategy locks relevant rows in a stable order, checks balances, then applies updates. A constraint can prohibit negative balances when that matches the business rule.

## Isolation phenomena
Dirty reads expose uncommitted work. Nonrepeatable reads change previously read row values. Phantom reads change a query's matching set. Write skew occurs when transactions update different rows after reading a shared condition and jointly violate an invariant.

Read committed, repeatable read, snapshot isolation, and serializable have different guarantees; exact named-level behavior varies by system. Serializable means the committed outcome is equivalent to some serial execution, and transactions may need retrying after detected conflicts.

## Implementation approaches
Locking controls conflicting access. Multiversion concurrency control (MVCC) lets readers use appropriate row versions. Neither removes every need to coordinate writes or handle aborts.

## Common mistakes
A transaction around code does not guarantee the needed isolation level. External email or HTTP side effects are not automatically rolled back with SQL. Retry whole transactions carefully and make external effects idempotent or coordinate them through an [[10-Distributed-Systems/46-distributed-systems|outbox]].

## Revision check
**Question:** Why can two valid-looking concurrent updates violate a rule?
**Answer:** Each may act on a snapshot that omits the other's changes.

## Connected concepts

- [[04-Programming/25-concurrency-and-synchronization|Concurrency and Synchronization]] — Isolation coordinates concurrent operations and protects shared invariants.
- [[10-Distributed-Systems/46-distributed-systems|Distributed Systems]] — External side effects and retries require coordination beyond one database.

[Back to contents](../README.md)
