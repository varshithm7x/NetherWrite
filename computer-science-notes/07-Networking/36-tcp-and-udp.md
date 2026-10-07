# TCP and UDP

## Core idea
TCP and UDP are transport protocols with different service models. TCP provides a reliable ordered byte stream while a connection remains viable. UDP sends independent datagrams without built-in reliable delivery or ordering.

## TCP essentials
Sequence numbers identify positions in the byte stream. Acknowledgments and retransmission recover from missing data. Flow control prevents overwhelming the receiver; congestion control responds to conditions along the network path. These solve different problems.

A typical TCP connection begins with a SYN, SYN-ACK, ACK handshake. Connection teardown and error behavior are more complex than simply reversing this exchange.

## UDP essentials
UDP preserves datagram boundaries. Applications decide whether to add acknowledgments, sequencing, retries, or loss tolerance. The lack of TCP-like connection state does not mean zero overhead or guaranteed low latency. QUIC is an example of a sophisticated transport built over UDP.

## Worked example: message framing
If an application sends `HELLO` and then `WORLD` over TCP, the receiver might read `HELLOWORLD` once, or smaller chunks. Application-level boundaries must be encoded explicitly:

```text
[length field][message bytes][length field][message bytes]...
```
The receiver first accumulates a complete length field, validates the size, then accumulates that many payload bytes. Impose a maximum message size to control resource use.

## Failure semantics
TCP acknowledgments show transport-level receipt, not that an application committed a business operation. If a client loses the connection after sending a payment request, the payment may have completed. Safe retry needs an application protocol, often using an [[10-Distributed-Systems/46-distributed-systems|idempotency key]].

## Common mistakes
One send is not one receive. Retransmission can increase delay. UDP packets can be dropped, reordered, or duplicated. Neither protocol encrypts application data by itself.

## Revision check
**Question:** What distinguishes flow control from congestion control?
**Answer:** Flow control protects the receiver; congestion control manages traffic pressure on the network.

## Connected concepts

- [[07-Networking/35-networking-fundamentals|Computer Networking Fundamentals]] — TCP and UDP operate above the IP routing layer.
- [[10-Distributed-Systems/46-distributed-systems|Distributed Systems]] — Lost replies make retries ambiguous even with reliable transport.

[Back to contents](../README.md)
