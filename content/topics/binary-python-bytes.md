# Bytes and Strings in Python

In **ASCII & Unicode** we saw that text is stored as numbers. Python lets you see this directly, because it has two different types:

- `str`: **text**, a sequence of characters, like `"Hello"`.
- `bytes`: **raw bytes**, a sequence of numbers from **0 to 255**, like `b'Hello'`.

Going from text to bytes is called **encoding**, and going back is called **decoding**.

![The string "Hi!" becomes the bytes 72, 105, 33 with encode('utf-8'), and the bytes become "Hi!" again with decode('utf-8'). The same bytes print as b'Hi!', as [72, 105, 33] with list(), and as 48 69 21 with hex()](assets/binary/encode-decode.svg)

## Making bytes from numbers

Give `bytes()` a list of numbers, and you get one byte for each number:

```python
b = bytes([65, 66, 67])
b             # b'ABC'
```

Why does Python show `b'ABC'` and not the numbers? The `b` in front means "this is bytes, not text". To make bytes easy to read, Python shows every byte that is a printable ASCII character as that character. Look at the **ASCII table**: 65 is `A`, 66 is `B` and 67 is `C`. Inside, `b` is still just three numbers.

A byte that is not a printable character is shown in hex, with `\x` in front (see **Hexadecimal**):

```python
bytes([1, 2, 72, 10])    # b'\x01\x02H\n'
```

Here 1 and 2 are shown as `\x01` and `\x02`, 72 is `H`, and 10 is the new line character `\n`.

A byte can only hold 0 to 255, so `bytes([300])` gives an error: `ValueError: bytes must be in range(0, 256)`.

## `decode()`: from bytes to text

`decode()` reads the bytes as characters, using an encoding, and gives you a `str`:

```python
b.decode('utf-8')    # 'ABC'
```

Notice the output: `'ABC'` with no `b` in front. Now it is text.

## `encode()`: from text to bytes

`encode()` goes the other way. It turns every character into its bytes:

```python
string = "Hello, World!"
bytes_rep = string.encode('utf-8')
bytes_rep            # b'Hello, World!'
```

It looks almost the same as the text, but the `b` tells you it is now 13 bytes, ready to be sent over a serial port, a network or saved in a file. Those only send bytes, never "text".

## `list()`: see the number of every byte

To see the actual numbers, turn the bytes into a list:

```python
print(list(bytes_rep))
# [72, 101, 108, 108, 111, 44, 32, 87, 111, 114, 108, 100, 33]
```

Check them against the ASCII table: 72 is `H`, 101 is `e`, 108 is `l` (twice), 44 is the comma, 32 is the space, and 33 is `!`.

You can also take one byte with an index. A single byte is just an `int`:

```python
bytes_rep[0]         # 72
```

And `decode()` brings the text back:

```python
result = bytes_rep.decode('utf-8')
print(result)        # Hello, World!
```

## Not every character is one byte

For English text, every character is one byte, because UTF-8 uses the plain ASCII byte for it. Hebrew is different. As we saw in **ASCII & Unicode**, a Hebrew letter takes **2 bytes** in UTF-8:

```python
word = "שלום"
len(word)                     # 4 characters
data = word.encode('utf-8')
len(data)                     # 8 bytes
list(data)                    # [215, 169, 215, 156, 215, 149, 215, 157]
```

This is why you can't just cut bytes in the middle. If only the first byte arrives, `bytes([215]).decode('utf-8')` gives a `UnicodeDecodeError`, because half a letter is not a letter.

## Summary

| You have | You want | Use |
|----------|----------|-----|
| A list of numbers | bytes | `bytes([72, 105])` |
| bytes | text | `b.decode('utf-8')` |
| text | bytes | `s.encode('utf-8')` |
| bytes | the numbers | `list(b)` or `b[0]` |
| bytes | hex | `b.hex(' ')` |
