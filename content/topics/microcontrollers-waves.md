# Waves

A digital pin can only be **HIGH (3.3 V)** or **LOW (0 V)**. But switch it on and off again and again, and you get a **square wave**. By choosing how fast it repeats and how long it stays high, the same pin can dim an LED, set a motor's speed, play a melody on a buzzer and move a servo to an exact angle.

This item shows the three ways we use square waves. It builds on the [Nano ESP32 Digital Pins](topic.html?id=microcontrollers) item, so read that first.

## A square wave has three numbers

![One square wave with its parts marked: the high time, the low time and the period T of one full cycle; then three cards: the period T = 1 ms, the frequency f = 1 / T = 1000 Hz, and the duty cycle 0.25 ms / 1 ms = 25 %](assets/waves/square-wave.svg)

| Number | What it is | Example |
|--------|-----------|---------|
| **Period** `T` | The time of one full cycle: one high part and one low part | 1 ms |
| **Frequency** `f` | How many cycles happen every second. `f = 1 / T`, measured in **hertz (Hz)** | 1 / 1 ms = 1000 Hz |
| **Duty cycle** | The share of the period that the pin is high. `duty = high time / T` | 0.25 ms / 1 ms = 25 % |

Period and frequency are two ways to say the same thing: a shorter period means a higher frequency. So really there are only two things you can change: **how long the cycle is**, and **how much of it is high**. Each kind of device listens to a different one:

| | PWM (LED, motor) | Buzzer | Servo |
|---|---|---|---|
| **Period** | Stays the same (about 1 ms) | **Changes** | Stays the same (20 ms) |
| **High time** | **Changes** | Always half the period | **Changes** (0.5 – 2.4 ms) |
| **Duty cycle** | 0 – 100 % | Always 50 % | Only 2.5 – 12 % |
| **The device feels** | The **average power** | The **frequency**, as a note | The **width** of the pulse, as an angle |
| **In Arduino** | `analogWrite()` | `tone()` | A servo library, or by hand |

## Making any wave by hand

Before we use the built-in functions, here is one small function that makes **one cycle** of any square wave:

```c
// One cycle of a square wave: HIGH for highUs microseconds, then LOW for lowUs.
void squareWave(int pin, long highUs, long lowUs) {
  digitalWrite(pin, HIGH);
  delayMicroseconds(highUs);
  digitalWrite(pin, LOW);
  delayMicroseconds(lowUs);
}
```

Call it again and again in `loop()`, and the pin makes a wave. The three uses below are just three different ways of choosing `highUs` and `lowUs`.

## 1. PWM: a fixed period, a changing duty cycle

To give an LED or a motor **part** of its power, keep the period the same and change how much of it is high. This is **PWM** (Pulse Width Modulation):

![Three PWM signals with the same period: 10 % duty averages 0.33 V and the LED is dim, 50 % averages 1.65 V and it is at half, 90 % averages 2.97 V and it is bright](assets/waves/pwm-average.svg)

While the pin is high, the load gets **full power**. While it is low, it gets **none**. The load is too slow to follow each pulse (an LED is quick, but your eye isn't, and a motor has weight that keeps it turning), so what counts is the **average**:

**average power = duty cycle × full power**

At 50 % duty a motor gets half its power, and the average voltage is half of 3.3 V. Only the duty cycle matters here. The period just has to be **short enough** that the load can't follow the single pulses.

By hand, with a period of 1000 µs (1 ms, so 1000 Hz):

```c
const int LED_PIN = D2;
const long PERIOD_US = 1000;     // 1 ms: stays the same

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int duty = 25;                               // percent: change this
  long highUs = PERIOD_US * duty / 100;
  squareWave(LED_PIN, highUs, PERIOD_US - highUs);
}
```

In real programs, let the board's PWM hardware do it in the background with `analogWrite(pin, value)`, where `value` goes from 0 (0 %) to 255 (100 %). The [Digital Pins](topic.html?id=microcontrollers) item shows it fading an LED.

**Try it:** change `PERIOD_US` to `100000` (0.1 s). The period is now too long for your eye, and the LED blinks instead of glowing dimly.

> A pin gives only about 20 mA, enough for an LED but not for a motor. To control a motor's speed with PWM, the pin switches a **MOSFET** that switches the motor. See the [Motors](topic.html?id=motors) unit.

## 2. A buzzer: a fixed 50 % duty cycle, a changing frequency

A **passive buzzer** is a small disc that moves a little every time the voltage on it changes. Each push and pull moves the air, and a fast stream of them is a **sound**. Here the average doesn't matter at all. What you hear is the **frequency**: more cycles per second sound like a higher note.

![Three waves, all high for half of the period and low for the other half: 262 Hz (note C4, T = 3.82 ms) is a low pitch, 440 Hz (A4, 2.27 ms) is in the middle, 880 Hz (A5, 1.14 ms) is high](assets/waves/buzzer-frequency.svg)

The duty cycle stays at **50 %**: high for half the period, low for the other half. That gives the buzzer equal pushes and pulls, which makes the loudest and cleanest sound. People hear from about 20 Hz to 20,000 Hz, and small buzzers sound best between about 500 Hz and 4000 Hz.

**Wiring:** connect the buzzer's **+** leg to **D5** through a **100 Ω** resistor, and its other leg to **GND**.

By hand: for a frequency `f`, the period is `1,000,000 / f` microseconds, so each half is `500,000 / f`:

```c
const int BUZZER_PIN = D5;

// Play a note for some milliseconds, by hand.
void playNote(long freq, long ms) {
  long halfUs = 500000 / freq;               // half of the period
  long cycles = freq * ms / 1000;
  for (long i = 0; i < cycles; i++) {
    squareWave(BUZZER_PIN, halfUs, halfUs);  // 50 % duty
  }
}

void setup() {
  pinMode(BUZZER_PIN, OUTPUT);
}

void loop() {
  playNote(262, 300);   // C
  playNote(330, 300);   // E
  playNote(392, 300);   // G
  playNote(523, 600);   // high C
  delay(1000);
}
```

Arduino has a built-in function that makes this wave in the background: `tone(pin, frequency)` starts it, `noTone(pin)` stops it, and `tone(pin, frequency, ms)` plays for a set time. Here is a melody with it:

```c
const int BUZZER_PIN = D5;

int notes[]     = {262, 294, 330, 349, 392, 440, 494, 523};  // C D E F G A B C
int durations[] = {300, 300, 300, 300, 300, 300, 300, 600};  // ms

void setup() {
  for (int i = 0; i < 8; i++) {
    tone(BUZZER_PIN, notes[i]);
    delay(durations[i]);
    noTone(BUZZER_PIN);
    delay(50);              // a short gap between the notes
  }
}

void loop() {
}
```

| Note | C4 | D4 | E4 | F4 | G4 | A4 | B4 | C5 |
|------|----|----|----|----|----|----|----|----|
| Frequency (Hz) | 262 | 294 | 330 | 349 | 392 | 440 | 494 | 523 |

Each octave up **doubles** the frequency: A4 is 440 Hz, A5 is 880 Hz.

> **Active or passive?** An **active** buzzer has its own wave-maker inside. Give it a steady HIGH and it beeps, always at the same pitch, so it can't play notes. A **passive** buzzer needs your wave, and plays any note you give it. If a buzzer beeps when you connect it straight to 3.3 V, it is active.

## 3. A servo: a fixed 20 ms period, a changing pulse width

A servo listens to something else again. It expects **one pulse every 20 ms** (50 Hz), and the **width of the pulse** tells it the angle. The [Servo](topic.html?id=motors) item in the Motors unit explains what is inside a servo, how to wire it and how to use a servo library. Here we only look at its wave:

![Three servo signals drawn to scale with a 20 ms period: a 0.5 ms pulse (duty 2.5 %) sends the horn to 0°, 1.5 ms (7.5 %) to 90° and 2.4 ms (12 %) to 180°](assets/waves/servo-pulse.svg)

Drawn to scale, the pulse is tiny: the pin is LOW almost all the time. The duty cycle is only between 2.5 % and 12 %, and the average voltage is less than 0.4 V. That doesn't matter, because the servo's chip **measures the width of each pulse** and turns the horn to match. It doesn't feel an average, and the 20 ms doesn't have to be exact.

By hand, it is the same `squareWave()` again:

```c
const int SERVO_PIN = D9;
const long PERIOD_US = 20000;    // 20 ms: stays the same

void setup() {
  pinMode(SERVO_PIN, OUTPUT);
}

void loop() {
  int angle = 90;                                  // change this
  long widthUs = map(angle, 0, 180, 500, 2400);    // 0.5 ms to 2.4 ms
  squareWave(SERVO_PIN, widthUs, PERIOD_US - widthUs);
}
```

**Why not `analogWrite()`?** It also makes pulses of a chosen width, but its period is about 1 ms, twenty times too short. A servo library uses the same PWM hardware, set to 50 Hz. It also makes the pulses in the background, so your program is free to do other things.

## Summary

- A square wave has a **period** `T` (or a **frequency** `f = 1 / T`) and a **duty cycle** (the share of `T` that is high).
- **PWM**: a fixed, short period and a changing duty cycle. The load feels the **average power**, `duty × full power`. Use `analogWrite()`.
- **Buzzer**: a fixed 50 % duty cycle and a changing frequency. The frequency is the **pitch**. Use `tone()` and `noTone()`.
- **Servo**: a fixed 20 ms period and a pulse of 0.5 – 2.4 ms. The pulse **width** is the **angle**.

## Challenges

1. **Theremin:** connect a potentiometer to A0 (see the [Analog Pins](topic.html?id=microcontrollers) item) and a buzzer to D5. Turning the knob changes the pitch from 200 Hz to 2000 Hz. Use `map()`.
2. **Siren:** make the buzzer slide up from 500 Hz to 1500 Hz and back down, again and again, like an ambulance.
3. **Same knob, three waves:** with the same potentiometer, set the brightness of an LED on D2, the pitch of the buzzer on D5 and the angle of a servo on D9, all at once. Which number of the wave does each one change?
