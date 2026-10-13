# Serial in PySide

You've got an Arduino talking over USB. Now let's give it a **real desktop app**, with a window, buttons and live data, in about 40 lines of Python.

## The trap: your own `while` loop

The first idea most people have is:

```python
while True:
    line = ser.readline()   # waits until a line arrives...
    label.setText(line)
```

In a GUI this **freezes the window**. While Python sits inside `readline()`, nobody is left to redraw the window or handle clicks, and the OS soon shows *"Not Responding"*.

## The trick: Qt is already looping for you

When you call `app.exec()`, Qt starts its **event loop**. It already waits for clicks, key presses and timers, and it can wait for **serial bytes** too. You don't write a loop. You just say *"when data arrives, call this function"*.

![Left: a while-loop blocks on readline and the window freezes. Right: Qt's event loop handles clicks, keys and serial bytes, and calls receive() when readyRead fires](assets/serial-pyside/event-loop.svg)

The tool for this is **`QSerialPort`**, which comes with PySide6 (no `pyserial` needed). Its **`readyRead`** signal fires whenever new bytes arrive.

| Instead of… | Use |
|-------------|-----|
| `serial.Serial("COM3", 9600)` | `QSerialPort("COM3")` + `setBaudRate(9600)` |
| `while True: ser.readline()` | `port.readyRead.connect(receive)` |
| threads or `time.sleep()` | nothing! The event loop does it |

## The app

![The finished app: a log of received and sent lines, and a text box at the bottom](assets/serial-pyside/app-window.svg)

```python
import sys
from PySide6.QtWidgets import QApplication, QWidget, QVBoxLayout, QPlainTextEdit, QLineEdit
from PySide6.QtSerialPort import QSerialPort
from PySide6.QtCore import QIODevice

class SerialWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Serial in PySide6")

        # 1. The GUI: a log and a text box
        self.log = QPlainTextEdit()
        self.log.setReadOnly(True)
        self.entry = QLineEdit()
        self.entry.setPlaceholderText("Type and press Enter…")
        layout = QVBoxLayout(self)
        layout.addWidget(self.log)
        layout.addWidget(self.entry)

        # 2. The serial port
        self.port = QSerialPort("COM3")      # Linux: "/dev/ttyACM0", Mac: "/dev/cu.usbmodem…"
        self.port.setBaudRate(9600)          # 8N1 is the default
        if not self.port.open(QIODevice.OpenModeFlag.ReadWrite):
            self.log.appendPlainText("Can't open port: " + self.port.errorString())

        # 3. Connect signals to functions
        self.port.readyRead.connect(self.receive)       # bytes arrived
        self.entry.returnPressed.connect(self.send)     # Enter pressed

    def receive(self):
        while self.port.canReadLine():       # handle every complete line waiting
            line = self.port.readLine().data().decode(errors="replace").strip()
            self.log.appendPlainText("◀ " + line)

    def send(self):
        text = self.entry.text()
        self.port.write((text + "\n").encode())
        self.log.appendPlainText("▶ " + text)
        self.entry.clear()

app = QApplication(sys.argv)
window = SerialWindow()
window.show()
sys.exit(app.exec())                         # the event loop starts here
```

Install with `pip install pyside6`, change `"COM3"` to your port and run it. Close the Arduino IDE's Serial Monitor first, because only one program can open a port at a time.

## Something to talk to

Upload this to the Arduino. It echoes back whatever you type and turns the LED on or off:

```c
void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.println("Arduino ready");
}

void loop() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "LED ON")  digitalWrite(LED_BUILTIN, HIGH);
    if (cmd == "LED OFF") digitalWrite(LED_BUILTIN, LOW);
    Serial.println("got: " + cmd);
  }
}
```

Type `LED ON` in your app, press Enter, and watch the board light up. 🎉

## Why `canReadLine()`?

`readyRead` fires when **some** bytes arrive, not necessarily a whole line. `"temp=23.5\n"` might come as `"tem"` and then `"p=23.5\n"`. `QSerialPort` keeps the bytes in a buffer, so we only read once `canReadLine()` says a full line (ending in `\n`) is there. The rest waits for the next `readyRead`.

## Level up

- **Find ports automatically:** `QSerialPortInfo.availablePorts()` lists them. Put their `portName()` in a `QComboBox`.
- **Send on a schedule:** a `QTimer` with `timeout.connect(...)` can ask the Arduino for a reading every second, again with no loop.
- **Plot live data:** feed the numbers from `receive()` into a chart (`pyqtgraph` works well with PySide6).

## Summary

- Never block a GUI with your own `while` loop or `readline()`.
- `app.exec()` is already a loop. Let it do the waiting.
- `QSerialPort` + `readyRead.connect(...)` calls your function exactly when data arrives.
- Read only **complete lines** with `canReadLine()` / `readLine()`.
