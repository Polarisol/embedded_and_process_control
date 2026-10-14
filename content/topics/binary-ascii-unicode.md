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

Codes **32 to 126** are the characters you can see and type. The hex column comes straight from the previous item: two hex digits for one byte.

[![The ASCII table for codes 32 to 126 in three columns: space, punctuation and digits from 32 to 63, capital letters from 64 to 95, and small letters from 96 to 126. Each row shows the 8-bit binary, hex, decimal and the symbol, for example 01000001, 41, 65, A](assets/binary/ascii-table.svg)](assets/binary/ascii-table.svg)

On a phone, tap the table to open it full size and zoom in.

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
