# TCP/IP Server in PySide6

The **server** is the side that is switched on first, **listens** on a port and waits for clients. Let's build one: a desktop app that accepts any number of clients, shows what they send, answers them, and lets you send a line to all of them.

## The tools: `QTcpServer` and `QTcpSocket`

A server needs two kinds of objects:

- One **`QTcpServer`**, which listens on a port. When a client connects, it fires **`newConnection`**.
- One **`QTcpSocket`** for **each** connected client. You get it from `nextPendingConnection()`, and from then on you use it exactly like the socket in the client item: `readyRead`, `readLine()`, `write()`, `disconnected`.

As in the client, there are no loops and no waiting. Qt's event loop calls your functions when a client connects, sends a line or leaves.

## The steps

1. **Create** the server: `QTcpServer(self)`.
2. **Connect** its `newConnection` signal to your function.
3. **Listen**: `listen(QHostAddress.SpecialAddress.Any, 5000)`. `Any` means "accept clients from any network card", so other computers and ESP32 boards can connect too. It returns `False` if the port is taken.
4. In `newConnection`, call **`nextPendingConnection()`** to get the client's socket, keep it in a list, and connect its `readyRead` and `disconnected` signals.
5. **Read and write** text on each client's socket, just like in the client.
6. When a client **disconnects**, remove it from the list and call `deleteLater()` on its socket.

## The app

```python
import sys
from PySide6.QtWidgets import QApplication, QWidget, QVBoxLayout, QPlainTextEdit, QLineEdit
from PySide6.QtNetwork import QTcpServer, QHostAddress

PORT = 5000

class ServerWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("TCP Server")

        # The GUI: a log and a text box
        self.log = QPlainTextEdit()
        self.log.setReadOnly(True)
        self.entry = QLineEdit()
        self.entry.setPlaceholderText("Type and press Enter to send to all clients…")
        layout = QVBoxLayout(self)
        layout.addWidget(self.log)
        layout.addWidget(self.entry)
        self.entry.returnPressed.connect(self.send_to_all)

        self.clients = []   # one QTcpSocket per connected client

        # 1-3. Create the server, connect its signal, and listen
        self.server = QTcpServer(self)
        self.server.newConnection.connect(self.on_new_connection)
        if self.server.listen(QHostAddress.SpecialAddress.Any, PORT):
            self.log.appendPlainText(f"Listening on port {PORT}")
        else:
            self.log.appendPlainText("Can't listen: " + self.server.errorString())

    def on_new_connection(self):
        # 4. Take every client that is waiting, and connect its signals
        while self.server.hasPendingConnections():
            client = self.server.nextPendingConnection()
            self.clients.append(client)
            client.readyRead.connect(self.receive)
            client.disconnected.connect(self.on_disconnected)
            self.log.appendPlainText(f"{self.name(client)} connected")

    def receive(self):
        # 5. Read every complete line from the client that sent it, and answer it
        client = self.sender()   # the socket whose readyRead called us
        while client.canReadLine():
            line = client.readLine().data().decode(errors="replace").strip()
            self.log.appendPlainText(f"◀ {self.name(client)}: {line}")
            client.write(("got: " + line + "\n").encode())

    def send_to_all(self):
        text = self.entry.text()
        for client in self.clients:
            client.write((text + "\n").encode())
        self.log.appendPlainText(f"▶ all ({len(self.clients)}): {text}")
        self.entry.clear()

    def on_disconnected(self):
        # 6. Forget the client that left, and free its socket
        client = self.sender()   # the socket whose disconnected called us
        self.log.appendPlainText(f"{self.name(client)} disconnected")
        self.clients.remove(client)
        client.deleteLater()

    def closeEvent(self, event):
        # Close every connection when the window closes
        for client in self.clients[:]:   # a copy, because on_disconnected changes the list
            client.disconnectFromHost()
        event.accept()

    def name(self, client):
        return f"{client.peerAddress().toString()}:{client.peerPort()}"

app = QApplication(sys.argv)
window = ServerWindow()
window.show()
sys.exit(app.exec())   # the event loop starts here
```

Which client was it? All the clients' `readyRead` signals are connected to the same `receive` method, and all their `disconnected` signals to the same `on_disconnected`. Inside a method called by a signal, **`self.sender()`** returns the object that sent the signal, so it tells us which client's socket it was.

## Something to talk to

- **On the same computer:** start the server, then start the client app from the previous item (it connects to `127.0.0.1:5000`). Start two clients and use the server's text box to talk to both. On Linux or Mac you can also run `nc 127.0.0.1 5000` in a terminal.
- **From another device:** find your computer's address (`ipconfig` on Windows, `ip -4 -br addr` on Linux) and connect to it from another computer or an ESP32. The first time, Windows asks whether to allow the program through the **firewall**: allow it on private networks.

An ESP32 client that sends a line every second and prints the answers:

```c
#include <WiFi.h>

WiFiClient client;

void setup() {
  Serial.begin(115200);
  WiFi.begin("MyWiFi", "password");
  while (WiFi.status() != WL_CONNECTED) delay(200);
}

void loop() {
  if (!client.connected()) {               // (re)connect to the PySide6 server
    client.connect("192.168.1.20", 5000);  // your computer's address
    delay(1000);
    return;
  }
  client.println("millis=" + String(millis()));
  while (client.available()) {
    Serial.println("server says: " + client.readStringUntil('\n'));
  }
  delay(1000);
}
```

## Summary

- **`QTcpServer`** listens on a port: `listen(QHostAddress.SpecialAddress.Any, 5000)`.
- **`newConnection`** → `nextPendingConnection()` gives one **`QTcpSocket`** per client.
- Each client socket works like the client item: `readyRead`, `canReadLine()` / `readLine()`, `write()`.
- Keep the clients in a list, and remove them (and `deleteLater()`) on `disconnected`.
- One event loop serves the window and all the clients together, with no threads and no loops.
