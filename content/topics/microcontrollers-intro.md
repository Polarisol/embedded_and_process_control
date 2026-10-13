# Introduction

A **microcontroller** (MCU) is a whole tiny computer on one chip: a processor, memory, a built-in clock and input/output pins. Some come in a package smaller than your fingernail. You will find them hiding in washing machines, car keys, toys, drones, thermostats and smartwatches. A modern home has dozens of them, and billions are made every year.

## A very short history

| Year | Milestone |
|------|-----------|
| **1971** | Intel's 4004 is the first commercial microprocessor. It still needs separate chips for memory and I/O |
| **1974** | Texas Instruments' TMS1000 puts CPU, memory and I/O on **one chip**: the first microcontroller, built for calculators |
| **1980** | Intel's **8051** arrives. Its design is so successful that versions of it are still made today |
| **1990s** | Microchip's **PIC** and Atmel's **AVR** add flash memory, so a chip can be reprogrammed thousands of times |
| **2000s–today** | 32-bit **ARM Cortex-M** chips bring desktop-like power for a few dollars, and Wi‑Fi and Bluetooth move onto the chip |

## What can they do?

A microcontroller **senses**, **decides** and **acts**, over and over, thousands of times a second:

- **Sense:** read buttons, temperature, light, distance, motion
- **Decide:** run your program, like *"if it's too hot, turn on the fan"*
- **Act:** blink LEDs, spin motors, beep buzzers, show text on a screen
- **Talk:** send data to a computer, a phone or the internet

All this on a battery that can last months, or even years.

## Development boards: the game changer

A bare chip is hard to use. You need a circuit board, a power supply, a special programmer and, in some cases, an external clock crystal (when the built-in clock isn't accurate enough) just to say "hello". For decades this kept microcontrollers in the hands of engineers.

A **development board** puts all of that on one small, ready-to-use board. Plug in a USB cable, write a few lines of code, press **Upload**, and an LED blinks. That simple idea opened embedded systems to students, artists, hobbyists and makers everywhere, and gave birth to the **maker movement**.

### Famous families

| Family | Why people love it |
|--------|--------------------|
| **Arduino** (Uno, Nano, Mega) | Born in Italy in 2005 for design students. Simple, cheap, and the largest beginner community in the world. The perfect first board |
| **ESP** (ESP8266, ESP32) | By Espressif. Built-in **Wi‑Fi** and **Bluetooth** for a few dollars, the go-to choice for Internet of Things projects. Can even be programmed with the Arduino tools |
| **Raspberry Pi Pico** | Uses the RP2040/RP2350 chip. Low cost and easy to program in **MicroPython** or C |
| **STM32** (Nucleo, "Blue Pill") | By STMicroelectronics. Powerful ARM chips used widely in industry |
| **Adafruit & SparkFun** | Friendly boards, sensors and add-ons with excellent tutorials |
| **micro:bit** | By the BBC, with built-in LEDs, buttons and sensors. Made for schools |

> **Microcontroller board or Raspberry Pi computer?** A Raspberry Pi 4 or 5 is a full computer running Linux. The Pico, Arduino and ESP boards are microcontrollers: no operating system, they start instantly and run *your* program only.

In this unit you will pick up a board, connect it to your computer and make it come alive. Let's get started!
