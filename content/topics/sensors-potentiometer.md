# Potentiometer

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
