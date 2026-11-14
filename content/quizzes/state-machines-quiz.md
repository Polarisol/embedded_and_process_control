# State Machines Quiz

Answer all the questions, then press **Submit answers** to see your score and the corrections.

## A system is described by a state machine. What is true about it at any moment?
- [ ] It can be in several states at once, as long as they don't conflict
  > A state machine never mixes states. A traffic light can't be "a bit red and a bit green".
- [x] It is in exactly one state
  > Right! The system is always in exactly one of its states, and it knows what comes next.
- [ ] It is in no state until an event happens
  > There is always a current state. When the device switches on, it is in the **start** state.
- [ ] It moves to the next state on every pass through `loop()`
  > The state only changes when an event moves it along an arrow. Without an event it stays where it is.
> A state machine is a list of **states**, **events** and **transitions**. The system is always in exactly one state, and an event can move it to another.

## A lamp has two states, OFF and ON, and one button. What does pressing the button do?
- [ ] It always turns the lamp on
  > That's only true in OFF. In ON the same press turns the lamp off.
- [ ] It always turns the lamp off
  > That's only true in ON. In OFF the same press turns the lamp on.
- [ ] Nothing, because a button is not an event
  > A button press is a classic event, just like a sensor reading or a timer running out.
- [x] It depends on the current state
  > Right! In OFF the press turns the lamp on, and in ON it turns it off. You need the state to know what an event will do.
> This is the heart of every state machine: the same event can do different things, and the **current state** decides which.

## In a state diagram, what is the label written on an arrow?
- [x] The event that makes the transition happen
  > Right! For example, "button pressed" or "after 30 s".
- [ ] The name of the state the arrow points to
  > The state's name is written inside its circle or box, not on the arrow.
- [ ] What the motors and LEDs do in that state
  > The outputs of a state are written inside the state, not on the arrows.
- [ ] The start state
  > The start state is marked by an arrow from a small dot, and it has no event label.
> A state diagram has four parts: **states** (circles), **transitions** (arrows), **events** (labels on the arrows) and a **start** arrow from a small dot.

## An automatic door is CLOSING when a person walks in. According to the door's state diagram, what should happen?
- [ ] Nothing. The door finishes closing and then opens again
  > Then the door would hit the person. That is exactly the problem the diagram helps us catch.
- [ ] The door goes straight to OPEN
  > The door is half closed, so it can't be fully open at once. The motor has to turn forward first.
- [x] The door goes back to OPENING
  > Right! The red arrow goes from CLOSING back to OPENING when a person is detected.
- [ ] The door stops and stays where it is forever
  > There is no "stuck" state in the diagram. The door must open again to let the person through.
> When designing a state machine, go over **every state** and ask "what if this event happens **now**?". That is how you find cases like the door closing on someone, before they reach the real device.

## In this Arduino state machine, which line is a **transition**?
```c
switch (state) {
  case LAMP_OFF:
    digitalWrite(LED_PIN, LOW);
    if (pressed) {
      state = LAMP_ON;
    }
    break;
  // ...
}
```
- [ ] `switch (state) {`
  > This line chooses which state's code to run. It doesn't move the machine anywhere.
- [ ] `digitalWrite(LED_PIN, LOW);`
  > This is the **output** of the OFF state: what the LED does while we are in it.
- [ ] `case LAMP_OFF:`
  > A `case` matches one **state** (one circle in the diagram), not an arrow.
- [x] `state = LAMP_ON;`
  > Right! Changing the state variable is the transition, the arrow from OFF to ON.
> Each **state** becomes a `case`, its **outputs** are the code inside it, each **event** is an `if`, and each **transition** is a change of the `state` variable.

## What goes wrong in this code when the lamp is in the `LAMP_OFF` state?
```c
switch (state) {
  case LAMP_OFF:
    digitalWrite(LED_PIN, LOW);
    if (pressed) {
      state = LAMP_ON;
    }
  case LAMP_ON:
    digitalWrite(LED_PIN, HIGH);
    if (pressed) {
      state = LAMP_OFF;
    }
    break;
}
```
- [ ] The compiler refuses to compile it
  > It compiles without any error. That is what makes this mistake sneaky.
- [x] The code runs on into the `LAMP_ON` case, so the LED is turned on even in OFF
  > Right! Without `break`, C keeps going into the next `case`, so one pass does the work of two states.
- [ ] Only the `LAMP_OFF` case runs, so everything works fine
  > C only stops at `break` (or at the end of the `switch`). Here the `LAMP_OFF` case has no `break`.
- [ ] The program jumps back to the top of `loop()` and skips the `LAMP_ON` case
  > Reaching the next `case` label doesn't stop anything. The code keeps running straight through it.
> End every `case` with `break;`. Without it the program "falls through" into the next state's code.

## A traffic light waits in GREEN with `delay(4000)`. A pedestrian presses the button 1 second into the wait. What happens?
- [ ] The light turns yellow at once
  > During `delay()` the board does nothing at all, so it can't react to the press.
- [ ] The board stops the delay early and handles the press
  > `delay()` can't be interrupted by your code. It simply waits until the time is up.
- [x] The board doesn't notice the press, because it is busy waiting
  > Right! While `delay()` runs, the board reads no buttons or sensors, so a short press is missed.
> Don't use `delay()` in a state machine. Instead, remember the time you entered the state with `millis()`, and check on every pass how long you have been there. The board keeps listening to everything else.

## In the traffic light code, every transition goes through `goTo()`. Why?
```c
void goTo(LightState next) {
  state = next;
  enteredAt = millis();
}
```
- [ ] Because C doesn't let you change `state` directly
  > You can change `state` directly. `goTo()` is there so you can never forget the second line.
- [ ] To make the board wait before entering the next state
  > `goTo()` doesn't wait at all. It returns at once.
- [x] So the timer restarts every time the state changes
  > Right! `enteredAt` is set to the current time, so the new state starts counting from zero.
- [ ] To print the new state's name to the Serial Monitor
  > There is no `Serial` here. The function changes the state and saves the time.
> If you change `state` without restarting the timer, the next state thinks its time is already up. Changing state through one function, like `goTo()`, makes that mistake impossible.

## Which of these reads belong at the **top** of `loop()`, before the `switch`? Choose all that apply.
- [x] `digitalRead(BUTTON_PIN)`
  > Yes. It returns at once, so reading it at the top costs almost nothing.
- [ ] `pulseIn(ECHO_PIN, HIGH, 30000)`
  > No. `pulseIn()` waits for the echo, so it goes inside the `case` of the one state that needs it.
- [x] `millis() - enteredAt`
  > Yes. Checking the time returns at once.
- [x] `buttonPressed()`
  > Yes. It reads the button and returns at once, so the result is ready for whichever state needs it.
> Reads that **return at once** go at the top of `loop()`, once per pass. Reads that **wait**, like `pulseIn()` or waiting for a `Serial` message, go inside the `case` that needs them, so they don't slow down every other state.
