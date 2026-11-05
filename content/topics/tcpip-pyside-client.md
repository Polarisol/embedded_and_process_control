# TCP/IP Client in PySide6

In the TCP item we saw that the **client** is the side that **starts** the connection. Now let's write one: a small desktop app that connects to a server at the press of a button, sends lines of text and shows what comes back.

## The tool: `QTcpSocket`

PySide6 comes with **`QTcpSocket`** (in `PySide6.QtNetwork`). It works like `QSerialPort` from the Serial in PySide item: you **don't write a loop** and you **never wait**. Every call returns at once, and the socket tells you what happened through **signals**, which Qt's **event loop** (`app.exec()`) delivers to your functions.

| Signal | Fires when… |
|--------|-------------|
| `connected` | the handshake is done and you can send |
| `readyRead` | new bytes arrived |
| `disconnected` | the other side closed the connection |
| `errorOccurred` | something went wrong (nobody listening, no route, timeout…) |

## The steps

1. **Create** the socket: `QTcpSocket(self)`.
2. **Connect the signals** to your functions, before anything can happen.
3. **Connect to the server**: `connectToHost("192.168.1.20", 5000)`. This only **starts** the handshake and returns at once. You may send only after `connected` fires.
4. **Write** text: `write((text + "\n").encode())`. TCP sends **bytes**, so encode the string, and end each message with `\n` so the other side knows where it ends.
5. **Read** text in the `readyRead` function: while `canReadLine()`, call `readLine()` and decode it.
6. **Close** when you're done: `disconnectFromHost()`.

## The app

![The finished app: a Connect/Disconnect toggle at the top (pressed, showing Disconnect), a log of sent ▶ and received ◀ lines, and a text box with a Send button at the bottom](assets/tcpip-pyside/client-window.svg)

The whole window is one class, `ClientWindow`, built from four widgets:

| Widget | Where | What it does |
|--------|-------|--------------|
| `QPushButton` "Connect" | top | a **toggle** (`setCheckable(True)`): press it to connect, press again to disconnect |
| `QTextEdit` | middle | read-only; shows everything sent (▶), received (◀) and the connection messages |
| `QLineEdit` | bottom | the line to send |
| `QPushButton` "Send" | bottom, next to the line | sends the line (Enter does the same) |

Pressing the toggle only **asks** for a connection. The button's text and the Send controls follow the **socket**, not the click: `set_connected()` is called from `connected`, `disconnected` and `errorOccurred`, so if nobody is listening the toggle pops back up to "Connect" by itself, and you can't press Send before there is somewhere to send to.

The toggle uses the `clicked` signal, not `toggled`. `clicked` fires only when the **user** presses the button, while `toggled` would also fire every time our own code calls `setChecked()`, and the app would start connecting and disconnecting itself.

```python
import sys
from PySide6.QtWidgets import (QApplication, QWidget, QVBoxLayout, QHBoxLayout,
                               QPushButton, QTextEdit, QLineEdit)
from PySide6.QtNetwork import QTcpSocket

HOST = "127.0.0.1"   # the server's address (this computer, for a first test)
PORT = 5000          # the port the server listens on

class ClientWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("TCP Client")

        # The GUI
        self.connect_button = QPushButton("Connect")    # top: the connect / disconnect toggle
        self.connect_button.setCheckable(True)
        self.text_box = QTextEdit()                     # middle: everything sent and received
        self.text_box.setReadOnly(True)
        self.line_edit = QLineEdit()                    # bottom: the line to send...
        self.line_edit.setPlaceholderText("Type a message…")
        self.send_button = QPushButton("Send")          # ...and the button that sends it

        bottom_row = QHBoxLayout()
        bottom_row.addWidget(self.line_edit)
        bottom_row.addWidget(self.send_button)
        layout = QVBoxLayout(self)
        layout.addWidget(self.connect_button)
        layout.addWidget(self.text_box)
        layout.addLayout(bottom_row)

        self.set_connected(False)   # nothing to send to yet

        # 1. Create the socket
        self.socket = QTcpSocket(self)

        # 2. Connect signals to functions
        self.socket.connected.connect(self.on_connected)
        self.socket.disconnected.connect(self.on_disconnected)
        self.socket.errorOccurred.connect(self.on_error)
        self.socket.readyRead.connect(self.receive)
        self.connect_button.clicked.connect(self.toggle_connection)
        self.send_button.clicked.connect(self.send)
        self.line_edit.returnPressed.connect(self.send)   # Enter works too

    def set_connected(self, connected):
        # Keep the buttons in step with the connection
        self.connect_button.setChecked(connected)
        self.connect_button.setText("Disconnect" if connected else "Connect")
        self.line_edit.setEnabled(connected)
        self.send_button.setEnabled(connected)

    def toggle_connection(self, checked):
        if checked:
            # 3. Start connecting (returns at once; "connected" fires later)
            self.text_box.append(f"Connecting to {HOST}:{PORT}…")
            self.connect_button.setText("Connecting…")
            self.socket.connectToHost(HOST, PORT)
        else:
            # 6. Close the connection
            self.socket.disconnectFromHost()
            self.set_connected(False)   # in case we were still connecting

    def on_connected(self):
        self.text_box.append("Connected")
        self.set_connected(True)

    def on_disconnected(self):
        self.text_box.append("Disconnected")
        self.set_connected(False)

    def on_error(self):
        self.text_box.append("Error: " + self.socket.errorString())
        self.socket.abort()
        self.set_connected(False)

    def send(self):
        # 4. Write a line of text
        text = self.line_edit.text()
        if not text:
            return
        self.socket.write((text + "\n").encode())   # Note the added '\n' and the encoding
        self.text_box.append("▶ " + text)
        self.line_edit.clear()

    def receive(self):
        # 5. Read every complete line that has arrived
        while self.socket.canReadLine():   # only lines that end with '\n'
            line = self.socket.readLine().data().decode(errors="replace").strip()   # Note the decoding
            self.text_box.append("◀ " + line)

    def closeEvent(self, event):
        # 6. Close the connection when the window closes
        self.socket.disconnectFromHost()
        event.accept()

app = QApplication(sys.argv)
window = ClientWindow()
window.show()
sys.exit(app.exec())   # the event loop starts here and does all the waiting
```

## Something to talk to

You need a server listening on port `5000`. Run the app from the next item, **TCP/IP Server in PySide6**, or on Linux or Mac open a terminal and run `nc -l 5000`. Then start the client, press **Connect**, type a line and press **Send**. Whatever you type in the `nc` terminal shows up in the client.

To reach another computer or an ESP32 server, change `HOST` to its address on the same Wi-Fi.

## Why the event loop matters

`readyRead` fires when **some** bytes arrive, not necessarily a whole message. TCP is a **stream**: `"temp=23.5\n"` may arrive as `"tem"` and then `"p=23.5\n"`, and two short lines may arrive together. `QTcpSocket` keeps the bytes in a buffer, and `canReadLine()` tells you when a full line is there. The rest waits for the next `readyRead`.

Meanwhile the window stays alive: while the socket is connecting or waiting for data, the event loop keeps handling clicks and typing. Never use `waitForConnected()` or `waitForReadyRead()` in a GUI, because they block just like a `while` loop and freeze the window.

## Summary

- The window is a class: a **Connect/Disconnect toggle** on top, a `QTextEdit` log, and a `QLineEdit` with a **Send** button.
- The toggle only starts or closes the connection. Update the buttons from the socket's signals, and use `clicked`, not `toggled`.
- `QTcpSocket` + signals: `connected`, `readyRead`, `disconnected`, `errorOccurred`.
- `connectToHost()` only **starts** connecting. Send after `connected` fires.
- Send **bytes**: `write((text + "\n").encode())`, with `\n` marking the end of each message.
- Read in `readyRead`, only **complete lines**, with `canReadLine()` / `readLine()`.
- Let `app.exec()` do the waiting. No loops, no `waitFor…()`.
