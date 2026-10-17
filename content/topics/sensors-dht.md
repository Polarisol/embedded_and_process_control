# DHT11 / DHT22 temperature and humidity sensor

**What it is:** a small blue (DHT11) or white (DHT22) box with holes in it. Inside are a thermistor and a humidity sensor, plus a tiny chip that does the measuring for you.

**Used for:** weather stations, greenhouses, smart thermostats and checking whether a room is too damp.

**How it talks:** **digital data**. Instead of a voltage, the chip sends a 40-bit message over a single wire: humidity, temperature and a checksum to catch errors. The timing is tricky, so we let a library do it. Install **"DHT sensor library" by Adafruit** from the Library Manager.

![DHT11 temperature and humidity sensor](assets/sensors/dht.svg)

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
