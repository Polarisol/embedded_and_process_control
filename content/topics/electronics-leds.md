# LEDs

An **LED** (Light-Emitting Diode) is a tiny part that glows when current flows through it. It is usually the very first thing you connect to a development board, and it stays useful in every project after that: it tells you the board is on, that a message arrived, that a button was pressed, or that something went wrong.

## Why are LEDs everywhere?

Look around you: the power light on your charger, traffic lights, screen backlights, car headlights, the flash on your phone, and the infrared LED inside every TV remote. LEDs replaced almost every other kind of small light because they are:

- **Efficient.** An LED turns most of its energy into light, not heat. An LED bulb uses about a sixth of the power of an old filament bulb for the same light.
- **Long-lasting.** A good LED works for tens of thousands of hours. There is no thin wire inside to burn out.
- **Small and tough.** The glowing chip is smaller than a grain of sand, and there is no glass to break.
- **Fast.** An LED turns on and off in less than a millionth of a second. A TV remote uses this to send data by blinking an infrared LED, and your board uses it to dim an LED by blinking it faster than the eye can see.
- **Cheap and colourful.** They cost a few cents each and come in red, yellow, green, blue, white, infrared and ultraviolet.
- **Happy with low voltage.** About 2 to 3 V is enough, so a 3.3 V board can drive one straight from a pin.

## Meet the LED

An LED has two legs, and **it only works one way round**.

![A 5 mm LED with its long anode leg and short cathode leg, and the LED circuit symbol](assets/leds/anatomy.svg)

| Leg | Name | How to recognise it | Connect it to |
|-----|------|---------------------|---------------|
| **+** | Anode | The **long** leg | The side with the higher voltage (the board's pin, through the resistor) |
| **−** | Cathode | The **short** leg, next to the **flat edge** of the rim | GND |

If you put an LED in backwards, nothing breaks: it simply stays dark. Turn it around and try again. (If the legs were cut to the same length, look for the flat edge.)

## How does an LED make light?

The "D" in LED stands for **diode**. A diode is made of two layers of a **semiconductor** (usually a crystal based on gallium, a cousin of the silicon in computer chips):

- The **N side** has extra electrons that are free to move.
- The **P side** is missing electrons. Each missing electron leaves a gap called a **hole**.

The border between them is called the **junction**.

![Electrons from the N side cross the junction, fall into holes on the P side and give off light](assets/leds/inside.svg)

When you connect + to the P side and − to the N side, the voltage pushes electrons across the junction. On the other side each electron drops into a hole, and as it drops it gives away its extra energy as a tiny packet of light called a **photon**. Billions of these every second make the glow you see.

Connect it the other way and the electrons are pulled *away* from the junction, so no current flows and no light is made. That is why a diode is a one-way street for current.

### Why different colours need different voltages

The **colour** of the light depends on how big the energy "step" is when an electron drops into a hole. The step size is set by the material the LED is made of:

- A **small** step gives **red** (or infrared) light.
- A **bigger** step gives **green**.
- An even bigger step gives **blue**. White LEDs are blue LEDs with a yellow coating that turns part of the blue into other colours.

To push electrons up and over a bigger step, you need a bigger voltage. So every LED has its own **forward voltage** (written **V<sub>F</sub>**), the voltage it needs across its legs to light up:

| Colour | Typical forward voltage V<sub>F</sub> |
|--------|----------------------------------------|
| Red | 1.8 – 2.2 V (use **2.0 V**) |
| Yellow / orange | 2.0 – 2.2 V (use **2.1 V**) |
| Green (classic yellow-green) | 2.0 – 2.2 V |
| Green (bright "true" green) | 2.8 – 3.2 V |
| Blue and white | 2.8 – 3.3 V (use **3.0 V**) |

The exact value is in the LED's datasheet. If you don't have one, the table is a good guess.

## Why every LED needs a resistor

Here is the surprising part. An LED does not behave like a light bulb, where a bit more voltage gives a bit more current. Below its forward voltage, almost no current flows. Above it, **the current shoots up**:

![Voltage vs. current for a red LED: almost no current below 1.7 V, then a very steep rise](assets/leds/iv-curve.svg)

For a red LED, going from 2.0 V to 2.1 V can triple the current. If you connect the LED straight to a 3.3 V pin, the LED tries to pull a huge current. Two things can happen, and both are bad:

1. The **LED** overheats and dies, sometimes with a small pop.
2. The **pin** on your board is forced to deliver far more current than it is built for, and it can be damaged for good.

The fix is simple: put a **resistor** in series with the LED. The resistor takes up the "extra" voltage and limits the current to a safe value. We say an LED is **current-driven**: you don't choose its voltage, you choose its **current**, and the resistor is how you choose it.

> **Rule:** never connect an LED to a pin, a battery or a power supply without a resistor in series with it.

## Connecting an LED to the Arduino Nano ESP32

The **Arduino Nano ESP32** runs at **3.3 V**: when you write `digitalWrite(pin, HIGH)`, the pin gives out 3.3 V. Connect the pin to a resistor, the resistor to the LED's **long leg** (anode), and the LED's **short leg** (cathode) to **GND**:

![Pin D2 of the Arduino Nano ESP32, a 150 ohm resistor, a red LED, and back to GND](assets/leds/circuit.svg)

The resistor can be on either side of the LED (between the pin and the anode, or between the cathode and GND). The same current flows through everything in a single loop, so it works the same.

Then blink it:

```c
const int LED_PIN = D2;   // the Nano ESP32 pin labelled D2

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);   // 3.3 V on the pin: the LED is on
  delay(500);
  digitalWrite(LED_PIN, LOW);    // 0 V on the pin: the LED is off
  delay(500);
}
```

## Calculating the resistor

The 3.3 V from the pin is **shared** between the LED and the resistor. The LED takes its forward voltage, and the resistor takes whatever is left:

```text
V_resistor = V_supply − V_F
```

Now **Ohm's law** (V = I × R) gives the resistor value for the current you want:

```text
R = (V_supply − V_F) / I
```

| Symbol | Meaning | For us |
|--------|---------|--------|
| V<sub>supply</sub> | The voltage on the pin | **3.3 V** on the Nano ESP32 |
| V<sub>F</sub> | The LED's forward voltage | From the table above |
| I | The current you want, in **amps** | **10 mA = 0.010 A** is plenty for a clear, bright LED |

### Example: a red LED

```text
R = (3.3 V − 2.0 V) / 0.010 A
  = 1.3 V / 0.010 A
  = 130 Ω
```

Resistors only come in **standard values** (100, 120, 150, 180, 220, 270, 330 …). If the exact value isn't available, always **round up**: a bigger resistor means a little less current, which is always safe. So we use **150 Ω**, and the current is 1.3 V / 150 Ω ≈ **8.7 mA**.

### Typical values at 3.3 V and about 10 mA

| LED colour | V<sub>F</sub> | Calculated R | Use |
|------------|---------------|--------------|-----|
| Red | 2.0 V | 130 Ω | **150 Ω** |
| Yellow / classic green | 2.1 V | 120 Ω | **120 – 150 Ω** |
| Blue / white / true green | 3.0 V | 30 Ω | **33 – 47 Ω** |

A few things to notice:

- **220 Ω** works with red, yellow and classic green LEDs too. The current is lower (about 6 mA for red), and modern LEDs are still bright at that current. If your kit has a bag of 220 Ω resistors, that's fine.
- **Blue and white LEDs are a tight fit at 3.3 V.** They need almost all of it, leaving only about 0.3 V for the resistor. They will light up, but their brightness changes a lot from one LED to the next. With a 5 V board this problem goes away.
- **Stay well below the pin limit.** A Nano ESP32 pin can safely give a few tens of milliamps at most, and the whole chip has a total limit too. Around 10 mA per LED is a good habit. For anything that needs more current (an LED strip, a high-power LED), use a transistor, which we'll meet later.
- A normal ¼ W resistor is more than enough here: it only has to get rid of about 0.01 W.

## Two LEDs? Two resistors!

If you want to light several LEDs, it's tempting to save a resistor by connecting them in **parallel** (side by side) after one shared resistor. **Don't.**

![Left: two LEDs sharing one resistor, where only the red one lights. Right: each LED with its own resistor, where both light](assets/leds/parallel.svg)

LEDs in parallel all get **the same voltage**. Here is why that's a problem:

1. **Different colours:** the red LED starts conducting at about 2.0 V and holds the voltage there. The green one needs 3.0 V, so it never gets enough and **stays dark**, while the red LED takes all the current.
2. **Even the same colour:** two "identical" red LEDs are never exactly identical. One might start conducting at 1.95 V and the other at 2.00 V. Remember the steep curve: that tiny difference means one LED **hogs most of the current**. It glows brighter, gets warmer, and a warmer LED conducts even more easily, so it hogs even more.
3. **If one LED fails**, the full current you calculated for two LEDs rushes through the one that's left, and it can fail too.

The resistor only controls the **total** current. It has no way of sharing it fairly between the LEDs. The solution is to give **every LED its own resistor**, calculated for that LED's colour. Then each LED gets exactly the current you planned, and the colours don't matter.

What about connecting LEDs **in series** (one after the other) with one resistor? Then their forward voltages add up: two red LEDs need 2 × 2.0 = 4.0 V, which is more than the 3.3 V we have. On our board, the answer is simple: **one LED, one resistor, one pin**.

## Summary

- An LED is a **diode** that gives off light when electrons cross its junction. It conducts only one way: **long leg (anode) to the pin side, short leg (cathode) to GND**.
- The colour sets the **forward voltage**: about 2 V for red, about 3 V for blue and white.
- Above its forward voltage the current rises very steeply, so **every LED needs a series resistor** to limit the current.
- **R = (V<sub>supply</sub> − V<sub>F</sub>) / I.** On the 3.3 V Nano ESP32 with 10 mA: about **150 Ω** for red, about **33 Ω** for blue or white. Always round up.
- **Never** share one resistor between LEDs in parallel. Give each LED its own resistor.
