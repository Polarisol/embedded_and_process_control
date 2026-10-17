# Ultrasonic distance sensor

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

## Challenge

**Parking sensor:** beep a buzzer faster and faster as your hand gets closer to the ultrasonic sensor.
