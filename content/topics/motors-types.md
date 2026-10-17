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
- **Servo or stepper?** A servo **measures** its angle, so it knows where it is at once but only turns about 180°. A stepper **counts** its steps, so it can turn without limit and very precisely, but needs **homing** at start-up and loses count if it is blocked.

## Challenge

**Servo or stepper?** For each project, choose a servo or a stepper and give two reasons: a camera that turns to face whoever is talking; a toy car steering wheel; an automatic window blind that rolls up and down; a "weather dial" that points to sunny, cloudy or rainy.
