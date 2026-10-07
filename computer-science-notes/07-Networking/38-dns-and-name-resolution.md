# DNS and Name Resolution

## Core idea
The Domain Name System maps hierarchical names to resource records through a distributed database. It supports address discovery, mail routing, delegation, and other naming functions.

## Essential concepts
A **recursive resolver** works on a client's behalf. **Authoritative servers** answer for zones they serve. Root and top-level-domain servers guide resolution through delegations; they do not normally store every domain's final address.

Common records include:
- `A`: IPv4 address.
- `AAAA`: IPv6 address.
- `CNAME`: alias to another name.
- `MX`: mail exchanger information.
- `NS`: authoritative nameserver information.
- `TXT`: text used for various verification and policy purposes.

TTL values control caching duration, subject to resolver behavior and policy. Negative answers can also be cached.

## Worked example: resolving a website
A browser asks the configured resolver for `www.example.test`. With no useful cache, the resolver follows delegations to the relevant authoritative server, obtains records, and returns the answer. It caches eligible results. The browser then connects to the selected address using the required transport and application protocols.

Multiple names can share one IP address. A name can also have multiple addresses for redundancy or traffic distribution. An address returned by DNS is not proof that the remote service is trustworthy.

## Security
[[08-Security-and-Cryptography/40-cryptography-fundamentals|DNSSEC]] authenticates signed DNS data and helps detect tampering; it does not encrypt queries. DNS over TLS and DNS over HTTPS encrypt the connection to a resolver, but that resolver can still see the query. These mechanisms address different threats.

## Common mistakes
A DNS change may remain unseen while cached records are valid. DNS does not itself redirect an HTTP path. CNAME aliases have record-coexistence restrictions at the same owner name. Name lookup failures and connection failures require different diagnosis.

## Revision check
**Question:** Why can two users see different addresses after a DNS update?
**Answer:** Their resolvers may have different cached data and remaining TTLs.

## Connected concepts

- [[07-Networking/35-networking-fundamentals|Computer Networking Fundamentals]] — Address records connect names to network endpoints.
- [[08-Security-and-Cryptography/40-cryptography-fundamentals|Cryptography Fundamentals]] — DNSSEC signatures and encrypted resolver transports protect different properties.

[Back to contents](../README.md)
