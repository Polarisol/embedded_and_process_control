# Non-textual messages

So far our client and server sent **text**: `"speed=1500\n"`. Text is easy to read and debug, but the computer has to turn the number into characters, send them, and turn them back into a number on the other side. Instead, we can send the number's **bytes** as they are.

![The number 1500 sent as text is 5 bytes, 31 35 30 30 0A, which the receiver has to parse. Sent as binary it is 2 bytes, 05 DC, which the receiver uses at once](assets/tcp/bin-text-vs-binary.svg)

## Why bother?

- **Shorter:** 1500 is 2 bytes instead of 5. With thousands of readings a second, that adds up.
- **No parsing:** no `split()`, no `int()`, no "what if the text is `15OO`?". Every value sits at a known place in the message.
- **Fixed size:** if every message is 4 bytes, the receiver just waits for 4 bytes. No searching for `\n`.

And sometimes you have no choice. Many industrial products speak **only** binary. A PLC, a motor drive or an energy meter that speaks **Modbus TCP** (port 502) understands messages like `00 01 00 00 00 06 01 03 00 00 00 02`, and doesn't understand a single word of text. The same goes for Siemens PLCs, many IP cameras, and most online games.

## Bytes in Python

A `bytes` object is a sequence of numbers from 0 to 255:

```python
msg = bytes([1, 3, 5, 220])
print(msg.hex(" "))   # 01 03 05 dc
print(msg[2])         # 5, a single byte is just an int
```

A number bigger than 255 needs more than one byte. `to_bytes` splits it and `from_bytes` puts it back together:

```python
(1500).to_bytes(2, "big")             # b'\x05\xdc', high byte first
int.from_bytes(b"\x05\xdc", "big")    # 1500
```

`"big"` means the high byte goes first. That's the usual order on networks (and in Modbus). Both sides just have to agree.

## Our message: 4 bytes

We'll send a command to set a motor's speed. Every message is exactly 4 bytes:

![A 4-byte message 01 03 05 DC: byte 0 is the command (1 = set speed), byte 1 is the motor number (3), and bytes 2 and 3 are the speed, 1500, high byte first](assets/tcp/bin-message.svg)

## Sending: the client

Start from the client app in **TCP/IP Client in PySide6**. Only `send()` and `receive()` change. You type three numbers, like `1 3 1500`:

```python
    def send(self):
        command, motor, speed = map(int, self.entry.text().split())
        msg = bytes([command, motor]) + speed.to_bytes(2, "big")
        self.socket.write(msg)                       # no encode(), no '\n'
        self.log.appendPlainText("▶ " + msg.hex(" "))
        self.entry.clear()

    def receive(self):
        while self.socket.bytesAvailable() >= 4:     # a whole message is here
            msg = self.socket.read(4).data()
            self.log.appendPlainText("◀ " + msg.hex(" "))
```

## Reading: the server

Start from the server app in **TCP/IP Server in PySide6** and replace `receive()`:

```python
    def receive(self):
        client = self.sender()
        while client.bytesAvailable() >= 4:          # wait for all 4 bytes
            msg = client.read(4).data()
            command = msg[0]
            motor = msg[1]
            speed = int.from_bytes(msg[2:4], "big")
            self.log.appendPlainText(f"◀ {msg.hex(' ')}  command={command} motor={motor} speed={speed}")
            client.write(msg)                         # echo it back as "got it"
```

Type `1 3 1500` in the client and the server shows `01 03 05 dc  command=1 motor=3 speed=1500`.

Two things to notice:

- **Don't use `readLine()`.** The speed 10 is the byte `0x0A`, which is also `'\n'`. In a binary message any byte can show up, so `canReadLine()` would cut messages in the wrong place. We count bytes instead.
- **Keep the rest in the buffer.** TCP is a stream, so 6 bytes may arrive: one whole message and half of the next. `bytesAvailable() >= 4` reads only whole messages, and the extra 2 bytes wait for the next `readyRead`.

## Summary

- Binary messages are **shorter**, need **no parsing**, and can have a **fixed size**.
- Many real products (Modbus TCP PLCs, drives, meters) speak **only** binary.
- Build a message with `bytes([...])` and `to_bytes(n, "big")`. Read it back with `msg[i]` and `int.from_bytes(..., "big")`.
- Send with `write(msg)`: no `encode()`, no `\n`.
- Read with `bytesAvailable()` and `read(n)`, never `readLine()`.
- Use `msg.hex(" ")` to see what you really sent.
