# Nano ESP32 Overview

The **Arduino Nano ESP32** is the development board we use in this course. It is small enough to sit on a breadboard, costs about the price of a pizza, and has everything you need to build real projects: a fast processor, lots of memory, and built-in **Wi‑Fi** and **Bluetooth**.

It brings together the two families from the Introduction. **Arduino** made the board, with its simple tools and huge community. The chip on it is an **ESP32-S3** made by **Espressif**, the company behind the ESP boards. So we get the easy Arduino way of working *and* the wireless power of the ESP32.

![The Arduino Nano ESP32 seen from above: the USB-C connector, the LED L, the power LED, the reset button, the RGB LED, the ESP32-S3 module with its antenna and the two rows of pin headers](assets/nano-esp32/board.svg)

## The board in numbers

| | Nano ESP32 | For comparison: Arduino Uno |
|--|------------|-----------------------------|
| **Chip** | ESP32-S3, 2 cores | ATmega328P, 1 core |
| **Speed** | up to 240 MHz | 16 MHz |
| **Memory (RAM)** | 512 KB | 2 KB |
| **Space for your program (flash)** | 16 MB | 32 KB |
| **Wireless** | Wi‑Fi and Bluetooth | none |
| **Pin voltage** | **3.3 V** | 5 V |
| **Size** | 45 × 18 mm | 69 × 53 mm |

Don't worry about remembering these numbers. The point is that this tiny board is many times more powerful than the classic Arduino Uno, and it can talk to the internet.

## The parts of the board

| Part | What it does |
|------|--------------|
| **USB-C connector** | Powers the board and connects it to your computer. Your programs are uploaded through it, and the board can send messages back over the same cable |
| **ESP32-S3 module** | The brain: the microcontroller, its memory and the radio, all under one metal cover |
| **Antenna** | Part of the module. It sends and receives the Wi‑Fi and Bluetooth signals, so don't cover it with metal or your hand |
| **Power LED** | Lights up green when the board has power |
| **LED "L"** | A small LED connected to pin **D13**. Your first program will blink it |
| **RGB LED** | A red, green and blue LED in one. Mix them from your code to make any colour |
| **Reset button** | Restarts your program from the beginning, like turning the board off and on |
| **Pin headers** | Two rows of 15 pins. This is where you connect LEDs, buttons, sensors and motors |

## The pins

The pins are how the board talks to the world. Each one has a name, printed on the board next to it:

![The 30 pins of the Nano ESP32: digital pins D0 to D13, analog inputs A0 to A7, power pins 3V3, VBUS and VIN, two GND pins, RST, and the special pins B0 and B1](assets/nano-esp32/pinout.svg)

| Group | Pins | Used for |
|-------|------|----------|
| **Digital** | D0 – D13 | Turning things on and off (LEDs, motors through a driver) and reading buttons. D0 and D1 also carry serial data |
| **Analog** | A0 – A7 | Reading a voltage, like the position of a knob or the light level on a light sensor |
| **Power** | 3V3, VBUS, VIN | **3V3** gives out 3.3 V for your circuits. **VBUS** gives the 5 V that comes from the USB cable. **VIN** is an input for a battery or supply of 6–21 V when there is no USB |
| **Ground** | GND (two pins) | The 0 V reference. Every circuit you build connects to GND |
| **Special** | RST, B0, B1 | Reset and boot pins. Leave them unconnected |

> **The Nano ESP32 runs on 3.3 V.** A pin gives out 3.3 V when it is on, and it must never receive more than 3.3 V. Connecting a 5 V signal to a pin can damage the board.

We will learn how to use each group of pins in later items.

## Programming the board in C

The Nano ESP32 is programmed in **C** (the Arduino "language" is C and C++ with some ready-made functions) using the free **Arduino IDE**. An IDE (Integrated Development Environment) is the program where you write your code, check it and send it to the board.

![The Arduino IDE on a laptop with a blink program; the compiled program goes over the USB-C cable to the Nano ESP32, and its LED L blinks](assets/nano-esp32/upload.svg)

1. You write a program, called a **sketch**, in the Arduino IDE.
2. You press **Upload**. The IDE **compiles** your C code into machine code the ESP32-S3 understands, and sends it over the USB cable.
3. The board starts running your program straight away, and runs it again every time it gets power.

Every sketch has two parts: `setup()` runs once when the board starts, and `loop()` runs again and again, forever. Here is the classic first program. It blinks the LED "L":

```c
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);     // LED_BUILTIN is the LED "L" on D13
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);  // LED on
  delay(500);                       // wait half a second
  digitalWrite(LED_BUILTIN, LOW);   // LED off
  delay(500);
}
```

You don't need to understand every line yet. We will set up the IDE together and go through this program step by step in the next items.

## Links

- **Download the Arduino IDE** (free, for Windows, macOS and Linux): <https://www.arduino.cc/en/software>
- **The Nano ESP32 page** on the official Arduino site, with the full pinout and datasheet: <https://docs.arduino.cc/hardware/nano-esp32/>
