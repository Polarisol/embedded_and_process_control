# Introduction

A **state machine** is a simple way to describe how a system behaves. It says three things:

1. **The states** the system can be in. It is always in **exactly one** of them.
2. **The events** that can happen: a button press, a sensor reading, a timer running out.
3. **The transitions**: which event moves the system from which state to which state.

That's all. No maths, and no code yet. Just a few circles and arrows that you can draw on paper before you write a single line.

## A first example: a lamp with one button

A lamp has two states, **OFF** and **ON**. Pressing the button moves it from one to the other:

![A state diagram of a lamp: two circles, OFF and ON, with an arrow each way labelled "button pressed". Callouts name the parts: state, start, transition and event](assets/state-machines/lamp.svg)

This picture is a **state diagram**. Every state diagram uses the same few parts:

| Part | How it's drawn | What it means |
|------|----------------|---------------|
| **State** | A circle or a box | What the system is doing right now |
| **Transition** | An arrow from one state to another | The system can move this way |
| **Event** | The label on an arrow | What has to happen for that move |
| **Start** | An arrow from a small dot | The state the system begins in when it switches on |

Notice something interesting: the button does **two different things**. In OFF it turns the lamp on, and in ON it turns the lamp off. The button alone doesn't tell you what will happen. You also need to know the **state**. That idea is the heart of every state machine.

## A traffic light

Here the events aren't buttons but **time**. The light stays in each state for a while, then moves on to the next one:

![A state diagram of a traffic light: RED goes to GREEN after 30 seconds, GREEN goes to YELLOW after 25 seconds, YELLOW goes back to RED after 3 seconds](assets/state-machines/traffic-light.svg)

The light can never be "a bit red and a bit green". It is in one state, and it knows exactly what comes next.

## An automatic door

A sliding door at the entrance of a shop has a motor and a sensor that sees people. It has four states:

![A state diagram of an automatic door with four states: CLOSED, OPENING, OPEN and CLOSING. A red arrow goes from CLOSING back to OPENING when a person is detected](assets/state-machines/door.svg)

Each state also says what the **outputs** do: in OPENING the motor turns forward, in CLOSING it turns backward, and in CLOSED and OPEN it is off.

Look at the red arrow. If someone walks in while the door is **closing**, it must open again, or it will hit them. Drawing the diagram makes you ask "what if a person comes **now**?" for every state, and that is how you catch a problem like this before it reaches the real door.

## Why do we use state machines?

Many embedded projects are really a state machine, even when nobody calls them that:

| Device | Some of its states |
|--------|--------------------|
| Washing machine | Idle, filling, washing, rinsing, spinning, done |
| Elevator | Waiting, doors opening, moving up, moving down, doors closing |
| Microwave | Idle, cooking, paused, beeping "done" |
| Phone screen | Locked, unlocked, sleeping |
| Alarm system | Disarmed, armed, intruder detected, siren on |
| A robot car | Driving, obstacle ahead, turning, stopped |

A state machine helps because:

- **It's clear.** Anyone can read the diagram, even before there is any code. You can show it to a teammate (or a teacher) and check the idea together.
- **It's complete.** For each state you ask "what should happen if *this* event comes now?". The answers you would otherwise forget, like the door that is closing on someone, show up right away.
- **It's easy to change.** Adding a feature means adding a state or an arrow, not untangling a pile of "if"s.
- **It matches how devices behave.** A device waits for something to happen, reacts, and waits again. That is exactly what a state machine describes.

## How to design one

1. **List the states.** Ask "what different situations can my device be in?". Give each a short name.
2. **Choose the start state.** Where is the device when it switches on?
3. **List the events.** Buttons, sensors, timers, messages.
4. **Draw the arrows.** For every state, go over every event and ask "does this event move us somewhere?". If it does, draw an arrow. If it doesn't, the event is simply ignored in that state.
5. **Write the outputs** inside each state: what the LEDs, motors or buzzer do there.

Keep it small. If a diagram gets crowded, the states are probably too detailed.

## Summary

- A **state machine** is a list of **states**, **events** and **transitions**. The system is always in exactly one state.
- What an event does depends on the **current state**: the same button can turn a lamp on or off.
- A **state diagram** shows it with circles (states) and labelled arrows (transitions). A dot and an arrow mark the start state.
- We use state machines because they are **clear**, make us think about **every** case, and are **easy to change**.

## Challenge

Draw a state diagram for a **microwave oven**. It has a door, a **Start** button and a **Stop** button, and it beeps when the time is up. What are its states? What happens if someone opens the door while it is cooking? What does Stop do while it is cooking, and what does it do while it is paused?
