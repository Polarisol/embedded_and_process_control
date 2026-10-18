# Serial in Arduino

You already know what travels on the wire: frames of start bit, data and stop bit. Now let's use it. On the Arduino all of this is hidden behind one object, **`Serial`**, and a handful of functions. This item covers sending, receiving, the Serial Monitor and Plotter, and how to read commands without freezing your program.

## Two serial ports on the Nano ESP32

The Nano ESP32 has more than one serial port. The two you will meet first are:

![The Nano ESP32 has Serial, which goes over the USB cable to the computer's Serial Monitor, Serial Plotter or your PySide app, and Serial0 on pins D1 (TX) and D0 (RX), wired crossed to a GPS module or another board](assets/serial/arduino-two-ports.svg)

| Name | Where it goes | Use it for |
|------|---------------|------------|
| **`Serial`** | The **USB cable** to the computer | Serial Monitor, Serial Plotter, your Python app, debugging |
| **`Serial0`** | Pins **D1 (TX)** and **D0 (RX)** | Another board, a GPS or Bluetooth module |

Both work the same way: everything below with `Serial.` also works with `Serial0.`. When you connect two boards with `Serial0`, the wires **cross** (TX to RX, RX to TX) and the grounds must be connected, as in the **Introduction** item.

> On an Arduino Uno there is only one hardware port, `Serial`, and it uses **both** the USB cable and pins 0 and 1. That is why uploading fails on an Uno when something is connected to those pins. The Nano ESP32 doesn't have this problem.

## Starting the port

```c
void setup() {
  Serial.begin(9600);          // 9600 baud, 8N1
}
```

`Serial.begin()` sets the baud rate and the frame format (see the **Serial Frame** item). The other side must use the same values, so the speed you choose in the Serial Monitor must match.

Two things that are special about the Nano ESP32's USB port:

- The baud rate doesn't really matter on `Serial`, because USB sets its own speed. It still matters on `Serial0`, where real frames go out on the pins.
- The board does **not** restart when you open the Serial Monitor, so whatever `setup()` printed may already be gone. To wait for the computer, add `while (!Serial) { }` after `Serial.begin()`. Remove it when the board runs without a computer, or it will wait forever.

## Sending: `print`, `println` and `printf`

```c
int light = 600;
float temp = 23.5;

Serial.print("light = ");     // text, no new line
Serial.println(light);        // the number as text, then "\r\n"
Serial.println(temp, 2);      // 23.50 (2 digits after the point)
Serial.println(light, HEX);   // 258
Serial.println(light, BIN);   // 1001011000
Serial.printf("temp=%.1f light=%d\n", temp, light);  // like C's printf
```

| Function | What it sends |
|----------|---------------|
| `Serial.print(x)` | `x` as **text** |
| `Serial.println(x)` | `x` as text, then `'\r'` and `'\n'` |
| `Serial.printf(...)` | Formatted text, like `printf` in C (works on the ESP32, not on an Uno) |
| `Serial.write(b)` | One raw **byte** with the value `b`, not text |

All of these send text except `write()`. `Serial.print(200)` sends the three characters `'2'`, `'0'`, `'0'`. To send raw bytes, variables and arrays of bytes, see the **Sending non-string data** item.

Sending takes time: at 9600 baud each character takes about 1 ms. The Arduino puts what you print in a **transmit buffer** and sends it in the background, but if you print more than fits, `print()` waits until there is room. Printing a lot at a low baud rate slows down your whole `loop()`.

## The Serial Monitor and the Serial Plotter

In the Arduino IDE:

- **Tools → Serial Monitor** shows the text the board sends, and has a box at the top for sending text to the board. Next to it, the **line ending** menu chooses what is added when you press Enter: *No Line Ending*, *New Line* (`\n`), *Carriage Return* (`\r`) or *Both NL & CR*. Choose **New Line** for the examples below.
- **Tools → Serial Plotter** draws a live graph. Print the numbers on one line, separated by commas, and end the line. A `name:` before a value gives it a name in the legend:

```c
Serial.print("temp:");
Serial.print(temp);
Serial.print(",light:");
Serial.println(light);       // temp:23.5,light:600
```

Only one program can use the port at a time. Close the Serial Monitor before you run your PySide app, and close the app before you upload.

## Receiving: the receive buffer

Bytes can arrive at any moment, even while your code is busy with something else. The Arduino stores them in a **receive buffer** until you read them:

![The PC sends "LED ON\n". Four bytes, L, E, D and space, are already in the buffer and three are still on the way. Serial.available() returns 4, Serial.read() returns the oldest byte 'L', and returns -1 when the buffer is empty](assets/serial/arduino-rx-buffer.svg)

| Function | What it does |
|----------|--------------|
| `Serial.available()` | How many bytes are waiting. Doesn't remove anything |
| `Serial.read()` | Takes the oldest byte out and returns it (0 to 255), or `-1` if there is none |
| `Serial.peek()` | Like `read()`, but leaves the byte in the buffer |

The buffer is small (64 bytes on an Uno, a few hundred on the ESP32). If you don't read it, new bytes are thrown away.

The simplest program reads one character at a time, a one-letter command:

```c
void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  if (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '1') digitalWrite(LED_BUILTIN, HIGH);
    if (c == '0') digitalWrite(LED_BUILTIN, LOW);
  }
}
```

Type `1` or `0` in the Serial Monitor. The `'\n'` that the Monitor adds is read too, and simply ignored.

## Reading whole lines and numbers

Arduino has functions that read more than one byte at a time:

| Function | Reads until | Returns |
|----------|-------------|---------|
| `Serial.readStringUntil('\n')` | `'\n'` (not included) | A `String` |
| `Serial.readString()` | Nothing arrives for a while | A `String` |
| `Serial.parseInt()` | The number ends | A `long`, `0` if no number came |
| `Serial.parseFloat()` | The number ends | A `float` |

```c
void loop() {
  if (Serial.available() > 0) {
    int brightness = Serial.parseInt();   // "128\n" → 128
    analogWrite(LED_BUILTIN, brightness);
  }
}
```

They are easy to use, but they have a catch: they **wait**. If the rest of the line hasn't arrived yet, they keep waiting until it does, or until the **timeout** runs out (1 second by default, change it with `Serial.setTimeout(ms)`). During that time `loop()` is stuck.

## Reading without waiting

![Two timelines. With readStringUntil the LED blinks, then freezes from the first byte until the '\n' arrives. Reading one character at a time, the LED keeps blinking the whole time and the line is done when '\n' arrives](assets/serial/arduino-blocking.svg)

When the program must keep doing other things (blink, read sensors, run a motor), collect the line yourself, one character per `loop()`, and act only when `'\n'` arrives:

```c
char line[32];      // the line being collected
int len = 0;

void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
}

void handleCommand(const char *cmd) {
  if (strcmp(cmd, "LED ON") == 0)  digitalWrite(LED_BUILTIN, HIGH);
  else if (strcmp(cmd, "LED OFF") == 0) digitalWrite(LED_BUILTIN, LOW);
  else if (strncmp(cmd, "PWM ", 4) == 0) analogWrite(LED_BUILTIN, atoi(cmd + 4));
  else {
    Serial.print("unknown: ");
    Serial.println(cmd);
    return;
  }
  Serial.println("ok");
}

void loop() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\r') continue;           // ignore '\r' from "Both NL & CR"
    if (c == '\n') {                   // the line is complete
      line[len] = '\0';
      handleCommand(line);
      len = 0;
    } else if (len < sizeof(line) - 1) {
      line[len++] = c;                 // add the character
    }
  }

  // ...the rest of loop() keeps running: sensors, motors, a blinking LED
}
```

- `line` is a C string: an array of `char` that ends with `'\0'` (see [The C Language](topic.html?id=c-language)).
- `len < sizeof(line) - 1` keeps a too-long line from writing past the end of the array.
- `strcmp()` compares two strings and returns `0` when they are equal. `atoi()` turns text such as `"128"` into a number.

Send `LED ON`, `LED OFF` or `PWM 50` and the board answers `ok`. This is the same kind of text protocol that the app in **Serial in PySide** uses.

## A protocol: agree on the messages

A **protocol** is the agreement between the two sides on what the messages look like. A good text protocol for a project:

- **One message per line**, ending with `'\n'`.
- A **command word** first, then values, separated by spaces or commas: `PWM 128`, `MOTOR 1,200`.
- The board **answers** every command (`ok`, `error`, or the value asked for), so the computer knows it was received.
- Readings use a fixed form, like `temp=23.5,light=600`, which is easy to split in Python.

## Summary

- `Serial` goes over USB to the computer. `Serial0` uses pins D1 (TX) and D0 (RX).
- `Serial.begin(baud)` starts the port. Both sides must use the same settings.
- `print()` and `println()` send **text**. `write()` sends raw bytes.
- The Serial Monitor sends and shows text. The Serial Plotter graphs comma-separated numbers.
- Received bytes wait in a buffer. `available()` says how many, `read()` takes one.
- `readStringUntil()` and `parseInt()` are easy but **wait**. To keep `loop()` running, collect characters yourself until `'\n'`.
