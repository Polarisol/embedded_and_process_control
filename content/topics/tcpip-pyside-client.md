# TCP/IP Client in PySide6

In the TCP item we saw that the **client** is the side that **starts** the connection. Now let's write one: a small desktop app that connects to a server, sends lines of text and shows what comes back.

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

```python
import sys
from PySide6.QtWidgets import QApplication, QWidget, QVBoxLayout, QPlainTextEdit, QLineEdit
from PySide6.QtNetwork import QTcpSocket, QAbstractSocket

HOST = "127.0.0.1"   # the server's address (this computer, for a first test)
PORT = 5000          # the port the server listens on

class ClientWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("TCP Client")

        # The GUI: a log and a text box
        self.log = QPlainTextEdit()
        self.log.setReadOnly(True)
        self.entry = QLineEdit()
        self.entry.setPlaceholderText("Type and press Enter…")
        layout = QVBoxLayout(self)
        layout.addWidget(self.log)
        layout.addWidget(self.entry)

        # 1. Create the socket
        self.socket = QTcpSocket(self)

        # 2. Connect signals to functions
        self.socket.connected.connect(lambda: self.log.appendPlainText("Connected"))
        self.socket.disconnected.connect(lambda: self.log.appendPlainText("Disconnected"))
        self.socket.errorOccurred.connect(lambda: self.log.appendPlainText("Error: " + self.socket.errorString()))
        self.socket.readyRead.connect(self.receive)
        self.entry.returnPressed.connect(self.send)

        # 3. Start connecting (returns at once; "connected" fires later)
        self.log.appendPlainText(f"Connecting to {HOST}:{PORT}…")
        self.socket.connectToHost(HOST, PORT)

    def send(self):
        # 4. Write a line of text
        text = self.entry.text()
        self.socket.write((text + "\n").encode()) # Note the added '\n' and the encoding
        self.log.appendPlainText("▶ " + text)
        self.entry.clear()

    def receive(self):
        # 5. Read every complete line that has arrived
        while self.socket.canReadLine(): # only line that ends with '\n'
            line = self.socket.readLine().data().decode(errors="replace").strip() # Note the decoding
            self.log.appendPlainText("◀ " + line)

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

You need a server listening on port `5000`. Run the app from the next item, **TCP/IP Server in PySide6**, or on Linux or Mac open a terminal and run `nc -l 5000`. Then start the client, type a line and press Enter. Whatever you type in the `nc` terminal shows up in the client.

To reach another computer or an ESP32 server, change `HOST` to its address on the same Wi-Fi.

## Why the event loop matters

`readyRead` fires when **some** bytes arrive, not necessarily a whole message. TCP is a **stream**: `"temp=23.5\n"` may arrive as `"tem"` and then `"p=23.5\n"`, and two short lines may arrive together. `QTcpSocket` keeps the bytes in a buffer, and `canReadLine()` tells you when a full line is there. The rest waits for the next `readyRead`.

Meanwhile the window stays alive: while the socket is connecting or waiting for data, the event loop keeps handling clicks and typing. Never use `waitForConnected()` or `waitForReadyRead()` in a GUI, because they block just like a `while` loop and freeze the window.

## Summary

- `QTcpSocket` + signals: `connected`, `readyRead`, `disconnected`, `errorOccurred`.
- `connectToHost()` only **starts** connecting. Send after `connected` fires.
- Send **bytes**: `write((text + "\n").encode())`, with `\n` marking the end of each message.
- Read in `readyRead`, only **complete lines**, with `canReadLine()` / `readLine()`.
- Let `app.exec()` do the waiting. No loops, no `waitFor…()`.
