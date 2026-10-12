# Serial Frame

In asynchronous serial communication (UART, used by Arduino `Serial`, RS-232, RS-485, USB-to-serial adapters, GPS and Bluetooth modules) the data travels on **one wire per direction**, one bit after another. There is **no clock wire**, so both sides must agree in advance on the speed and on the shape of every character. That shape is called the **frame**.

## The structure of a frame

Every byte is sent inside its own frame:

| Part | Bits | Value | Purpose |
|------|------|-------|---------|
| **Idle** | – | `1` (high) | The line rests high while nothing is sent |
| **Start bit** | 1 | always `0` | The falling edge tells the receiver "a character begins now" and lets it synchronise |
| **Data bits** | 5–9 (usually 8) | the data | Sent **LSB first** (bit 0 first, bit 7 last) |
| **Parity bit** | 0 or 1 | `0` / `1` | Optional simple error check (see below) |
| **Stop bit(s)** | 1, 1.5 or 2 | always `1` | Returns the line to high so the next start bit's falling edge can be seen |

![One UART frame: idle, start bit, data bits LSB first, optional parity, stop bit](assets/serial/frame-structure.svg)

### How the receiver reads it

1. It waits for the line to fall from `1` to `0` – the start bit.
2. It waits **half a bit time** and checks that the line is still `0` (otherwise it was just noise).
3. It then samples the line **once every bit time**, in the middle of each bit, collecting the data bits and the parity bit.
4. It expects the stop bit to be `1`. If it reads `0` instead, it reports a **framing error** – usually a sign of a wrong baud rate.

Because the receiver re-synchronises on every start bit, the two clocks only need to stay close (within about 2–3 %) for the length of one frame.

## Frame notation: 8N1, 7E1, …

The frame format is written as **data bits – parity – stop bits**:

| Notation | Data bits | Parity | Stop bits | Bits per frame |
|----------|-----------|--------|-----------|----------------|
| **8N1** | 8 | None | 1 | 1 + 8 + 0 + 1 = **10** |
| 8E1 | 8 | Even | 1 | 1 + 8 + 1 + 1 = **11** |
| 8O1 | 8 | Odd | 1 | 11 |
| 7E1 | 7 | Even | 1 | 10 |
| 8N2 | 8 | None | 2 | 11 |

8N1 is by far the most common – it is the default of Arduino `Serial.begin(9600)`.

## Parity

The parity bit makes the number of `1`s in the data **plus** the parity bit:

- **Even parity (E):** an even number. If the data has an odd number of `1`s, the parity bit is `1`.
- **Odd parity (O):** an odd number. If the data has an even number of `1`s, the parity bit is `1`.
- **None (N):** no parity bit is sent.

Parity detects any **single** flipped bit. Two flipped bits cancel out and go unnoticed, and parity cannot say *which* bit is wrong.

## Baud rate and timing

The **baud rate** is the number of bits (symbols) per second on the line. Both sides must use the same value.

- Bit time = 1 / baud rate
- Frame time = bits per frame × bit time
- Bytes per second = baud rate / bits per frame

| Baud rate | Bit time | 8N1 frame (10 bits) | Max bytes/s (8N1) |
|-----------|----------|---------------------|-------------------|
| 9600 | 104.17 µs | 1.042 ms | 960 |
| 19200 | 52.08 µs | 0.521 ms | 1920 |
| 115200 | 8.68 µs | 86.8 µs | 11520 |

Not every bit carries data. With 8N1, 8 of the 10 bits are data, so the **efficiency** is 8 / 10 = **80 %**. With 8E2 it is 8 / 12 ≈ 67 %.

## Example 1: the letter `'A'` in 8N1

`'A'` = `0x41` = `0100 0001` in binary (bit 7 … bit 0).

Sent LSB first, the data bits are `D0…D7` = `1 0 0 0 0 0 1 0`.

![Waveform of 'A' (0x41) in 8N1](assets/serial/frame-A-8N1.svg)

10 bits on the wire for one byte. At 9600 baud this frame takes 10 × 104.17 µs ≈ 1.04 ms.

## Example 2: the letter `'C'` in 8E1 (even parity)

`'C'` = `0x43` = `0100 0011`. Data bits LSB first: `1 1 0 0 0 0 1 0`.

The data contains **three** `1`s (odd), so for even parity the parity bit is **`1`**, making the total four.

![Waveform of 'C' (0x43) in 8E1](assets/serial/frame-C-8E1.svg)

With **odd** parity the same byte would get parity bit `0`.

If noise flips `D2` from `0` to `1`, the receiver counts five `1`s (data + parity) – an odd number – and reports a **parity error**.

## Example 3: the letter `'K'` in 7O1 (7 data bits, odd parity)

`'K'` = `0x4B` = `100 1011` (7 bits). Data bits LSB first: `1 1 0 1 0 0 1`.

The data contains **four** `1`s (even), so for odd parity the parity bit is **`1`**.

![Waveform of 'K' (0x4B) in 7O1](assets/serial/frame-K-7O1.svg)

Notice that the parity bit and the stop bit are both `1`, so the line simply stays high until the next start bit.

## Example 4: decode a frame (8N1)

A logic analyser shows these bits, from the start bit to the stop bit:

![A captured 8N1 frame](assets/serial/frame-decode-8N1.svg)

As bits: `0  0 1 0 0 1 1 1 0  1`

1. First bit `0` is the start bit; last bit `1` is the stop bit – the frame is valid.
2. The data bits in the order received (D0…D7): `0 1 0 0 1 1 1 0`.
3. Reverse them to write the byte MSB first: `0111 0010`.
4. `0111 0010` = `0x72` = 114 = **`'r'`**.

## Example 5: sending the string `"Hi"` at 9600 8N1

| Char | Hex | Binary (MSB…LSB) | Frame on the wire (S, D0…D7, Sp) |
|------|-----|------------------|----------------------------------|
| `'H'` | `0x48` | `0100 1000` | `0 0001 0010 1` |
| `'i'` | `0x69` | `0110 1001` | `0 1001 0110 1` |

Two characters = 2 × 10 = 20 bits → 20 × 104.17 µs ≈ **2.08 ms**. If `Serial.println("Hi")` is used, `'\r'` and `'\n'` are sent too: 4 frames ≈ 4.17 ms.

## Setting the frame in code

Arduino:

```c
Serial.begin(9600);              // 9600 baud, 8N1 (default)
Serial.begin(9600, SERIAL_8E1);  // 8 data bits, even parity, 1 stop bit
Serial.begin(115200, SERIAL_7O1); // 7 data bits, odd parity, 1 stop bit
```

Both devices must be set the same way. A wrong baud rate or frame format shows up as garbage characters, framing errors or parity errors.

## Summary

- Line idles at `1`; every byte is wrapped in a **start bit (`0`)** and **stop bit(s) (`1`)**.
- Data bits are sent **LSB first**.
- An optional **parity bit** catches single-bit errors.
- The format is written as **data–parity–stop**, e.g. **8N1** = 10 bits per byte.
- Frame time = bits per frame ÷ baud rate.
