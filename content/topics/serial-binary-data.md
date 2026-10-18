# Sending non-string data

So far everything we sent over the serial port was **text**: `"LED ON"`, `"temp=23.5\n"`. Text is easy to read, but it is not the only option. The serial port does not know about letters at all. It moves **bytes**, and each byte is just a number from 0 to 255. You can put any value you like in those bytes.

This item covers two things, each in both directions:

1. Sending and receiving **a single byte**, or **one variable that is several bytes long** (like a `float`).
2. Sending and receiving **an array of bytes**, where every byte is a value of its own.

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
| **Readable in the Serial Monitor** | Yes | No |
| **Receiver must** | Turn the text back into a number | Know how many bytes are coming |

Bytes are smaller and there is nothing to parse. The price is that both sides must agree on **what is sent**: how many bytes, and what each one means.

## Hexadecimal: the language of bytes

When we work with raw bytes we write them in **hexadecimal** (see the Hexadecimal item in the [Binary Rep.](topic.html?id=binary-representation) unit). Every byte is exactly **two hex digits**, from `0x00` to `0xFF`:

| Decimal | Hex | Binary |
|---------|-----|--------|
| 0 | `0x00` | `0000 0000` |
| 65 | `0x41` | `0100 0001` (also the letter `'A'`) |
| 128 | `0x80` | `1000 0000` |
| 200 | `0xC8` | `1100 1000` |
| 255 | `0xFF` | `1111 1111` |

Both C and Python understand the `0x` prefix, so `Serial.write(0xC8)` and `Serial.write(200)` are the same thing.

The Serial Monitor shows everything as text. A byte like `0xFF` or `0x00` is not a printable letter, so it shows up as a strange symbol or nothing at all. To see what really arrived, print the bytes in **hex**:

![The bytes FF 80 00 shown in the Serial Monitor as strange symbols, and in a hex view as FF 80 00](assets/serial/nonstring-hex-view.svg)

- In **Python**, `data.hex(" ")` turns bytes into `"ff 80 00"`.
- On the **Arduino**, `Serial.print(b, HEX)` prints a byte in hex.

## 1. A single byte, or one variable of several bytes

### A single byte

One byte holds a value from 0 to 255: a brightness, a speed in percent, a button state, a command number.

| | Send | Receive |
|--|------|---------|
| **Arduino** | `Serial.write(200);` | `int b = Serial.read();` |
| **Python** | `self.port.write(bytes([200]))` | `b = self.port.read(1).data()[0]` |

`Serial.read()` returns the byte as a number from 0 to 255, or `-1` if nothing has arrived, so check `Serial.available()` first. In Python, `bytes([200])` builds one byte from a list with one number, and `[0]` takes the first byte out of what was read, as a number.

This sketch sets the brightness of an LED from one byte that the computer sends:

```c
void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  if (Serial.available() >= 1) {
    int brightness = Serial.read();        // 0..255
    analogWrite(LED_BUILTIN, brightness);
  }
}
```

In the **Serial in PySide** app, connect a `QSlider` with range 0 to 255 to `self.port.write(bytes([value]))`, and the LED follows the slider.

### One variable of several bytes

A `float` is 4 bytes, a `uint16_t` is 2. You don't need to take the variable apart: send **all of its bytes** exactly as they sit in memory, and the receiver puts them back into the same type.

![float temperature = 23.5 is the 4 bytes 00 00 BC 41, and uint16_t light = 1000 is the 2 bytes E8 03. The bytes are sent as they are, and the receiver turns them back into 23.5 and 1000](assets/serial/nonstring-variable.svg)

On the Arduino:

```c
float temperature = 23.5;
Serial.write((uint8_t*)&temperature, sizeof(temperature));   // send its 4 bytes
```

- `&temperature` is the **address** of the variable in memory, and `(uint8_t*)` says "look at it as bytes".
- `sizeof(temperature)` is the number of bytes: 4 for a `float`.

Receiving into a variable works the same way, once all its bytes are in the buffer:

```c
float temperature;
if (Serial.available() >= sizeof(temperature)) {
  Serial.readBytes((uint8_t*)&temperature, sizeof(temperature));
}
```

In Python, the **`struct`** module turns bytes into a number and back. The letter says which type it is:

| Letter | C type | Bytes |
|--------|--------|-------|
| `B` | `uint8_t` | 1 |
| `h` / `H` | `int16_t` / `uint16_t` | 2 |
| `i` / `I` | `int32_t` / `uint32_t` | 4 |
| `f` | `float` | 4 |

```python
import struct
(temperature,) = struct.unpack("<f", self.port.read(4).data())   # receive: 4 bytes → 23.5
self.port.write(struct.pack("<f", 23.5))                         # send: 23.5 → 4 bytes
```

The `<` at the start tells Python to use the same byte order as the ESP32 (and your PC). `unpack()` always returns a tuple, which is why we write `(temperature,) =`.

> Use types with the size in their name, like `uint16_t` or `int32_t`. A plain `int` is 4 bytes on the Nano ESP32 but 2 bytes on an Arduino Uno, and both sides must agree on the size.

A complete pair: the Arduino sends the temperature every second, and the PySide app shows it.

```c
void setup() {
  Serial.begin(9600);
}

void loop() {
  float temperature = 23.5;     // in a real project: read it from a sensor
  Serial.write((uint8_t*)&temperature, sizeof(temperature));
  delay(1000);
}
```

```python
def receive(self):
    while self.port.bytesAvailable() >= 4:       # wait until all 4 bytes are here
        (temperature,) = struct.unpack("<f", self.port.read(4).data())
        self.log.appendPlainText(f"temperature = {temperature:.1f}")
```

`readyRead` can fire when only some of the bytes have arrived, so we read only once `bytesAvailable()` says all 4 are there.

## 2. An array of bytes

Often you have several small values, each fitting in one byte: the red, green and blue of a colour, or a few sensor readings scaled to 0–255. Put them in an array of `uint8_t` and send them together. Every byte is a value of its own, so there is nothing to split or join.

![uint8_t rgb[3] = {255, 128, 0} is sent with Serial.write(rgb, 3) as the bytes FF 80 00. The receiver reads 3 bytes and gets r = 255, g = 128, b = 0](assets/serial/nonstring-array.svg)

| | Send | Receive |
|--|------|---------|
| **Arduino** | `Serial.write(rgb, 3);` | `Serial.readBytes(rgb, 3);` |
| **Python** | `self.port.write(bytes([255, 128, 0]))` | `r, g, b = self.port.read(3).data()` |

In Python, reading 3 bytes and unpacking them into 3 names gives 3 numbers from 0 to 255.

### Arduino to computer: three readings

```c
void setup() {
  Serial.begin(9600);
  pinMode(2, INPUT);
}

void loop() {
  uint8_t readings[3];
  readings[0] = map(analogRead(A0), 0, 4095, 0, 255);   // potentiometer
  readings[1] = map(analogRead(A1), 0, 4095, 0, 255);   // light sensor (LDR)
  readings[2] = digitalRead(2);                         // button: 0 or 1
  Serial.write(readings, 3);
  delay(200);
}
```

```python
def receive(self):
    while self.port.bytesAvailable() >= 3:
        pot, light, button = self.port.read(3).data()
        self.log.appendPlainText(f"pot={pot}  light={light}  button={button}")
```

### Computer to Arduino: a colour

```python
self.port.write(bytes([255, 128, 0]))   # orange: red 255, green 128, blue 0
```

```c
const int RED_PIN = 9, GREEN_PIN = 10, BLUE_PIN = 11;   // an RGB LED, each colour with its resistor

void setup() {
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() >= 3) {        // wait until all 3 bytes are here
    uint8_t rgb[3];
    Serial.readBytes(rgb, 3);
    analogWrite(RED_PIN, rgb[0]);
    analogWrite(GREEN_PIN, rgb[1]);
    analogWrite(BLUE_PIN, rgb[2]);
  }
}
```

Three `QSlider`s in the PySide app, each sending `bytes([red, green, blue])` when it moves, make a colour mixer.

> In every example one side always sends the **same number of bytes**, so the other side knows how many to wait for. If the two sides disagree, for example the sender sends 4 bytes and the receiver reads 3, every value after that is wrong.

## Summary

- The serial port moves **bytes**, values from 0 to 255. Text is only one way to use them.
- `Serial.print(200)` sends the text `"200"` (3 bytes). `Serial.write(200)` sends one byte, `0xC8`.
- Write bytes in **hex**: one byte is always 2 hex digits.
- **A single byte:** `Serial.write(b)` / `Serial.read()` on the Arduino, `bytes([b])` / `read(1).data()[0]` in Python.
- **One variable of several bytes:** send its bytes with `Serial.write((uint8_t*)&x, sizeof(x))`, read them with `Serial.readBytes((uint8_t*)&x, sizeof(x))`. In Python use `struct.pack()` / `struct.unpack()`.
- **An array of bytes:** `Serial.write(arr, n)` / `Serial.readBytes(arr, n)` on the Arduino, `bytes([...])` / `read(n).data()` in Python.
- Read only when **all** the bytes are there: `Serial.available() >= n`, `bytesAvailable() >= n`.
