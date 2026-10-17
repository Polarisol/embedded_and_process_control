# Push button

**What it is:** two metal contacts and a spring. Press it and the contacts touch; let go and the spring pulls them apart.

**Used for:** keyboards, elevator buttons, game controllers, the "start" button on a microwave, and your first ever embedded project.

**How it talks:** **digital**. The pin reads either HIGH or LOW.

There is one catch. When the button is *not* pressed, the pin is connected to nothing, and a pin connected to nothing "floats": it picks up electrical noise and reads random 1s and 0s. The fix is a **pull-up resistor** that gently holds the pin HIGH until the button pulls it down to GND. Both Arduino and ESP have one built in, and `INPUT_PULLUP` switches it on.

![Button wired between pin D2 and GND, using the internal pull-up resistor](assets/sensors/button.svg)

Notice the result is "upside down": **pressed = LOW**, released = HIGH.

```c
const int BUTTON_PIN = 2;

void setup() {
  Serial.begin(9600);
  pinMode(BUTTON_PIN, INPUT_PULLUP);   // switch on the built-in pull-up
}

void loop() {
  if (digitalRead(BUTTON_PIN) == LOW) {
    Serial.println("Pressed!");
  } else {
    Serial.println("Released");
  }
  delay(100);
}
```

**Fun fact: buttons bounce.** When the metal contacts hit each other they bounce a few times in the first few milliseconds, so one press can look like five presses to a fast microcontroller. Waiting a few milliseconds after a change before believing it is called **debouncing**. The **Buttons Advanced** item explains bouncing and how to fix it.

## Challenge

**Button counter:** print how many times the button was pressed. Does it count more than once per press? Add debouncing.
