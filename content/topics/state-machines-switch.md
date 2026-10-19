# State Machines with switch

In the **Introduction** we drew state machines with circles and arrows. Now we turn those drawings into Arduino code. The tool is the `switch` statement from **The C Language** unit, plus one variable that remembers the current state.

You only need the board. The examples use the LEDs that are already on the Nano ESP32, and one button (or just a wire).

## The recipe

Every state machine in this item is built the same way:

1. **Give each state a name** with an `enum`.
2. **Keep the current state in one variable**, and set it to the start state.
3. In `loop()`, **read the events once** at the top: buttons, sensors, timers.
4. **`switch` on the state.** Each state gets its own `case`. Inside it:
   - do what this state does (its **outputs**),
   - check the events that leave this state, and when one happens, **change the state variable** (a **transition**),
   - end with `break`.

Here is how each part of the lamp diagram from the Introduction becomes a part of the code:

![On the left the lamp state diagram, on the right the matching code. The start arrow matches the line that sets the state variable, each state circle matches a case, the text inside a state matches its digitalWrite, and each arrow matches an if that changes the state](assets/state-machines/switch-mapping.svg)

### What is an `enum`?

An `enum` gives names to a list of whole numbers:

```c
enum LampState { LAMP_OFF, LAMP_ON };
```

This creates a new type, `LampState`, whose values are `LAMP_OFF` (which is really 0) and `LAMP_ON` (really 1). We could just use the numbers 0 and 1, but `case LAMP_ON:` is much easier to read than `case 1:`, and the compiler warns you if you try to put a value that isn't one of the states into the variable.

## Example 1: a lamp with one button

Connect a push button between pin **D2** and **GND**. No button? Use a jumper wire and touch its free end to a GND pin. We turn on the pin's built-in **pull-up** resistor with `INPUT_PULLUP`, so the pin reads **HIGH** when released and **LOW** when pressed. The **Sensors** unit explains why.

```c
const int BUTTON_PIN = D2;
const int LED_PIN = LED_BUILTIN;      // the LED marked "L" on the board

enum LampState { LAMP_OFF, LAMP_ON };
LampState state = LAMP_OFF;           // the start state

int lastButton = HIGH;                // released

// Returns true only at the moment the button goes down.
bool buttonPressed() {
  int button = digitalRead(BUTTON_PIN);
  if (button != lastButton) {         // a change, but the button may still be bouncing...
    delay(5);                         // ...so wait 5 ms
    button = digitalRead(BUTTON_PIN); // ...and read again
  }
  bool pressed = (button == LOW && lastButton == HIGH);
  lastButton = button;
  return pressed;
}

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  bool pressed = buttonPressed();     // read the events once

  switch (state) {
    case LAMP_OFF:
      digitalWrite(LED_PIN, LOW);     // what this state does
      if (pressed) {
        state = LAMP_ON;              // the transition
      }
      break;

    case LAMP_ON:
      digitalWrite(LED_PIN, HIGH);
      if (pressed) {
        state = LAMP_OFF;
      }
      break;
  }
}
```

Upload it and press the button: the LED toggles on and off.

Two things to notice:

- **The same event is handled in two places.** `pressed` means "turn on" in `LAMP_OFF` and "turn off" in `LAMP_ON`. Each `case` only cares about what happens in its own state.
- **`buttonPressed()` is true only for the moment the button goes down**, not for as long as it is held. Otherwise the lamp would flip on and off thousands of times a second while you hold the button.

## Example 2: a traffic light with a timer

The traffic light from the Introduction changes state after some **time** has passed. The Nano ESP32 has an **RGB LED** on the board, so it can be our traffic light: red, green, and red + green together for yellow.

The obvious way to wait is `delay(5000)`. Don't use it in a state machine: during a `delay()` the board does nothing else, so it can't notice a button, a sensor or anything else that happens. Use `millis()` instead.

`millis()` returns how many milliseconds have passed since the board started. When we enter a state we write down the time. Then, on every pass through `loop()`, we check how long we have been in the state:

```c
// The RGB LED is "upside down": LOW turns a colour on, HIGH turns it off.
const int LED_ON = LOW;
const int LED_OFF = HIGH;

enum LightState { LIGHT_RED, LIGHT_GREEN, LIGHT_YELLOW };
LightState state = LIGHT_RED;          // the start state
unsigned long enteredAt = 0;           // millis() when we entered the current state

void goTo(LightState next) {
  state = next;
  enteredAt = millis();                // start timing the new state
}

void setColour(int red, int green) {
  digitalWrite(LED_RED, red);
  digitalWrite(LED_GREEN, green);
}

void setup() {
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);
  digitalWrite(LED_BLUE, LED_OFF);     // we don't need blue
}

void loop() {
  unsigned long timeInState = millis() - enteredAt;   // the timer event

  switch (state) {
    case LIGHT_RED:
      setColour(LED_ON, LED_OFF);
      if (timeInState >= 5000) {
        goTo(LIGHT_GREEN);
      }
      break;

    case LIGHT_GREEN:
      setColour(LED_OFF, LED_ON);
      if (timeInState >= 4000) {
        goTo(LIGHT_YELLOW);
      }
      break;

    case LIGHT_YELLOW:
      setColour(LED_ON, LED_ON);       // red + green looks yellow
      if (timeInState >= 1000) {
        goTo(LIGHT_RED);
      }
      break;
  }
}
```

The times here are shorter than a real traffic light, so you don't wait half a minute to see it work.

Every transition goes through `goTo()`, so the timer is restarted every time the state changes and we can never forget it.

## Example 3: adding a button to the traffic light

Now the state machine pays off. Let's add a **pedestrian button**: pressing it while the light is green makes it turn yellow at once, instead of waiting.

Copy `BUTTON_PIN`, `lastButton` and `buttonPressed()` from Example 1, add `pinMode(BUTTON_PIN, INPUT_PULLUP);` to `setup()`, and change only two places in `loop()`:

```c
void loop() {
  unsigned long timeInState = millis() - enteredAt;
  bool pressed = buttonPressed();      // a second event

  switch (state) {
    // ... LIGHT_RED stays the same ...

    case LIGHT_GREEN:
      setColour(LED_OFF, LED_ON);
      if (timeInState >= 4000 || pressed) {   // time is up, OR someone pressed
        goTo(LIGHT_YELLOW);
      }
      break;

    // ... LIGHT_YELLOW stays the same ...
  }
}
```

That's the whole change: one new arrow on the diagram is one new condition in one `case`. Pressing the button while the light is red or yellow does nothing, because those cases never look at `pressed`. And because there is no `delay()`, the button works at any moment.

## Common mistakes

| Mistake | What happens | Fix |
|---------|--------------|-----|
| Forgetting `break` | The program runs on into the next `case`, so one pass does the work of two states | End every `case` with `break;` |
| Using `delay()` inside a state | The board stops noticing buttons and sensors while it waits | Time the state with `millis()` |
| Reading the button inside each `case` | Easy to read it twice in one pass, or to miss a press | Read every event once, at the top of `loop()` |
| Declaring a variable inside a `case` | Confusing compiler errors | Declare it above the `switch` |
| Changing `state` without restarting the timer | The next state thinks its time is already up | Always change state through one function, like `goTo()` |

## Summary

- A state machine in Arduino is an `enum` of states, one `state` variable and a `switch (state)` inside `loop()`.
- Each **state** is a `case`. Inside it, set the **outputs**, check the **events**, and change `state` for a **transition**.
- Read the events **once** at the top of `loop()`.
- For timers use `millis()`, never `delay()`, so the board keeps listening to everything else.
- Adding a feature usually means adding one `case` or one condition. The rest of the code stays as it is.

## Challenge

Build the **automatic door** from the Introduction. Use the button as the "person detected" sensor, the red LED for "motor backward" (closing) and the green LED for "motor forward" (opening). Opening and closing each take 2 seconds, and the door closes after 5 seconds with nobody there. Don't forget the red arrow: a press while the door is **closing** must send it back to **opening**.
