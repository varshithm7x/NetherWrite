# Cryptography Fundamentals

## Core idea
Cryptography uses mathematical constructions to protect information and verify claims under defined assumptions. Use established libraries and protocols; constructing an apparently clever cipher is not evidence of security.

## Essential primitives
- **Symmetric encryption:** one shared secret controls encryption and decryption.
- **Asymmetric cryptography:** uses related public and private keys for supported operations.
- **Cryptographic hash:** produces a fixed-size digest designed to resist specified attacks such as collisions and preimages.
- **Message authentication code (MAC):** authenticates data using a shared secret.
- **Digital signature:** allows verification with a public key of a signature produced with the corresponding private key.
- **Key derivation:** turns key material or passwords into keys using a purpose-appropriate construction.

## Worked example: authenticated encryption
An authenticated-encryption API conceptually accepts:

```text
encrypt(key, nonce, plaintext, associated_data)
    -> ciphertext and authentication tag
```
Associated data is authenticated but not encrypted. Decryption must verify authenticity before exposing usable plaintext. Nonce requirements depend on the construction; many widely used schemes require never repeating a nonce with the same key.

## Password storage
Store passwords using a salted, purpose-designed password hashing function with an appropriate work factor. A salt is normally public and unique per stored password. It prevents identical passwords from automatically producing identical stored values and frustrates reuse of precomputed tables. Fast general-purpose hashes alone are unsuitable.

## Trust and key management
Security depends on generating unpredictable secrets, protecting keys, distributing authentic public keys, rotating or revoking keys when needed, and handling failures correctly. TLS uses certificates and other protocol mechanisms to authenticate peers and establish protected communication.

## Common mistakes
Encoding is not encryption. Encryption without integrity can permit undetected modification. A hash alone does not authenticate data from an attacker-controlled source. Random-looking output does not establish cryptographic strength.

## Revision check
**Question:** Why does a checksum not provide strong adversarial integrity?
**Answer:** An attacker can often modify the data and recompute it without knowing a secret.

## Connected concepts

- [[08-Security-and-Cryptography/39-computer-security-principles|Computer Security Principles]] — Cryptographic primitives support a broader threat model and access-control design.

[Back to contents](../README.md)
