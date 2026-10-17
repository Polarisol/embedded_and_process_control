# Transmission Control Protocol

In the last item we met **IP**, which moves packets from device to device, **as best it can**. Packets can get lost, arrive out of order, arrive twice or arrive damaged, and nobody is told. IP also doesn't know which program a packet is for.

**TCP**, the **Transmission Control Protocol**, is the other half of TCP/IP, and it fixes all of that. Your browser, WhatsApp, email, and the ESP32 that sends readings to your laptop all use it. In this item we see what TCP does and, without too many details, how it does it.

## What is TCP, in plain words?

If IP is like dropping **postcards** in a mailbox, TCP is like a **phone call**:

- Before you talk, you **dial**, and the other side **picks up**. Now you both know the other one is there.
- While you talk, the other side keeps saying "uh-huh, got it". If they missed a sentence, you **say it again**.
- If you talk too fast, they say "**wait, slow down**".
- When you're done, you both say **goodbye** and hang up.

TCP does this using IP's postcards, without changing IP at all. The programs on both sides get a **reliable stream of bytes**: everything arrives, **exactly once**, **in order**, **unharmed**, or the program is told that the connection broke.

## Client and server

Every TCP connection has two sides with two different roles:

- The **server** is switched on first. It opens a **port** (more on ports in a moment) and **waits** for someone to connect. This is called **listening**. A web server, a game server, or a small Python program on your laptop can all be servers.
- The **client** knows the server's address and port, and it is the one that **starts** the connection. Your browser is a client, and so is your ESP32 when it sends readings to a server.

![Clients (a browser, a phone app and an ESP32) send a request to a server that is always on and listening, and the server sends back a response](assets/tcp/client-server.svg)

Once the connection is open, both sides are equal: each can send and receive at the same time. "Client" and "server" only tell you **who called whom**.

Remember NAT from the IP item? It is the reason a device at home usually plays the **client**: it can call out, but nobody outside can call in.

## Ports: which program is it for?

IP brings the packet to the right **device**. But that device runs a browser, Spotify and WhatsApp at the same time. Which one should get the data?

TCP answers with a **port**: a number from **0 to 65,535** (16 bits) in the TCP header. If the IP address is the address of a **building**, the port is the **apartment number**.

![A packet sent to 192.168.1.20 port 443 enters the computer and goes to the program on port 443, the HTTPS web server, and not to the programs on ports 80, 22 or 5000](assets/tcp/ports.svg)

A server listens on a port that everybody knows in advance. Some are so common that they are standard:

| Port | Who listens there |
|------|-------------------|
| `80` | Web servers (HTTP) |
| `443` | Secure web servers (HTTPS), most of the web today |
| `22` | Remote login (SSH) |
| `25` | Email between servers (SMTP) |
| `1883` | MQTT, a protocol made for IoT devices |

Ports below 1024 are reserved for well-known services. For your own server, pick any free number above that, like `5000`.

The client gets a port too, but it doesn't choose it: the operating system gives it a random free port, like `54321`, just for this conversation. That's how the answer finds its way back to the right browser tab.

An address and a port are written together with a colon: `192.168.1.20:5000`. A TCP connection is known by **four numbers**: the client's address and port, and the server's address and port. That's how one web server can talk with thousands of clients on the same port `443` without mixing them up.

(A small secret about NAT: the router's notes also hold the **port**. That's how it knows which of the devices at home should get an answer, even when two of them talk to the same server.)

## Step 1: opening a connection

Before any data is sent, the client and the server shake hands. It takes three messages, so it is called the **three-way handshake**:

![The three-way handshake: the client sends SYN, the server answers SYN plus ACK, and the client answers ACK. Only then does data flow](assets/tcp/handshake.svg)

1. **SYN** (synchronize): the client says "I want to talk, and I'll start numbering my bytes from here".
2. **SYN + ACK**: the server says "I hear you (that's the ACK), and here is where I'll start numbering mine (that's the SYN)".
3. **ACK**: the client says "got it".

SYN, ACK and FIN are **flags**: single bits in the TCP header that say what kind of segment this is.

After the handshake both sides know that the other one exists, is **listening**, and agrees where the numbering starts. That answers IP's question "**is the other side even there?**". If nobody listens on that port, the client finds out right away, and your program gets an error like "connection refused".

## Step 2: sending data reliably

This is the heart of TCP, and it uses two simple ideas.

**Idea 1: number every byte.** Each segment carries a **sequence number** (Seq): the number of its first byte. If the first segment carries bytes 1 to 100, the next one says Seq 101. (Real connections start counting from a random number that was agreed in the handshake. We start from 1 to keep it simple.)

**Idea 2: say what you got.** The receiver answers with an **ACK** (acknowledgment) that says "I have everything up to here, send me **this** byte next". ACK 101 means "bytes 1 to 100 arrived, I'm waiting for 101".

The sender keeps a copy of everything it sent and starts a **timer**. If the ACK doesn't come back in time, it assumes the segment was lost and **sends it again**:

![The sender sends Seq 1, the receiver answers ACK 101. The sender sends Seq 101, but it is lost. The timer runs out with no ACK 201, so the sender sends Seq 101 again, and the receiver answers ACK 201](assets/tcp/tcp-resend.svg)

With these two ideas, plus a **checksum**, every one of IP's problems has an answer. The receiver keeps the pieces in a waiting area, and only hands them to the program when they are complete and in order:

![The receiver gets Seq 201, Seq 1, a copy of Seq 1, a damaged Seq 101 and a resent Seq 101. It throws away the copy and the damaged one, and the program reads Seq 1, 101 and 201 in order](assets/tcp/tcp-reorder.svg)

| IP's problem | How TCP solves it |
|--------------|-------------------|
| **Lost** | No ACK came back in time, so the sender sends it again |
| **Out of order** | The sequence numbers say where each piece goes, so the receiver puts them back in order |
| **Duplicated** | The receiver already has those byte numbers, so it throws the copy away |
| **Damaged** | The **checksum**, a number computed from the data, doesn't match. The receiver throws the segment away, and it gets resent like a lost one |
| **Is it all here?** | The sequence numbers show exactly which bytes are missing |
| **Did it arrive?** | The ACKs tell the sender exactly what arrived |

Your program sees none of this. It just reads a clean stream of bytes.

## Step 3: not too fast

TCP also makes sure the sender doesn't drown the receiver, or the network.

- **Flow control:** in every ACK, the receiver also writes its **window**: how many more bytes it has room for right now. The sender never sends more than the window. If the ESP32 is busy and its buffer is full, it sends window 0, and the server waits.
- **Congestion control:** when segments start to get lost, it's usually because a router on the way is overloaded. So TCP **slows down** when it sees losses, and speeds up again slowly when things look good. If everyone on the internet does this, the network doesn't jam.

![A fast server sends data to an ESP32. The ESP32's buffer has 5 full slots and room for 3 more, so its ACK says Window 3, and the server sends no more than that](assets/tcp/tcp-window.svg)

## Step 4: closing the connection

When one side is done, it sends a segment with the **FIN** (finish) flag, and the other side ACKs it. The other side does the same when it is done too. Like on the phone: "OK, bye." "Bye!"

If something goes really wrong, for example a segment arrives for a connection that doesn't exist, TCP sends **RST** (reset), which ends the connection on the spot.

## The price, and TCP's sibling UDP

All this bookkeeping has a cost: the handshake takes time before the first byte is sent, and a lost segment holds up everything after it until it is resent.

Sometimes that's not worth it. In a video call or an online game, a lost piece of the last half second is useless anyway: better to skip it than wait for it. For that there is **UDP** (User Datagram Protocol). UDP has ports, like TCP, and a checksum, but no handshake, no ACKs, no resending and no order. It's basically IP's postcards plus a port number. Fast and simple, but every problem is yours.

| | TCP | UDP |
|---|-----|-----|
| Connection | Handshake first | None, just send |
| Lost data | Resent | Lost |
| Order | Kept | Not kept |
| Speed | Slower to start | Fast |
| Used for | Web, email, files, chat, most IoT | Video calls, games, live streaming, DNS |

## What this means for your projects

When your ESP32 connects to a server, the Wi-Fi library does all of the above for you: the handshake, the numbering, the ACKs, the resending and the window. Your sketch only says "connect to this address and port", "send this", "read that" and "close". Two things are still yours to know:

- **Who calls whom.** Something has to be the server and listen on a port, and the client has to know that address and port. Because of NAT, the ESP32 at home is usually the **client**, and the server is your laptop on the same Wi-Fi, or a server on the internet. If the client can't connect, the usual reasons are: nobody is listening on that port, the address is wrong, the two aren't on the same network, or a **firewall** blocks the port.
- **A stream, not messages.** TCP delivers a **stream of bytes**, not separate messages. If you send two lines quickly, the other side may get them together, or get one line in two pieces. So you decide where a message ends, for example with a newline at the end of each one, and the other side reads **until** the newline.

## Summary

- **TCP** turns IP's best-effort packets into a **reliable stream of bytes**: everything arrives, exactly once, in order, unharmed.
- The **server** listens on a known port and waits. The **client** knows its address and port, and starts the connection.
- A **port** (0 to 65,535) says which **program** gets the data: the IP address is the building, the port is the apartment. Web servers use 80 and 443.
- A connection opens with the **three-way handshake**: SYN, SYN + ACK, ACK.
- Every byte has a **sequence number**. The receiver sends **ACKs**, and whatever isn't ACKed in time is **sent again**. Copies and damaged segments (bad **checksum**) are thrown away, and the rest is put back in order.
- The **window** stops a fast sender from flooding a slow receiver, and TCP slows down when the network loses packets.
- A connection closes with **FIN**. **UDP** is the simple, fast sibling with ports but none of the guarantees.

## Challenges

1. **Back to the postcards:** take your rules from the last challenge of the IP item. Which of them match TCP's ideas: numbering, ACKs, resending after a timeout, a checksum, a handshake? Which problem did you solve in a different way, and which did you miss?
2. **Ports on your computer:** in a terminal run `netstat -an` (Windows, Mac or Linux) or `ss -tan` (Linux). Find a line with `LISTEN`: which port is that? Then open a website and run it again: find a line with `ESTABLISHED` and port `443`. What are the four numbers of that connection?
3. **Which port?** Which port would you connect to for: a secure web page, a remote login to a Raspberry Pi, an MQTT broker? Why can't two programs on the same computer listen on the same port?
4. **Follow the numbers:** a sender sends three segments of 200 bytes each, starting at Seq 1. What is the Seq of each segment? The second one is lost. Which ACK does the receiver send after the third one arrives? (Hint: the ACK says the next byte it is **waiting** for.)
5. **TCP or UDP?** For each one, choose and explain: downloading a firmware update to an ESP32, a live video call, sending a bank transfer, a sensor that sends the temperature 10 times a second where only the newest value matters.
6. **Design it:** an ESP32 in a greenhouse should send the temperature to a laptop in the office every minute, and the laptop should answer "open the window" or "close the window". Which one is the client and which is the server? Which port would you pick? How will each side know where one message ends? What should the ESP32 do if it can't connect?
