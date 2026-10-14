# Binary Representation

Computers only understand two things: **on** and **off**. Everything they store, from a sensor reading to a photo, is built out of those two states. This page shows how.

## How binary numbers work

We normally count in **decimal** (base 10). It has ten digits, 0 to 9, and each place in a number is worth **10 times** the place to its right: ones, tens, hundreds, and so on.

**Binary** (base 2) works the same way, but it has only two digits, **0** and **1**, and each place is worth **2 times** the place to its right: 1, 2, 4, 8, 16, 32, 64, 128 …

![Decimal 352 is 3 hundreds, 5 tens and 2 ones. Binary 1011 is one 8, no 4, one 2 and one 1, which is 11](assets/binary/place-values.svg)

To read a binary number, add up the place values that have a **1** under them:

| Binary | Place values with a 1 | Decimal |
|--------|-----------------------|---------|
| `0001` | 1 | **1** |
| `0010` | 2 | **2** |
| `0101` | 4 + 1 | **5** |
| `1010` | 8 + 2 | **10** |
| `1111` | 8 + 4 + 2 + 1 | **15** |

In C you can write a binary number directly with the `0b` prefix: `0b1011` is the same as `11`.

## Everything is bits

Inside the chip, a tiny wire is either at a high voltage (**1**) or at 0 V (**0**). One such 0-or-1 digit is called a **bit** (short for **bi**nary digi**t**).

Numbers, letters, colours, sounds and instructions are all stored as **combinations of bits**. The bits themselves have no meaning: the program decides what they stand for.

![The number 65 and the letter A are both stored as 01000001; an LED that is on is a single 1](assets/binary/everything-is-bits.svg)

For example, the bits `01000001` are the number **65** if the program treats them as a number, and the letter **'A'** if it treats them as text. This is why every variable in C has a **type**: the type tells the computer how to read its bits.

## Bytes: the smallest size a computer uses

A single bit can only hold 0 or 1, which is not much. So computers group bits together. The smallest group they work with is **8 bits**, called a **byte**. Nothing smaller is used on its own: the memory is a long row of bytes, each with its own address, so even a variable that only needs one bit (like `true`/`false`) takes a whole byte.

One byte can hold 2<sup>8</sup> = **256** different combinations, from `00000000` to `11111111`.

When a byte is not enough, the computer uses 2, 4 or 8 bytes together:

![8 bits is 1 byte (char), 16 bits is 2 bytes (short), 32 bits is 4 bytes (long, float), 64 bits is 8 bytes (long long, double)](assets/binary/sizes.svg)

| Bits | Bytes | Number of combinations |
|------|-------|------------------------|
| 8 | 1 | 2<sup>8</sup> = 256 |
| 16 | 2 | 2<sup>16</sup> = 65,536 |
| 32 | 4 | 2<sup>32</sup> ≈ 4.3 billion |
| 64 | 8 | 2<sup>64</sup> ≈ 18 billion billion |

Every extra bit **doubles** the number of combinations.

### What "8-bit", "32-bit" and "64-bit" computers mean

The processor does its maths in small built-in storage boxes called **registers**. The width of these registers is the "bit size" of the computer. It is the size of number the processor can add, compare or move **in one step**:

| Computer | Processor | Registers | Adding two 32-bit numbers |
|----------|-----------|-----------|---------------------------|
| Arduino Uno | ATmega328P | 8-bit | 4 steps, one byte at a time |
| **Arduino Nano ESP32** (our board) | ESP32-S3 | **32-bit** | 1 step |
| A modern PC or phone | x86-64 / ARM64 | 64-bit | 1 step (and 64-bit numbers too) |

So a 32-bit board can use bigger numbers than an 8-bit one, and it uses them faster. That is also why the sizes are always 8, 16, 32 and 64: they match the way processors and memory are built.

## Variable types in C

Each C type uses a fixed number of bytes, and that sets the range of values it can hold. The sizes below are for **our board, the Arduino Nano ESP32**:

| Type | Bits | Bytes | Range of values |
|------|------|-------|-----------------|
| `signed char` | 8 | 1 | −128 to 127 |
| `unsigned char` | 8 | 1 | 0 to 255 |
| `short int` | 16 | 2 | −32,768 to 32,767 |
| `unsigned short int` | 16 | 2 | 0 to 65,535 |
| `int` | 32 | 4 | −2,147,483,648 to 2,147,483,647 |
| `long int` | 32 | 4 | −2,147,483,648 to 2,147,483,647 |
| `unsigned long int` | 32 | 4 | 0 to 4,294,967,295 |
| `long long int` | 64 | 8 | −9,223,372,036,854,775,808 to 9,223,372,036,854,775,807 |
| `unsigned long long int` | 64 | 8 | 0 to 18,446,744,073,709,551,615 |
| `float` | 32 | 4 | about ±3.4 × 10<sup>38</sup>, with about 7 correct digits |
| `double` | 64 | 8 | about ±1.8 × 10<sup>308</sup>, with about 15 correct digits |

A few things to notice:

- **Unsigned** types have no minus sign, so all their combinations go to positive numbers. With *n* bits they hold 0 to 2<sup>n</sup> − 1. **Signed** types give half the combinations to negative numbers: −2<sup>n−1</sup> to 2<sup>n−1</sup> − 1.
- Plain **`char`** is meant for letters. On the Nano ESP32 it behaves like `unsigned char`, on a PC like `signed char`, so write `signed char` when you need negative numbers.
- **`float`** and **`double`** store numbers with a decimal point. They can hold huge and tiny values, but only to a limited number of digits, so `0.1 + 0.2` is not exactly `0.3`.
- **The size depends on the machine.** On a 64-bit PC (Linux or macOS), `long int` is 64 bits, not 32. If you need an exact size, use the types from `<stdint.h>`, such as `int16_t` or `uint32_t`, which are the same size everywhere.

You can check any size on your own board with `sizeof`, which gives the size in bytes:

```c
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.print("long:   ");  Serial.println(sizeof(long));    // 4 on the Nano ESP32
  Serial.print("double: ");  Serial.println(sizeof(double));  // 8
}

void loop() {}
```
