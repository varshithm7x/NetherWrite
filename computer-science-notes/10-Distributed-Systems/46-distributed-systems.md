# Distributed Systems

## Core idea
A distributed system coordinates independent components through communication. Partial failure is fundamental: one component or connection can fail while others continue operating, and a timeout does not prove what the remote component did.

## Essential concepts
Replication stores copies for availability or read capacity. Partitioning divides data or work among nodes. Leader-based designs direct selected operations through an authority; consensus protocols coordinate agreement despite specified failures.

Consistency models define what observations are allowed. Linearizability makes operations appear to take effect atomically between invocation and response. Eventual consistency promises convergence under the model's conditions, not an immediate bound on staleness.

## CAP reasoning
When a network partition prevents communication, a system cannot guarantee both linearizable consistency and the CAP definition of availability for all affected requests. This is a conditional tradeoff during partitions, not a rule to permanently choose any two of three marketing labels.

## Worked example: retry ambiguity
A client sends “create order,” the server commits it, and the reply is lost. Retrying can create a second order.

```text
request includes idempotency key K
server transaction:
    check whether K already has a recorded result
    if yes, return that result
    otherwise create order and record result under unique K
```
Concurrent duplicates must be coordinated atomically. The key's scope, retention, and request-payload validation matter.

## Reliability patterns
Bound timeouts, retry with backoff and jitter, cap retries, and use circuit breakers where appropriate. Backpressure prevents overload propagation. Quorums require careful read/write semantics; majority counts alone do not automatically establish every desired guarantee.

## Common mistakes
Exactly-once business effects need end-to-end coordination; a delivery label is insufficient. Wall clocks can disagree. Retries can amplify an outage. Consensus does not remove the need for sound application state-machine design.

## Revision check
**Question:** What does a timeout tell a client?
**Answer:** That a response was not received in time, not whether the operation executed.

## Connected concepts

- [[07-Networking/36-tcp-and-udp|TCP and UDP]] — Transport success does not prove a business operation committed.
- [[09-Databases/44-transactions-and-isolation|Transactions and Isolation]] — Atomic deduplication and outbox records rely on transaction guarantees.
- [[04-Programming/25-concurrency-and-synchronization|Concurrency and Synchronization]] — Message passing coordinates independent concurrent components.

[Back to contents](../README.md)
