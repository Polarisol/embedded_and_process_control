# Advanced Strings

In C Language Basics you used `printf` to write text on the screen and `scanf` to read what the user types. Each has a relative that does the same job with a different source or destination:

| Function | What it does | Python equivalent |
|----------|--------------|-------------------|
| `printf` | Writes formatted text to the **screen** | `print(f"...")` |
| `fprintf` | Writes formatted text to **any stream**: the screen, a file or a serial port | `print(f"...", file=f)` |
| `scanf` | Reads values from the **keyboard** | `int(input())` |
| `sscanf` | Reads values out of a **string** you already have | `line.split()`, then `int()` and `float()` |

These two functions are how a C program **builds** a text message to send and **takes apart** a text message it received. That is most of what a mechatronic device does when it talks to a computer.

Both live in `stdio.h`, and both use the format codes you already know (`%d`, `%f`, `%c`, `%s`).

## `fprintf`: formatted text to a stream

A **stream** is any place that text can flow to or from. `fprintf` is `printf` with one extra argument at the front that says which stream to write to:

```c
fprintf(stream, "format text", values...);
```

Everything after the first argument works as in `printf`.

### The screen is a stream too

C opens two output streams for you before `main` starts:

| Stream | Goes to | Used for |
|--------|---------|----------|
| `stdout` | The screen | Normal output |
| `stderr` | The screen | Error messages |

So these two lines do the same thing:

```c
printf("Speed: %d rpm\n", speed);
fprintf(stdout, "Speed: %d rpm\n", speed);
```

### Writing to a file

To write to a file, open it with `fopen`, write with `fprintf` and close it with `fclose`:

```c
#include <stdio.h>

int main(void)
{
    float temperature[3] = {23.5, 23.9, 24.6};

    FILE *log = fopen("log.csv", "w");      // "w" = write, "a" = add to the end
    if (log == NULL) {
        fprintf(stderr, "Could not open the file\n");
        return 1;
    }

    fprintf(log, "sample,temperature\n");
    for (int i = 0; i < 3; i++) {
        fprintf(log, "%d,%.1f\n", i, temperature[i]);
    }

    fclose(log);
    return 0;
}
```

`FILE *` is the type of the variable that stands for the open stream. Write it as shown, with the `*`. The file `log.csv` now holds:

```
sample,temperature
0,23.5
1,23.9
2,24.6
```

This is a data logger: a spreadsheet or a Python script can open the file and plot it.

> **Watch out:** `fopen` returns `NULL` when it fails, for example when the folder does not exist. Always check before you write, as the example does.

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

Each side then needs two skills, and they are the two functions on this page:

| Job | Function |
|-----|----------|
| Turn numbers into a text message and send it | `fprintf` |
| Turn a received text message back into numbers | `sscanf` |

### Why text?

- **You can read it.** Connect a serial terminal and you see `TEMP 23.5 HUM 40`, and you can type commands by hand to test a device before the PC program exists
- **Any language can speak it.** A Python script, a C program and a LabVIEW panel can all talk to the same controller
- **Both sides agree on numbers.** The text `150` means the same on every processor, while the bytes inside an `int` differ between machines

The price is size. The number `23.5` is 4 characters, and with the 8N1 frame each character costs 10 bits on the wire. At 9600 baud that is about 960 characters per second, so a 20 character message can be sent at most 48 times per second. For fast control loops, engineers switch to binary messages.

### Sending: `fprintf` to the port

On a PC, a serial port can be opened as a stream, just like a file. From then on, sending a command is one `fprintf`:

```c
FILE *port = fopen("COM3", "w");         // on Linux: "/dev/ttyUSB0"

int speed = 150;
fprintf(port, "SPEED %d\n", speed);      // sends: SPEED 150
fflush(port);                            // send it now
```

The baud rate and frame format are set separately, before the port is opened, and they must match the device.

> **Watch out:** `fprintf` collects text in a buffer and sends it later, when the buffer is full. A command that waits in a buffer is a motor that does not move. Call `fflush(port)` after each message to push it out at once.

On a microcontroller there are no files, but the idea is the same. Many C compilers for microcontrollers let you connect a stream to the UART, and then `fprintf` (or plain `printf`) sends its text out of the TX pin.

When there is no stream at all, use the sister function `snprintf`. It writes the formatted text **into a string**, and you hand that string to whatever send function your board has:

```c
char message[32];

snprintf(message, 32, "TEMP %.1f HUM %d\n", temp, hum);
uart_send(message);          // the name of this function depends on your board
```

The `32` is the size of the array, and `snprintf` never writes past it.

> **Watch out:** on small microcontrollers, `%f` is often switched off to save memory, and it prints `?` or nothing. A common trick is to send a whole number in smaller units: send `235` and agree that it means tenths of a degree.

### Receiving: one line, then `sscanf`

Receiving is done in two steps:

1. Collect characters until the end-of-line `'\n'` arrives. Now you have one complete message in a string.
2. Take it apart with `sscanf` and check the return value.

The function `fgets` does step 1 for a stream: it reads one whole line into a string.

```c
char line[50];

fgets(line, 50, port);       // read up to 49 characters, stop after '\n'
```

Never run `sscanf` on half a message. The `'\n'` at the end is what tells you the message is complete, and that is why every message in the protocol ends with one.

### A complete example

This program is the controller side of the protocol above. It reads commands, one line at a time, and answers each one. Here it reads from the keyboard (`stdin`) and answers on the screen (`stdout`), so you can run it on any computer and play the part of the PC. Replace the two streams with a serial port, and the same code runs a real device.

```c
#include <stdio.h>
#include <string.h>

int main(void)
{
    char line[50];
    char command[10];
    int value;
    int speed = 0;
    float temp = 23.5;
    int hum = 40;

    while (fgets(line, 50, stdin) != NULL) {
        int n = sscanf(line, "%9s %d", command, &value);

        if (n == 2 && strcmp(command, "SPEED") == 0) {
            speed = value;
            fprintf(stdout, "OK %d\n", speed);
        } else if (n >= 1 && strcmp(command, "READ") == 0) {
            fprintf(stdout, "TEMP %.1f HUM %d SPEED %d\n", temp, hum, speed);
        } else {
            fprintf(stdout, "ERR\n");
        }
        fflush(stdout);
    }

    return 0;
}
```

A session looks like this (the lines you type, each followed by the answer):

```
SPEED 150
OK 150
READ
TEMP 23.5 HUM 40 SPEED 150
SPEED fast
ERR
JUMP 5
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
| Print to the screen | `fprintf(stdout, "x = %d\n", x);` |
| Print an error | `fprintf(stderr, "Sensor failed\n");` |
| Open a file for writing | `FILE *f = fopen("log.csv", "w");` |
| Write a line to a file | `fprintf(f, "%d,%.1f\n", i, temp);` |
| Close the file | `fclose(f);` |
| Send a command | `fprintf(port, "SPEED %d\n", speed);` |
| Send it now | `fflush(port);` |
| Build a message in a string | `snprintf(msg, 32, "TEMP %.1f\n", temp);` |
| Read one line | `fgets(line, 50, port);` |
| Take a message apart | `n = sscanf(line, "TEMP %f HUM %d", &temp, &hum);` |
| Check it worked | `if (n == 2) { ... }` |
