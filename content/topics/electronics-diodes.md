# Diodes

A **diode** is a one-way valve for current. Current flows through it in one direction, and is blocked in the other. You have already met one: an **LED** is a diode that also gives off light. Ordinary diodes don't glow, but they do jobs that keep your circuits safe: they stop a battery connected backwards from destroying your board, and they catch the voltage spike a motor makes when it switches off.

## Meet the diode

![A 1N4007 diode: a black body with a silver stripe at the cathode end, next to the diode circuit symbol, where the bar matches the stripe](assets/diodes/anatomy.svg)

| Leg | Name | How to recognise it |
|-----|------|---------------------|
| **+** | **Anode** | The end **without** the stripe |
| **−** | **Cathode** | The end with the **stripe** (silver on a black diode, black on a glass one) |

In the circuit symbol, the **triangle** points the way current is allowed to flow, and the **bar** is the cathode. The bar on the symbol and the stripe on the part are the same thing, so they are easy to match.

## Forward and reverse

![Left: the diode points from + to the lamp and the lamp lights (forward). Right: the diode is turned around and the lamp stays dark (reverse)](assets/diodes/bias.svg)

- **Forward:** the anode is at a higher voltage than the cathode. The diode **conducts**, like a closed switch.
- **Reverse:** the cathode is at a higher voltage than the anode. The diode **blocks**, like an open switch. Only a tiny leakage current flows, too small to matter.

How does it work? Just like the LED: a diode is a **P** layer and an **N** layer of semiconductor (here, silicon). Connected forward, the voltage pushes electrons across the junction between them. Connected backwards, it pulls them away from the junction and nothing flows. The difference is that in silicon, the energy an electron gives up when it crosses turns into a little heat instead of light.

## The forward voltage

A diode is not a perfect switch. To push current through it, you "pay" a small, almost fixed voltage, the **forward voltage** V<sub>F</sub>:

![Voltage vs. current for a Schottky diode (about 0.3 V), a silicon diode (about 0.7 V) and a red LED (about 2 V)](assets/diodes/iv-curve.svg)

| Diode | V<sub>F</sub> | Notes |
|-------|---------------|-------|
| **Schottky** (1N5819) | **≈ 0.3 V** | Loses less voltage and switches very fast |
| **Silicon** (1N4148, 1N4007) | **≈ 0.7 V** | The "standard" diode |
| **Red LED** | ≈ 2.0 V | For comparison, from the LEDs item |

The curve has the same steep shape as the LED's. Once the diode is conducting, its voltage stays close to V<sub>F</sub> whatever the current. So if a 5 V supply feeds a circuit through a silicon diode, the circuit gets about 5 − 0.7 = **4.3 V**.

A diode also has two limits from its datasheet:

- **Maximum forward current**, I<sub>F</sub>: how much current it can carry. 1N4148: 0.2 A, 1N4007: 1 A, 1N5819: 1 A.
- **Maximum reverse voltage**, V<sub>R</sub>: how much it can block before it breaks down. 1N4148: 75 V, 1N4007: 1000 V, 1N5819: 40 V.

## Common diodes

| Diode | What it's for |
|-------|---------------|
| **1N4148** (small, glass, orange) | Signals: fast and small, up to 200 mA |
| **1N4001 – 1N4007** (black, silver stripe) | Power: rectifiers and protection, up to 1 A. The 1N4007 handles the highest voltage and costs the same, so it's the one to keep in your drawer |
| **1N5819** (Schottky) | Power with a low voltage drop and fast switching: the best choice across a motor |
| **Zener** (e.g. BZX55C5V1) | Used **backwards** on purpose: it breaks down at an exact voltage (here 5.1 V) and holds it there. Used as a simple voltage reference or for overvoltage protection |
| **LED** | Light, as you know |
| **Photodiode** | The opposite of an LED: light that hits it makes a tiny current. Inside TV remote receivers and light sensors |

## Job 1: protection from reverse polarity

Batteries and power plugs get connected backwards. It happens to everyone, and many chips die instantly when it does. One diode in series with the + wire prevents it:

![A battery feeds the circuit through a diode. Connected the right way, current flows; connected backwards, the diode blocks and the circuit is safe](assets/diodes/reverse-protection.svg)

- Battery the right way round: the diode conducts, and the circuit works (with 0.3 – 0.7 V less).
- Battery backwards: the diode blocks, and nothing happens. Turn the battery around and everything works.

A Schottky diode (1N5819) is the better choice here, because it wastes less of your battery's voltage.

## Job 2: the flyback diode across a motor

Motors, relays, solenoid valves and pumps are built around **coils** of wire. A coil hates sudden changes in current. When the MOSFET that drives it switches off, the coil tries to keep the current flowing and makes a **voltage spike** of tens or even hundreds of volts, which can destroy the MOSFET.

The cure is a diode **across the coil**, with its **stripe towards the +** of the supply:

![A motor between +6 V and the MOSFET, with a diode across the motor, stripe to +. While on, current flows through the motor; at switch-off, the motor current loops back through the diode](assets/diodes/flyback.svg)

- While the MOSFET is **on**, the diode is reversed and does nothing.
- The moment the MOSFET switches **off**, the coil's current has a safe path: around the loop through the diode, where it fades away in a fraction of a second. No spike reaches the MOSFET.

This diode is called a **flyback diode** (also "freewheeling" or "snubber" diode). You'll see it in the MOSFETs item and in every DC motor circuit in the Motors unit. Use a **1N5819** (fast) or a **1N4007**.

> **The most common mistake:** putting the flyback diode the other way round. Then it shorts the supply the moment the MOSFET switches on: the diode gets hot and the supply or the MOSFET can be damaged. **Stripe to +.**

## Job 3: turning AC into DC

The wall socket gives **AC**, where the voltage swings between + and − fifty times a second. Electronics need **DC**. A diode lets only the positive half through, and **four** diodes arranged in a square, called a **bridge rectifier**, flip the negative half up too. Add a capacitor to smooth the bumps (see the Capacitors item) and you have the heart of every phone charger and power adapter. You won't build one in this course (mains voltage is dangerous), but now you know what's inside the box.

## Testing a diode

Most multimeters have a **diode test** mode, marked with the diode symbol:

- Red probe on the **anode**, black on the **cathode** (stripe): the meter shows the forward voltage, about **0.5 – 0.7** for silicon, or about **0.2 – 0.3** for Schottky.
- Swap the probes: the meter shows **OL** (open line), because the diode blocks.
- **OL** both ways means the diode is broken open. **Close to 0** both ways means it's shorted. Either way, throw it out.

The same mode lights up an LED dimly, which is a quick way to find which leg is which.

## Summary

- A diode lets current flow **one way only**: from **anode** to **cathode**. The **stripe** marks the cathode, the same as the bar in the symbol.
- When it conducts, it drops an almost fixed **forward voltage**: about **0.7 V** for silicon, **0.3 V** for Schottky.
- **1N4148** for signals, **1N4007** for power, **1N5819** (Schottky) for low loss and motors.
- In series with the supply, a diode **protects against reverse polarity**.
- Across a motor, relay or valve, a **flyback diode** with its **stripe to +** protects the MOSFET from the switch-off spike.
- Four diodes make a **bridge rectifier** that turns AC into DC.
