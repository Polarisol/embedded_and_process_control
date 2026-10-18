# Introduction

**Serial communication** means sending data **one bit after another**, over a single line (or a few lines). The opposite is **parallel** communication, where several bits travel side by side, each on its own wire.

Parallel sounds faster, and at first it was. But many wires cost money, take up space, and at high speeds the bits on different wires drift apart and arrive at slightly different times. A serial link needs only a few wires and can run very fast over long distances. That is why almost everything today is serial: USB, Ethernet, HDMI, SATA disks, PCI Express, and the link between your Arduino and your computer.

![Serial sends the byte 01001101 one bit after another over one wire; parallel sends all 8 bits at once over 8 wires](assets/serial/intro-serial-vs-parallel.svg)

| | Serial | Parallel |
|--|--------|----------|
| **Bits at a time** | One | Several (8, 16, 32…) |
| **Wires** | Few | Many |
| **Distance** | Short to very long | Short |
| **Examples** | UART, I²C, SPI, USB, Ethernet | Old printer port, old IDE disks, inside a chip |

## Forms of serial communication

### Synchronous or asynchronous

- **Synchronous:** a **clock wire** travels with the data and tells the receiver exactly when to read each bit. Examples: **SPI**, **I²C**.
- **Asynchronous:** there is **no clock wire**. Both sides agree in advance on the speed (the **baud rate**), and every character is wrapped in a **frame** with a start bit and a stop bit so the receiver can find it. Example: **UART** (Arduino `Serial`).

![Synchronous: a clock wire runs beside the data and each rising edge marks when to read a bit. Asynchronous: no clock, and the byte is wrapped between a start bit and a stop bit](assets/serial/intro-sync-async.svg)

### Who talks, and when

| Mode | Meaning | Everyday example |
|------|---------|------------------|
| **Simplex** | One direction only | A GPS module that only sends |
| **Half duplex** | Both directions, but one at a time | A walkie-talkie, RS-485, I²C |
| **Full duplex** | Both directions at the same time | A phone call, UART (TX and RX wires), SPI |

![Simplex: arrow from device A to B only. Half duplex: one shared wire used in both directions, taking turns. Full duplex: two wires, one in each direction at the same time](assets/serial/intro-duplex.svg)

### Common serial interfaces

| Interface | Wires | Clock | Typical use |
|-----------|-------|-------|-------------|
| **UART** | TX, RX (+ GND) | No | Arduino to computer, GPS, Bluetooth modules |
| **RS-232 / RS-485** | 2–3 (+ GND) | No | UART with stronger voltages for longer cables, industrial machines |
| **I²C** | SDA, SCL | Yes | Many sensors and small screens on the same two wires |
| **SPI** | MOSI, MISO, SCK, CS | Yes | Fast devices: SD cards, displays |
| **CAN** | CAN-H, CAN-L | No | Cars and industrial control |
| **USB** | D+, D− | No (clock hidden in the data) | Almost everything that plugs into a computer |

![UART: Arduino TX goes to the GPS RX and GPS TX to the Arduino RX, plus GND. I²C: an Arduino and three devices with different addresses share SDA and SCL. SPI: Arduino and SD card joined by MOSI, MISO, SCK and CS](assets/serial/intro-wiring.svg)

## A bit of history

![Timeline: telegraph 1840s, Baudot code 1870s, teleprinters 1900s, RS-232 1960, UART chip 1971, I²C, SPI and CAN in the 1980s, USB 1996](assets/serial/intro-timeline.svg)

| Year | Milestone |
|------|-----------|
| **1840s** | The **telegraph** sends Morse code: dots and dashes, one after another, over one wire. Serial communication is born |
| **1870s** | Émile **Baudot** invents a 5-bit code for telegraph machines. The unit **baud** (symbols per second) is named after him |
| **1900s–1960s** | **Teleprinters** (teletypes) type messages sent over wires using start and stop bits, the same idea UART uses today |
| **1960** | The **RS-232** standard defines how computers and modems connect over a serial cable |
| **1971** | The first single-chip **UART** appears, making serial ports cheap and common on computers |
| **1980s** | **I²C** (Philips, 1982), **SPI** (Motorola) and **CAN** (Bosch, 1986) connect chips and car parts |
| **1996** | **USB** arrives and slowly replaces the old serial and parallel ports on PCs |

> **Why do we still say "serial port"?** When you plug an Arduino into USB, a small chip on the board turns USB back into a plain UART. Your computer shows it as a "COM port" (Windows) or `/dev/ttyUSB0` / `/dev/ttyACM0` (Linux), a name left over from the days of RS-232 cables.

In this unit you will look inside a UART frame and then write a program that talks to your board over the serial port.
