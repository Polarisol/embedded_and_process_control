# The Breadboard

Before you build a real, soldered circuit, you want to try it out, change it and fix your mistakes. A **breadboard** lets you do exactly that. It is a plastic board full of holes: you push the legs of parts and the ends of wires into the holes, and the board connects them for you. No solder, no tools, and you can pull everything out and start again in seconds.

> **Fun fact:** the name is real. Early radio hobbyists built their circuits by hammering nails into a wooden board for cutting bread, and wrapping wires around the nails.

## The parts of a breadboard

![A breadboard with the power rails, a terminal strip column, the center gap and the second half labelled](assets/electronics/breadboard-parts.svg)

| Part | Where | What is connected |
|------|-------|-------------------|
| **Power rails** | The long rows at the top and bottom, marked **+** (red line) and **−** (blue line) | All the holes along one rail, from one end of the board to the other |
| **Terminal strips** | The middle area, columns numbered 1, 2, 3 … and rows lettered a – j | The 5 holes **a, b, c, d, e** of one column. The 5 holes **f, g, h, i, j** of that column are a separate group |
| **Center gap** | The groove across the middle | Nothing. It separates the top half from the bottom half |

So hole **a5** is connected to **b5, c5, d5** and **e5**, and to nothing else. Hole **f5** is *not* connected to **e5**: they are on different sides of the gap.

The rails are not connected to the terminal strips, and the **+** rail is not connected to the **−** rail. You make those connections with wires.

## What is inside?

If you peel off the sticky back of a breadboard, you will see rows of metal clips. Each clip grabs whatever is pushed into the holes above it, and connects all of them together.

![The same breadboard with the hidden metal strips drawn under the holes](assets/electronics/breadboard-inside.svg)

This picture is the one to remember. Whenever you are not sure whether two holes are connected, ask yourself: *are they on the same metal strip?*

## The most common mistake

Every part needs current to flow **through** it, in one leg and out of the other. If both legs of a part are in the same column, they are on the same metal strip, and the current takes the easy way along the strip instead of through the part. The part does nothing.

![Left: a resistor with both legs in one column, which shorts it. Right: a resistor with its legs in two different columns](assets/electronics/breadboard-mistake.svg)

**Rule:** the two legs of a part always go into **two different columns**.

## Chips and boards go across the gap

Chips have two rows of legs. If you push a chip into one half of the board, the legs that line up in a column are shorted together. The center gap solves this: put the chip across it, and every leg gets its own column, with free holes next to it for your wires.

![An 8-leg chip across the center gap, with each leg in its own column](assets/electronics/breadboard-chip.svg)

Our **Arduino Nano ESP32** has pins on both long sides, so it also goes **across the gap**, with the USB connector pointing to the end of the board. Press it in gently and evenly: the pins are thin and bend easily.

## Jumper wires and colors

You connect columns, rails and the board with **jumper wires**. The color does not change anything electrically, but using the same colors every time makes a circuit much easier to read and to debug:

| Color | Use it for |
|-------|------------|
| **Red** | The **+** supply (3.3 V on our board) |
| **Black** or **blue** | **GND** (0 V) |
| Any other color | Signals, e.g. a wire from a pin to an LED or a sensor |

A good habit: start every project by connecting the board's **3V3** pin to a **+** rail and a **GND** pin to a **−** rail. After that, any part that needs power or ground is one short wire away.

> **The Nano ESP32 runs on 3.3 V.** Feed the **+** rail from the **3V3** pin, not from **VBUS** (that is 5 V from the USB cable), so a 5 V signal never reaches an ESP pin.

## Your first circuit: lighting an LED

Here is a full circuit: pin **D2** drives an LED through a 220 Ω resistor, and the LED's other leg goes to GND through the **−** rail.

![Nano ESP32 pin D2 wired to column 5, a 220 ohm resistor from column 5 to 10, an LED from column 10 to 13, and column 13 wired to the GND rail. A schematic of the same circuit is on the right](assets/electronics/breadboard-led.svg)

Follow the current from the pin to GND:

1. A wire takes **D2** to column 5.
2. The **resistor** goes from column 5 to column 10. It limits the current so the LED (and the pin) are not damaged.
3. The **LED** goes from column 10 to column 13. An LED only works one way round: the **long leg** (+, the anode) goes toward the pin, and the **short leg** (−, the cathode) goes toward GND.
4. A wire takes column 13 to the **−** rail, and another wire connects the **−** rail to a **GND** pin.

Compare the breadboard with the schematic next to it. The schematic shows *what is connected to what*; the breadboard is just one way to make those connections. Learning to go from one to the other is a skill you will use in every unit from now on.

Why 220 Ω? The pin gives 3.3 V and a red LED takes about 2 V, so about 1.3 V is left across the resistor. By Ohm's law the current is 1.3 V ÷ 220 Ω ≈ 6 mA: bright enough to see, and well within what a pin can supply.

Upload this sketch and the LED blinks once a second:

```c
const int LED_PIN = D2;   // the pin labelled D2 on the Nano ESP32

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);   // LED on
  delay(500);
  digitalWrite(LED_PIN, LOW);    // LED off
  delay(500);
}
```

## Good habits

- **Unplug the USB cable before you change the wiring.** A wire that slips into the wrong hole while the board is powered can damage it.
- **Never connect the + rail straight to the − rail.** That is a short circuit: a lot of current flows, things get hot, and the board may reset or break.
- **Keep legs short and wires flat.** A tidy board is much easier to check than a "bird's nest" of long wires.
- **Push legs straight in.** If a leg will not go in, do not force it; bent legs are a common reason for a missing connection.
- **Long breadboards may split their rails** in the middle. If the red or blue line has a break in it, the two halves are not connected until you add a short wire across.

## It does not work? Check this list

1. Are both legs of every part in **different columns**?
2. Is the LED the right way round (long leg toward the pin)?
3. Is every part on the correct side of the center gap?
4. Is the **−** rail really connected to a **GND** pin, and is the **+** rail connected to **3V3**?
5. Does your code use the same pin you wired?
6. Wiggle each wire gently. A wire that is only half pushed in makes no contact.

## Challenges

1. Move the LED circuit to the bottom half of the breadboard (rows f – j). Which columns do you use now?
2. Add a second LED with its own resistor on pin **D3**, and make the two LEDs blink one after the other.
3. Find the mistake: a student puts the resistor from **c8** to **e8**. The LED is wired correctly but stays dark. Why?
4. Draw the schematic of challenge 2 on paper, then build it from your drawing.
