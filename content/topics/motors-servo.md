# The servo motor

A **servo** is a small box with a motor inside that you tell **where to go**, not just how fast to spin. Write "90°" and the arm (called the **horn**) turns to 90° and **stays there**, even if you push on it. The most common hobby servo is the blue **SG90**.

## How it works

A servo is really four parts in one box:

![The pulse goes to a control chip, which drives a small DC motor, through gears, to the output horn; a potentiometer measures the angle and reports back to the chip](assets/motors/servo-inside.svg)

1. A small **DC motor**, which spins fast but is weak.
2. **Gears**, which make it slower but much stronger.
3. A **potentiometer** (a knob-like sensor, like the one in the Sensors unit) attached to the output shaft. It measures the angle the shaft is at right now.
4. A **control chip** that reads your command and compares it with what the potentiometer measures. If the shaft isn't where it should be, the chip turns the motor towards the right angle, and stops when they match.

This idea of **measuring and correcting** is called a **closed loop**, or **feedback**. It is the heart of process control, and we'll meet it again later in the course.

## Controlling a servo: the pulse

A servo has **three wires**, and the command comes on a single signal wire as a **pulse**. The board sends a pulse every **20 ms** (50 times a second), and the **width** of the pulse says what to do:

![A 0.5 ms pulse sends a positional servo to 0°, 1.5 ms to 90° and 2.4 ms to 180°; for a continuous servo the same pulses mean full speed one way, stop, and full speed the other way](assets/motors/servo-pulses.svg)

The textbook values are 1 ms to 2 ms, but most small servos like the SG90 actually use about **0.5 ms to 2.4 ms** for the full 0° to 180°. If your servo buzzes at the very ends, it is pushing against its own stop: use a slightly narrower range.

## Positional and continuous servos

The two kinds of servo look exactly the same from the outside. The difference is inside:

| | Positional servo | Continuous servo |
|---|---|---|
| Potentiometer | Connected to the shaft | Disconnected (or fixed in the middle) |
| Can turn | About 180° | All the way round, without stopping |
| A 1.5 ms pulse means | Go to 90° | **Stop** |
| A shorter or longer pulse means | Go to a smaller or bigger angle | Spin one way or the other; the further from 1.5 ms, the faster |
| Knows where it is? | Yes | **No.** You only control speed and direction |
| Good for | Robot arms, steering, flaps, locks | Wheels of a small robot |

A continuous servo "thinks" it is always at 90°. Ask it to go to 0° and it keeps turning forever trying to get there. That's exactly what makes it a handy geared motor with a built-in driver.

> **Good to know:** a continuous servo should stop at 1.5 ms, but small differences inside mean it may creep slowly. Many have a tiny adjustment screw to fix this. If yours doesn't, find the pulse width where it stops (for example 1480 µs) and use that as your "stop".

## Connecting a servo to the Arduino Nano ESP32

| Servo wire | Colour | Connect to |
|------------|--------|------------|
| Power | **Red** (middle) | Nano **VBUS** (5 V from USB) |
| Ground | **Brown** or black | Nano **GND** |
| Signal | **Orange** or yellow | Nano **D9** |

![The servo's red wire goes to VBUS, its orange wire to D9 and its brown wire to GND](assets/motors/servo-wiring.svg)

The servo has its own driver inside, so we don't need a driver module. But:

- Power it from **5 V**, not 3.3 V. On the Nano ESP32 the **VBUS** pin gives the 5 V coming from the USB cable.
- One small SG90 is fine on VBUS. For **two or more servos**, or bigger ones, use a separate 5 V supply (a 4 × AA pack, or a 5 V phone charger module) and connect its GND to the Nano's GND. Servos can pull a big current for a moment, and the board may reset.
- The 3.3 V signal from D9 is fine: servos understand it.

## The code: making the pulse ourselves

A servo just wants a pulse every 20 ms, so we can make it ourselves with `digitalWrite()` and `delayMicroseconds()`. This works on any board, needs no library, and shows exactly what's going on:

```c
const int SERVO_PIN = D9;

// Send one pulse for this angle, then wait for the rest of the 20 ms.
// Call it again and again: a servo needs a pulse every 20 ms.
void servoPulse(int angle) {
  int width = map(angle, 0, 180, 500, 2400);   // in microseconds
  digitalWrite(SERVO_PIN, HIGH);
  delayMicroseconds(width);
  digitalWrite(SERVO_PIN, LOW);
  delayMicroseconds(20000 - width);
}

// Hold the servo at an angle for some time.
void servoGoTo(int angle, int ms) {
  for (int t = 0; t < ms; t += 20) {
    servoPulse(angle);
  }
}

void setup() {
  pinMode(SERVO_PIN, OUTPUT);
}

void loop() {
  servoGoTo(0, 1000);
  servoGoTo(90, 1000);
  servoGoTo(180, 1000);

  // a slow sweep back to 0°: one degree every 20 ms
  for (int angle = 180; angle >= 0; angle--) {
    servoPulse(angle);
  }
}
```

`map()` turns the angle (0 to 180) into a pulse width (500 to 2400 µs). The same code drives a **continuous** servo: `servoGoTo(90, 2000)` stops it, `servoGoTo(0, 2000)` spins it at full speed one way, `servoGoTo(180, 2000)` the other way, and values close to 90 (like 80 or 100) spin it slowly.

The downside is that while the board is busy making pulses, it can't do much else. For bigger projects, use a **servo library**, which makes the pulses in the background with the chip's PWM hardware. For the ESP32 the common one is **ESP32Servo** (install it from the Library Manager). It gives you `myServo.attach(pin)` and `myServo.write(angle)`. On the Nano ESP32, some ESP32 libraries expect the chip's own GPIO numbers instead of the D numbers printed on the board. If the servo doesn't move, choose **Tools → Pin Numbering → By GPIO number (legacy)** and use GPIO **18**, which is the pin labelled D9.

## Summary

- A **servo** has a motor, gears, a potentiometer and a control chip inside. A **pulse** every 20 ms sets it: about 0.5 ms for 0°, 1.5 ms for 90° and 2.4 ms for 180°.
- A **continuous servo** has no position feedback: the same pulse sets its **speed and direction**, and 1.5 ms means stop.

## Challenges

1. **Knob-controlled servo:** connect a potentiometer to A0 (see the Sensors unit) and make the servo follow the knob. Use `map()` to turn the `analogRead()` value into an angle.
2. **Find the stop:** with a continuous servo, find the exact pulse width (in µs) where it stops completely. Is it exactly 1500 µs?
