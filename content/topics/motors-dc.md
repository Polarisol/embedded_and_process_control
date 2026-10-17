# The DC motor

A **DC motor** is the simplest motor. It has two wires. Connect it to a battery and it spins. Swap the wires and it spins the other way.

## How it works

Inside the motor there are **permanent magnets** and a **coil** of copper wire that can turn on an axle.

![A coil between a north and a south magnet; current makes one side of the coil go up and the other go down, and the commutator keeps it turning](assets/motors/dc-inside.svg)

1. When current flows through the coil, the coil becomes an **electromagnet**.
2. The permanent magnets push one side of the coil up and pull the other side down, so the coil turns.
3. After half a turn the push would reverse and stop the coil. To prevent that, the coil is connected through a **commutator**: a split ring that rubs against two contacts called **brushes**. Every half turn it flips the direction of the current in the coil, so the push always goes the same way and the motor keeps spinning.

Two things follow from this:

- **More voltage → more speed.** A bigger current makes a stronger push.
- **Reverse the voltage → reverse the direction.** The current flows the other way, so the push is reversed.

## Controlling the speed: PWM

A pin of the Nano ESP32 is digital: it is either 3.3 V or 0 V. To get "half speed" we switch the power **on and off very quickly**, thousands of times a second. This is called **PWM** (Pulse Width Modulation). The percentage of time it is on is called the **duty cycle**.

![PWM signals with 25 %, 50 % and 100 % on-time, and the matching motor speed](assets/motors/pwm.svg)

The motor is heavy and slow compared to the switching, so it doesn't feel each pulse. It feels the **average**: 25 % on is slow, 50 % on is medium, 100 % on is full speed. In Arduino C, `analogWrite(pin, value)` makes a PWM signal, where `value` goes from **0** (always off) to **255** (always on).

## Without a driver chip: one MOSFET

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

## Both directions: the H-bridge

To reverse the motor we need to swap its wires, and a program can't move wires. Instead, we use four electronic switches arranged in the shape of the letter **H**, called an **H-bridge**:

![Closing switches S1 and S4 makes current go through the motor one way; closing S2 and S3 makes it go the other way](assets/motors/h-bridge.svg)

- Close **S1 and S4**: current flows through the motor from left to right, and it spins forward.
- Close **S2 and S3**: current flows from right to left, and it spins in reverse.
- Never close S1 and S3 (or S2 and S4) together: that would connect + straight to GND. A good driver chip makes this impossible.

You don't build the H-bridge yourself. It comes ready-made inside a **motor driver** chip, and the board just tells the driver which way to go and how fast.

## Connecting a DC motor through a driver

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

## The code

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

## Summary

- A **DC motor** spins while it has power. **PWM** (`analogWrite`) sets its speed. For **one direction**, a single **MOSFET** with a **diode across the motor** is enough. For **both directions** you need an **H-bridge** driver like the TB6612FNG.

## Challenge

**Motor ramp:** make the DC motor speed up slowly from 0 to 255 over 3 seconds, then slow down again, then do the same in reverse. What is the smallest value that makes your motor turn?
