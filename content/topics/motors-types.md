# Types of Motors

A **motor** turns electricity into movement. Motors are what make a project *do* something: spin a fan, drive a robot, open a door, aim a camera or move the head of a 3D printer.

There are many kinds of motors. In this lesson we meet the three you will use most with a development board:

![A DC motor, a positional servo, a continuous servo and a stepper motor](assets/motors/family.svg)

| Motor | What it does | You control |
|-------|--------------|-------------|
| **DC motor** | Spins round and round while it has power | Speed and direction |
| **Servo (positional)** | Turns to an angle between 0° and 180° and holds it | The angle |
| **Servo (continuous)** | Spins all the way round, like a geared DC motor | Speed and direction |
| **Stepper motor** | Turns in small, exact steps | How many steps, and how fast |

## One rule for every motor

Before we look at each motor, here is the most important rule of this lesson:

> **Rule:** never power a motor from a signal pin. A pin of the Nano ESP32 can give a few tens of milliamps at most. Even a small motor needs hundreds of milliamps, and much more for a moment when it starts. The pin only sends the **control signal**. The power comes from a separate source, through a **driver**: a driver chip, or a MOSFET for a motor that only turns one way. A servo has its driver built in.

Motors are also electrically "noisy": when they start, stop or change direction they cause voltage spikes. A driver protects your board from those spikes too.

And one more habit: **connect all the GNDs together** (the board, the driver and the motor's power supply). Without a shared GND, the control signals have nothing to be measured against, and nothing works.

---

## The DC motor

A **DC motor** is the simplest motor. It has two wires. Connect it to a battery and it spins. Swap the wires and it spins the other way.

### How it works

Inside the motor there are **permanent magnets** and a **coil** of copper wire that can turn on an axle.

![A coil between a north and a south magnet; current makes one side of the coil go up and the other go down, and the commutator keeps it turning](assets/motors/dc-inside.svg)

1. When current flows through the coil, the coil becomes an **electromagnet**.
2. The permanent magnets push one side of the coil up and pull the other side down, so the coil turns.
3. After half a turn the push would reverse and stop the coil. To prevent that, the coil is connected through a **commutator**: a split ring that rubs against two contacts called **brushes**. Every half turn it flips the direction of the current in the coil, so the push always goes the same way and the motor keeps spinning.

Two things follow from this:

- **More voltage → more speed.** A bigger current makes a stronger push.
- **Reverse the voltage → reverse the direction.** The current flows the other way, so the push is reversed.

### Controlling the speed: PWM

A pin of the Nano ESP32 is digital: it is either 3.3 V or 0 V. To get "half speed" we switch the power **on and off very quickly**, thousands of times a second. This is called **PWM** (Pulse Width Modulation). The percentage of time it is on is called the **duty cycle**.

![PWM signals with 25 %, 50 % and 100 % on-time, and the matching motor speed](assets/motors/pwm.svg)

The motor is heavy and slow compared to the switching, so it doesn't feel each pulse. It feels the **average**: 25 % on is slow, 50 % on is medium, 100 % on is full speed. In Arduino C, `analogWrite(pin, value)` makes a PWM signal, where `value` goes from **0** (always off) to **255** (always on).

### Without a driver chip: one MOSFET

If your motor only ever needs to turn **one way** (a fan, a pump, a propeller), you don't need a driver module at all. A single **MOSFET** can switch the motor on and off, and with PWM it controls the speed too. This is the same **low-side switch** from the [MOSFETs](topic.html?id=electronics) item in the Electronics unit, with the motor as the load:

![The motor and a diode between +6 V and the drain of an IRLZ44N; the source to GND; D5 drives the gate through 100 ohm with a 10 kilohm pull-down; the board's GND joined to the battery's minus](assets/motors/dc-mosfet.svg)

| Part | Where |
|------|-------|
| **Motor** | Between the battery's **+** and the MOSFET's **drain** (never on the source side; the MOSFETs item explains why) |
| **MOSFET** (IRLZ44N) | **Source** to GND, **gate** to D5 through **100 Ω**, with a **10 kΩ** pull-down from gate to GND |
| **Diode** (1N5819 or 1N4007) | **Across the motor**, with its **stripe towards +** |
| **Battery** (4 × AA = 6 V) | **+** to the motor, **−** to GND, joined to the Nano's **GND** |

**Why the diode?** The motor is full of coils. Every time the MOSFET switches off (and with PWM that's thousands of times a second), the coils try to keep the current flowing and make a high voltage spike. Without the diode, that spike hits the MOSFET and can destroy it. The diode gives the current a safe loop back through the motor. A driver chip like the TB6612FNG has these diodes built in, which is one reason it is so convenient.

The code is just PWM on the gate pin:

```c
const int MOTOR_PIN = D5;   // the pin that drives the MOSFET's gate

void setup() {
  pinMode(MOTOR_PIN, OUTPUT);
  analogWrite(MOTOR_PIN, 0);        // start with the motor stopped
}

void loop() {
  analogWrite(MOTOR_PIN, 255);      // full speed
  delay(2000);
  analogWrite(MOTOR_PIN, 120);      // slower
  delay(2000);
  analogWrite(MOTOR_PIN, 0);        // stop
  delay(2000);
}
```

What you **can't** do with one MOSFET is reverse the motor. The MOSFET can only connect the motor to GND or disconnect it, so the current always flows the same way through the motor. For that you need an H-bridge.

> **Good to know:** the IRLZ44N is not fully on with only 3.3 V on its gate. For a small hobby motor (well under 1 A) that's fine. For a bigger motor, check how warm the MOSFET gets, or pick one that is fully on at 3.3 V (see "V<sub>GS</sub> threshold and logic level" in the MOSFETs item).

### Both directions: the H-bridge

To reverse the motor we need to swap its wires, and a program can't move wires. Instead, we use four electronic switches arranged in the shape of the letter **H**, called an **H-bridge**:

![Closing switches S1 and S4 makes current go through the motor one way; closing S2 and S3 makes it go the other way](assets/motors/h-bridge.svg)

- Close **S1 and S4**: current flows through the motor from left to right, and it spins forward.
- Close **S2 and S3**: current flows from right to left, and it spins in reverse.
- Never close S1 and S3 (or S2 and S4) together: that would connect + straight to GND. A good driver chip makes this impossible.

You don't build the H-bridge yourself. It comes ready-made inside a **motor driver** chip, and the board just tells the driver which way to go and how fast.

### Connecting a DC motor through a driver

We use the **TB6612FNG** driver module. It is small, efficient, works well with 3.3 V logic, and can drive two motors (channels A and B). Here we use channel A:

![Nano ESP32 pins D5, D6 and D7 go to PWMA, AIN1 and AIN2 of the TB6612FNG; the motor connects to AO1 and AO2; a 6 V battery pack connects to VM and GND](assets/motors/dc-wiring.svg)

| TB6612FNG pin | Connect to | Why |
|---------------|------------|-----|
| **VCC** | Nano **3.3V** | Power for the driver's logic |
| **STBY** | Nano **3.3V** | "Standby" off: HIGH means the driver is awake |
| **PWMA** | Nano **D5** | Speed (PWM) |
| **AIN1**, **AIN2** | Nano **D6**, **D7** | Direction |
| **AO1**, **AO2** | The two motor wires | The driver's output to the motor |
| **VM** | Battery **+** (4 × AA = 6 V) | The motor's power |
| **GND** | Battery **−** and Nano **GND** | Shared ground |

The two direction pins work like this:

| AIN1 | AIN2 | The motor |
|------|------|-----------|
| HIGH | LOW | Spins forward |
| LOW | HIGH | Spins in reverse |
| LOW | LOW | Stops (coasts to a stop) |
| HIGH | HIGH | Brakes (stops quickly) |

> **Good to know:** you'll also find the bigger, older **L298N** driver in many kits. It has the same idea (IN1, IN2 and ENA instead of AIN1, AIN2 and PWMA), but it wastes about 2 V as heat, so a small motor gets less power.

### The code

```c
const int PWMA = D5;   // speed
const int AIN1 = D6;   // direction
const int AIN2 = D7;   // direction

// speed: -255 (full reverse) ... 0 (stop) ... 255 (full forward)
void setMotor(int speed) {
  if (speed > 0) {
    digitalWrite(AIN1, HIGH);
    digitalWrite(AIN2, LOW);
  } else if (speed < 0) {
    digitalWrite(AIN1, LOW);
    digitalWrite(AIN2, HIGH);
  } else {
    digitalWrite(AIN1, LOW);
    digitalWrite(AIN2, LOW);
  }
  analogWrite(PWMA, abs(speed));
}

void setup() {
  pinMode(PWMA, OUTPUT);
  pinMode(AIN1, OUTPUT);
  pinMode(AIN2, OUTPUT);
}

void loop() {
  setMotor(255);    // full speed forward
  delay(2000);
  setMotor(100);    // slow forward
  delay(2000);
  setMotor(0);      // stop
  delay(1000);
  setMotor(-180);   // reverse
  delay(2000);
  setMotor(0);
  delay(1000);
}
```

If the motor turns the "wrong" way, just swap its two wires on AO1 and AO2. Very low values (below about 60) may not be enough to start the motor turning: it hums but doesn't move. That's normal.

---

## The servo motor

A **servo** is a small box with a motor inside that you tell **where to go**, not just how fast to spin. Write "90°" and the arm (called the **horn**) turns to 90° and **stays there**, even if you push on it. The most common hobby servo is the blue **SG90**.

### How it works

A servo is really four parts in one box:

![The pulse goes to a control chip, which drives a small DC motor, through gears, to the output horn; a potentiometer measures the angle and reports back to the chip](assets/motors/servo-inside.svg)

1. A small **DC motor**, which spins fast but is weak.
2. **Gears**, which make it slower but much stronger.
3. A **potentiometer** (a knob-like sensor, like the one in the Sensors unit) attached to the output shaft. It measures the angle the shaft is at right now.
4. A **control chip** that reads your command and compares it with what the potentiometer measures. If the shaft isn't where it should be, the chip turns the motor towards the right angle, and stops when they match.

This idea of **measuring and correcting** is called a **closed loop**, or **feedback**. It is the heart of process control, and we'll meet it again later in the course.

### Controlling a servo: the pulse

A servo has **three wires**, and the command comes on a single signal wire as a **pulse**. The board sends a pulse every **20 ms** (50 times a second), and the **width** of the pulse says what to do:

![A 0.5 ms pulse sends a positional servo to 0°, 1.5 ms to 90° and 2.4 ms to 180°; for a continuous servo the same pulses mean full speed one way, stop, and full speed the other way](assets/motors/servo-pulses.svg)

The textbook values are 1 ms to 2 ms, but most small servos like the SG90 actually use about **0.5 ms to 2.4 ms** for the full 0° to 180°. If your servo buzzes at the very ends, it is pushing against its own stop: use a slightly narrower range.

### Positional and continuous servos

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

### Connecting a servo to the Arduino Nano ESP32

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

### The code: making the pulse ourselves

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

---

## The stepper motor

A **stepper motor** doesn't spin smoothly. It moves in **small, exact steps**, and stops dead after each one. Tell it "200 steps" and it moves exactly 200 steps. Count the steps and you know exactly where it is, without any sensor. That's why steppers move the print head of a 3D printer, the lens in a camera and the scanner in a photocopier.

The stepper you'll find in most beginner kits is the **28BYJ-48**, which comes with a small **ULN2003** driver board.

### How it works

Inside, a magnet (the **rotor**) sits in the middle of several **coils**. Switch on one coil and the magnet turns to face it. Switch that coil off and the next one on, and the magnet turns again, by one step:

![Four snapshots: coil A on, then B, then C, then D; each time the magnet in the middle turns to face the coil that is on](assets/motors/stepper-inside.svg)

- Switch the coils on **in order** (A, B, C, D, A, …) and the motor turns one way.
- Switch them in the **opposite order** and it turns the other way.
- Switch them **faster** and it turns faster.
- **Stop switching** and the motor stops and holds its position.

A real stepper has more "teeth" than our drawing, so its steps are much smaller. The 28BYJ-48 also has a gearbox inside: it needs about **2048 steps for one full turn** of its shaft. That's less than 0.2° per step.

### Connecting a stepper to the Arduino Nano ESP32

The coils need far more current than a pin can give, so the four pins go to the **ULN2003** driver, which switches the coils for us. The motor plugs into the white socket on the driver board (it only fits one way):

![D2 to D5 of the Nano ESP32 go to IN1 to IN4 of the ULN2003 board; VBUS goes to + and GND to −; the motor plugs into the board](assets/motors/stepper-wiring.svg)

| ULN2003 board | Connect to |
|---------------|------------|
| **IN1, IN2, IN3, IN4** | Nano **D2, D3, D4, D5** |
| **+** | Nano **VBUS** (5 V) |
| **−** | Nano **GND** |

The four small LEDs on the driver board show which coil is on. When the motor runs slowly, you can watch them light up in turn.

> **Good to know:** a stepper uses current even when it is standing still, because a coil stays on to hold its position. The 28BYJ-48 gets warm, and that's normal. Bigger steppers (like the NEMA 17 in 3D printers) need their own power supply and a different driver, such as the A4988.

### The code

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

---

## Which motor should I use?

| I want to… | Use |
|------------|-----|
| Spin something one way (a fan, a pump, a propeller) | **DC motor** + MOSFET |
| Drive wheels forwards and backwards | **DC motor** + H-bridge driver |
| Move an arm or a flap to a certain angle | **Positional servo** |
| Drive the wheels of a small, simple robot | **Continuous servo** (or DC motors + driver) |
| Turn an exact amount, or more than half a turn | **Stepper motor** + driver |

### Servo or stepper?

Both a servo and a stepper can turn to a **chosen position** and stay there, so choosing between them is the hardest choice in this lesson. The difference is in **how each one knows where it is**:

![Left: a servo moves within a half circle and its potentiometer tells it the angle. Right: a stepper can turn all the way round and keeps track of its position by counting steps](assets/motors/servo-vs-stepper.svg)

- A **servo measures** its position. Its potentiometer tells it the angle all the time, so it goes straight to the right place, even right after power-up, and pushes back if something moves it. This is a **closed loop**.
- A **stepper counts** its steps. It doesn't measure anything: it simply trusts that every step happened. This is an **open loop**. It works very well, as long as nothing stops the motor.

Here is how they compare (for the SG90 servo and the 28BYJ-48 stepper from this lesson):

| | Servo (SG90) | Stepper (28BYJ-48) |
|---|---|---|
| **How far it can turn** | About 180°, no more | As far as you like, many turns, both ways |
| **Knows where it is at power-up?** | Yes, it goes straight to the angle you ask for | No. It needs a **home** position first (see below) |
| **If something blocks it** | Keeps pushing, and gets there when it's free | **Skips steps** and never finds out; the count is now wrong |
| **Precision** | About 1° to 2°, and it may jitter slightly | About 0.18° per step, and the same move gives the same result every time |
| **Speed** | Fast: 0° to 180° in about half a second | Slow: about 4 seconds for one turn |
| **Holding still** | Uses current only when it has to correct itself | The coils stay on, so it uses current all the time and gets warm |
| **Wiring and code** | 3 wires, no driver, a pulse | A driver board, 4 pins and a library |

### What is "homing"?

When a stepper project switches on, the board has no idea where the shaft is. So at start-up it turns the motor slowly until it presses a small **limit switch** (a button placed at a known position), and calls that point **step 0**. From then on, it counts. Every 3D printer does this when it starts: that's the clicking you hear as each axis moves to its corner. A servo never needs this, because it always knows its angle.

### How to choose

Ask these questions about your project, in this order:

1. **Does it need to turn more than about 180°, or all the way round?** Then it's a **stepper**. A servo simply can't.
2. **Must it be in the right place the moment it switches on, with no homing?** Then it's a **servo**.
3. **Can something push against it or block it** (a door, a gripper, a joint that carries weight)? Prefer a **servo**: it corrects itself, while a blocked stepper loses count.
4. **Do you need very fine, exactly repeatable moves**, or to turn an exact amount again and again? Then it's a **stepper**.
5. **Does it run on batteries and stand still most of the time?** Prefer a **servo**: a stepper uses current even when it isn't moving.
6. **Still not sure?** For a beginner project, start with a **servo**. It needs no driver and no homing, and the code is shorter.

Some examples:

| Project | Choice | Why |
|---------|--------|-----|
| A joint of a small robot arm | **Servo** | Less than 180°, knows its angle at start-up, holds against the weight |
| A door lock or a pet-feeder flap | **Servo** | Just two positions (open and closed), fast, simple |
| A solar panel that follows the sun across the sky | **Servo** | Half a circle is enough, and it must hold against the wind |
| A turntable that photographs an object from all sides | **Stepper** | Full turns, in exact equal steps |
| A clock hand or a dial that turns round and round | **Stepper** | Unlimited turns, and the hand moves in exact steps |
| A pen plotter or a 3D printer axis | **Stepper** (with homing) | Many turns of a screw or a belt, and very accurate, repeatable moves |

## Summary

- **Never** power a motor from a signal pin. The pin sends the control signal; the power comes through a **driver**. Always connect all the **GNDs** together.
- A **DC motor** spins while it has power. **PWM** (`analogWrite`) sets its speed. For **one direction**, a single **MOSFET** with a **diode across the motor** is enough. For **both directions** you need an **H-bridge** driver like the TB6612FNG.
- A **servo** has a motor, gears, a potentiometer and a control chip inside. A **pulse** every 20 ms sets it: about 0.5 ms for 0°, 1.5 ms for 90° and 2.4 ms for 180°.
- A **continuous servo** has no position feedback: the same pulse sets its **speed and direction**, and 1.5 ms means stop.
- A **stepper motor** turns in exact **steps** by switching its coils on one after another. The 28BYJ-48 needs about 2048 steps per turn and a ULN2003 driver.
- **Servo or stepper?** A servo **measures** its angle, so it knows where it is at once but only turns about 180°. A stepper **counts** its steps, so it can turn without limit and very precisely, but needs **homing** at start-up and loses count if it is blocked.

## Challenges

1. **Knob-controlled servo:** connect a potentiometer to A0 (see the Sensors unit) and make the servo follow the knob. Use `map()` to turn the `analogRead()` value into an angle.
2. **Find the stop:** with a continuous servo, find the exact pulse width (in µs) where it stops completely. Is it exactly 1500 µs?
3. **Motor ramp:** make the DC motor speed up slowly from 0 to 255 over 3 seconds, then slow down again, then do the same in reverse. What is the smallest value that makes your motor turn?
4. **Clock hand:** tape a paper arrow to the stepper shaft and make it move like the second hand of a clock: one step of 6° (2048 / 60 ≈ 34 steps) every second.
5. **Button control:** use two buttons (see "Buttons Advanced") to turn the stepper a little to the left or to the right with every press.
6. **Servo or stepper?** For each project, choose a servo or a stepper and give two reasons: a camera that turns to face whoever is talking; a toy car steering wheel; an automatic window blind that rolls up and down; a "weather dial" that points to sunny, cloudy or rainy.
