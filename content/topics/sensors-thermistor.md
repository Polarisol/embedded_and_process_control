# Thermistor

**What it is:** a resistor that changes with **temperature**. The common type is **NTC** (Negative Temperature Coefficient): the warmer it gets, the lower its resistance.

**Used for:** fridges, kettles, 3D-printer nozzles, car engines, and the battery in your phone (which stops charging if it gets too hot).

**How it talks:** **analog**, wired exactly like the LDR: thermistor on top, a fixed resistor of the same value (usually 10 kΩ) on the bottom, the middle point to an analog pin. The reading goes up as it warms up. A short formula, or a library, turns the number into °C.

![NTC thermistor: warmer means less resistance](assets/sensors/thermistor.svg)

**Try it:** run the LDR sketch with a thermistor instead and hold it between your fingers. Watch the number climb.
