# שרת TCP/IP ב-PySide6

ה**שרת** הוא הצד שמופעל ראשון, **מאזין** בפורט ומחכה ללקוחות. בואו נבנה אחד: אפליקציית דסקטופ שמקבלת כמה לקוחות שרוצים, מציגה מה הם שולחים, עונה להם, ומאפשרת לכם לשלוח שורה לכולם.

## הכלים: `QTcpServer` ו-`QTcpSocket`

שרת צריך שני סוגים של אובייקטים:

- **`QTcpServer`** אחד, שמאזין בפורט. כשלקוח מתחבר, הוא מפעיל את **`newConnection`**.
- **`QTcpSocket`** אחד **לכל** לקוח מחובר. מקבלים אותו מ-`nextPendingConnection()`, ומשם משתמשים בו בדיוק כמו ב-socket מהפריט על הלקוח: `readyRead`, `readLine()`, `write()`, `disconnected`.

כמו בלקוח, אין לולאות ואין המתנה. לולאת האירועים של Qt קוראת לפונקציות שלכם כשלקוח מתחבר, שולח שורה או עוזב.

## השלבים

1. **יוצרים** את השרת: `QTcpServer(self)`.
2. **מחברים** את האות `newConnection` שלו לפונקציה שלכם.
3. **מאזינים**: `listen(QHostAddress.SpecialAddress.Any, 5000)`. `Any` אומר "קבל לקוחות מכל כרטיס רשת", כך שגם מחשבים אחרים ולוחות ESP32 יכולים להתחבר. הפונקציה מחזירה `False` אם הפורט תפוס.
4. ב-`newConnection` קוראים ל-**`nextPendingConnection()`** כדי לקבל את ה-socket של הלקוח, שומרים אותו ברשימה, ומחברים את האותות `readyRead` ו-`disconnected` שלו.
5. **קוראים וכותבים** טקסט ב-socket של כל לקוח, בדיוק כמו בלקוח.
6. כשלקוח **מתנתק**, מוציאים אותו מהרשימה וקוראים ל-`deleteLater()` על ה-socket שלו.

## האפליקציה

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

איזה לקוח זה היה? האותות `readyRead` של כל הלקוחות מחוברים לאותה מתודה `receive`, וכל האותות `disconnected` שלהם לאותה `on_disconnected`. בתוך מתודה שאות קרא לה, **`self.sender()`** מחזיר את האובייקט ששלח את האות, וכך הוא אומר לנו של איזה לקוח ה-socket הזה.

## משהו לדבר איתו

- **על אותו מחשב:** הפעילו את השרת, ואז את אפליקציית הלקוח מהפריט הקודם (היא מתחברת ל-`127.0.0.1:5000`). הפעילו שני לקוחות ודברו עם שניהם דרך תיבת הטקסט של השרת. ב-Linux או Mac אפשר גם להריץ בטרמינל `nc 127.0.0.1 5000`.
- **ממכשיר אחר:** מצאו את הכתובת של המחשב שלכם (`ipconfig` ב-Windows, `ip -4 -br addr` ב-Linux) והתחברו אליה ממחשב אחר או מ-ESP32. בפעם הראשונה Windows שואלת אם לאפשר לתוכנה לעבור דרך **חומת האש** (firewall): אשרו ברשתות פרטיות.

לקוח ESP32 ששולח שורה כל שנייה ומדפיס את התשובות:

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

## סיכום

- **`QTcpServer`** מאזין בפורט: `listen(QHostAddress.SpecialAddress.Any, 5000)`.
- **`newConnection`** ← `nextPendingConnection()` נותן **`QTcpSocket`** אחד לכל לקוח.
- ה-socket של כל לקוח עובד כמו בפריט על הלקוח: `readyRead`, `canReadLine()` / `readLine()`, `write()`.
- שומרים את הלקוחות ברשימה, ומוציאים אותם ממנה (וקוראים ל-`deleteLater()`) ב-`disconnected`.
- לולאת אירועים אחת משרתת את החלון ואת כל הלקוחות ביחד, בלי תהליכונים (threads) ובלי לולאות.
