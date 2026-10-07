# Computer Security Principles

## Core idea
Security protects systems against unwanted actions under an explicit threat model. It combines design, implementation, configuration, monitoring, and recovery rather than relying on one protective feature.

## Essential concepts
The CIA triad is **confidentiality**, **integrity**, and **availability**. Authentication establishes an identity or credential claim; authorization determines allowed actions. Auditing records security-relevant events for investigation and accountability.

Least privilege gives identities only the access they require. Defense in depth uses complementary controls. Attack surface comprises exposed interfaces and capabilities that an attacker might exploit. A trust boundary separates components with different assumptions or privileges.

## Worked example: SQL injection prevention
Unsafe construction mixes input with executable query syntax:

```python
# Unsafe: user input becomes part of the SQL program.
query = "SELECT * FROM users WHERE name = '" + name + "'"
```
A [[09-Databases/42-sql-queries-and-joins|parameterized]] SQLite-style query keeps data separate:

```python
cursor.execute("SELECT * FROM users WHERE name = ?", (name,))
```
Placeholder syntax depends on the driver. Parameters protect data values; dynamic identifiers such as column names need controlled selection or appropriate identifier handling.

## Broader defenses
Validate inputs against business constraints. Encode outputs for their actual context to prevent injection into HTML, JavaScript, or other interpreters. Enforce authorization on the server for every protected operation. Use secure credential storage and avoid logging secrets. Restrict file paths to intended boundaries when accepting filenames.

## Threat modeling
Identify valuable assets, possible attackers, entry points, trust boundaries, and failure consequences. Prioritize realistic threats and verify controls through targeted tests. Security assumptions should be stated and reviewed when the system changes.

## Common mistakes
Encryption does not replace access control. Client-side checks can be bypassed. Hiding an endpoint is not authorization. Passing a scanner does not prove that business logic is secure.

## Revision check
**Question:** Can a logged-in user still be unauthorized?
**Answer:** Yes. Authentication does not grant access to every object or action.

## Connected concepts

- [[08-Security-and-Cryptography/40-cryptography-fundamentals|Cryptography Fundamentals]] — Encryption, authentication codes, and signatures supply specific security primitives.
- [[09-Databases/42-sql-queries-and-joins|SQL Queries and Joins]] — Parameterized SQL separates data from executable query syntax.

[Back to contents](../README.md)
