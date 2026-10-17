# LDR (Light Dependent Resistor)

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

## Challenge

**Light-controlled blink:** use the LDR to set how fast an LED blinks. The darker the room, the faster it blinks.
