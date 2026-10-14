# Hexadecimal

Binary is how the computer stores everything, but long rows of 0s and 1s are hard for people to read. **Hexadecimal** (or just **hex**) is a short way to write the same bits.

## What is hexadecimal?

Hexadecimal is **base 16**. It works just like decimal and binary, but it has **16 digits**, and each place in a number is worth **16 times** the place to its right: 1, 16, 256, 4096 …

We only have ten number symbols (0 to 9), so hex borrows the letters **A to F** for the values 10 to 15:

![The 16 hex digits are 0 to 9 and A to F, where A is 10 and F is 15. 0x2F is 2 sixteens and 15 ones, which is 47](assets/binary/hex-place-values.svg)

| Hex digit | `0`–`9` | `A` | `B` | `C` | `D` | `E` | `F` |
|-----------|---------|-----|-----|-----|-----|-----|-----|
| Value | 0–9 | 10 | 11 | 12 | 13 | 14 | 15 |

Upper or lower case letters mean the same thing: `0xFF` and `0xff` are equal.

## The 0x notation

The number `10` could be ten (decimal), two (binary) or sixteen (hex). To avoid mixing them up, hex numbers are written with the prefix **`0x`** in front:

| Written as | Base | Value in decimal |
|------------|------|------------------|
| `10` | decimal | 10 |
| `0b10` | binary | 2 |
| `0x10` | hexadecimal | 16 |

The `0x` is only a label that says "this is hex". It is **not** part of the value. You will see it in C code, in datasheets, in the Serial Monitor and in error messages.

## Why do we use hex?

The real reason is that **one hex digit is exactly 4 bits**. 4 bits have 2<sup>4</sup> = 16 combinations, and hex has 16 digits, so every group of 4 bits matches one hex digit. That gives hex some big advantages:

- **It is short.** One byte (8 bits) is always exactly **2 hex digits**: `11111111` is `0xFF`. A 32-bit number is 8 hex digits instead of 32 bits.
- **The bits are still easy to see.** You can turn hex into binary in your head, which is not true for decimal. Looking at `214` you cannot tell which bits are on, but in `0xD6` you can.
- **Everyone else uses it.** Memory addresses, colours on a web page (`#FF8800`), MAC addresses, register values in a datasheet and raw data from sensors are almost always shown in hex.

A group of 4 bits (half a byte) is called a **nibble**. So one hex digit is one nibble, and two hex digits are one byte.

## How to read a hex number

Reading hex is the same as reading binary: multiply each digit by its place value and add them up. The only difference is that the place values are 1, 16, 256 … and the digits go up to F.

`0x2F`: the `2` is in the 16s place and the `F` (15) is in the 1s place, so 2×16 + 15×1 = **47**.

| Hex | Place values × digits | Decimal |
|-----|-----------------------|---------|
| `0x0A` | 10×1 | **10** |
| `0x10` | 1×16 + 0×1 | **16** |
| `0x1A` | 1×16 + 10×1 | **26** |
| `0x2F` | 2×16 + 15×1 | **47** |
| `0x64` | 6×16 + 4×1 | **100** |
| `0xFF` | 15×16 + 15×1 | **255** |
| `0x100` | 1×256 + 0×16 + 0×1 | **256** |

Notice that `0xFF` = 255 is the largest value one byte can hold, the same as `11111111`.

## Converting between hex and binary

Because one hex digit is always 4 bits, you never have to go through decimal. Learn this table (or work out each row from the 8, 4, 2, 1 place values) and you can convert anything:

| Hex | Binary | Decimal | | Hex | Binary | Decimal |
|-----|--------|---------|---|-----|--------|---------|
| `0` | `0000` | 0 | | `8` | `1000` | 8 |
| `1` | `0001` | 1 | | `9` | `1001` | 9 |
| `2` | `0010` | 2 | | `A` | `1010` | 10 |
| `3` | `0011` | 3 | | `B` | `1011` | 11 |
| `4` | `0100` | 4 | | `C` | `1100` | 12 |
| `5` | `0101` | 5 | | `D` | `1101` | 13 |
| `6` | `0110` | 6 | | `E` | `1110` | 14 |
| `7` | `0111` | 7 | | `F` | `1111` | 15 |

![The byte 11010110 split into 1101 and 0110. 1101 is 8+4+1 = 13 = D, 0110 is 4+2 = 6, so the byte is 0xD6](assets/binary/hex-nibbles.svg)

### Binary to hex

1. Split the bits into groups of **4, starting from the right**.
2. If the leftmost group has fewer than 4 bits, add 0s on its left.
3. Turn each group into one hex digit.

Example: `1011101`

- Groups from the right: `101` `1101`
- Pad the left group: `0101` `1101`
- Each group: `0101` = 5, `1101` = 13 = D
- Answer: **`0x5D`** (which is 93 in decimal)

### Hex to binary

Turn **each hex digit into its 4 bits** and write them side by side. Keep the leading 0s inside each group.

Example: `0x3C`

- `3` = `0011`, `C` = `1100`
- Answer: **`0011 1100`** (which is 60 in decimal)

Example: `0xA7`

- `A` = `1010`, `7` = `0111`
- Answer: **`1010 0111`**

## Hex in C

C understands hex numbers written with `0x`, just like binary numbers written with `0b`. All three lines below put the same value into the same variable:

```c
unsigned char a = 214;          // decimal
unsigned char b = 0b11010110;   // binary
unsigned char c = 0xD6;         // hexadecimal
```