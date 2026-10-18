# Capacitors

A **capacitor** stores electric charge, a little like a tiny, very fast rechargeable battery. It fills up when you put a voltage on it and gives the charge back when the voltage drops. That makes it the part you reach for whenever a voltage needs to be **steadied**: next to every chip to keep its supply clean, on a motor's power wires, and on a button to smooth out its bouncing.

## What is inside?

![Two metal plates separated by an insulator. Connected to a battery, one plate fills with + charge and the other with − charge](assets/capacitors/inside.svg)

A capacitor is two metal **plates** with a thin **insulator** (called the **dielectric**) between them. No current can cross the insulator. But when you connect a voltage, electrons pile up on one plate and leave the other, so the plates become charged, + on one side and − on the other. Disconnect the battery and the charge stays there, waiting.

A good picture is a **bucket of water**:

- The **capacitance** is the size of the bucket: how much charge it holds for each volt.
- The **voltage** across the capacitor is the water level. It can't jump: it only rises as the bucket fills and falls as it empties.

That last point is the key to everything a capacitor does. **The voltage on a capacitor can't change instantly.**

## Units

Capacitance is measured in **farads** (F). One farad is huge, so real capacitors are measured in much smaller units:

| Unit | Name | In farads | Typical use |
|------|------|-----------|-------------|
| **pF** | picofarad | 0.000 000 000 001 F | Radio and crystal circuits |
| **nF** | nanofarad | 0.000 000 001 F (1 000 pF) | Filtering, timing |
| **µF** | microfarad | 0.000 001 F (1 000 nF) | Power supplies, motors, timing |

You'll often see **100 nF** written as **0.1 µF**. They are the same.

## Meet the capacitors

![A ceramic disc capacitor marked 104, an electrolytic capacitor with its long + leg and the − stripe, and the two circuit symbols](assets/capacitors/types.svg)

| Type | Looks like | Values | Polarity |
|------|------------|--------|----------|
| **Ceramic** | A small yellow, orange or blue drop or disc | 10 pF – 10 µF | **None**: any way round |
| **Electrolytic** | A metal can in a plastic sleeve | 1 µF – 10 000 µF | **Yes!** The **−** leg is marked |
| **Film** | A box, often yellow or red | 1 nF – 10 µF | None |

### Reading a ceramic capacitor

Ceramic capacitors are too small for the full value, so they carry a **3-digit code** in **picofarads**: two digits, then the number of zeros.

| Code | Means | Value |
|------|-------|-------|
| **104** | 10 and 4 zeros = 100 000 pF | **100 nF** = 0.1 µF |
| **103** | 10 and 3 zeros = 10 000 pF | **10 nF** |
| **105** | 10 and 5 zeros = 1 000 000 pF | **1 µF** |
| **222** | 22 and 2 zeros = 2 200 pF | **2.2 nF** |
| **22** | no third digit: just 22 pF | **22 pF** |

**104** is by far the one you'll see most.

### Reading an electrolytic capacitor

Electrolytics are big enough to print the value in plain text, for example **100 µF 25 V**. Two things matter:

1. **Polarity.** The **−** leg is the **short** one, and there's a **stripe of − signs** down that side of the sleeve. The **−** goes to GND, or to the lower voltage.
2. **Voltage rating.** The highest voltage the capacitor may ever see. Choose one with room to spare: for a 12 V circuit, use 16 V or 25 V, not 12 V.

> **Warning:** an electrolytic capacitor connected **backwards**, or to more than its rated voltage, heats up and can **burst** with a bang, spraying its contents. The top has a stamped cross so it opens there and not in your face, but always wear safety glasses with electrolytics, and check the stripe twice before you power up.

## Charging and discharging

Connect a capacitor to a voltage through a resistor, and it doesn't fill up at once. It fills **quickly at first**, then more and more slowly as it gets near the full voltage:

![The capacitor voltage rises along a curve: 63 percent after one time constant RC, 95 percent after three and almost full after five; then it discharges along the mirror curve](assets/capacitors/rc-curve.svg)

Why? At the start the capacitor is empty, so the whole supply voltage is across the resistor and a big current flows in. As the capacitor fills, its own voltage rises, less is left across the resistor, and the current gets smaller. Emptying it works the same way, in reverse.

How long it takes depends on the resistor (a narrower pipe fills the bucket more slowly) and on the capacitor (a bigger bucket takes longer). Multiply them and you get the **time constant**, written with the Greek letter τ (tau):

```text
τ = R × C        (ohms × farads = seconds)
```

| Time | Charged to |
|------|------------|
| 1 τ | 63 % |
| 3 τ | 95 % |
| 5 τ | > 99 %: "full" |

**Example:** 10 kΩ and 100 µF: τ = 10 000 × 0.000 1 = **1 second**. The capacitor is practically full after 5 seconds.

**Shortcut:** kΩ × µF = milliseconds. 10 kΩ × 1 µF = 10 ms (that's the button debounce filter from the Sensors unit), and 10 kΩ × 100 µF = 1 000 ms.

## Try it: watch a capacitor charge

You can see the curve for yourself with the Nano ESP32. You need a **10 kΩ** resistor and a **100 µF** electrolytic capacitor.

![D2 drives a 10 kilohm resistor into a 100 microfarad capacitor to GND; A0 measures the voltage on the capacitor](assets/capacitors/rc-experiment.svg)

- **D2** → 10 kΩ resistor → the capacitor's **+** (long leg).
- The capacitor's **−** (stripe, short leg) → **GND**.
- **A0** → the capacitor's **+**, to measure its voltage.

```c
const int CHARGE_PIN = D2;   // charges and discharges the capacitor through 10 kΩ
const int MEASURE_PIN = A0;  // reads the voltage on the capacitor

void setup() {
  Serial.begin(115200);
  pinMode(CHARGE_PIN, OUTPUT);
}

void measureFor(unsigned long ms) {
  unsigned long start = millis();
  while (millis() - start < ms) {
    Serial.println(analogReadMilliVolts(MEASURE_PIN));  // in millivolts
    delay(50);
  }
}

void loop() {
  digitalWrite(CHARGE_PIN, HIGH);   // 3.3 V: the capacitor charges
  measureFor(5000);                 // 5 seconds = 5 τ
  digitalWrite(CHARGE_PIN, LOW);    // 0 V: the capacitor discharges
  measureFor(5000);
}
```

Open **Tools → Serial Plotter**. You'll see the same curve as in the picture, climbing to 3300 mV and falling back to 0. Then try a 4.7 kΩ resistor instead: the curve gets about twice as steep.

## Job 1: decoupling, a 100 nF next to every chip

When a chip switches, it suddenly needs a burst of current for a few billionths of a second. The long wires from the power supply can't deliver it that fast, so the chip's supply voltage dips for a moment, and the chip can misbehave or reset.

A **100 nF ceramic** capacitor placed **as close as possible** to the chip's power pins, between + and GND, is a small reservoir right where it's needed. It hands out the quick bursts and refills between them. Look at any circuit board, including your Nano ESP32, and you'll find tiny capacitors next to every chip. These are called **decoupling** (or **bypass**) capacitors.

![A chip with a 100 nanofarad capacitor right at its power pins, and a 470 microfarad capacitor where a motor's supply comes in](assets/capacitors/decoupling.svg)

## Job 2: a bulk capacitor on motor power

Motors are much worse: when one starts, it pulls a big current, and the supply voltage can drop enough to reset your board. A **large electrolytic** (100 – 1000 µF) across the motor's supply, where the wires come in, helps hold the voltage up during those moments. Mind the polarity and the voltage rating. Many motor drivers ask for one in their datasheet.

## Job 3: smoothing and filtering

Because its voltage can't change quickly, a capacitor **smooths** a signal:

- After a **bridge rectifier** (see the Diodes item), a big capacitor fills up on every peak and fills in the dips between them, turning bumpy DC into nearly flat DC.
- With a resistor, it forms an **RC filter** that lets slow changes through and blocks fast ones. That's how the button debounce circuit in the Sensors unit works: the button's bounces are too short to fill the capacitor, so the pin never sees them.

## Capacitors in series and parallel

The rules are the **opposite** of resistors:

- **In parallel**, capacitances **add up**: 100 µF + 100 µF = 200 µF. It's like putting two buckets side by side.
- **In series**, the total is **smaller** than the smallest one: two 100 µF in series = 50 µF.

## Summary

- A capacitor is two **plates** with an **insulator** between them. It **stores charge**, and **its voltage can't change instantly**.
- Units: **pF, nF, µF**. A ceramic marked **104** is **100 nF**.
- **Ceramic** and **film** capacitors have no polarity. **Electrolytic** capacitors do: the **stripe and the short leg are −**. Backwards or over-voltage, they can burst.
- Through a resistor, it charges along a curve with **time constant τ = R × C**: 63 % after 1 τ, practically full after 5 τ. kΩ × µF = ms.
- **100 nF next to every chip** (decoupling), a **big electrolytic on motor power**, and **RC filters** to smooth signals.
- In **parallel**, capacitances add up; in **series**, they get smaller.
