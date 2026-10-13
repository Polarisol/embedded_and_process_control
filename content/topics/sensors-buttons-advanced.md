# Buttons Advanced

In **Types of Sensors** we wired a button in one line and read it with `INPUT_PULLUP`. Now we open the button up, wire it properly on a breadboard, learn why every button needs a resistor, and solve the problem that trips up almost every beginner: **bouncing**.

Everything here uses the course board, the **Arduino Nano ESP32**. Its pins work at **3.3 V**, so we power the button from the **3.3V** pin, never from 5 V.

## 1. How a push button is built

The small square button in your kit is called a **tactile switch**. Inside it there are only a few parts:

- a **plunger** on top, the part your finger presses;
- a thin **metal dome** that works as the spring;
- metal **contacts** in the plastic base;
- four **legs**, the metal pins that come out of the bottom.

When you press, the dome snaps down and touches the middle contact, which closes the circuit. You can even feel and hear the "click". When you let go, the dome springs back up and the circuit opens again.

![Side view, top view and circuit symbol of a push button with its four legs](assets/sensors/button-anatomy.svg)

### Why four legs?

A switch only needs two connections, so why are there four? The legs come in **two pairs**:

- legs **1 and 2** are joined inside the button by a metal strip, so they are **always connected**;
- legs **3 and 4** are also **always connected**;
- **pressing** the button connects the 1–2 pair to the 3–4 pair.

So really it is one switch with two legs on each side. The extra legs make the button sit firmly on the board, and they let a wire pass "through" the button to the other side.

> **Check it yourself:** set a multimeter to continuity mode (the beeping one) and touch two legs. If it beeps without pressing, those two legs are a pair. If it only beeps while you press, they are on different sides of the switch.

## 2. Putting the button on a breadboard

A breadboard hides metal strips under its holes. In the middle area, each column of five holes (a–e) is one strip, and the five holes below the gap (f–j) are another strip. The two halves are **not** connected across the middle gap.

Push the button **across the middle gap**, so two legs are in the top half and two legs in the bottom half. The button's legs are spaced to fit exactly like this.

![The button placed across the breadboard gap, with legs 1-2 in column 5 and legs 3-4 in column 7](assets/sensors/button-breadboard.svg)

Placed like this:

- legs 1 and 2 land in the same column (here column 5), one above the gap and one below. All 10 holes of that column are now one connection.
- legs 3 and 4 land in column 7. All 10 holes of that column are another connection.
- **pressing** the button joins column 5 to column 7.

So you connect one side of your circuit anywhere in column 5, and the other side anywhere in column 7.

> **Common mistake:** if you turn the button a quarter turn, two legs that are always connected end up in two different columns. Wire to those two columns and the button looks "always pressed". The safe trick: connect your wires to two legs that are **diagonal** to each other (1 and 4, or 2 and 3). They are always on different sides of the switch, whichever way the button sits.

## 3. Adding a pull-down resistor

The simplest idea is to connect one side of the button to **3.3V** and the other side to pin **D2**. Pressed, D2 gets 3.3 V and reads HIGH. But what does D2 read when the button is released?

The answer is: **anything**. A released button connects D2 to nothing at all. A pin that is connected to nothing is called **floating**. It acts like a tiny antenna and picks up noise from your hand, from nearby wires and from the mains wiring in the walls. It reads random HIGHs and LOWs, and your program thinks the button is being pressed by a ghost.

The fix is a **pull-down resistor**: a 10 kΩ resistor from D2 to **GND**.

![Without a resistor the pin floats; with a 10 kΩ pull-down it reads LOW when released and HIGH when pressed](assets/sensors/button-pulldown.svg)

- **Released:** the resistor gently "pulls" D2 down to GND, so it reads **LOW**.
- **Pressed:** the button connects D2 straight to 3.3V. The button wins over the resistor, so D2 reads **HIGH**.

### Why 10 kΩ?

- **Not 0 Ω (a plain wire):** pressing the button would connect 3.3V directly to GND. That is a short circuit.
- **Not too small:** current flows through the resistor every time you press. With 10 kΩ it is only 3.3 V ÷ 10 000 Ω = 0.33 mA, which is nothing.
- **Not too big:** a huge resistor (say 10 MΩ) pulls so weakly that noise can still win, and the pin starts to float again.

Anything from about 4.7 kΩ to 47 kΩ works. 10 kΩ is the usual choice. Its colour bands are **brown, black, orange**.

### Wiring it on the breadboard

![Breadboard wiring: 3.3V to the + rail, a jumper to the button, D2 and a 10 kΩ resistor to GND on the other side](assets/sensors/button-pulldown-breadboard.svg)

1. Connect the Nano ESP32 **3.3V** pin to the **+** rail, and **GND** to the **−** rail.
2. Put the button across the middle gap.
3. A short wire from the **+** rail to one side of the button (the red column).
4. A wire from the other side of the button (the green column) to **D2**.
5. The 10 kΩ resistor from that same green column to the **−** rail.

## 4. Reading HIGH or LOW with the Arduino

```c
const int BUTTON_PIN = D2;

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT);          // a plain input: our resistor does the pulling
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  int state = digitalRead(BUTTON_PIN); // HIGH (1) or LOW (0)

  if (state == HIGH) {
    Serial.println("Pressed");
    digitalWrite(LED_BUILTIN, HIGH);   // the LED follows the button
  } else {
    Serial.println("Released");
    digitalWrite(LED_BUILTIN, LOW);
  }
  delay(100);
}
```

Open **Tools → Serial Monitor** and set it to **115200 baud**. Press the button and watch the text change, and the board's orange LED light up.

With a pull-down resistor the logic is the "natural" one: **pressed = HIGH**, released = LOW.

> **Pin names on the Nano ESP32:** write `D2`, not just `2`. The board can number its pins in two ways (Arduino numbers or the ESP32 chip's GPIO numbers), and `D2` always means the pin printed "D2" on the board.

**Try it:** pull the resistor out and run the sketch again. Move your finger near the wires without pressing. The "floating" pin starts printing random values.

## 5. Bouncing

Now let's count presses. This sketch looks for the moment the pin goes from LOW to HIGH:

```c
const int BUTTON_PIN = D2;
int lastState = LOW;
int presses = 0;

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT);
}

void loop() {
  int state = digitalRead(BUTTON_PIN);
  if (state == HIGH && lastState == LOW) {   // it just went from LOW to HIGH
    presses++;
    Serial.print("Presses: ");
    Serial.println(presses);
  }
  lastState = state;
}
```

Press the button ten times. Sometimes the counter jumps by 2 or 3 for a single press. The code is right; the button is the problem.

When the metal dome hits the contact, it doesn't land cleanly. It bounces up and down a few times, like a ball dropped on the floor, before it settles. This takes only about **1 to 5 milliseconds**, far too fast for you to notice. But the ESP32 reads the pin millions of times a second, so it sees every single bounce as a separate press. It can happen on release too.

![What you expect: one clean step. What really happens: several quick HIGH-LOW pulses before the signal settles](assets/sensors/bounce.svg)

Fixing this is called **debouncing**. It can be done in hardware or in software.

## 6. Debouncing in hardware

The idea is to make the pin voltage change **slowly**, so the short bounces are smoothed out before they reach the pin. We add a resistor and a capacitor, called an **RC filter**:

![A 10 kΩ resistor in series and a 1 µF capacitor to GND smooth the bouncing signal into a slow rise at D2](assets/sensors/debounce-rc.svg)

- A **capacitor** is like a small bucket for charge. The voltage on it can't jump; it only rises as the capacitor fills up.
- The **10 kΩ resistor in series** limits how fast it can fill.
- When you press, the capacitor fills smoothly, so the voltage at D2 climbs in one gentle curve. Each bounce lasts far too short a time to empty the bucket, so the pin never sees it.

How slow is "slow"? Multiply the resistor by the capacitor: **R × C = 10 kΩ × 1 µF = 10 ms**. That is longer than the bounces, but still far too fast for a person to notice.

- **Pros:** no extra code, and it works with any program.
- **Cons:** two more parts for every button. For very clean edges, engineers also add a **Schmitt trigger** chip (such as the 74HC14) after the filter, which turns the slow curve back into a sharp step.

## 7. Debouncing in software: `debouncedRead()`

Most projects fix bouncing in code, because code is free. The idea is simple:

1. Read the pin.
2. If it is **different** from last time, something is happening, but it might still be bouncing. **Wait 5 ms.**
3. Read it **again**. By now the bouncing is over, so this value can be trusted.

If nothing changed, there is nothing to check, so the function returns at once and the program is not slowed down.

![Software debouncing: a change is seen, the code waits 5 ms, then reads the now-steady pin again](assets/sensors/debounce-software.svg)

```c
const int BUTTON_PIN = D2;
int lastState = LOW;
int presses = 0;

// Reads a pin but ignores the bouncing.
// lastState is the value this pin had last time.
int debouncedRead(int pin, int lastState) {
  int state = digitalRead(pin);
  if (state != lastState) {      // a change! but it may still be bouncing...
    delay(5);                    // ...so wait 5 ms
    state = digitalRead(pin);    // ...and read again
  }
  return state;
}

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT);
}

void loop() {
  int state = debouncedRead(BUTTON_PIN, lastState);
  if (state == HIGH && lastState == LOW) {
    presses++;
    Serial.print("Presses: ");
    Serial.println(presses);
  }
  lastState = state;
}
```

The only change from the counter in part 5 is that `digitalRead()` became `debouncedRead()`. Now each press counts exactly once.

A few things to notice:

- If the second read gives back the **old** value, the "change" was just a short spike of noise, and it is ignored. That is a bonus.
- The function takes `lastState` as a parameter instead of keeping it inside. That way you can use the same function for several buttons, each with its own `lastState` variable.
- **5 ms** is enough for the buttons in your kit. A big, old or cheap switch may bounce longer. If it still double-counts, try 10 or 20 ms.
- While `delay(5)` runs, the board does nothing else. For a button that is fine. Later we will learn to wait with `millis()` without stopping the program.

## Extra: the built-in pull-up resistor

You don't always need to add a resistor yourself. Inside the ESP32 chip, every pin has a resistor (about **45 kΩ**) that can be connected to 3.3V by software. This is the **internal pull-up**, and `INPUT_PULLUP` switches it on.

With the pull-up inside the chip, the wiring gets simpler: the button goes between **D2** and **GND**, and that's it. No resistor and no 3.3V wire.

![The internal pull-up resistor inside the Nano ESP32 holds D2 HIGH; pressing the button connects D2 to GND](assets/sensors/button-pullup.svg)

The catch is that the logic is **upside down**:

- **Released:** the internal resistor pulls D2 up to 3.3V, so it reads **HIGH**.
- **Pressed:** the button connects D2 to GND, so it reads **LOW**.

The same counter with the internal pull-up only needs three small changes:

```c
const int BUTTON_PIN = D2;
int lastState = HIGH;                  // 1. released is now HIGH
int presses = 0;

int debouncedRead(int pin, int lastState) {
  int state = digitalRead(pin);
  if (state != lastState) {
    delay(5);
    state = digitalRead(pin);
  }
  return state;
}

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);   // 2. switch on the internal pull-up
}

void loop() {
  int state = debouncedRead(BUTTON_PIN, lastState);
  if (state == LOW && lastState == HIGH) {   // 3. a press is now HIGH -> LOW
    presses++;
    Serial.print("Presses: ");
    Serial.println(presses);
  }
  lastState = state;
}
```

| | External pull-down | Internal pull-up |
|---|---|---|
| Button connects D2 to | 3.3V | GND |
| Extra parts | 10 kΩ resistor | None |
| `pinMode` | `INPUT` | `INPUT_PULLUP` |
| Released reads | LOW | HIGH |
| Pressed reads | HIGH | LOW |

> **Good to know:** the ESP32 also has an internal **pull-down**, switched on with `INPUT_PULLDOWN`. The classic Arduino Uno only has the pull-up, which is why most Arduino examples you find online use `INPUT_PULLUP` and "pressed = LOW".

## Challenges

1. **Bounce hunter:** run the counter from part 5 without debouncing. Press 20 times and write down the count. Then switch to `debouncedRead()` and do it again.
2. **Toggle switch:** each press turns the LED on, the next press turns it off. Without debouncing, what happens?
3. **Two buttons:** add a second button with the internal pull-up. One button counts up, the other counts down. Use one `debouncedRead()` function and two `lastState` variables.
4. **How long was it pressed?** Use `millis()` to measure how long the button was held down, and print it when you let go.
