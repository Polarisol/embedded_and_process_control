# Types of Sensors

A development board on its own is like a brain in a jar: it can think very fast, but it has no idea what is happening around it. **Sensors** are its eyes, ears and skin. A sensor turns something from the real world (a press, a turn, light, heat, motion, distance) into an **electrical signal** the board can read.

Your phone has more than ten of them: it knows when you rotate it, how bright the room is, where you are, and when you hold it to your ear. In this unit we start with the simplest sensors there are, and they already let you build alarms, night lights, thermostats and parking sensors.

## How does a sensor talk to the board?

Every sensor answers in one of four ways. Once you know which way a sensor uses, you already know how to wire it and which function reads it.

![Four signal types: digital, analog, pulse length and digital data](assets/sensors/signal-types.svg)

| Type | What the board sees | Read it with | Examples |
|------|---------------------|--------------|----------|
| **Digital** | Only HIGH or LOW (1 or 0) | `digitalRead(pin)` | Button, tilt switch, PIR motion |
| **Analog** | A voltage anywhere between 0 V and the supply voltage | `analogRead(pin)` | Potentiometer, LDR, thermistor |
| **Pulse length** | How long a pin stays HIGH | `pulseIn(pin, HIGH)` | Ultrasonic distance sensor |
| **Digital data** | A stream of bits that spells out a number | A library | DHT11 / DHT22, and later I²C sensors |

### From voltage to number: the ADC

The board's processor only understands numbers, so analog pins go through an **ADC** (Analog-to-Digital Converter). It measures the voltage and gives you a whole number:

| Board | Supply voltage | ADC resolution | `analogRead()` range |
|-------|----------------|----------------|----------------------|
| Arduino Uno / Nano | 5 V | 10 bits | 0 – 1023 |
| ESP32 | 3.3 V | 12 bits | 0 – 4095 |

So on an Uno, 0 V reads `0`, 5 V reads `1023`, and 2.5 V reads about `512`.

> **ESP boards run on 3.3 V.** Never put 5 V on an ESP pin. Power your sensors from the **3.3V** pin, or lower the sensor's output voltage first (we will see how for the ultrasonic sensor).

## 1. Push button

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

## 2. Potentiometer

**What it is:** a resistor with a third leg, the **wiper**, that slides along it when you turn the knob. It has three legs: the two ends and the wiper in the middle.

**Used for:** volume knobs, dimmer switches, the speed knob on a fan, and joysticks (a joystick is just two potentiometers, one for left-right and one for up-down).

**How it talks:** **analog**. Connect one end to the supply, the other end to GND, and the wiper to an analog pin. Turning the knob slides the wiper from 0 V all the way up to the supply voltage. This circuit is called a **voltage divider**, and you will meet it again and again.

![Potentiometer wired as a voltage divider, with the wiper connected to A0](assets/sensors/potentiometer.svg)

```c
void setup() {
  Serial.begin(9600);
}

void loop() {
  int value = analogRead(A0);              // 0 to 1023 on an Uno
  float volts = value * 5.0 / 1023.0;      // convert back to volts
  Serial.print(value);
  Serial.print("  ->  ");
  Serial.print(volts);
  Serial.println(" V");
  delay(200);
}
```

On an ESP32, use an analog-capable pin such as GPIO 34 (`analogRead(34)`) and change the maths to `value * 3.3 / 4095.0`.

**Try it:** open **Tools → Serial Plotter** in the Arduino IDE and turn the knob. You get a live graph of your hand movement.

## 3. LDR (Light Dependent Resistor)

**What it is:** a small disc with a squiggly line on top. It is a resistor whose resistance **drops when light shines on it**: about 1 kΩ in bright light, and hundreds of kΩ in the dark.

**Used for:** street lights that switch on at dusk, night lights, automatic phone screen brightness (phones use a more precise light sensor, but the idea is the same) and "is the box open?" alarms.

**How it talks:** **analog**. The board can't measure resistance directly, only voltage. So we pair the LDR with a fixed resistor to build a voltage divider, just like the potentiometer. Here the light, not your hand, moves the "wiper".

![LDR on top and a 10 kΩ resistor on the bottom form a voltage divider into A0](assets/sensors/ldr.svg)

```c
const int LED_PIN = 13;
const int DARK_LEVEL = 300;    // adjust this for your room

void setup() {
  Serial.begin(9600);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int light = analogRead(A0);
  Serial.println(light);

  if (light < DARK_LEVEL) {
    digitalWrite(LED_PIN, HIGH);   // it's dark: night light ON
  } else {
    digitalWrite(LED_PIN, LOW);
  }
  delay(200);
}
```

Swap the LDR and the 10 kΩ resistor and the readings flip: bright light then gives a *low* number. Neither way is wrong, just remember which one you built.

## 4. Thermistor

**What it is:** a resistor that changes with **temperature**. The common type is **NTC** (Negative Temperature Coefficient): the warmer it gets, the lower its resistance.

**Used for:** fridges, kettles, 3D-printer nozzles, car engines, and the battery in your phone (which stops charging if it gets too hot).

**How it talks:** **analog**, wired exactly like the LDR: thermistor on top, a fixed resistor of the same value (usually 10 kΩ) on the bottom, the middle point to an analog pin. The reading goes up as it warms up. A short formula, or a library, turns the number into °C.

**Try it:** run the LDR sketch with a thermistor instead and hold it between your fingers. Watch the number climb.

## 5. Tilt switch

**What it is:** a tiny tube with a metal ball inside. When the tube is upright, the ball rests on two contacts and connects them. Tip it over and the ball rolls away.

**Used for:** toys that wake up when you pick them up, old pinball machines ("TILT!"), and heaters that switch off if they fall over.

**How it talks:** **digital**. Wire and code it exactly like the button, with `INPUT_PULLUP`. It is a button that is pressed by gravity.

![Thermistor, tilt switch, PIR motion sensor and DHT11 temperature and humidity sensor](assets/sensors/more-sensors.svg)

## 6. PIR motion sensor

**What it is:** PIR stands for **Passive InfraRed**. Every warm body glows in infrared light, which our eyes can't see. The white dome is a lens that splits the room into zones; when a warm body moves from one zone to the next, the sensor notices the change. It doesn't send anything out, it only watches, which is why it is "passive".

**Used for:** lights that turn on when you walk into a room, burglar alarms, automatic doors and hand dryers.

**How it talks:** **digital**. The common HC-SR501 module has three pins: power, GND and OUT. OUT goes HIGH for a few seconds when it sees motion. It outputs 3.3 V, so it is safe for ESP boards too.

```c
const int PIR_PIN = 2;

void setup() {
  Serial.begin(9600);
  pinMode(PIR_PIN, INPUT);
}

void loop() {
  if (digitalRead(PIR_PIN) == HIGH) {
    Serial.println("Motion detected!");
  }
  delay(200);
}
```

Give it about a minute after power-up to "learn" the room before trusting it. The two little orange knobs on the module set how sensitive it is and how long OUT stays HIGH.

## 7. Ultrasonic distance sensor

**What it is:** the HC-SR04 has two "eyes", but they are really a tiny speaker and a microphone. It shouts a short beep at 40 kHz, far too high for humans to hear, and listens for the echo, exactly like a bat or a dolphin.

**Used for:** car parking sensors, robots that avoid walls, tank level meters and touch-free tape measures.

**How it talks:** **pulse length**. You send a 10 µs pulse on **TRIG**. The sensor then holds **ECHO** HIGH for as long as the sound took to fly to the object and back. The longer the pulse, the farther the object.

![Ultrasonic sensor sends a ping, the echo returns, and the ECHO pin stays HIGH for the travel time](assets/sensors/ultrasonic.svg)

```c
const int TRIG_PIN = 9;
const int ECHO_PIN = 10;

void setup() {
  Serial.begin(9600);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
}

void loop() {
  // send a 10 µs pulse to start a measurement
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH);   // microseconds
  float cm = duration * 0.0343 / 2;          // there and back again

  Serial.print(cm);
  Serial.println(" cm");
  delay(100);
}
```

Why divide by 2? The sound goes to the object **and back**, so it travels the distance twice.

> **ESP warning:** the HC-SR04 needs 5 V, and its ECHO pin answers with 5 V. Feed ECHO into the ESP through a voltage divider (for example 1 kΩ and 2 kΩ) to bring it down to about 3.3 V, or use the 3.3 V version, the HC-SR04P.

## 8. DHT11 / DHT22 temperature and humidity sensor

**What it is:** a small blue (DHT11) or white (DHT22) box with holes in it. Inside are a thermistor and a humidity sensor, plus a tiny chip that does the measuring for you.

**Used for:** weather stations, greenhouses, smart thermostats and checking whether a room is too damp.

**How it talks:** **digital data**. Instead of a voltage, the chip sends a 40-bit message over a single wire: humidity, temperature and a checksum to catch errors. The timing is tricky, so we let a library do it. Install **"DHT sensor library" by Adafruit** from the Library Manager.

```c
#include <DHT.h>

DHT dht(2, DHT11);    // data pin 2, sensor type DHT11 (or DHT22)

void setup() {
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  float temp = dht.readTemperature();   // °C
  float hum  = dht.readHumidity();      // %
  Serial.print(temp);
  Serial.print(" °C   ");
  Serial.print(hum);
  Serial.println(" %");
  delay(2000);          // the DHT11 can only measure about once a second
}
```

This is your first taste of sensors that send their reading as **data**. Many advanced sensors (accelerometers, pressure sensors, colour sensors) work this way, often over a two-wire bus called **I²C**.

## Cheat sheet

| Sensor | Measures | Signal type | Read with |
|--------|----------|-------------|-----------|
| Push button | A press | Digital | `digitalRead()` + `INPUT_PULLUP` |
| Tilt switch | Tilting | Digital | `digitalRead()` + `INPUT_PULLUP` |
| PIR | Movement of warm bodies | Digital | `digitalRead()` |
| Potentiometer | Knob position | Analog | `analogRead()` |
| LDR | Light | Analog (voltage divider) | `analogRead()` |
| Thermistor | Temperature | Analog (voltage divider) | `analogRead()` |
| HC-SR04 | Distance | Pulse length | `pulseIn()` |
| DHT11 / DHT22 | Temperature and humidity | Digital data | DHT library |

## Challenges

1. **Light-controlled blink:** use the LDR to set how fast an LED blinks. The darker the room, the faster it blinks.
2. **Button counter:** print how many times the button was pressed. Does it count more than once per press? Add debouncing.
3. **Parking sensor:** beep a buzzer faster and faster as your hand gets closer to the ultrasonic sensor.
4. **Burglar alarm:** when the PIR sees motion, flash an LED until someone presses the button.
