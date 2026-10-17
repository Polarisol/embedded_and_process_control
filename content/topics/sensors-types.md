# Types of Sensors

A development board on its own is like a brain in a jar: it can think very fast, but it has no idea what is happening around it. **Sensors** are its eyes, ears and skin. A sensor turns something from the real world (a press, a turn, light, heat, motion, distance) into an **electrical signal** the board can read.

Your phone has more than ten of them: it knows when you rotate it, how bright the room is, where you are, and when you hold it to your ear. In this unit we start with the simplest sensors there are, and they already let you build alarms, night lights, thermostats and parking sensors.

## How does a sensor talk to the board?

Every sensor answers in one of four ways. Once you know which way a sensor uses, you already know how to wire it and which function reads it.

![Four signal types: digital, analog, pulse length and digital data](assets/sensors/signal-types.svg)

| Type | What the board sees | Read it with | Examples |
|------|---------------------|--------------|----------|
| **Digital** | Only HIGH or LOW (1 or 0) | `digitalRead(pin)` | Button, tilt switch, PIR motion |
| **Analog** | A voltage anywhere between 0 V and the supply voltage | `analogRead(pin)` | Potentiometer, LDR, thermistor |
| **Pulse length** | How long a pin stays HIGH | `pulseIn(pin, HIGH)` | Ultrasonic distance sensor |
| **Digital data** | A stream of bits that spells out a number | A library | DHT11 / DHT22, and later I²C sensors |

### From voltage to number: the ADC

The board's processor only understands numbers, so analog pins go through an **ADC** (Analog-to-Digital Converter). It measures the voltage and gives you a whole number:

| Board | Supply voltage | ADC resolution | `analogRead()` range |
|-------|----------------|----------------|----------------------|
| Arduino Uno / Nano | 5 V | 10 bits | 0 – 1023 |
| ESP32 | 3.3 V | 12 bits | 0 – 4095 |

So on an Uno, 0 V reads `0`, 5 V reads `1023`, and 2.5 V reads about `512`.

> **ESP boards run on 3.3 V.** Never put 5 V on an ESP pin. Power your sensors from the **3.3V** pin, or lower the sensor's output voltage first (we will see how for the ultrasonic sensor).

## Cheat sheet

| Sensor | Measures | Signal type | Read with |
|--------|----------|-------------|-----------|
| Push button | A press | Digital | `digitalRead()` + `INPUT_PULLUP` |
| Tilt switch | Tilting | Digital | `digitalRead()` + `INPUT_PULLUP` |
| PIR | Movement of warm bodies | Digital | `digitalRead()` |
| Potentiometer | Knob position | Analog | `analogRead()` |
| LDR | Light | Analog (voltage divider) | `analogRead()` |
| Thermistor | Temperature | Analog (voltage divider) | `analogRead()` |
| HC-SR04 | Distance | Pulse length | `pulseIn()` |
| DHT11 / DHT22 | Temperature and humidity | Digital data | DHT library |
