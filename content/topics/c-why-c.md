# Why C?

You already know Python, and Python is easier to write. So why learn another language? Because the small computers inside machines mostly run C. If you want to build a robot, a drone or a motor controller, sooner or later you will read and write C.

## C is everywhere in machines

C was created in 1972 and is still one of the most used languages in the world. In mechatronics and robotics you meet it at almost every level:

| Where | What is written in C (or its close relative C++) |
|-------|--------------------------------------------------|
| **Microcontrollers** | Almost all firmware: Arduino, ESP32, STM32, PIC. The Arduino "language" is C/C++ |
| **Motor drives and flight controllers** | The fast control loops that read sensors and drive motors |
| **Industrial equipment** | Robot controllers, PLC runtimes, CNC machines, sensors with a built-in processor |
| **Operating systems** | Linux, Windows and the real-time operating systems used in robots |
| **Your Python tools** | The Python interpreter itself and the core of NumPy are written in C |

Chip manufacturers also publish their code examples and libraries in C. When you buy a new sensor or motor driver, the example code that comes with it is almost always C.

## C and Python side by side

| | Python | C |
|---|--------|---|
| **How it runs** | An interpreter reads the program line by line while it runs | A compiler translates the whole program into machine code before it runs |
| **What it needs** | An interpreter, and usually an operating system | Nothing. The program can run directly on the bare chip |
| **Speed** | Slow | Often 10 to 100 times faster in loops and calculations |
| **Memory** | Managed for you, with a lot of overhead | You decide exactly how many bytes each variable takes |
| **Timing** | Can pause at unexpected moments | Predictable |
| **Hardware** | Reached through libraries | Reached directly, down to a single bit of a single pin |
| **Mistakes** | Clear error messages while running | Many errors found by the compiler, but a running program has no safety net |

The next sections explain why these differences matter in a machine.

## It fits on a small chip

An Arduino Uno has **2 KB** of RAM and **32 KB** of program memory. A Python interpreter does not fit there at all: MicroPython, the small version of Python made for microcontrollers, needs about 256 KB of program memory and 16 KB of RAM before your own program is counted.

A C program has no interpreter to carry around. Only your code and the library functions you really use are put on the chip, so a useful program can take a few kilobytes. Small chips are cheap and use little power, which matters when a product is made by the million or runs on a battery.

Memory use is also under your control. In Python, even a small whole number takes about 28 bytes. In C, an `int` takes 4 bytes and a `char` takes 1 byte, no more.

## It is fast

In Python, each line is examined again every time it runs: what type is this variable, what does `+` mean for it, where is it stored? In C, the compiler answers all these questions once, in advance. What runs on the chip is only the machine code that does the work.

A microcontroller is far weaker than your laptop, so this difference decides what is possible. A motor control loop may need to run thousands of times a second, and each round must read sensors, calculate and update the output.

## Its timing is predictable

In control, being **on time** is as important as being correct. A balancing robot that corrects its motors every 1 ms works well. If one correction comes 20 ms late, it may fall over.

Python cleans up unused memory automatically (this is called **garbage collection**), and it does so when *it* decides. Your program stops for a moment, and you cannot say when or for how long. C has no garbage collector and nothing running behind your back, so the same code takes the same time on every round. This is what makes **real-time** control possible.

## It talks directly to the hardware

On a microcontroller, pins, timers and communication ports are controlled through **registers**: special memory locations inside the chip. C can read and write them directly:

```c
PORTB = PORTB | 0b00100000;   // turn on one pin (the LED on an Arduino Uno)
```

This single line becomes one or two machine instructions. C also lets you write **interrupt** functions, which the chip calls by itself the instant something happens, such as a pulse arriving from a motor encoder.

## You control every byte

Devices talk to each other in bytes. A sensor may send a 16-bit number as exactly two bytes, and a motor driver may expect a command of exactly 5 bytes. C types have a known, fixed size, so you can build and read such messages exactly. You will use this in the units on binary representation and serial communication.

## What Python is still better at

C is not "better" than Python. It is better **for certain jobs**. A Python program is shorter, faster to write and easier to debug, and Python has excellent libraries for data analysis, computer vision and AI.

C makes you do more work, and it protects you less. For example, writing past the end of an array is not stopped with an error message. The program just continues with damaged data.

Many robots therefore use both:

| Part of the robot | Typical job | Language |
|-------------------|-------------|----------|
| The main computer (a PC or a Raspberry Pi) | Vision, path planning, user interface, data logging | Python |
| The microcontrollers | Reading sensors, driving motors, control loops, safety | C |

> **Rule of thumb:** the closer the code is to the hardware, and the more it depends on exact timing, the more likely it is written in C.

The good news is that you already know how to program. The next page shows how the ideas you know from Python are written in C.
