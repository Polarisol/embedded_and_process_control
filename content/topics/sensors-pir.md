# PIR motion sensor

**What it is:** PIR stands for **Passive InfraRed**. Every warm body glows in infrared light, which our eyes can't see. The white dome is a lens that splits the room into zones; when a warm body moves from one zone to the next, the sensor notices the change. It doesn't send anything out, it only watches, which is why it is "passive".

**Used for:** lights that turn on when you walk into a room, burglar alarms, automatic doors and hand dryers.

**How it talks:** **digital**. The common HC-SR501 module has three pins: power, GND and OUT. OUT goes HIGH for a few seconds when it sees motion. It outputs 3.3 V, so it is safe for ESP boards too.

![PIR motion sensor](assets/sensors/pir.svg)

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

## Challenge

**Burglar alarm:** when the PIR sees motion, flash an LED until someone presses the button.
