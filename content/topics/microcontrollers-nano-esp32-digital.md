# Nano ESP32 Digital Pins

A **digital** pin knows only two states: **HIGH** and **LOW**. On the Nano ESP32, HIGH is **3.3 V** and LOW is **0 V**. In code, HIGH is also `1` and LOW is `0`, the same bits you met in Binary Representation.

Two states sound like very little, but they are enough to switch an LED on and off, read a button, talk to a sensor, and even set the speed of a motor.

![The Nano ESP32 with its digital pins highlighted: D0 to D13 on the right, with D13 as the LED L and SPI SCK, D10 to D12 as SPI, D0 and D1 as Serial0; A0 to A7 on the left also work as digital pins, with A4 and A5 as I2C](assets/nano-esp32/digital-pins.svg)

## Which pins are digital?

| Pins | Notes |
|------|-------|
| **D2 – D9** | Free for anything you like. Start with these |
| **D10 – D13** | Also the **SPI** bus, used by some displays and SD cards. **D13** is also connected to the **LED "L"** on the board |
| **D0, D1** | Also the hardware serial port **Serial0** (RX and TX). The Serial Monitor uses the USB cable, not these pins, so you can use them when you don't need Serial0 |
| **A0 – A7** | The analog pins can work as digital pins too. **A4** and **A5** are also the **I2C** bus, used by many sensors |

> **Write the pin names the way they are printed on the board:** `D2`, `D13`, `A0`. Arduino defines these names for the Nano ESP32, so your code always means the right pin.

## What can a digital pin do?

Before you use a pin, you tell it what its job is with `pinMode()`, usually in `setup()`:

| `pinMode(pin, ...)` | The pin's job |
|---------------------|---------------|
| `OUTPUT` | The board sets the pin to HIGH or LOW |
| `INPUT` | The board reads the pin. Something outside must hold it HIGH or LOW |
| `INPUT_PULLUP` | Read the pin, with a resistor inside the board that holds it HIGH when nothing pulls it down |
| `INPUT_PULLDOWN` | Read the pin, with a resistor inside the board that holds it LOW when nothing pulls it up |

There are three things you'll do with a digital pin: **write** to it, **read** from it, and make **PWM** with it.

## 1. Output: `digitalWrite()`

As an output, the pin is a switch that connects to 3.3 V (HIGH) or to 0 V (LOW). Connect an LED with a resistor between the pin and GND, and HIGH turns it on:

![Two circuits side by side: digitalWrite(D2, HIGH) puts 3.3 V on D2, current flows through a 220 ohm resistor and the LED to GND and the LED lights; digitalWrite(D2, LOW) puts 0 V on D2 and the LED is off](assets/nano-esp32/digital-output.svg)

```c
const int LED_PIN = D2;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);  // 3.3 V: LED on
  delay(1000);
  digitalWrite(LED_PIN, LOW);   // 0 V: LED off
  delay(1000);
}
```

This is the same blink program from the Overview, with an LED you connected yourself instead of the LED "L".

**How much can a pin give?** A pin can safely give about **20 mA**, and never more than 40 mA. That is enough for an LED with a resistor, a buzzer or the input of another chip. It is **not** enough for a motor, a relay or a strip of LEDs. For those, the pin switches a **MOSFET** or a driver that does the heavy work (see the [MOSFETs](topic.html?id=electronics) item in the Electronics unit).

## 2. Input: `digitalRead()`

As an input, the pin measures the voltage on it and decides if it is HIGH or LOW. `digitalRead(pin)` gives back `HIGH` or `LOW`.

![Left: a voltage scale where above about 2.5 V reads HIGH, below about 0.8 V reads LOW, and the band between is unclear. Right: with INPUT_PULLUP, a resistor inside the board pulls D2 up to 3.3 V; a button joins D2 to GND, so released reads HIGH and pressed reads LOW](assets/nano-esp32/digital-input.svg)

- Above about **2.5 V** the pin reads **HIGH**.
- Below about **0.8 V** it reads **LOW**.
- In between, the result is unclear and can change from one reading to the next. Good circuits never leave a pin there.

**A pin connected to nothing "floats".** It picks up electrical noise and reads random HIGHs and LOWs. That's why a button is wired with a **pull-up** (or pull-down) resistor. The Nano ESP32 has both inside every pin, so you don't need to add one: `INPUT_PULLUP` switches it on. Connect the button between the pin and GND. Released, the pull-up holds the pin HIGH. Pressed, the button joins it to GND and it reads LOW.

This program lights the LED on D2 while the button on D3 is pressed:

```c
const int LED_PIN = D2;
const int BUTTON_PIN = D3;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);   // switch on the pull-up inside the board
}

void loop() {
  if (digitalRead(BUTTON_PIN) == LOW) {   // pressed = LOW
    digitalWrite(LED_PIN, HIGH);
  } else {
    digitalWrite(LED_PIN, LOW);
  }
}
```

The Push button and Buttons Advanced items in the [Sensors](topic.html?id=sensors) unit go deeper into buttons, bouncing and debouncing.

## 3. PWM: `analogWrite()`

A digital pin can only be 3.3 V or 0 V. So how do you make an LED glow at **half** brightness, or a motor spin at half speed? You switch the pin on and off very fast, about a thousand times a second. This is called **PWM** (Pulse Width Modulation), and the share of time the pin is on is the **duty cycle**.

![PWM signals with 25 %, 50 % and 100 % on-time, the analogWrite values that make them, and the matching motor speed](assets/motors/pwm.svg)

Your eye (or the motor) is too slow to see each pulse, so it feels the **average**. 25 % on looks dim, 100 % on is full brightness. In code, `analogWrite(pin, value)` makes the PWM signal, where `value` goes from **0** (always off) to **255** (always on). This program makes an LED fade in and out:

```c
const int LED_PIN = D2;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  for (int value = 0; value <= 255; value++) {   // fade in
    analogWrite(LED_PIN, value);
    delay(5);
  }
  for (int value = 255; value >= 0; value--) {   // fade out
    analogWrite(LED_PIN, value);
    delay(5);
  }
}
```

On the Nano ESP32, **every D pin can make PWM**, and up to 8 pins can do it at the same time. Don't let the name `analogWrite` fool you: the pin still gives only 3.3 V or 0 V. The Analog Pins item explains why.

## Keep your board alive

- **Never connect more than 3.3 V to a pin.** A 5 V sensor or module needs a voltage divider or a level shifter first.
- **Never connect an output pin straight to GND or 3V3.** When the pin tries to be HIGH while it is wired to GND, it gives far more than 40 mA and gets damaged. Always have a load (like an LED with its resistor) in the way.
- **Motors, relays and anything big go through a MOSFET or a driver,** never straight on the pin.

## Summary

- A digital pin is **HIGH (3.3 V)** or **LOW (0 V)**. Set its job with `pinMode()`.
- `digitalWrite(pin, HIGH/LOW)` sets an output. A pin gives up to about **20 mA**.
- `digitalRead(pin)` reads an input. Use `INPUT_PULLUP` so a button pin never floats.
- `analogWrite(pin, 0–255)` makes **PWM** on any D pin, to dim an LED or set a motor's speed.

## Challenge

**Traffic light:** connect a red, a yellow and a green LED (each with its own resistor) to D2, D3 and D4. Make them run like a real traffic light. Then add a button on D5: when someone presses it, the light finishes its cycle and turns red so a pedestrian can cross.
