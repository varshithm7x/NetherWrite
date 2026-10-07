# HTTP and Web Architecture

## Core idea
HTTP defines request and response semantics for web resources. Clients send methods, targets, headers, and optional content; servers return status codes, headers, and optional content.

## Essential concepts
- `GET` retrieves a representation and is intended to be safe.
- `POST` submits data for resource-specific processing.
- `PUT` replaces the target resource representation and is idempotent by intended semantics.
- `DELETE` is also idempotent by intended semantics: repeating it should not produce additional deletion effects.
- Status families include `2xx` success, `3xx` redirection, `4xx` client-side request issues, and `5xx` server failures.

Idempotence concerns intended effects, not identical responses. HTTP statelessness means request semantics need not depend on a protocol-level conversation; applications can still maintain sessions and persistent state.

## Worked example: conditional caching
```http
GET /notes/42 HTTP/1.1
Host: example.test
If-None-Match: "revision-7"
```
If the selected representation still matches the validator, the server can respond with `304 Not Modified`, allowing the client to reuse its cached representation. Cache rules must account for authentication, variants, and freshness.

## Security and architecture
HTTPS applies HTTP over a secure transport arrangement, providing confidentiality, integrity, and authenticated endpoint identity when correctly configured. It does not decide which users may access which records; [[08-Security-and-Cryptography/39-computer-security-principles|authorization]] remains an application responsibility.

Cookies can carry session identifiers. Use appropriate attributes such as `Secure`, `HttpOnly`, and suitable `SameSite` settings for the use case. CORS controls certain browser cross-origin access; it is not a general server authorization mechanism.

## Common mistakes
GET requests should not perform destructive business actions. Blind retries of POST can duplicate operations. A successful HTTP status does not prove application correctness. JSON serialization is independent of HTTP semantics.

## Revision check
**Question:** Can repeated DELETE requests return different statuses and remain idempotent?
**Answer:** Yes. The resource can remain deleted while later responses indicate it was already absent.

## Connected concepts

- [[07-Networking/36-tcp-and-udp|TCP and UDP]] — TCP byte streams require protocol framing; HTTP supplies message rules.
- [[08-Security-and-Cryptography/40-cryptography-fundamentals|Cryptography Fundamentals]] — HTTPS relies on cryptographic protection through TLS.
- [[08-Security-and-Cryptography/39-computer-security-principles|Computer Security Principles]] — Authorization and injection defenses remain application responsibilities.

[Back to contents](../README.md)
