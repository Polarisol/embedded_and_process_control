# Binary, Bytes and Hex Quiz

Answer all the questions, then press **Submit answers** to see your score and the corrections.

## What is the value of the binary number `10110`?
- [x] 22
  > Right! From the right the place values are 1, 2, 4, 8, 16. The 1s are under 16, 4 and 2, so 16 + 4 + 2 = 22.
- [ ] 13
  > That's what you get if you read the place values from the wrong end (1 + 4 + 8). The rightmost digit is always the 1s place.
- [ ] 44
  > Close, but the leftmost 1 of a 5-digit binary number is in the 16s place, not the 32s place.
- [ ] 3
  > That counts how many 1s there are. Each 1 is worth its place value, so you need to add those up.
> To read binary, write the place values 1, 2, 4, 8, 16 … starting from the **right**, then add up the ones that have a 1 under them.

## The bits `01000001` are stored in the computer's memory. What do they mean?
- [ ] They are always the number 65, because memory only holds numbers
  > They are 65 *if* the program reads them as a number, but the same bits can mean other things too.
- [ ] They are always the letter `'A'`, because 8 bits make one character
  > They are `'A'` *if* the program reads them as text, but they could just as well be a number.
- [x] It depends on how the program reads them, which is what the variable's type is for
  > Right! The bits themselves have no meaning. The type tells the computer how to read them: 65 as a number, `'A'` as text.
- [ ] Nothing, because real data like music or photos isn't stored as bits
  > Everything in a computer, including music, movies and SolidWorks files, is stored as bits.
> All data in a computer is stored in binary: numbers, text, music, movies and CAD files are all just combinations of 0s and 1s. The program decides what they stand for.

## These 24 bits are three letters stored as ASCII text. What do they say?
`010110010110010101110011`

Use an ASCII table to find the letters.
- [ ] OK!
  > The first byte is `01011001` = 64 + 16 + 8 + 1 = 89. `'O'` would be 79 (`01001111`).
- [ ] Tal
  > The first byte is `01011001` = 89. `'T'` would be 84 (`01010100`).
- [x] Yes
  > Right! `01011001` = 89 = `'Y'`, `01100101` = 101 = `'e'` and `01110011` = 115 = `'s'`.
- [ ] Wow
  > The first byte is `01011001` = 89. `'W'` would be 87 (`01010111`), two less.
> Each ASCII character takes one byte. Split the bits into groups of 8, turn each byte into a number, then look up which character that number stands for.

## What is Unicode?
- [ ] A way of storing each character in exactly 2 bytes
  > That mixes up Unicode with an encoding. Unicode only gives each character a number; how many bytes it takes depends on the encoding, such as UTF-8.
- [ ] An 8-bit table with 256 characters that replaced ASCII
  > 256 characters isn't nearly enough for every language. That's what the old national tables using codes 128–255 tried, and it caused the garbled-text problem.
- [ ] A font that can draw the letters of every language
  > A font decides how a character *looks*. Unicode decides which *number* each character gets, whatever the font.
- [x] One big list that gives a number (a code point) to every character in every language, including emoji
  > Right! For example `A` is `U+0041` (65) and `א` is `U+05D0` (1488). The first 128 code points are exactly ASCII.
> **Unicode** says *which number* each character gets, written as `U+` and hex. It has about 150,000 characters and includes ASCII as its first 128 code points.

## What is UTF-8?
- [x] An encoding that stores each Unicode code point in 1 to 4 bytes
  > Right! ASCII characters take 1 byte, Hebrew takes 2, the Euro sign takes 3 and emoji take 4.
- [ ] Another name for Unicode
  > Unicode gives each character a number. UTF-8 is one way of turning that number into bytes; UTF-16 is another.
- [ ] An encoding that stores every character in exactly 8 bits
  > The 8 is the size of its building block, one byte. Characters outside ASCII take 2, 3 or 4 bytes, so one character is not always one byte.
- [ ] A newer version of ASCII that adds 128 European letters
  > UTF-8 covers every Unicode character, not just European letters. It does keep plain ASCII text exactly the same, byte for byte.
> **UTF-8** is the most common encoding: it turns Unicode code points into bytes, using 1 byte for ASCII and up to 4 for other characters. That's why a 4-letter Hebrew word is 8 bytes long and `strlen()` in C says 8.

## What does Python show for `b`?
```python
b = bytes([72, 105, 33])
b
```
- [ ] `[72, 105, 33]`
  > That's what `list(b)` shows. The bytes object itself is shown with a `b` in front.
- [ ] `'Hi!'`
  > Close, but this is text (`str`). You only get text after `decode()`. Bytes always have a `b` in front.
- [x] `b'Hi!'`
  > Right! Python shows each byte that is a printable ASCII character as that character: 72 is `H`, 105 is `i` and 33 is `!`. Inside, `b` is still three numbers.
- [ ] `ValueError`
  > All three numbers are between 0 and 255, so they fit in a byte. You only get an error for a number like 300.
> `bytes()` turns a list of numbers from 0 to 255 into bytes. The `b` in front means "this is bytes, not text".

## What does this code print?
```python
s = "ABC"
data = s.encode('utf-8')
print(list(data))
```
- [ ] `['A', 'B', 'C']`
  > That's `list(s)`, the characters of the text. After `encode()` you have bytes, and every byte is a number.
- [x] `[65, 66, 67]`
  > Right! `encode()` turns each character into its byte, and `list()` shows the number of each byte: 65 is `A`, 66 is `B` and 67 is `C`.
- [ ] `b'ABC'`
  > That's what `data` looks like on its own. `list()` turns the bytes into a list of numbers.
- [ ] `[65, 0, 66, 0, 67, 0]`
  > In UTF-8 an ASCII character takes exactly 1 byte, so there are no extra bytes.
> `encode('utf-8')` goes from text (`str`) to `bytes`. For English text, every character becomes one byte, the same number as in the ASCII table.

## What is the value of `text`?
```python
b = bytes([79, 75])
text = b.decode('utf-8')
```
- [x] `'OK'`
  > Right! `decode()` reads the bytes as characters: 79 is `O` and 75 is `K`. There's no `b` in front, so it's text.
- [ ] `b'OK'`
  > That's `b` itself. `decode()` turns bytes into text, so the result has no `b` in front.
- [ ] `[79, 75]`
  > That's `list(b)`. `decode()` gives text, not a list of numbers.
- [ ] `'7975'`
  > `decode()` doesn't write the numbers as digits. It looks up which character each byte stands for.
> `decode('utf-8')` goes from `bytes` back to text (`str`). It is the opposite of `encode('utf-8')`.

## A `bool` variable only needs to store `true` or `false`. How much memory does it take?
- [x] 1 byte (8 bits)
  > Right! A byte is the smallest unit the computer uses, so even a one-bit value takes a whole byte.
- [ ] 1 bit
  > One bit is enough to *represent* true or false, but memory is a row of bytes, each with its own address. A single bit can't be used on its own.
- [ ] 2 bytes (16 bits)
  > That's more than needed. 2 bytes is the size of a `short int`.
- [ ] 4 bits
  > 4 bits is half a byte (a nibble). The computer can't give a variable less than one whole byte.
> A byte is **8 bits** and it is the smallest unit of memory a computer uses.

## Which of these are possible sizes for a C variable?
- [x] 1 byte
  > Yes, for example `char`.
- [ ] 3 bytes
  > There's no 3-byte type. Sizes match how processors and memory are built: 8, 16, 32 or 64 bits.
- [x] 4 bytes
  > Yes, for example `long int` and `float` on our board.
- [ ] 6 bytes
  > There's no 6-byte type. A 48-bit value would go into an 8-byte variable.
- [x] 8 bytes
  > Yes, for example `long long int` and `double`.
- [x] 2 bytes
  > Yes, for example `short int`.
> C variables take **1, 2, 4 or 8 bytes** (8, 16, 32 or 64 bits), depending on their type.

## What range of values can an 8-bit **unsigned** number hold?
- [ ] −128 to 127
  > That's the range of an 8-bit **signed** number, which gives half its combinations to negative values.
- [ ] 0 to 256
  > 8 bits have 256 combinations, but one of them is 0, so the largest value is 255.
- [ ] 1 to 256
  > The smallest value is `00000000`, which is 0, not 1.
- [x] 0 to 255
  > Right! Unsigned means no negative numbers, so all 256 combinations go to 0 … 255 (`11111111` is 255).
> With *n* bits, an unsigned number holds 0 to 2<sup>n</sup> − 1. For 8 bits that's 0 to 255.

## What range of values can an 8-bit **signed** number (`signed char`) hold?
- [ ] −127 to 128
  > The extra value goes to the negative side, not the positive side.
- [ ] −255 to 255
  > That would need 511 combinations, but 8 bits only have 256.
- [x] −128 to 127
  > Right! Half of the 256 combinations are negative (−128 … −1) and half are 0 … 127.
- [ ] −128 to 128
  > That's 257 values, one more than 8 bits can hold. Remember that 0 also takes a combination.
> Signed numbers use two's complement and hold −2<sup>n−1</sup> to 2<sup>n−1</sup> − 1. For 8 bits that's −128 to 127.

## A sensor gives a whole number from 0 to 40,000. Which is the **smallest** type that can hold it?
- [ ] `short int`
  > A signed 2-byte `short int` only goes up to 32,767, so 40,000 doesn't fit.
- [x] `unsigned short int`
  > Right! It uses 2 bytes and holds 0 to 65,535, and the value is never negative.
- [ ] `unsigned char`
  > 1 byte only goes up to 255, far too small.
- [ ] `long long int`
  > It would work, but it uses 8 bytes when 2 are enough.
> To choose an integer type, ask two questions: can the value be negative (signed or unsigned)? And what is the biggest value (how many bytes)?

## A counter must count from 0 up to 1,000,000. How many bytes does the smallest integer type that fits it use?
- [ ] 2 bytes
  > 2 bytes hold at most 65,535 (unsigned), which is much less than 1,000,000.
- [ ] 8 bytes
  > 8 bytes would work, but a smaller size is already big enough.
- [ ] 3 bytes
  > 3 bytes would hold it in theory, but C has no 3-byte integer type.
- [x] 4 bytes
  > Right! A 4-byte `unsigned long int` holds up to about 4.3 billion, so 1,000,000 fits easily.
> Integer types come in 1, 2, 4 or 8 bytes. Pick the smallest one whose range covers the biggest value you need.

## Which statements about `float` and `double` are true?
- [ ] `float` stores decimal numbers more exactly than `double`
  > It's the other way round: `double` keeps about twice as many correct digits.
- [x] `float` uses 4 bytes and keeps about 7 correct digits
  > Yes. It's smaller, so it is fine when about 7 digits are enough.
- [ ] With `double`, `0.1 + 0.2` is exactly `0.3`
  > Both types keep only a limited number of digits, so `0.1 + 0.2` is very close to `0.3` but not exactly equal.
- [x] `double` uses 8 bytes and keeps about 15 correct digits
  > Yes. Use it when you need more precision, for example a GPS coordinate like `32.0853123`.
> `float` (4 bytes, about 7 digits) and `double` (8 bytes, about 15 digits) both store numbers with a decimal point. Choose `double` when you need more correct digits, and `float` when 7 is enough.

## What is the value of the hexadecimal number `0x2C`?
- [ ] 212
  > That's writing the digit `2` and the value of `C` (12) next to each other. Each hex place is worth 16 times the one to its right.
- [x] 44
  > Right! The `2` is in the 16s place and `C` is 12 in the 1s place: 2×16 + 12 = 44.
- [ ] 14
  > That adds the digits (2 + 12) but forgets that the `2` is in the 16s place.
- [ ] 32
  > That treats the places as tens, like decimal (2×10 + 12). In hex, the second place from the right is worth 16.
> Hex is base 16: digits go 0–9 then A–F (10–15), and the place values are 1, 16, 256 … The `0x` only says "this is hex".
