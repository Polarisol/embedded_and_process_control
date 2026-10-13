# MOSFETs

A pin on the Arduino Nano ESP32 gives out **3.3 V** and only a **few milliamps** safely. That is plenty for an LED, but a motor, a 12 V LED strip, a water pump or a heater needs a higher voltage and **amps**, not milliamps. Connect one of those to a pin and the pin is damaged.

A **MOSFET** solves this. It is an electronic switch with no moving parts: a tiny voltage from your pin opens it, and a big current from a separate power supply flows through it. Think of it as a tap on a thick water pipe: your pin turns the handle, and the water (the current) comes from the pipe, not from your hand.

## When do you need a MOSFET?

Use a MOSFET when the thing you want to switch:

- **needs more current than a pin can give.** As a rule, anything above about 10–20 mA: motors, LED strips, high-power LEDs, solenoid valves, relays, buzzers, heaters, pumps, fans.
- **needs a different voltage** than 3.3 V, for example 5 V, 12 V or 24 V from its own supply or battery.
- **should be dimmed or slowed down with PWM.** A MOSFET switches on and off thousands of times a second without wearing out, so it is perfect for controlling the brightness of an LED strip or the speed of a DC motor with `analogWrite()`.

| Switch | Good at | Not good at |
|--------|---------|-------------|
| **MOSFET** | DC loads, from milliamps to many amps. Fast (PWM), silent, never wears out, needs almost no current from the pin | Mains AC (230 V / 110 V) |
| **Relay** | Mains AC, and completely separating two circuits | Slow, clicks, wears out, can't do PWM, its coil itself needs a transistor to drive it |
| **BJT transistor** (e.g. 2N2222) | Small loads up to a few hundred mA | Needs a constant base current from the pin, and gets warm at higher currents |

## The load

The device that the MOSFET switches on and off (the motor, the LED strip, the pump) is called **the load**. It is the part that actually uses the power. The MOSFET doesn't use the power, it only decides whether the load gets it.

The load has **two wires**, and every circuit in this item uses the same idea: one wire of the load goes to the **+** of the power supply, and the other goes to the MOSFET.

## Meet the MOSFET

A MOSFET has three legs:

![A MOSFET in a TO-220 package with its gate, drain and source legs, and the N-channel MOSFET circuit symbol](assets/mosfets/parts.svg)

| Leg | Name | Its job | In our circuit it connects to |
|-----|------|---------|-------------------------------|
| **G** | Gate | The control input, the "handle of the tap" | The board's pin (through a small resistor) |
| **D** | Drain | Where the load current comes **in** | The load's second wire |
| **S** | Source | Where the load current goes **out** | GND |

There are two families: **N-channel** and **P-channel**. In this item we use **N-channel** MOSFETs, which are the most common, the cheapest, and the easiest to drive from a microcontroller. The leg order is not the same on every MOSFET, so **always check the datasheet's pin drawing** before you wire it.

## How does a MOSFET work?

MOSFET stands for **M**etal-**O**xide-**S**emiconductor **F**ield-**E**ffect **T**ransistor. The name describes the inside:

![Inside an N-channel MOSFET: with 0 V on the gate there is no channel; with a positive gate voltage a channel of electrons joins source and drain](assets/mosfets/inside.svg)

- The source and the drain are two islands of **N-type** silicon (with free electrons) sitting in a block of **P-type** silicon. Between the islands there is no path for electrons, so the MOSFET is **off**.
- The gate is a metal plate that sits on top of a **very thin layer of glass-like insulator** (the "oxide"). The gate does **not touch** the silicon at all.
- When you put a **positive voltage** on the gate, its electric field (that's the "field effect") pulls electrons up to the surface right under it. They form a thin **channel** that joins the source and the drain. Now current can flow: the MOSFET is **on**.
- The higher the gate voltage, the thicker the channel and the more easily current flows.

Two important things follow from this:

1. **The gate takes almost no current.** It is insulated, so it behaves like a tiny capacitor. Your pin only has to charge it once when switching on and empty it when switching off. After that, holding the MOSFET on costs the pin nothing.
2. **The gate is controlled by the voltage between the gate and the source**, not between the gate and ground. This voltage is called **V<sub>GS</sub>**, and it is the key to the next two sections.

A small extra: every MOSFET also has a built-in **body diode** from the source to the drain (you can see it in the symbol). It only matters in special circuits; just remember it's there, and that it means a MOSFET can only block current in one direction.

## Connecting a MOSFET: the low-side switch

This is the circuit you will use almost every time:

![The low-side switch: +12 V to the load, the load to the drain, the source to GND, and the gate driven from pin D5 through 100 ohm with a 10 kilohm pull-down](assets/mosfets/low-side.svg)

Every part has a job:

| Part | Where | Why |
|------|-------|-----|
| **The load** | Between the supply's **+** and the **drain** | The MOSFET switches the load's connection to GND |
| **Source** | Straight to **GND** | So that V<sub>GS</sub> is simply the pin voltage (see the next section) |
| **100 Ω gate resistor** | Between the pin and the gate | Limits the short burst of current that charges the gate each time it switches, which protects the pin. Anything from 47 to 220 Ω is fine |
| **10 kΩ pull-down** | Between the gate and GND | Keeps the MOSFET **off** while the board is starting up or being programmed, when the pin isn't driving anything yet. Without it the gate "floats" and the load may switch on by itself |
| **Common GND** | The board's GND joined to the supply's **−** | The gate voltage is measured from the source, so both circuits need the same reference. Without this wire nothing works |

It is called a **low-side** switch because the MOSFET sits on the low (GND) side of the load.

> **Motors, relays, solenoid valves and pumps need a diode too.** These loads contain a coil. When the MOSFET switches off, the coil produces a short, high voltage spike that can destroy the MOSFET. Put a diode (1N4007, or better a fast 1N5819) **across the load**, with its **stripe (cathode) towards the +** of the supply. It does nothing while the load runs, and gives the spike a safe path when it switches off. LED strips and heaters don't need it.

### The code

Switching the load is just `digitalWrite()`:

```c
const int MOSFET_PIN = D5;   // the pin that drives the gate

void setup() {
  pinMode(MOSFET_PIN, OUTPUT);
  digitalWrite(MOSFET_PIN, LOW);    // start with the load off
}

void loop() {
  digitalWrite(MOSFET_PIN, HIGH);   // V_GS = 3.3 V: the load is on
  delay(2000);
  digitalWrite(MOSFET_PIN, LOW);    // V_GS = 0 V: the load is off
  delay(2000);
}
```

And for brightness or speed, use PWM with `analogWrite()` (0 = off, 255 = fully on):

```c
const int MOSFET_PIN = D5;

void setup() {
  pinMode(MOSFET_PIN, OUTPUT);
}

void loop() {
  for (int duty = 0; duty <= 255; duty++) {   // slowly brighter / faster
    analogWrite(MOSFET_PIN, duty);
    delay(10);
  }
  for (int duty = 255; duty >= 0; duty--) {   // slowly dimmer / slower
    analogWrite(MOSFET_PIN, duty);
    delay(10);
  }
}
```

## Why the load goes on the drain, never on the source

It is tempting to wire it the other way: + to the drain, and the load between the source and GND. It looks the same, the MOSFET is still "in the loop". **It doesn't work**, and here is why:

![Left: the load on the drain side, the source is at 0 V and the MOSFET is fully on. Right: the load on the source side, the source rises to about 1.5 V and the MOSFET is barely on](assets/mosfets/load-placement.svg)

Remember: the MOSFET only reacts to **V<sub>GS</sub> = V<sub>gate</sub> − V<sub>source</sub>**.

- **Load on the drain side (correct).** The source is tied to GND, so it is always at 0 V. When the pin is HIGH, V<sub>GS</sub> = 3.3 − 0 = **3.3 V**, the MOSFET is fully on, and the load gets almost the whole 12 V.
- **Load on the source side (wrong).** Now the source is connected to the top of the load. As soon as current starts to flow, there is a voltage across the load, so the **source voltage rises**. That makes V<sub>GS</sub> smaller, which turns the MOSFET down. It settles at the point where V<sub>GS</sub> is just a little above the threshold (next section). The source, and so the load, can never get higher than about **3.3 V − V<sub>GS(th)</sub>**, which is around 1.5 V out of your 12 V. The load barely runs, and the MOSFET has the other 10.5 V across it while current flows through it, so it turns that into **heat**.

In other words: with the load on the source, the load "steals" the gate's voltage. This circuit has a name, a **source follower**, because the source just follows the gate voltage (minus the threshold). It has its uses, but switching a load is not one of them.

> **Rule (N-channel MOSFET):** **+** → **load** → **drain**. **Source** → **GND**. The gate voltage is then measured against a fixed 0 V, and 3.3 V from the pin is all of it.

If you ever need to switch the **+** side of a load instead (for example when the load's other wire must stay connected to GND), that is a **high-side** switch, and it needs a P-channel MOSFET or a special driver. That's a topic for later.

## V<sub>GS</sub> threshold and "logic level"

### The threshold voltage V<sub>GS(th)</sub>

The **gate threshold voltage**, **V<sub>GS(th)</sub>**, is the gate-to-source voltage at which the MOSFET **only just starts** to conduct. The datasheet measures it at a tiny current, usually just 250 µA. So:

> **V<sub>GS(th)</sub> is where the MOSFET starts to turn on, not where it is fully on.** A MOSFET at its threshold is like a tap opened by a hair.

To be **fully on**, a MOSFET needs a gate voltage well above its threshold. Between "starting" and "fully on", the MOSFET is half open: it lets current through but has a lot of voltage across it, and it heats up.

![How fully on two MOSFETs are as the gate voltage rises: a logic-level MOSFET is fully on well before 3.3 V, a standard MOSFET barely starts at 3.3 V](assets/mosfets/vgs.svg)

Also notice that the threshold is never one number. The datasheet gives a **range** (min–max), because every MOSFET that comes off the production line is a little different. The IRF520, for example, has a threshold anywhere from 2 V to 4 V, so with 3.3 V on its gate some IRF520s turn on a bit and others don't turn on at all.

### What "logic level" means

Most "standard" power MOSFETs are designed to be driven with **10 V** on the gate. A **logic-level MOSFET** is designed to be fully on with the voltage that comes straight from a logic pin. You can often spot them by an **L** in the name (IRLZ44N, IRLB8721, FQP30N06L).

But be careful: "logic level" was invented when logic meant **5 V**. Most logic-level MOSFETs are fully on at 4.5 V or 5 V, which is great for an Arduino Uno but **not enough to be sure** for our 3.3 V Nano ESP32.

The reliable test is not the name but the datasheet: **find the R<sub>DS(on)</sub> line (next section) and check which V<sub>GS</sub> it is given for.**

| MOSFET | R<sub>DS(on)</sub> given at | On a 3.3 V board |
|--------|-----------------------------|------------------|
| IRF520, IRF540N (the purple "MOSFET modules" in many kits use IRF520) | 10 V only | ✗ Barely on, or not at all. Don't use it straight from a 3.3 V pin |
| IRLZ44N | 10 V, 5 V and 4 V | ⚠ Turns on, but not fully. OK for small currents (up to about 1 A). Above that, check how hot it gets |
| AO3400A, IRLML2502 (small SOT-23 parts, need a breakout board for a breadboard) | down to **2.5 V** | ✓ Fully on at 3.3 V, up to a few amps |

> **For the Nano ESP32, look for a MOSFET whose R<sub>DS(on)</sub> is specified at V<sub>GS</sub> = 2.5 V (or at least 3.3 V or lower).** If the lowest V<sub>GS</sub> in the table is 4.5 V or 10 V, it was not designed for 3.3 V.

## Reading the datasheet: the important numbers

A MOSFET datasheet has pages of numbers. These are the ones that matter for switching a load:

| Value | What it means | When to look at it | What to look for |
|-------|---------------|--------------------|------------------|
| **V<sub>DS</sub>** (max drain-source voltage) | The highest voltage the MOSFET can block while it is off. Above it, it breaks down | Always | At least **2× your supply voltage**: 30 V or more for a 12 V supply. Motors and coils make spikes, so leave room |
| **I<sub>D</sub>** (continuous drain current) | The most current it can carry. Measured under perfect conditions: a huge heatsink at 25 °C | Always, as a first filter | At least **2–3× the load's current**. In real life heat (R<sub>DS(on)</sub>, below) usually limits you first |
| **R<sub>DS(on)</sub>** (on-resistance) | The resistance between drain and source when the MOSFET is on. Low is good | Always, and it's the most important number | Read the line for the V<sub>GS</sub> **you** will use (≤ 3.3 V for us). Tens of milliohms (mΩ) or less. Then calculate the heat: **P = I² × R<sub>DS(on)</sub>** |
| **V<sub>GS(th)</sub>** (gate threshold voltage) | Where it only just starts to conduct. Given as a min–max range | When choosing a MOSFET for a 3.3 V board | The **max** value should be far below 3.3 V, about **1.5 V or less**. But the real check is R<sub>DS(on)</sub> at your V<sub>GS</sub> |
| **V<sub>GS</sub> max** (max gate-source voltage) | The most voltage the gate can take before its thin insulator is punched through | When the gate is driven from more than a logic pin | Usually ±20 V, but only ±8 or ±12 V for many small logic-level parts. 3.3 V is always safe |
| **R<sub>θJA</sub>** (thermal resistance, junction to air) and **P<sub>D</sub>** | How hot the MOSFET gets per watt of heat, when there is no heatsink | When P = I² × R<sub>DS(on)</sub> is more than about 0.1 W | **Temperature rise = P × R<sub>θJA</sub>.** Keep it under about 50 °C. A TO-220 without heatsink is about 62 °C/W, a tiny SOT-23 about 100–125 °C/W |
| **Q<sub>g</sub>** (total gate charge) | How much charge the pin must pump into the gate to switch it. More charge = slower switching | When you use fast PWM | At Arduino's normal PWM (around 1 kHz) almost anything works. For PWM above about 20 kHz, look for a few nC up to about 20 nC, or use a gate driver |
| **Package and pinout** | The shape and the leg order | Before wiring | TO-220 fits a breadboard directly. SOT-23 needs a small breakout board. Check the G/D/S order in the pin drawing |

### Example: a 12 V, 2 A LED strip on the Nano ESP32

Let's check the AO3400A (numbers from its datasheet):

| Check | AO3400A | Verdict |
|-------|---------|---------|
| V<sub>DS</sub> ≥ 2 × 12 V = 24 V | 30 V | ✓ |
| I<sub>D</sub> ≥ 2–3 × 2 A | 5.7 A | ✓ |
| V<sub>GS(th)</sub> max well below 3.3 V | 1.45 V | ✓ |
| R<sub>DS(on)</sub> specified at ≤ 3.3 V | below 48 mΩ at V<sub>GS</sub> = 2.5 V | ✓ |

Heat, using the worst-case R<sub>DS(on)</sub>:

```text
P = I² × R_DS(on)
  = (2 A)² × 0.048 Ω
  ≈ 0.19 W

Temperature rise = P × R_θJA
                 ≈ 0.19 W × 125 °C/W
                 ≈ 24 °C   → warm, but fine
```

Now the same strip with an **IRF520 module**: at V<sub>GS</sub> = 3.3 V it is somewhere between off and half on. Even if it conducts with, say, 1 Ω, that is (2 A)² × 1 Ω = **4 W**, enough to make a TO-220 without a heatsink far too hot to touch, and the strip would be dim anyway. Wrong part for a 3.3 V board.

## Summary

- A **MOSFET** is a voltage-controlled switch. A small voltage on the **gate** lets a big current flow from the **drain** to the **source**. The gate takes almost no current.
- The device being switched is called **the load**.
- Use the **low-side switch**: **+ → load → drain**, **source → GND**, the pin to the gate through **100 Ω**, a **10 kΩ pull-down** from gate to GND, and a **common GND**.
- **Never put the load between the source and GND.** The MOSFET responds to **V<sub>GS</sub>**; a load on the source raises the source voltage, steals the gate voltage, and the MOSFET stays half on and hot.
- Motors, relays, valves and pumps need a **diode across the load**, stripe to **+**.
- **V<sub>GS(th)</sub>** is where the MOSFET **starts** to conduct, not where it is fully on.
- **"Logic level"** usually means fully on at 5 V. For the 3.3 V Nano ESP32, choose a MOSFET with **R<sub>DS(on)</sub> specified at V<sub>GS</sub> = 2.5 V**.
- In the datasheet, check **V<sub>DS</sub>**, **I<sub>D</sub>**, **R<sub>DS(on)</sub> at your V<sub>GS</sub>**, **V<sub>GS(th)</sub>**, and calculate the heat with **P = I² × R<sub>DS(on)</sub>**.
