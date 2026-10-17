# TCP/IP Quiz

Answer all the questions, then press **Submit answers** to see your score and the corrections.

## Which of these jobs does **IP on its own** (without TCP) do?
- [x] Gives every device an address
  > Right. Every device on the internet has an IP address, and every packet carries a From and a To address.
- [ ] Makes sure every packet arrives
  > IP is **best effort**: a busy router can simply throw a packet away, and nobody tells the sender.
- [x] Moves each packet one router closer to its To address
  > Right. Each router reads only the To address and hands the packet to the next router that is a bit closer.
- [ ] Puts the packets back in the right order
  > Each packet finds its own way, so packet 3 can arrive before packet 2. IP does nothing about it.
- [ ] Delivers the data to the right program on the computer
  > An IP address points to the **device**, not to the program. Choosing the program is the job of TCP's ports.
> IP's job is simple: give every device an address and move packets toward it. It promises nothing about loss, order, duplicates or damage. That's TCP's job.

## Which of these statements about IPv4 addresses are true?
- [ ] `192.168.1.300` is a valid IPv4 address
  > Each part is one byte, so it can only be 0 to 255. `300` doesn't fit in 8 bits.
- [x] An IPv4 address is 32 bits, written as 4 bytes in dotted decimal
  > Right. For example `192.168.1.20` is four bytes, 8 bits each, separated by dots.
- [ ] There are so many IPv4 addresses that every device on Earth can have its own
  > 32 bits give only about 4.3 billion addresses. There are more people than that, and many more devices than people.
- [x] There are fewer IPv4 addresses than people on Earth
  > Right. 2³² ≈ 4.3 billion, while there are about 8.2 billion people, and tens of billions of devices.
> In 1981, 4.3 billion addresses looked like plenty. Then came PCs, smartphones and IoT devices, and the free addresses ran out between 2011 and 2019.

## A laptop at home has the address `192.168.1.30`. It sends a packet to a server on the internet. The home router's WAN address is `85.64.12.7`. Which **From** address does the server see?
- [ ] `192.168.1.30`
  > That's a **private** LAN address. Millions of homes use it, so the server could never answer it. It never leaves the house.
- [x] `85.64.12.7`
  > Right. With **NAT**, the router swaps the private From address for its own public WAN address, and writes a note so it can pass the answer back to the laptop.
- [ ] `192.168.1.1`
  > That's the router's address on the **LAN side**. The internet only sees the router's public WAN address.
- [ ] `127.0.0.1`
  > That address means "myself" (`localhost`). It never travels over a network.
> Inside a LAN, devices use private addresses that any home may reuse. The router uses NAT so the whole home shares **one** public address. The side effect: devices inside can reach out, but the outside world can't start a conversation with them.

## How does IPv6 fix the shortage of IPv4 addresses?
- [x] Its addresses are 128 bits long, so there are about 3.4 × 10³⁸ of them
  > Right. That's enough for every device, even every sensor, to have its own public address, with no need for NAT.
- [ ] It lets many more homes share one public address by using a smarter kind of NAT
  > NAT is IPv4's patch. IPv6 is the real fix: simply many more addresses, so NAT isn't needed.
- [ ] It writes addresses in hexadecimal, and hex digits can count higher than decimal digits
  > Hexadecimal is only a shorter way to **write** the address. The number of addresses comes from the number of bits.
- [ ] It adds a fifth byte to every IPv4 address
  > An IPv6 address is a whole new format: 8 groups of 4 hex digits, like `2001:db8::ff00:42:8329`.
> IPv6 uses 128 bits instead of 32. Today IPv4 and IPv6 live side by side, and most devices have both kinds of address.

## A TCP sender sends Seq 1 (100 bytes) and gets back ACK 101. Then it sends Seq 101 (100 bytes), but that segment is lost on the way. What happens next?
- [ ] The receiver asks IP to search for the lost packet on the routers
  > IP doesn't keep copies or look for lost packets. Only the sender has a copy of the data.
- [ ] Nothing. The program on the other side reads the data with a hole in it
  > TCP never hands the program data with a gap. It only passes bytes on when they are complete and in order.
- [ ] The receiver sends ACK 201 anyway so the connection doesn't get stuck
  > An ACK says "I have everything up to here". The receiver doesn't have bytes 101 to 200, so it can't send ACK 201.
- [x] The sender's timer runs out without ACK 201, so it sends Seq 101 again
  > Right. The sender keeps a copy of everything it sent. If the ACK doesn't come back in time, it sends the segment again.
> TCP makes IP reliable with **sequence numbers**, **ACKs**, **resending after a timeout** and a **checksum**. The program just reads a clean stream of bytes: everything, exactly once, in order.

## A laptop runs a browser, Spotify and your PySide6 server at the same time. A PySide6 client on another computer sends data to `192.168.1.20:5000`. What is the job of `5000`?
- [ ] It tells the routers along the way which direction to send the packet in
  > Routers only look at the IP address. The port matters only once the packet reaches the laptop.
- [ ] It is the size of the packet in bytes
  > Packets are usually up to about 1,500 bytes. A port is a number from 0 to 65,535 that names a program.
- [x] It tells the laptop which program should get the data
  > Right. The IP address is the building, and the port is the apartment number. Your server listens on port 5000, so it gets the data.
- [ ] It is the port the client picked for itself
  > The client's port is chosen at random by its operating system. `5000` is the **server's** port, which the client must know in advance.
> IP brings the packet to the right **device**, and the port picks the right **program**. Well-known ports include `80` (HTTP), `443` (HTTPS) and `22` (SSH). For your own server, pick a free number above 1023, like `5000`.

## Which of these statements about the TCP client and server are true?
- [x] The server must already be listening on its port when the client connects
  > Right. If nobody listens on that port, the client gets an error like "connection refused".
- [ ] The server starts the connection by sending SYN to the client
  > It's the other way around: the **client** sends SYN, the server answers SYN + ACK, and the client answers ACK.
- [ ] After the connection opens, only the client is allowed to send data
  > Once connected, both sides are equal and can send and receive. "Client" and "server" only tell who called whom.
- [x] At home, programs usually include clients and not servers
  > Right. Because of NAT, a device at home can call out, but nobody outside can call in. So programs at home usually connect to servers, and not the other way around.
- [ ] The client must choose its own port number above 1023
  > The client doesn't choose its port. The operating system gives it a random free port for this connection.
> The **server** listens on a known port and waits. The **client** knows the server's address and port and starts the connection with the three-way handshake.

## In the PySide6 client, what does this line do?
```python
self.socket.connectToHost("192.168.1.20", 5000)
```
- [ ] It waits until the server answers, and only then returns
  > That's what `waitForConnected()` would do, and it would freeze the window. `connectToHost` never waits.
- [ ] It opens port 5000 on this computer and waits for clients
  > That's what a **server** does, with `QTcpServer` and `listen()`.
- [ ] It connects to the server and right away sends it a first message, so the server knows who called
  > It doesn't send any data. You send with `write()`, after the connection is ready.
- [x] It starts the handshake and returns at once. The `connected` signal fires later
  > Right. The event loop (`app.exec()`) does the waiting, and calls your function when `connected` fires. Then you can send.
> In PySide6 you don't write loops and you never wait. Every call returns at once, and the socket reports what happened through signals: `connected`, `readyRead`, `disconnected` and `errorOccurred`. Meanwhile the window keeps working.

## The server sends `"temp=23.5\n"`, but it arrives in two pieces: first `"tem"`, then `"p=23.5\n"`. What happens when `readyRead` fires for the first piece?
```python
def receive(self):
    while self.socket.canReadLine():
        line = self.socket.readLine().data().decode(errors="replace").strip()
        self.log.appendPlainText("◀ " + line)
```
- [ ] The log shows `◀ tem`, and on the next `readyRead` a second line, `◀ p=23.5`
  > `canReadLine()` is true only when a whole line, ending with `\n`, is in the buffer. `"tem"` has no `\n` yet.
- [x] Nothing is logged. The bytes wait in the buffer until the rest of the line arrives
  > Right. On the next `readyRead`, the buffer holds `"temp=23.5\n"`, `canReadLine()` is true, and the whole line is logged.
- [ ] `readLine()` waits inside the loop until the rest of the line arrives, then logs it
  > Nothing here waits. The loop doesn't even start, because `canReadLine()` is false.
- [ ] The bytes `"tem"` are thrown away because the message is broken
  > `QTcpSocket` keeps the bytes in its buffer. Nothing is lost.
> TCP is a **stream of bytes**, not separate messages. That's why each message ends with `\n`, and the reader takes only **complete lines** with `canReadLine()` and `readLine()`.

## Three clients, A, B and C, are connected to the PySide6 server. All their `readyRead` signals are connected to this method. Client B sends `"hi\n"`. What happens?
```python
def receive(self):
    client = self.sender()
    while client.canReadLine():
        line = client.readLine().data().decode(errors="replace").strip()
        client.write(("got: " + line + "\n").encode())
```
- [ ] All three clients get `got: hi`
  > The answer is written only to `client`, a single socket. Sending to everyone would need a loop over `self.clients`, like in `send_to_all`.
- [ ] Only client A gets `got: hi`, because it connected first and so it is the first socket in `self.clients`
  > The code doesn't use the list here. It answers whoever sent the signal.
- [x] Only client B gets `got: hi`
  > Right. `self.sender()` returns the socket whose `readyRead` called the method, which is B's socket.
- [ ] Nobody gets an answer until A and C also send something
  > Each client's socket works on its own. The event loop calls `receive` as soon as B's data arrives.
> The server has one `QTcpServer` that listens, and one `QTcpSocket` for **each** client, from `nextPendingConnection()`. One event loop serves the window and all the clients, with no threads and no loops. `self.sender()` tells which client a signal came from.
