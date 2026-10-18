# Sending non-string data

In the client and server items every message was a line of **text** ending in `\n`. Text is easy to read and easy to debug, but TCP does not know about letters at all. It moves **bytes**, and each byte is just a number from 0 to 255. You can put any value you like in those bytes.

## Text or a byte?

On an ESP32, a `WiFiClient` has the same `print()` and `write()` as `Serial`:

```c
client.print(200);   // sends the text "200"
client.write(200);   // sends one byte with the value 200
```

`print()` turns the number into characters and sends their ASCII codes: `'2'`, `'0'`, `'0'`, which are `0x32`, `0x30`, `0x30`. That is **3 bytes**. `write()` sends the value itself, as **1 byte**: `0xC8`.

![client.print(200) sends three bytes, 0x32 0x30 0x30, the ASCII codes of '2', '0', '0'. client.write(200) sends a single byte 0xC8, which is 11001000 in binary](assets/tcp/binary-print-vs-write.svg)

In Python it is the same difference: `"200".encode()` is 3 bytes, `bytes([200])` is 1 byte.

| | Text | Bytes |
|--|------|-------|
| **The value 200** | `0x32 0x30 0x30` (3 bytes) | `0xC8` (1 byte) |
| **The value 60000** | 5 bytes | 2 bytes |
| **Readable in `nc` or a text log** | Yes | No |
| **End of a message** | `\n` | A length sent in front of the data |
| **Receiver must** | Parse the text back into a number | Know how many bytes each value takes |

Bytes are smaller and there is nothing to parse. The price is that both sides must agree exactly on the **format**: which byte means what.

## Hexadecimal: the language of bytes

When we work with raw bytes we write them in **hexadecimal** (see the Hexadecimal item in the [Binary Rep.](topic.html?id=binary-representation) unit). Every byte is exactly **two hex digits**, from `0x00` to `0xFF`, and each digit is 4 bits, so it is easy to see the bits inside:

| Decimal | Hex | Binary |
|---------|-----|--------|
| 0 | `0x00` | `0000 0000` |
| 4 | `0x04` | `0000 0100` |
| 65 | `0x41` | `0100 0001` (also the letter `'A'`) |
| 200 | `0xC8` | `1100 1000` |
| 235 | `0xEB` | `1110 1011` |
| 255 | `0xFF` | `1111 1111` |

Both C and Python understand the `0x` prefix, so `client.write(0xC8)` and `client.write(200)` are the same thing.

### Seeing the bytes

`nc` and the text log in our PySide apps show everything as text. A byte like `0xEB` or `0x04` is not a printable letter, so it shows up as a strange symbol, a question mark or nothing at all. To check what really arrived you need a **hex view**:

![The same 6 bytes shown in a text log as strange symbols, and in a hex view as 00 04 00 EB 02 58](assets/tcp/binary-hex-view.svg)

- In **Python**, `data.hex(" ")` turns bytes into `"00 04 00 eb 02 58"`, and `bytes.fromhex("00 04 00 EB")` goes the other way.
- On the **ESP32**, `Serial.print(b, HEX)` prints a byte in hex. It does not add a leading zero, so add it yourself: `if (b < 0x10) Serial.print('0');`.
- On Linux or Mac, `nc -l 5000 | xxd` shows everything a client sends, in hex.
- **Wireshark** shows the bytes of every TCP segment in hex, too.

## Values bigger than one byte: network byte order

One byte only holds 0 to 255. A sensor reading of 1000 needs **two bytes**. We split it into a **high byte** and a **low byte**, send both, and the receiver joins them again.

Which byte goes first? The Internet protocols themselves (the addresses in an IP header, the ports in a TCP header) always send the **high byte first**. This is called **big-endian**, or **network byte order**, and it is the usual choice for your own messages over TCP too:

![1000 is 0x03E8. Its high byte is 0x03 and its low byte is 0xE8. The sender sends 0x03 first and then 0xE8. The receiver computes (hi << 8) | lo = 0x03E8 = 1000](assets/tcp/binary-network-order.svg)

On the ESP32:

```c
uint16_t light = 1000;           // 0x03E8
client.write(highByte(light));   // 0x03
client.write(lowByte(light));    // 0xE8
```

On the other side:

```c
uint16_t light = (hi << 8) | lo; // 0x03 << 8 = 0x0300, | 0xE8 = 0x03E8 = 1000
```

In Python, the **`struct`** module does the splitting and joining for you. The `!` at the start of the format means network byte order:

| Format letter | Type | Bytes |
|---------------|------|-------|
| `B` | unsigned 8-bit, 0 to 255 | 1 |
| `h` / `H` | signed / unsigned 16-bit | 2 |
| `i` / `I` | signed / unsigned 32-bit | 4 |
| `f` | `float` | 4 |

```python
import struct
struct.pack("!H", 1000)             # b'\x03\xe8'
struct.unpack("!H", b"\x03\xe8")    # (1000,)
```

Both sides must also agree on the **size** of each value. On the ESP32 an `int` is **4 bytes**, but on an Arduino Uno it is 2. Use types with the size in their name: `uint8_t` (1 byte), `int16_t` / `uint16_t` (2 bytes), `int32_t` / `uint32_t` (4 bytes). A temperature is easiest to send as an integer: 23.5 °C becomes `235`, and the receiver divides by 10.

> The ESP32 and your PC keep numbers in memory **little-endian** (low byte first). That is why you should not just send the memory of an `int` or a `float` as it is: build the bytes yourself with `highByte()` / `lowByte()`, or with `struct` in Python.

## Where does a message end?

Remember from the client item that TCP is a **stream**: what you write as one message can arrive in several pieces, and two messages can arrive together. With text, the `\n` marks the end. With raw bytes **any** value can appear in the data, even `0x0A`, the code of `\n`, so we need another way.

The usual answer is a **length prefix**: before the data, send its length in 2 bytes. The receiver first reads the length, then waits until that many bytes have arrived.

![A message is 00 04 (length 4), then 00 EB (temp 235 = 23.5 °C) and 02 58 (light 600). Two such messages are written one after the other, but readyRead hands them over in three pieces of different sizes. The length tells the receiver where each message ends](assets/tcp/binary-stream.svg)

On a serial line we also needed a start byte and a checksum, because bytes can get lost or damaged on the wire. TCP already takes care of that (see the TCP item): every byte arrives, in order, and checked. All we need to add is the length.

### ESP32 client: sending a message

```c
#include <WiFi.h>

WiFiClient client;

void sendMessage(int16_t temp10, uint16_t light) {
  uint8_t msg[6] = {
    0x00, 0x04,                          // length of the data = 4 bytes
    highByte(temp10), lowByte(temp10),   // temperature × 10
    highByte(light),  lowByte(light)     // light level
  };
  client.write(msg, sizeof(msg));        // the whole message in one write
}

void setup() {
  Serial.begin(115200);
  WiFi.begin("MyWiFi", "password");
  while (WiFi.status() != WL_CONNECTED) delay(200);
}

void loop() {
  if (!client.connected()) {               // (re)connect to the PySide6 server
    client.connect("192.168.1.20", 5000);  // your computer's address
    delay(1000);
    return;
  }
  sendMessage(235, 600);                   // 23.5 °C, light 600
  delay(1000);
}
```

Every second the board sends `00 04 00 EB 02 58`.

### PySide6 server: receiving the messages

These changes go into the app from the **TCP/IP Server in PySide6** item. Each client gets its own buffer, because each client's bytes arrive separately. `receive()` adds the new bytes to that client's buffer and takes out every message that is complete:

```python
import struct

# in __init__:           self.buffers = {}            # one bytearray per client
# in on_new_connection:  self.buffers[client] = bytearray()
# in on_disconnected:    del self.buffers[client]

def receive(self):
    client = self.sender()
    buffer = self.buffers[client]
    buffer += client.readAll().data()
    while len(buffer) >= 2:
        (size,) = struct.unpack("!H", buffer[:2])   # the 2-byte length
        if len(buffer) < 2 + size:
            break                                   # wait for the rest
        data = bytes(buffer[2:2 + size])
        del buffer[:2 + size]                       # remove the message from the buffer
        temp10, light = struct.unpack("!hH", data)
        self.log.appendPlainText(f"◀ {self.name(client)}: {data.hex(' ')}  →  temp={temp10 / 10} °C  light={light}")
```

The log shows `00 eb 02 58  →  temp=23.5 °C  light=600`. `"!hH"` means network byte order (`!`), a signed 16-bit value (`h`) and an unsigned 16-bit value (`H`).

## The other direction: PC to ESP32

Sending bytes from Python is just as easy. `struct.pack()` builds the data, and we put its length in front:

```python
data = struct.pack("!B", 200)                        # brightness 200, 1 byte
self.socket.write(struct.pack("!H", len(data)) + data)   # 00 01 C8
```

On the ESP32, `client.read()` returns the next byte as a number from 0 to 255 (or `-1` if nothing is waiting), and `client.read(buffer, n)` reads `n` bytes into an array. This sketch is a small ESP32 **server** that sets the brightness of an LED from such a 3-byte command:

```c
#include <WiFi.h>

WiFiServer server(5000);
WiFiClient client;

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  WiFi.begin("MyWiFi", "password");
  while (WiFi.status() != WL_CONNECTED) delay(200);
  server.begin();
}

void loop() {
  if (!client.connected()) {
    client = server.available();         // a new client, if one is waiting
    return;
  }
  if (client.available() >= 3) {         // wait until the whole command is here
    uint8_t msg[3];
    client.read(msg, 3);
    uint16_t size = (msg[0] << 8) | msg[1];
    if (size == 1) analogWrite(LED_BUILTIN, msg[2]);
  }
}
```

Point the client app from the **TCP/IP Client in PySide6** item at the ESP32's address, connect a `QSlider` with range 0 to 255 to the two lines above, and the LED follows the slider over Wi-Fi.

## Summary

- TCP moves **bytes**, values from 0 to 255. Text is only one way to use them.
- `client.print(200)` sends the text `"200"` (3 bytes). `client.write(200)` sends one byte, `0xC8`.
- Write bytes in **hex**: one byte is always 2 hex digits. Use a hex view (`data.hex(" ")`, `xxd`, Wireshark) to see what really arrived.
- Bigger values are split into bytes. Over the network, send the **high byte first** (network byte order, `!` in `struct`) and use sized types like `uint16_t`.
- TCP is a stream, so put a **length prefix** in front of each message. TCP already makes sure every byte arrives, in order, so no start byte or checksum is needed.
- In Python, `struct.pack()` / `struct.unpack()` and `.hex(" ")` do the work.
