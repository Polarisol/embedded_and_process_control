# Nano ESP32 Analog Pins

The real world is not just on and off. A room is a little dark or very bright, a knob is turned a bit or all the way, the water is warm or hot. Sensors turn these things into a **voltage** that can be anything between 0 V and the supply. An **analog** pin measures that voltage and gives your program a number.

![The Nano ESP32 with its analog pins highlighted: A0 to A3 always work, A4 to A7 do not work while Wi-Fi is on, A4 and A5 are also I2C; the D pins on the right are digital only](assets/nano-esp32/analog-pins.svg)

## Which pins are analog?

The Nano ESP32 has **8 analog inputs**, **A0 – A7**, on the left side of the board.

| Pins | Notes |
|------|-------|
| **A0 – A3** | Always work. Use these first |
| **A4 – A7** | Don't work while **Wi‑Fi** is on, because the radio uses the same converter inside the chip. Fine for projects without Wi‑Fi |
| **A4, A5** | Also the **I2C** bus (SDA and SCL). If a sensor uses I2C, these two pins are taken |

The **D pins can't read an analog voltage.** They are digital only. The analog pins, on the other hand, can also work as digital pins with `digitalRead()` and `digitalWrite()`.

## From a voltage to a number: the ADC

Inside the chip is an **ADC** (Analog-to-Digital Converter). It measures the voltage on the pin and turns it into a whole number. `analogRead(pin)` gives you that number:

![A voltage scale from 0 V to 3.3 V lined up above a number scale from 0 to 4095: 0.825 V is 1024, 1.65 V is 2048, 2.475 V is 3071 and 3.3 V is 4095](assets/nano-esp32/adc.svg)

The ADC of the Nano ESP32 has **12 bits**, so the number goes from **0** to **4095** (2¹² = 4096 different values):

| Voltage on the pin | `analogRead()` gives |
|--------------------|----------------------|
| 0 V | 0 |
| 1.65 V (half) | about 2048 |
| 3.3 V | 4095 |

To turn the number back into volts: `volts = value * 3.3 / 4095.0`. Or let the board do it: `analogReadMilliVolts(pin)` gives the voltage in millivolts, already corrected for the chip's small measuring errors.

> **Coming from an Arduino Uno?** The Uno has a 10-bit ADC and 5 V pins, so it reads 0 – 1023 for 0 – 5 V. Examples written for the Uno need the numbers changed to 4095 and 3.3 V.

## Example: reading a potentiometer

A **potentiometer** (a knob) is the easiest way to try an analog pin. Connect its two ends to **3V3** and **GND**, and its middle leg, the **wiper**, to **A0**. Turning the knob moves the wiper from 0 V to 3.3 V:

![A 10 kilo-ohm potentiometer with one end on 3V3, the other on GND and the wiper on A0; turning the knob gives 0 V and 0, 1.65 V and 2048, or 3.3 V and 4095](assets/nano-esp32/analog-pot.svg)

```c
const int POT_PIN = A0;

void setup() {
  Serial.begin(115200);
}

void loop() {
  int value = analogRead(POT_PIN);         // 0 to 4095
  float volts = value * 3.3 / 4095.0;      // back to volts
  Serial.print(value);
  Serial.print("  ->  ");
  Serial.print(volts);
  Serial.println(" V");
  delay(200);
}
```

**Try it:** open **Tools → Serial Plotter** in the Arduino IDE and turn the knob. You get a live graph of your hand movement.

## Using the number: `map()`

A raw number from 0 to 4095 is rarely what you want. `map()` scales a number from one range into another. Here the knob sets the brightness of an LED on D2, whose PWM goes from 0 to 255:

```c
const int POT_PIN = A0;
const int LED_PIN = D2;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int value = analogRead(POT_PIN);                 // 0 to 4095
  int brightness = map(value, 0, 4095, 0, 255);    // 0 to 255
  analogWrite(LED_PIN, brightness);
}
```

The same idea turns a reading into degrees, percent, or a servo angle: `map(value, 0, 4095, 0, 180)`.

## Never more than 3.3 V

An analog pin measures up to 3.3 V, and **more than 3.3 V can damage it**. Many sensors made for the Uno give out up to 5 V. To read them, bring the voltage down with a **voltage divider**: two resistors in series, with the pin connected between them.

![A 5 V sensor output goes through R1 = 10 kilo-ohm and R2 = 15 kilo-ohm to GND; the point between them goes to A0. 5 V times 15 divided by 25 is 3.0 V, safely below 3.3 V](assets/nano-esp32/analog-divider.svg)

The pin sees `V_OUT × R2 ÷ (R1 + R2)`. With 10 kΩ and 15 kΩ, 5 V becomes 3.0 V. In code, multiply back: `sensorVolts = volts * 25.0 / 15.0`.

## Noisy readings

Read the same pin twice and you'll often get two slightly different numbers, like 2031 and 2044. This **noise** is normal: the voltage itself wiggles a little, and so does the ADC. The easy fix is to **average** several readings:

```c
int readAverage(int pin) {
  long sum = 0;
  for (int i = 0; i < 16; i++) {
    sum += analogRead(pin);
  }
  return sum / 16;
}
```

Even then, don't expect the last few counts to be exact. The ESP32's ADC is also less accurate very close to 0 V and to 3.3 V, so design your circuit to stay in the middle of the range when you can.

## And analog output?

The Nano ESP32 **can't output a real analog voltage**. There is no DAC (Digital-to-Analog Converter) on its pins. `analogWrite()` is **PWM** on a digital pin: the pin still switches between 3.3 V and 0 V, very fast. For LEDs and motors that's all you need, because they feel the average. The Digital Pins item explains PWM.

## Summary

- **A0 – A7** read a voltage from **0 V to 3.3 V**. **A4 – A7** don't work while Wi‑Fi is on.
- `analogRead(pin)` gives **0 – 4095** (12 bits). `volts = value * 3.3 / 4095.0`, or use `analogReadMilliVolts(pin)`.
- `map()` turns the number into something useful.
- **Never more than 3.3 V** on a pin. Use a voltage divider for a 5 V signal.
- Average several readings to calm the noise.

## Challenge

**Light meter:** connect a light sensor (LDR) with a 10 kΩ resistor as a voltage divider to A0. Print the light level in percent (0 % dark, 100 % bright) and turn on an LED on D2 when it gets dark. Then make the LED brighter the darker it gets.
