# ASCII & UNI

A computer can only store bits, so how does it store text? The trick is simple: **give every character a number**, and store the number. Everyone just has to agree on which number means which character. That agreement is called a **character encoding**.

## ASCII: one number for each character

In the 1960s, American engineers made a list called **ASCII** (American Standard Code for Information Interchange, say "ASK-ee"). It gives a number from **0 to 127** to every English letter, digit, punctuation mark and a few special codes.

You already met one of them: `01000001` is **65**, and in ASCII 65 is the letter **'A'**. So the word `Hi` is stored as two bytes:

| Character | `H` | `i` |
|-----------|-----|-----|
| Decimal | 72 | 105 |
| Binary | `01001000` | `01101001` |

128 = 2<sup>7</sup> values only need **7 bits**, so every ASCII character fits easily in **one byte**, and the leftmost bit is always `0`.

## The ASCII table

Codes **32 to 126** are the characters you can see and type. They are split below into three groups of 32. The hex column comes straight from the previous item: two hex digits for one byte.

### Space, punctuation and digits (32–63)

| Binary | Hex | Decimal | Symbol |
|--------|-----|---------|--------|
| `00100000` | `0x20` | 32 | (space) |
| `00100001` | `0x21` | 33 | `!` |
| `00100010` | `0x22` | 34 | `"` |
| `00100011` | `0x23` | 35 | `#` |
| `00100100` | `0x24` | 36 | `$` |
| `00100101` | `0x25` | 37 | `%` |
| `00100110` | `0x26` | 38 | `&` |
| `00100111` | `0x27` | 39 | `'` |
| `00101000` | `0x28` | 40 | `(` |
| `00101001` | `0x29` | 41 | `)` |
| `00101010` | `0x2A` | 42 | `*` |
| `00101011` | `0x2B` | 43 | `+` |
| `00101100` | `0x2C` | 44 | `,` |
| `00101101` | `0x2D` | 45 | `-` |
| `00101110` | `0x2E` | 46 | `.` |
| `00101111` | `0x2F` | 47 | `/` |
| `00110000` | `0x30` | 48 | `0` |
| `00110001` | `0x31` | 49 | `1` |
| `00110010` | `0x32` | 50 | `2` |
| `00110011` | `0x33` | 51 | `3` |
| `00110100` | `0x34` | 52 | `4` |
| `00110101` | `0x35` | 53 | `5` |
| `00110110` | `0x36` | 54 | `6` |
| `00110111` | `0x37` | 55 | `7` |
| `00111000` | `0x38` | 56 | `8` |
| `00111001` | `0x39` | 57 | `9` |
| `00111010` | `0x3A` | 58 | `:` |
| `00111011` | `0x3B` | 59 | `;` |
| `00111100` | `0x3C` | 60 | `<` |
| `00111101` | `0x3D` | 61 | `=` |
| `00111110` | `0x3E` | 62 | `>` |
| `00111111` | `0x3F` | 63 | `?` |

### Capital letters (64–95)

| Binary | Hex | Decimal | Symbol |
|--------|-----|---------|--------|
| `01000000` | `0x40` | 64 | `@` |
| `01000001` | `0x41` | 65 | `A` |
| `01000010` | `0x42` | 66 | `B` |
| `01000011` | `0x43` | 67 | `C` |
| `01000100` | `0x44` | 68 | `D` |
| `01000101` | `0x45` | 69 | `E` |
| `01000110` | `0x46` | 70 | `F` |
| `01000111` | `0x47` | 71 | `G` |
| `01001000` | `0x48` | 72 | `H` |
| `01001001` | `0x49` | 73 | `I` |
| `01001010` | `0x4A` | 74 | `J` |
| `01001011` | `0x4B` | 75 | `K` |
| `01001100` | `0x4C` | 76 | `L` |
| `01001101` | `0x4D` | 77 | `M` |
| `01001110` | `0x4E` | 78 | `N` |
| `01001111` | `0x4F` | 79 | `O` |
| `01010000` | `0x50` | 80 | `P` |
| `01010001` | `0x51` | 81 | `Q` |
| `01010010` | `0x52` | 82 | `R` |
| `01010011` | `0x53` | 83 | `S` |
| `01010100` | `0x54` | 84 | `T` |
| `01010101` | `0x55` | 85 | `U` |
| `01010110` | `0x56` | 86 | `V` |
| `01010111` | `0x57` | 87 | `W` |
| `01011000` | `0x58` | 88 | `X` |
| `01011001` | `0x59` | 89 | `Y` |
| `01011010` | `0x5A` | 90 | `Z` |
| `01011011` | `0x5B` | 91 | `[` |
| `01011100` | `0x5C` | 92 | `\` |
| `01011101` | `0x5D` | 93 | `]` |
| `01011110` | `0x5E` | 94 | `^` |
| `01011111` | `0x5F` | 95 | `_` |

### Small letters (96–126)

| Binary | Hex | Decimal | Symbol |
|--------|-----|---------|--------|
| `01100000` | `0x60` | 96 | <code>&#96;</code> |
| `01100001` | `0x61` | 97 | `a` |
| `01100010` | `0x62` | 98 | `b` |
| `01100011` | `0x63` | 99 | `c` |
| `01100100` | `0x64` | 100 | `d` |
| `01100101` | `0x65` | 101 | `e` |
| `01100110` | `0x66` | 102 | `f` |
| `01100111` | `0x67` | 103 | `g` |
| `01101000` | `0x68` | 104 | `h` |
| `01101001` | `0x69` | 105 | `i` |
| `01101010` | `0x6A` | 106 | `j` |
| `01101011` | `0x6B` | 107 | `k` |
| `01101100` | `0x6C` | 108 | `l` |
| `01101101` | `0x6D` | 109 | `m` |
| `01101110` | `0x6E` | 110 | `n` |
| `01101111` | `0x6F` | 111 | `o` |
| `01110000` | `0x70` | 112 | `p` |
| `01110001` | `0x71` | 113 | `q` |
| `01110010` | `0x72` | 114 | `r` |
| `01110011` | `0x73` | 115 | `s` |
| `01110100` | `0x74` | 116 | `t` |
| `01110101` | `0x75` | 117 | `u` |
| `01110110` | `0x76` | 118 | `v` |
| `01110111` | `0x77` | 119 | `w` |
| `01111000` | `0x78` | 120 | `x` |
| `01111001` | `0x79` | 121 | `y` |
| `01111010` | `0x7A` | 122 | `z` |
| `01111011` | `0x7B` | 123 | `{` |
| `01111100` | `0x7C` | 124 | <code>&#124;</code> |
| `01111101` | `0x7D` | 125 | `}` |
| `01111110` | `0x7E` | 126 | `~` |

### Patterns worth noticing

- **The digit `'0'` is not the number 0.** The character `'0'` is stored as 48, `'1'` as 49, and so on up to `'9'` = 57. To turn a digit character into its value, subtract 48: `'7' - '0'` = 55 − 48 = **7**. You will use this trick when reading numbers from the Serial Monitor.
- **The letters are in order.** `'A'` is 65, `'B'` is 66 … `'Z'` is 90. That is why sorting words alphabetically is just sorting numbers.
- **Small letters are exactly 32 more than capitals.** `'A'` is 65 and `'a'` is 97. 32 is a single bit (`00100000`), so changing between upper and lower case only flips one bit:

| | Binary |
|-|--------|
| `'A'` = 65 | `01000001` |
| `'a'` = 97 | `01100001` |

## Control codes (0–31 and 127)

The codes below 32 are not symbols you can see. They are **commands** from the days of teleprinters (typewriters connected to a wire). A few are still used every day:

| Name | Decimal | In C | What it does |
|------|---------|------|--------------|
| NUL | 0 | `'\0'` | **End of a string** in C |
| TAB | 9 | `'\t'` | Tab |
| LF | 10 | `'\n'` | Line feed: **new line** |
| CR | 13 | `'\r'` | Carriage return: back to the **start of the line** |
| DEL | 127 | | Delete (an old leftover) |

When an Arduino runs `Serial.println("Hi")`, it actually sends **4 bytes**: 72, 105, 13, 10. That is `H`, `i`, then CR and LF to end the line.

## In C, a char is just a small number

In C, a `char` is a 1-byte integer. Writing a letter in single quotes is just a friendly way to write its ASCII number, so these two lines store exactly the same bits:

```c
char a = 'A';  // 01000001
char b = 65;   // 01000001 too
```

## The problem: the world has more than 128 characters

ASCII only covers English. There is no `é`, no `ש`, no `€`, no `中` and no 😀. For years, every country used the unused codes 128–255 for its own letters, so the same byte could be a Hebrew letter on one computer and a Russian letter on another. Text sent between countries often turned into garbage.

## Unicode: one list for every character

**Unicode** fixed this with one giant list that gives a number to **every character in every language**, plus maths symbols, arrows and emoji. Today it has about **150,000 characters**, and there is room for over a million.

The number of a character is called its **code point** and is written as `U+` followed by hex:

| Character | Code point | Decimal |
|-----------|------------|---------|
| `A` | `U+0041` | 65 |
| `é` | `U+00E9` | 233 |
| `א` | `U+05D0` | 1488 |
| `€` | `U+20AC` | 8364 |
| 😀 | `U+1F600` | 128512 |

**Unicode includes ASCII.** The first 128 code points are exactly the ASCII table: `A` is still 65. So everything you learned above is still true.

## UTF-8: how Unicode is stored in bytes

Unicode says *which number* each character gets. It does not say how to put that number into bytes. That is the job of an **encoding**, and the most common one by far is **UTF-8**. Almost every web page, including this one, is UTF-8.

UTF-8 uses **1 to 4 bytes** for each character:

- **ASCII characters (0–127) take 1 byte**, exactly the same byte as in ASCII. So plain English text in UTF-8 *is* ASCII.
- Other characters take **2, 3 or 4 bytes**. Hebrew and most European letters take 2, the Euro sign and Chinese take 3, and emoji take 4.

![A takes 1 byte in UTF-8, é and the Hebrew letter alef take 2, the Euro sign takes 3 and an emoji takes 4](assets/binary/utf8-bytes.svg)

You do not need to know the exact bit patterns. Just remember that **one character is not always one byte**. A Hebrew word with 4 letters is 8 bytes long, so `strlen()` in C will say 8, not 4.

You may also hear of **UTF-16** (2 or 4 bytes per character, used inside Windows, Java and JavaScript). It stores the same Unicode numbers, just in a different way.
