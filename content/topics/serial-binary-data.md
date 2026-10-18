# Sending non-string data

So far everything we sent over the serial port was **text**: `"LED ON"`, `"temp=23.5\n"`. Text is easy to read and easy to debug, but it is not the only option. The serial port does not know about letters at all. It moves **bytes**, and each byte is just a number from 0 to 255. You can put any value you like in those bytes.

## Text or a byte?

Look at these two lines of Arduino code:

```c
Serial.print(200);   // sends the text "200"
Serial.write(200);   // sends one byte with the value 200
```

`Serial.print()` turns the number into characters and sends their ASCII codes: `'2'`, `'0'`, `'0'`, which are `0x32`, `0x30`, `0x30`. That is **3 bytes**. `Serial.write()` sends the value itself, as **1 byte**: `0xC8`.

![Serial.print(200) sends three bytes, 0x32 0x30 0x30, the ASCII codes of '2', '0', '0'. Serial.write(200) sends a single byte 0xC8, which is 11001000 in binary](assets/serial/nonstring-print-vs-write.svg)

| | Text (`print`) | Bytes (`write`) |
|--|----------------|-----------------|
| **The value 200** | `0x32 0x30 0x30` (3 bytes) | `0xC8` (1 byte) |
| **The value 60000** | 5 bytes | 2 bytes |
| **Readable in the Serial Monitor** | Yes | No |
| **Separator needed** | Yes, e.g. `\n` or `,` | No, if both sides know the format |
| **Receiver must** | Parse the text back into a number | Know how many bytes each value takes |

Bytes are smaller and faster, and there is nothing to parse. The price is that both sides must agree exactly on the **format**: which byte means what.

## Hexadecimal: the language of bytes

When we work with raw bytes we write them in **hexadecimal** (see the Hexadecimal item in the [Binary Rep.](topic.html?id=binary-representation) unit). Every byte is exactly **two hex digits**, from `0x00` to `0xFF`, and each digit is 4 bits, so it is easy to see the bits inside:

| Decimal | Hex | Binary |
|---------|-----|--------|
| 0 | `0x00` | `0000 0000` |
| 10 | `0x0A` | `0000 1010` |
| 65 | `0x41` | `0100 0001` (also the letter `'A'`) |
| 170 | `0xAA` | `1010 1010` |
| 200 | `0xC8` | `1100 1000` |
| 255 | `0xFF` | `1111 1111` |

Both C and Python understand the `0x` prefix, so `Serial.write(0xC8)` and `Serial.write(200)` are the same thing.

### Seeing the bytes

The Arduino IDE's Serial Monitor shows everything as text. A byte like `0xC8` or `0x04` is not a printable letter, so it shows up as a strange symbol, a question mark or nothing at all. To check what really arrived you need a **hex view**:

![The same 7 bytes shown in the Serial Monitor as strange symbols, and in a hex view as AA 04 EB 00 58 02 B1](assets/serial/nonstring-hex-view.svg)

- In **Python**, `data.hex(" ")` turns bytes into `"aa 04 eb 00 58 02 b1"`, and `bytes.fromhex("AA 04 EB")` goes the other way.
- On the **Arduino**, `Serial.print(b, HEX)` prints a byte in hex. It does not add a leading zero, so add it yourself: `if (b < 0x10) Serial.print('0');`.
- Serial terminal programs such as **CoolTerm** have a hex view too.

## Values bigger than one byte

One byte only holds 0 to 255. A sensor reading of 1000 needs **two bytes**. We split it into a **high byte** and a **low byte**, send both, and the receiver joins them again:

![1000 is 0x03E8. Its high byte is 0x03 and its low byte is 0xE8. The sender sends 0xE8 first and then 0x03. The receiver computes (hi << 8) | lo = 0x03E8 = 1000](assets/serial/nonstring-split-int.svg)

On the Arduino:

```c
uint16_t light = 1000;           // 0x03E8
Serial.write(lowByte(light));    // 0xE8
Serial.write(highByte(light));   // 0x03
```

On the other side:

```c
uint16_t light = (hi << 8) | lo; // 0x03 << 8 = 0x0300, | 0xE8 = 0x03E8 = 1000
```

Two things to agree on:

- **The order of the bytes.** Sending the low byte first is called **little-endian**. The ESP32 and your PC both keep numbers in memory this way, so it is the natural choice. Big-endian (high byte first) also works, as long as both sides use the same order.
- **The size of each value.** On the Nano ESP32 an `int` is **4 bytes**, but on an Arduino Uno it is 2. Use types with the size in their name: `uint8_t` (1 byte), `int16_t` / `uint16_t` (2 bytes), `int32_t` / `uint32_t` (4 bytes).

A `float` is 4 bytes too. You can send its bytes as they are in memory with `Serial.write((uint8_t*)&f, 4);`, and Python reads them back with `struct.unpack("<f", data)`. Often it is simpler to send an integer instead: 23.5 °C becomes `235`, and the receiver divides by 10.

## Packets: where does a message start?

Text messages end with `\n`, so the receiver always knows where one message ends and the next begins. With raw bytes, **any** value can appear in the data, even `0x0A`, the code of `\n`. If the receiver misses a byte, or starts listening in the middle of a message, every value after that is wrong.

The answer is to wrap each message in a **packet**:

![A 7-byte packet: start byte 0xAA, length 0x04, four data bytes EB 00 58 02 holding temp = 235 (23.5 °C) and light = 600, and checksum 0xB1, the XOR of the data bytes](assets/serial/nonstring-packet.svg)

| Part | Purpose |
|------|---------|
| **Start byte** | A fixed value (here `0xAA`) that tells the receiver "a packet begins here" |
| **Length** | How many data bytes follow |
| **Data** | The values, in the agreed order and size |
| **Checksum** | Computed from the data. The receiver computes it again, and if it does not match, the packet is thrown away |

The data could contain `0xAA` too, so the receiver may sometimes start at the wrong place. The checksum catches that: a packet that starts at the wrong byte almost never has a correct checksum, so the receiver drops one byte and looks for the next `0xAA`.

> This is the same idea as the UART frame one level up. The frame wraps every **byte** with a start bit and a stop bit; the packet wraps every **message** with a start byte and a checksum.

### Arduino: sending a packet

```c
const uint8_t START = 0xAA;

void sendPacket(int16_t temp10, uint16_t light) {
  uint8_t data[4] = {
    lowByte(temp10), highByte(temp10),   // temperature × 10
    lowByte(light),  highByte(light)     // light level
  };

  uint8_t checksum = 0;
  for (int i = 0; i < 4; i++) checksum ^= data[i];   // XOR of the data bytes

  Serial.write(START);
  Serial.write(sizeof(data));     // length = 4
  Serial.write(data, sizeof(data));
  Serial.write(checksum);
}

void setup() {
  Serial.begin(9600);
}

void loop() {
  sendPacket(235, 600);           // 23.5 °C, light 600
  delay(1000);
}
```

Every second the board sends `AA 04 EB 00 58 02 B1`.

### Python: receiving the packet

This `receive()` replaces the one in the **Serial in PySide** app. Bytes may arrive a few at a time, so we collect them in a buffer and only take a packet out once all of it is there. Python's `struct` module turns the data bytes back into numbers: `"<hH"` means little-endian (`<`), a signed 16-bit value (`h`) and an unsigned 16-bit value (`H`).

```python
import struct

# in __init__:  self.buffer = bytearray()

def receive(self):
    self.buffer += self.port.readAll().data()
    while len(self.buffer) >= 2:
        if self.buffer[0] != 0xAA:              # not a start byte: drop it
            del self.buffer[0]
            continue
        size = self.buffer[1]
        if len(self.buffer) < size + 3:         # start + length + data + checksum
            break                               # wait for the rest
        data = self.buffer[2:2 + size]
        checksum = 0
        for b in data:
            checksum ^= b
        if size != 4 or checksum != self.buffer[2 + size]:
            del self.buffer[0]                  # bad packet: look for the next 0xAA
            continue
        del self.buffer[:size + 3]              # remove the packet from the buffer
        temp10, light = struct.unpack("<hH", data)
        self.log.appendPlainText(f"{data.hex(' ')}  →  temp={temp10 / 10} °C  light={light}")
```

The log shows `eb 00 58 02  →  temp=23.5 °C  light=600`.

## The other direction: PC to Arduino

Sending bytes from Python is just as easy. `bytes([...])` builds the bytes from a list of numbers, and `struct.pack()` turns numbers into bytes:

```python
self.port.write(bytes([0xAA, 200]))            # start byte + brightness 200
self.port.write(struct.pack("<H", 1000))       # b'\xe8\x03', the 2 bytes of 1000
```

On the Arduino, `Serial.read()` returns the next byte as a number from 0 to 255 (or `-1` if nothing is waiting). This sketch sets the brightness of an LED from a 2-byte command:

```c
void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  if (Serial.available() >= 2) {         // wait until the whole command is here
    if (Serial.read() == 0xAA) {         // start byte?
      int brightness = Serial.read();    // 0..255
      analogWrite(LED_BUILTIN, brightness);
    }                                    // if not, that byte is dropped and we try again
  }
}
```

Connect a `QSlider` with range 0 to 255 to `self.port.write(bytes([0xAA, value]))`, and the LED follows the slider. To read many bytes at once, `Serial.readBytes(buffer, n)` fills an array with `n` bytes.

## Summary

- The serial port moves **bytes**, values from 0 to 255. Text is only one way to use them.
- `Serial.print(200)` sends the text `"200"` (3 bytes). `Serial.write(200)` sends one byte, `0xC8`.
- Write bytes in **hex**: one byte is always 2 hex digits. Use a hex view to see what really arrived.
- Bigger values are split into bytes. Agree on the **order** (low byte first is little-endian) and use sized types like `uint16_t`.
- Wrap messages in a **packet** with a start byte, a length and a checksum, so the receiver can find each message and reject broken ones.
- In Python, `bytes([...])`, `struct.pack()` / `struct.unpack()` and `.hex(" ")` do the work.
