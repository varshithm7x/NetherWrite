# Computer Networking Fundamentals

## Core idea
Networks move information between hosts using layered protocols. Layers separate concerns such as physical transmission, local-link delivery, routing, [[07-Networking/36-tcp-and-udp|transport]] behavior, and application meaning.

## Essential concepts
The TCP/IP model commonly distinguishes link, internet, transport, and application layers. The seven-layer OSI model is a reference framework; real protocol implementations do not always match it exactly.

An IP address identifies an interface or endpoint within an addressing context. Routers forward packets between networks. A link-layer address supports local-link delivery. A transport port helps identify an application endpoint on a host.

Encapsulation adds headers as data travels down the stack; receivers interpret and remove them in reverse. Routers generally process network-layer routing information rather than application semantics.

## Worked example: subnet reasoning
For IPv4 network `192.168.10.0/24`, the first `24` bits are the network prefix. The block contains `256` addresses. Under conventional subnet rules, `.0` is the network address and `.255` the broadcast address, leaving `254` ordinary host addresses. Special subnet sizes have different conventions.

## Performance concepts
**Bandwidth** is transfer capacity; **latency** is delay. **Throughput** is achieved transfer rate. **Jitter** is delay variation. Packet loss can cause retransmission or degraded real-time media.

```text
serialization delay = packet size in bits / link rate in bits per second
```
A `12,000`-bit packet takes `1.2 ms` to serialize on a `10 Mb/s` link, excluding propagation, processing, and queueing delays.

## Common mistakes
High bandwidth does not imply low latency. Private addresses still need routing and policy; they are not a security boundary by themselves. NAT changes addressing and connection handling but does not replace authorization or encryption.

## Revision check
**Question:** What does a router primarily use to forward an IP packet?
**Answer:** Its destination IP address and the applicable routing table entry.

## Connected concepts

- [[07-Networking/36-tcp-and-udp|TCP and UDP]] — Transport protocols add endpoint communication semantics to IP delivery.
- [[07-Networking/38-dns-and-name-resolution|DNS and Name Resolution]] — Name resolution discovers addresses before communication begins.

[Back to contents](../README.md)
