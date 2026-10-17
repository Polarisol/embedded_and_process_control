# The stepper motor

A **stepper motor** doesn't spin smoothly. It moves in **small, exact steps**, and stops dead after each one. Tell it "200 steps" and it moves exactly 200 steps. Count the steps and you know exactly where it is, without any sensor. That's why steppers move the print head of a 3D printer, the lens in a camera and the scanner in a photocopier.

The stepper you'll find in most beginner kits is the **28BYJ-48**, which comes with a small **ULN2003** driver board.

## How it works

Inside, a magnet (the **rotor**) sits in the middle of several **coils**. Switch on one coil and the magnet turns to face it. Switch that coil off and the next one on, and the magnet turns again, by one step:

![Four snapshots: coil A on, then B, then C, then D; each time the magnet in the middle turns to face the coil that is on](assets/motors/stepper-inside.svg)

- Switch the coils on **in order** (A, B, C, D, A, …) and the motor turns one way.
- Switch them in the **opposite order** and it turns the other way.
- Switch them **faster** and it turns faster.
- **Stop switching** and the motor stops and holds its position.

A real stepper has more "teeth" than our drawing, so its steps are much smaller. The 28BYJ-48 also has a gearbox inside: it needs about **2048 steps for one full turn** of its shaft. That's less than 0.2° per step.

## Connecting a stepper to the Arduino Nano ESP32

The coils need far more current than a pin can give, so the four pins go to the **ULN2003** driver, which switches the coils for us. The motor plugs into the white socket on the driver board (it only fits one way):

![D2 to D5 of the Nano ESP32 go to IN1 to IN4 of the ULN2003 board; VBUS goes to + and GND to −; the motor plugs into the board](assets/motors/stepper-wiring.svg)

| ULN2003 board | Connect to |
|---------------|------------|
| **IN1, IN2, IN3, IN4** | Nano **D2, D3, D4, D5** |
| **+** | Nano **VBUS** (5 V) |
| **−** | Nano **GND** |

The four small LEDs on the driver board show which coil is on. When the motor runs slowly, you can watch them light up in turn.

> **Good to know:** a stepper uses current even when it is standing still, because a coil stays on to hold its position. The 28BYJ-48 gets warm, and that's normal. Bigger steppers (like the NEMA 17 in 3D printers) need their own power supply and a different driver, such as the A4988.

## The code

The **Stepper** library comes with the Arduino IDE, so there is nothing to install:

```c
#include <Stepper.h>

const int STEPS_PER_TURN = 2048;   // for the 28BYJ-48

// Watch the order: IN1, IN3, IN2, IN4. This is what the 28BYJ-48 needs.
Stepper motor(STEPS_PER_TURN, D2, D4, D3, D5);

void setup() {
  motor.setSpeed(10);   // in turns per minute (rpm); 28BYJ-48: up to about 15
}

void loop() {
  motor.step(STEPS_PER_TURN);        // one full turn one way
  delay(1000);
  motor.step(-STEPS_PER_TURN / 4);   // a quarter turn back (negative = other way)
  delay(1000);
}
```

Two things to notice:

- The pin order in `Stepper motor(...)` is **D2, D4, D3, D5**, not D2, D3, D4, D5. With the "natural" order the motor only shakes and hums. This is a well-known quirk of the 28BYJ-48 with this library.
- `motor.step()` **waits** until all the steps are done. While the motor turns, the rest of your program pauses.

## Summary

- A **stepper motor** turns in exact **steps** by switching its coils on one after another. The 28BYJ-48 needs about 2048 steps per turn and a ULN2003 driver.

## Challenges

1. **Clock hand:** tape a paper arrow to the stepper shaft and make it move like the second hand of a clock: one step of 6° (2048 / 60 ≈ 34 steps) every second.
2. **Button control:** use two buttons (see "Buttons Advanced") to turn the stepper a little to the left or to the right with every press.
