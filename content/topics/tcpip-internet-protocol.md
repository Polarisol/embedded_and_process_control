# Internet Protocol

When your phone opens a website, or your ESP32 sends a temperature reading to a server, the data has to find its way across thousands of kilometres of cables, routers and Wi-Fi. The set of rules that makes this possible is called the **Internet Protocol**, or **IP** for short. It is the "I" in **TCP/IP**, and in this item we meet it on its own.

## What is IP, in plain words?

Think of the post office.

- Every house has an **address**, so a letter knows where to go. On the internet, every device has an **IP address**.
- You don't carry the letter yourself. You drop it in a mailbox, and it is passed from one post office to the next until it reaches the right street. On the internet, the "post offices" are **routers**.
- A big parcel is too heavy for one envelope, so you split it into many small envelopes. On the internet, data is cut into small pieces called **packets** (usually up to about 1,500 bytes each).

Every packet carries two addresses on it: **who sent it** and **who it is for**. That's it. That is the main job of IP: **give every device an address, and move each packet one step closer to its address.**

![A packet: an IP header with a From address and a To address, and a piece of data, travelling from a laptop through three routers to a server](assets/ip/packet.svg)

A router does not know the whole way to the destination, and it doesn't need to. It reads only the **To** address and hands the packet to the next router that is a bit closer, exactly like a post office that only knows "letters for the north go on that truck".

## IPv4: the address everyone knows

The version of IP that the internet was built on is **IPv4** (version 4). It was written down in 1981, and it still carries a big part of the internet's traffic today. When people say "an IP address", they usually mean an IPv4 address, like this one:

```
192.168.1.20
```

## The structure of an IPv4 address

An IPv4 address is just **32 bits**. Since a long row of 32 ones and zeros is hard for people to read, we cut it into **four bytes** (8 bits each, also called *octets*), write each byte as a normal decimal number, and put dots between them. This is called **dotted decimal**.

![The address 192.168.1.20 as four bytes, each with its 8 bits in binary. The first three bytes are the network part and the last byte is the host part](assets/ip/ipv4-address.svg)

Because each part is one byte, it can only be a number from **0 to 255** (that's `00000000` to `11111111`, see the Binary Representation unit). So `192.168.1.20` is a valid address, but `192.168.1.300` is not.

An address has two parts, just like a postal address has a street and a house number:

| Part | What it says | Like |
|------|--------------|------|
| **Network part** (the first bytes) | Which network the device is on. Every device on the same local network has the same network part | The street name |
| **Host part** (the last bytes) | Which device on that network | The house number |

How many bytes belong to the network is set by the **subnet mask**. In most homes the mask is `255.255.255.0`, which means "the first 3 bytes are the network". The short way to write it is `/24`, because the first 24 bits are the network part. So on a home network, `192.168.1.20` and `192.168.1.21` are neighbours on the same street, and there is room for about 254 devices (`.1` to `.254`).

A few addresses are worth knowing:

| Address | Meaning |
|---------|---------|
| `127.0.0.1` | "Myself". Every device calls itself by this address, also known as `localhost` |
| `192.168.x.x`, `10.x.x.x` | Private addresses, used inside homes, schools and offices (more about them below) |
| `x.x.x.255` (on a /24 network) | Broadcast: a packet for **every** device on the street at once |

## The problem: not enough addresses

32 bits can make **2³² = 4,294,967,296** different addresses. In 1981 that looked like more than anyone would ever need. Computers were huge and expensive, and mostly universities, armies and big companies had them.

Then came personal computers, then the web, then smartphones, and now light bulbs, cameras, cars, watches and the ESP32 on your desk all want to be online.

![Bars comparing 4.3 billion IPv4 addresses with about 7 billion smartphones, about 8.2 billion people, and tens of billions of things on the internet](assets/ip/ipv4-shortage.svg)

There are more people on Earth than IPv4 addresses, and many more devices than people. On top of that, a part of the addresses is reserved for special uses. The organizations that hand out addresses gave away their last free blocks between 2011 and 2019 (for Europe and Israel, in November 2019). Today a public IPv4 address is something companies **buy and sell**.

So how is it that your phone, your laptop and your ESP32 are all online right now? The answer is a clever trick.

## The IPv4 solution: LAN and WAN

The trick is to split the world into two kinds of networks:

- A **LAN** (Local Area Network) is the small network in one place: your home, the lab, the school. Its devices talk to each other through one router (usually over Wi-Fi).
- A **WAN** (Wide Area Network) is the big network that connects places to each other. The internet is the biggest WAN of all.

Inside a LAN we use **private addresses**. Three ranges were set aside for this, and **any LAN in the world may use them**:

| Private range | Typical place |
|---------------|---------------|
| `192.168.0.0` to `192.168.255.255` | Homes |
| `10.0.0.0` to `10.255.255.255` | Large companies, campuses |
| `172.16.0.0` to `172.31.255.255` | Companies, and less common at home |

Private addresses are **never used on the internet**. That's why your home and your neighbour's home can both use `192.168.1.20` without any clash: those addresses never leave the house.

![A home LAN with a laptop, a phone and an ESP32 using private 192.168.1.x addresses, a router with a private LAN-side address and a public WAN-side address, and the internet with a server](assets/ip/lan-wan.svg)

The **router** stands with one foot in each world:

- On the **LAN side** it has a private address (often `192.168.1.1`), and it gives every device that joins the Wi-Fi its own private address. Handing out addresses automatically is called **DHCP**.
- On the **WAN side** it has **one public address**, the only address that your internet provider gives you.

### NAT: one public address for the whole home

When the ESP32 sends a packet to a server on the internet, its **From** address is private. The server could never answer a private address, because there are millions of `192.168.1.30`s in the world. So the router does a swap, called **NAT** (Network Address Translation):

![NAT: going out, the router replaces the private From address with its public address and writes a note; coming back, it uses the note to replace its public To address with the device's private address](assets/ip/nat.svg)

1. **Going out:** the router replaces the private **From** address with its own public address, and writes a note: "the ESP32 is talking to this server".
2. **Coming back:** the answer arrives at the router's public address. The router looks at its notes and replaces the **To** address with the ESP32's private address.

Thanks to NAT, a whole home, or a whole school with hundreds of devices, can share **one** public address. This is how IPv4 survived long after it ran out.

NAT has a side effect you will meet in projects: **devices inside a LAN can reach out, but the outside world can't reach in**. A server can't start a conversation with your ESP32 at home, because a packet that nobody inside asked for has no note, and the router doesn't know where to send it. (That is also a nice bit of protection.)

### Find your own addresses

| Where | How |
|-------|-----|
| Windows | Open a terminal and type `ipconfig` |
| Mac or Linux | Open a terminal and type `ip addr` (or `ifconfig`) |
| Nano ESP32 | Print `WiFi.localIP()` after it connects to Wi-Fi |
| Your public (WAN) address | Search the web for "what is my IP" |

You will see that the address your computer shows and the "what is my IP" address are **different**: the first is the private LAN address, the second is the router's public WAN address.

## IPv6: the real fix

NAT is a clever patch, but it is a patch. The real fix is simply **more addresses**. That is **IPv6**, the next version of IP (there was never a v5 in use). It was designed in the 1990s, and today about half of the people who reach Google already do it over IPv6, mostly on phones without even knowing it.

An IPv6 address is **128 bits** long instead of 32. That is too long for dotted decimal, so it is written in **hexadecimal** (see the Hexadecimal item): **8 groups of 4 hex digits**, separated by colons.

![An IPv6 address: 8 groups of 4 hex digits, then shortened by dropping leading zeros, then shortened again by replacing a run of zero groups with a double colon. 2 to the power of 128 is about 3.4 times 10 to the 38](assets/ip/ipv6-address.svg)

Because the full form is long, there are two rules for writing it shorter:

1. In each group, you may **drop the zeros at the start**: `0db8` becomes `db8`, and `0000` becomes `0`.
2. **One** run of groups that are all zeros may be replaced by `::`. Only once per address, otherwise you couldn't tell how many zeros each `::` hides.

These two are the very same address, short and full:

```
2001:db8::ff00:42:8329
2001:0db8:0000:0000:0000:ff00:0042:8329
```

And "myself", which was `127.0.0.1` in IPv4, is just `::1` in IPv6.

How many addresses is 128 bits? **2¹²⁸ ≈ 3.4 × 10³⁸**. That's enough to give every grain of sand on every beach on Earth billions of addresses of its own. With IPv6 there is no need for NAT: every device, even every sensor, can have its own public address.

Today IPv4 and IPv6 live **side by side**. Most devices have both kinds of address, and use IPv6 when the other side supports it and IPv4 when it doesn't.

## What IP does not do

Now for the honest part. IP gets each packet to the right address **as best it can**, and that's all it promises. Engineers call this **best effort**. It's like dropping postcards in a mailbox: usually they arrive, but nobody guarantees it, and nobody tells you if they don't.

![What IP does not promise: packets can be lost, arrive out of order, arrive twice, or arrive damaged](assets/ip/ip-problems.svg)

Here is what can happen to your packets on the way, and IP does nothing about it:

- **Lost:** a router that is too busy simply throws packets away. The sender is not told.
- **Out of order:** each packet finds its own way, so packet 3 can arrive before packet 2.
- **Duplicated:** sometimes the same packet arrives twice.
- **Damaged:** a bit can flip on the way, turning an `A` into an `E`. IP doesn't check your data for mistakes.

And there are bigger questions that IP doesn't even ask:

- **Which program is it for?** The packet reached the right computer, but your computer is running a browser, Spotify and WhatsApp at the same time. The IP address points to the device, not to the program.
- **Is it all here?** A 3 MB photo travels as more than two thousand packets. IP carries each one on its own and has no idea that they belong together, which one is missing, or how to put them back in the right order.
- **Did it arrive?** The sender never hears back from IP. It can't know whether the other side got anything at all, or whether the other side is even listening.
- **Too fast?** Nothing stops a fast server from pouring packets at a small ESP32 faster than it can read them, or at a crowded network that is already dropping packets.

Imagine sending a long program over a link where any line could go missing, come twice, swap places with another line or get a typo, and you'd never know. That is the internet with IP alone.

These are exactly the problems that **TCP**, the other half of TCP/IP, was built to solve. How it does it is the next part of this unit. Before you read it, try the last challenge below: **how would you solve them?**

## Summary

- **IP** gives every device an **address** and moves data across networks in small **packets**. Each packet carries a **From** and a **To** address, and **routers** pass it along step by step.
- An **IPv4** address is **32 bits**, written as **4 bytes** in dotted decimal (`192.168.1.20`). Each byte is 0 to 255.
- An address has a **network part** (the street) and a **host part** (the house). The **subnet mask** (`255.255.255.0`, or `/24`) says where one ends and the other begins.
- 32 bits give only about **4.3 billion** addresses, fewer than the people on Earth, and far fewer than the devices.
- IPv4 survives with **LANs** that use **private addresses** (`192.168.x.x`, `10.x.x.x`, `172.16–31.x.x`) and a router that does **NAT** to share **one public WAN address**. The cost: outsiders can't easily reach into a LAN.
- **IPv6** uses **128 bits**, written as 8 groups of 4 hex digits (`2001:db8::ff00:42:8329`). There are enough addresses for every device, forever.
- IP is **best effort**: packets can be lost, reordered, duplicated or damaged, and nobody is told. Fixing this is TCP's job.

## Challenges

1. **Your addresses:** find your computer's IP address, your router's address (in Windows it is the "Default Gateway") and your public address. Which of them are private? Then print your Nano ESP32's address with `WiFi.localIP()`. Is it on the same network as your computer?
2. **To binary and back:** write `10.0.0.138` and `172.16.254.1` in binary, 8 bits per byte. Then turn `11000000.10101000.00000000.11111111` into dotted decimal.
3. **Valid or not?** Which of these are valid IPv4 addresses, and which are private? `192.168.0.1`, `8.8.8.8`, `10.20.300.4`, `172.20.1.1`, `172.40.1.1`, `1.2.3`
4. **Shorten it:** write `fe80:0000:0000:0000:0204:61ff:fe9d:f156` in the shortest form. Then write `2001:db8:a::1` in full form, all 8 groups with 4 digits each.
5. **Count:** a school gets the network `10.5.7.0/24`. How many devices can it connect? What if it gets `10.5.0.0/16`?
6. **Think like an engineer:** you want to send a 10-line message to a friend, and the only way is by postcards that may get lost, arrive twice, arrive in the wrong order or get a smudged letter. You and your friend may agree on any rules you like before you start. Write down your rules so that your friend ends up with the exact message, in the right order, and you **know** that they got it. Keep your answer for the TCP lesson.
