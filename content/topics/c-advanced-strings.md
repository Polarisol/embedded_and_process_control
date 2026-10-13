# Advanced Strings

In C Language Basics you used `printf` to write text on the screen and `scanf` to read what the user types. Each has a relative that does the same job with a **string** in place of the screen or the keyboard:

| Function | What it does | Python equivalent |
|----------|--------------|-------------------|
| `printf` | Writes formatted text to the **screen** | `print(f"...")` |
| `snprintf` | Writes formatted text **into a string** | `s = f"..."` |
| `scanf` | Reads values from the **keyboard** | `int(input())` |
| `sscanf` | Reads values **out of a string** you already have | `line.split()`, then `int()` and `float()` |

These two functions are how a C program **builds** a text message to send and **takes apart** a text message it received. That is most of what a mechatronic device does when it talks to a computer.

Both live in `stdio.h`, and both use the format codes you already know (`%d`, `%f`, `%c`, `%s`).

## `snprintf`: formatted text into a string

`snprintf` is `printf` with two extra arguments at the front: the string to write into, and its size.

```c
snprintf(string, size, "format text", values...);
```

Everything after the first two arguments works as in `printf`. Nothing appears on the screen. The text goes into the string, ready for you to use:

```c
char message[32];
int speed = 150;

snprintf(message, 32, "Speed: %d rpm", speed);

printf("%s\n", message);     // prints: Speed: 150 rpm
```

The `32` is the size of the array. `snprintf` never writes past it, and it always puts the closing `'\0'` at the end of the text.

> **Watch out:** if the text does not fit, `snprintf` cuts it short. An array of 32 holds at most 31 characters and the `'\0'`. Make the array large enough for the longest message you expect.

> **Watch out:** you will meet an older function, `sprintf`, that has no size argument. It keeps writing past the end of the array when the text is too long, and it damages whatever is stored there. Use `snprintf`.

### Controlling the format

A device that reads your message expects an exact layout, so these `printf` options matter more here than they do on the screen:

| Code | Meaning | Value | Text produced |
|------|---------|-------|---------------|
| `%d` | Whole number | `42` | `42` |
| `%5d` | At least 5 characters wide, padded with spaces | `42` | `   42` |
| `%05d` | At least 5 characters wide, padded with zeros | `42` | `00042` |
| `%.2f` | 2 digits after the decimal point | `3.14159` | `3.14` |
| `%7.2f` | 7 characters wide, 2 after the point | `3.14159` | `   3.14` |
| `%X` | Whole number in hexadecimal | `255` | `FF` |
| `%02X` | Hexadecimal, 2 characters, padded with zeros | `10` | `0A` |
| `%%` | A real percent sign | | `%` |

### Joining strings

`%s` puts one string inside another, so `snprintf` is also the safe way to join strings and numbers into one:

```c
char name[] = "TEMP";
char unit[] = "C";
float value = 23.5;
char text[32];

snprintf(text, 32, "%s = %.1f %s", name, value, unit);    // text = "TEMP = 23.5 C"
```

## `sscanf`: reading values out of a string

`sscanf` is `scanf` with one extra argument at the front: the string to read from. It does not wait for the keyboard.

```c
sscanf(string, "format text", &variable1, &variable2...);
```

```c
char line[] = "150 2.5";
int speed;
float gain;

sscanf(line, "%d %f", &speed, &gain);    // speed = 150, gain = 2.5
```

The `scanf` rules still hold: `&` before simple variables, no `&` before a string, and `%lf` for a `double`.

### Fixed text in the format

Any ordinary text in the format must appear in the string exactly as written. This lets you describe the whole message:

```c
char line[] = "TEMP 23.5 HUM 40";
float temp;
int hum;

sscanf(line, "TEMP %f HUM %d", &temp, &hum);    // temp = 23.5, hum = 40
```

A space in the format matches any number of spaces in the string, so `"TEMP   23.5 HUM 40"` works too.

### Always check the return value

`sscanf` returns **how many values it managed to read**. It stops at the first thing that does not fit, and the variables it did not reach keep their old values.

```c
int n = sscanf(line, "TEMP %f HUM %d", &temp, &hum);

if (n == 2) {
    printf("Temperature %.1f, humidity %d\n", temp, hum);
} else {
    printf("Bad message: %s\n", line);
}
```

| `line` | `n` | Why |
|--------|-----|-----|
| `"TEMP 23.5 HUM 40"` | 2 | Both values read |
| `"TEMP 23.5 HUM abc"` | 1 | `abc` is not a number |
| `"TEMP 23.5"` | 1 | The message ended early |
| `"SPEED 100"` | 0 | The text `TEMP` was not found |

> **Watch out:** a message from a wire can be cut short or damaged by noise. If you skip the check, a bad message leaves **old or garbage values** in your variables, and your motor acts on them. Compare the return value with the number of values you expect, every time.

### Reading a word and a number

To read a command name, use `%s` with a size limit, then compare it with `strcmp`:

```c
char line[] = "SPEED 150";
char command[10];
int value;

if (sscanf(line, "%9s %d", command, &value) == 2) {
    if (strcmp(command, "SPEED") == 0) {
        printf("Set the speed to %d\n", value);
    } else if (strcmp(command, "ANGLE") == 0) {
        printf("Turn to %d degrees\n", value);
    }
}
```

The `9` in `%9s` is the size of `command` minus one, which leaves room for the `'\0'`.

> **Watch out:** `%s` reads until the next space, and a comma is not a space. In `"SPEED,150"` the `%s` takes the whole of `SPEED,150` and nothing is left for `%d`. The simple cure is to separate the parts of a message with **spaces**. Commas between numbers are fine: `"%d,%d"` reads `"10,20"` correctly.

## Use in mechatronics communication

A mechatronic system is rarely one program. A PC talks to a motor controller, a microcontroller talks to a GPS module, a sensor board reports to a logger. They are joined by a serial link (see **Serial Com.**) that carries **bytes**, one after another, and nothing else.

A very common way to give those bytes meaning is to send **lines of text**:

```
PC          ->  controller :   SPEED 150\n
controller  ->  PC         :   OK 150\n

PC          ->  controller :   READ\n
controller  ->  PC         :   TEMP 23.5 HUM 40\n
```

Each line is a string. Each side then needs two skills, and they are the two functions on this page:

| Job | Function |
|-----|----------|
| Turn numbers into a text message, ready to send | `snprintf` |
| Turn a received text message back into numbers | `sscanf` |

How the string travels over the wire depends on your board and is covered elsewhere. This page deals with the string itself.

### Why text?

- **You can read it.** Connect a serial terminal and you see `TEMP 23.5 HUM 40`, and you can type commands by hand to test a device before the PC program exists
- **Any language can speak it.** A Python script, a C program and a LabVIEW panel can all talk to the same controller
- **Both sides agree on numbers.** The text `150` means the same on every processor, while the bytes inside an `int` differ between machines

The price is size. The number `23.5` is 4 characters, and with the 8N1 frame each character costs 10 bits on the wire. At 9600 baud that is about 960 characters per second, so a 20 character message can be sent at most 48 times per second. For fast control loops, engineers switch to binary messages.

### Sending: build the message with `snprintf`

```c
char message[32];
float temp = 23.5;
int hum = 40;

snprintf(message, 32, "TEMP %.1f HUM %d\n", temp, hum);    // message = "TEMP 23.5 HUM 40\n"
```

The string `message` is now complete, and you hand it to whatever send function your board has.

> **Watch out:** on small microcontrollers, `%f` is often switched off to save memory, and it prints `?` or nothing. A common trick is to send a whole number in smaller units: send `235` and agree that it means tenths of a degree.

### Receiving: take the message apart with `sscanf`

Once a complete line has arrived and sits in a string, take it apart with `sscanf` and check the return value:

```c
char line[] = "TEMP 23.5 HUM 40\n";
float temp;
int hum;

if (sscanf(line, "TEMP %f HUM %d", &temp, &hum) == 2) {
    // temp and hum are safe to use
}
```

Never run `sscanf` on half a message. The `'\n'` at the end is what tells the receiver that the message is complete, and that is why every message in the protocol ends with one.

### A complete example

This program is the controller side of the protocol above. The function `handle` gets one command as a string, takes it apart with `sscanf` and builds the answer with `snprintf`. Here `main` feeds it a few test commands and prints each answer, so you can run it on any computer. On a real device, the commands come from the serial link and the answers go back to it, and `handle` stays the same.

```c
#include <stdio.h>
#include <string.h>

int speed = 0;
float temp = 23.5;
int hum = 40;

void handle(char line[])
{
    char command[10];
    char reply[40];
    int value;

    int n = sscanf(line, "%9s %d", command, &value);

    if (n == 2 && strcmp(command, "SPEED") == 0) {
        speed = value;
        snprintf(reply, 40, "OK %d\n", speed);
    } else if (n >= 1 && strcmp(command, "READ") == 0) {
        snprintf(reply, 40, "TEMP %.1f HUM %d SPEED %d\n", temp, hum, speed);
    } else {
        snprintf(reply, 40, "ERR\n");
    }

    printf("%s", reply);
}

int main(void)
{
    handle("SPEED 150\n");
    handle("READ\n");
    handle("SPEED fast\n");
    handle("JUMP 5\n");

    return 0;
}
```

The program prints one answer for each command:

```
OK 150
TEMP 23.5 HUM 40 SPEED 150
ERR
ERR
```

Notice the third command. `fast` is not a number, so `sscanf` returns 1, the check `n == 2` fails and the controller answers `ERR`. The speed is left alone.

### Designing your own messages

- **End every message with `'\n'`**, so the receiver knows where it stops
- **Start with a name** (`SPEED`, `TEMP`), so the receiver knows what kind of message it is
- **Separate the parts with spaces**, which `sscanf` handles well
- **Fix the units** and write them down: is `150` in rpm or in percent?
- **Answer every command**, with `OK` or `ERR`, so the sender knows it arrived
- **Check the return value of `sscanf`** and ignore any message that does not fit

## Cheat sheet

| Task | Code |
|------|------|
| Build a message in a string | `snprintf(msg, 32, "SPEED %d\n", speed);` |
| Fixed number of decimals | `snprintf(msg, 32, "TEMP %.1f\n", temp);` |
| Pad with zeros | `snprintf(msg, 32, "%05d", count);` |
| Join strings and numbers | `snprintf(msg, 32, "%s = %d", name, value);` |
| Take a message apart | `n = sscanf(line, "TEMP %f HUM %d", &temp, &hum);` |
| Check it worked | `if (n == 2) { ... }` |
| Read a word and a number | `n = sscanf(line, "%9s %d", command, &value);` |
| Compare the word | `if (strcmp(command, "SPEED") == 0) { ... }` |
