# Resistors

A **resistor** is the simplest and most common part in electronics. It does one thing: it **resists** the flow of current. That sounds like a waste, but it is exactly what you need to protect an LED, to hold a button pin at a known voltage, or to turn a voltage your board can't handle into one it can. Open any electronic device and you will find dozens, sometimes thousands, of them.

## Voltage, current and resistance

Think of electricity as water in a pipe:

| Electricity | Water | Unit |
|-------------|-------|------|
| **Voltage** (V) | The **pressure** that pushes the water | volt (**V**) |
| **Current** (I) | **How much** water flows each second | ampere (**A**), or milliampere (**mA**, a thousandth of an amp) |
| **Resistance** (R) | How **narrow** the pipe is | ohm (**Ω**), kiloohm (**kΩ** = 1 000 Ω), megaohm (**MΩ** = 1 000 000 Ω) |

More pressure pushes more water through. A narrower pipe lets less water through. The rule that connects the three is called **Ohm's law**:

![Ohm's law: V = I × R, with a triangle that shows how to find each of the three values](assets/resistors/ohms-law.svg)

```text
V = I × R        I = V / R        R = V / I
```

**Example:** a 1 kΩ resistor connected to 3.3 V lets through I = 3.3 V / 1000 Ω = 0.0033 A = **3.3 mA**.

> **Tip:** volts divided by **kΩ** gives **mA** directly. 3.3 V / 1 kΩ = 3.3 mA, and 5 V / 10 kΩ = 0.5 mA. No zeros to count.

## Meet the resistor

The resistors in your kit look like small beige or blue cylinders with a wire leg on each end and coloured stripes around the body.

![A through-hole resistor with its colour bands, and the two circuit symbols: a zigzag and a rectangle](assets/resistors/anatomy.svg)

- A resistor has **no polarity**: it works the same both ways round. Unlike an LED or a diode, you can't put it in backwards.
- In circuit diagrams it is drawn as a **zigzag** (the American style) or a **rectangle** (the European style). Both mean the same thing.
- The value is often written next to the symbol in a short form: **4k7** means 4.7 kΩ and **1M** means 1 MΩ. The letter takes the place of the decimal point, so it can't get lost when a diagram is printed small.

## Reading the colour code

The value is too long to print on such a small part, so it is painted on as **coloured bands**. On a common 4-band resistor:

![A 4-band resistor with red, red, brown and gold bands, read as 2, 2, times 10, plus or minus 5 percent = 220 ohm](assets/resistors/color-code.svg)

| Colour | Digit | Multiplier |
|--------|-------|------------|
| Black | 0 | × 1 |
| Brown | 1 | × 10 |
| Red | 2 | × 100 |
| Orange | 3 | × 1 000 (1 k) |
| Yellow | 4 | × 10 000 (10 k) |
| Green | 5 | × 100 000 (100 k) |
| Blue | 6 | × 1 000 000 (1 M) |
| Violet | 7 | |
| Grey | 8 | |
| White | 9 | |
| Gold | | × 0.1, or **±5 %** as the last band |
| Silver | | × 0.01, or **±10 %** as the last band |

How to read it:

1. Hold the resistor so the **gold or silver band is on the right**. That band is the **tolerance**: how far the real value may be from the printed one.
2. The **first two bands** are digits.
3. The **third band** is the multiplier: how many zeros to add.

| Bands | Digits | Multiplier | Value |
|-------|--------|------------|-------|
| red red brown gold | 2 2 | × 10 | **220 Ω** ±5 % |
| brown black red gold | 1 0 | × 100 | **1 kΩ** ±5 % |
| yellow violet red gold | 4 7 | × 100 | **4.7 kΩ** ±5 % |
| brown black orange gold | 1 0 | × 1 000 | **10 kΩ** ±5 % |

**5-band resistors** (usually blue bodies with a brown last band, ±1 %) work the same way, but with **three** digit bands before the multiplier. So brown black black brown brown is 1 0 0 × 10 = **1 kΩ** ±1 %.

> A memory trick for the order of the colours (black, brown, red, orange, yellow, green, blue, violet, grey, white): it follows the rainbow from red to violet, with black and brown at the start and grey and white at the end.

When the colours are hard to tell apart (and brown, red and orange often are), don't guess. **Measure** the resistor with a multimeter set to **Ω**: touch one probe to each leg, and don't hold both legs with your fingers, because your body is a resistor too.

## Standard values

Resistors are not made in every possible value. They come in a series of **standard values** that are spaced so that, with ±5 % tolerance, there are no gaps:

```text
10  12  15  18  22  27  33  39  47  56  68  82
```

and the same numbers times 10, 100, 1 000 and so on (100, 120, 150, … 1k, 1.2k, 1.5k, … 10k, 12k …). This is why the LEDs item says "round up to the next standard value". Values you'll meet again and again in this course: **150 Ω – 330 Ω** for LEDs, **10 kΩ** for pull-up and pull-down resistors, and **100 Ω** on a MOSFET gate.

## Power: how much heat can it take?

A resistor turns the energy it stops into **heat**. The power it has to get rid of is:

```text
P = V × I   =   I² × R   =   V² / R
```

Every resistor has a **power rating** in watts (W). The ones in your kit are **¼ W** (0.25 W). Stay below about **half** of the rating and the resistor stays cool.

**Example:** the 150 Ω resistor in front of a red LED has 1.3 V across it and 8.7 mA through it: P = 1.3 × 0.0087 ≈ **0.011 W**. That is about twenty times less than ¼ W, so no problem at all.

**Counter-example:** a 10 Ω resistor straight across a 5 V supply: P = 5² / 10 = **2.5 W**, ten times the rating. It gets hot enough to burn your finger, then smokes and dies. If your calculation gives more than about 0.1 W, stop and check your circuit.

## Series and parallel

You can combine resistors to get values you don't have:

![Two resistors in series add up; two resistors in parallel give less than the smaller one](assets/resistors/series-parallel.svg)

- **In series** (one after the other), the same current flows through both and the resistances **add up**: R = R1 + R2. Two 1 kΩ in series = **2 kΩ**.
- **In parallel** (side by side), the current splits between them and the total is **smaller than the smallest one**: R = (R1 × R2) / (R1 + R2). Two 1 kΩ in parallel = **500 Ω**. Two equal resistors in parallel always give half.

## The voltage divider

Put two resistors in series between a voltage and GND, and the point between them gives you a **fraction** of the voltage:

![A voltage divider: 5 V, a 10 kilohm resistor, the output point, a 20 kilohm resistor and GND, giving 3.33 V](assets/resistors/divider.svg)

```text
V_out = V_in × R2 / (R1 + R2)
```

With R1 = 10 kΩ and R2 = 20 kΩ, 5 V becomes 5 × 20 / 30 = **3.33 V**, which is safe for a 3.3 V pin of the Nano ESP32. This is how you read a 5 V sensor signal (see the Analog Pins item in the Microcontrollers unit). The same idea is inside every **potentiometer**, **LDR** and **thermistor** circuit in the Sensors unit: one of the two resistors changes, so the output voltage changes with it.

The divider only works for **signals**, where almost no current is drawn from the middle point. Don't use it to power a motor or a board from a higher voltage: as soon as the load draws current, the output voltage drops.

## Where you'll use resistors in this course

| Job | Typical value | Where |
|-----|---------------|-------|
| Limit the current through an LED | 150 – 330 Ω | LEDs |
| Pull-up or pull-down: hold an input pin at a known level when a button is open | 10 kΩ | Sensors: Buttons |
| Slow down the gate current of a MOSFET | 100 Ω | MOSFETs |
| Keep a MOSFET off while the board starts up (gate pull-down) | 10 kΩ | MOSFETs |
| Voltage divider for sensors and 5 V signals | 1 kΩ – 100 kΩ | Analog Pins, Sensors |
| RC filter for button debouncing | 10 kΩ with 1 µF | Sensors: Buttons, Capacitors |

## Summary

- A resistor **limits current**. It has **no polarity**.
- **Ohm's law: V = I × R.** Volts / kΩ = mA.
- Read the **colour code** with the gold band on the right: **digit, digit, multiplier, tolerance**. Red red brown = 220 Ω, brown black orange = 10 kΩ. When unsure, measure.
- Resistors come in **standard values** (10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82 × powers of ten).
- **P = V × I.** Kit resistors are ¼ W; stay well below it.
- **Series adds** up. **Parallel** gives less than the smallest.
- A **voltage divider** gives V<sub>in</sub> × R2 / (R1 + R2), for signals only.
