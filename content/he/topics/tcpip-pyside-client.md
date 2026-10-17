# לקוח TCP/IP ב-PySide6

בפריט על TCP ראינו שה**לקוח** הוא הצד ש**מתחיל** את החיבור. עכשיו בואו נכתוב אחד: אפליקציית דסקטופ קטנה שמתחברת לשרת, שולחת שורות טקסט ומציגה את מה שחוזר.

## הכלי: `QTcpSocket`

PySide6 מגיעה עם **`QTcpSocket`** (ב-`PySide6.QtNetwork`). הוא עובד כמו `QSerialPort` מהפריט על תקשורת טורית ב-PySide: **לא כותבים לולאה** ו**אף פעם לא מחכים**. כל קריאה חוזרת מיד, וה-socket מודיע לכם מה קרה דרך **אותות** (signals), שלולאת האירועים (event loop) של Qt (`app.exec()`) מעבירה לפונקציות שלכם.

| אות | מופעל כש… |
|--------|-------------|
| `connected` | לחיצת היד הסתיימה ואפשר לשלוח |
| `readyRead` | הגיעו בתים חדשים |
| `disconnected` | הצד השני סגר את החיבור |
| `errorOccurred` | משהו השתבש (אף אחד לא מאזין, אין דרך לשם, נגמר הזמן…) |

## השלבים

1. **יוצרים** את ה-socket: `QTcpSocket(self)`.
2. **מחברים את האותות** לפונקציות שלכם, לפני שמשהו יכול לקרות.
3. **מתחברים לשרת**: `connectToHost("192.168.1.20", 5000)`. זה רק **מתחיל** את לחיצת היד וחוזר מיד. מותר לשלוח רק אחרי ש-`connected` מופעל.
4. **כותבים** טקסט: `write((text + "\n").encode())`. TCP שולח **בתים**, אז מקודדים את המחרוזת, ומסיימים כל הודעה ב-`\n` כדי שהצד השני יידע איפה היא נגמרת.
5. **קוראים** טקסט בפונקציה של `readyRead`: כל עוד `canReadLine()`, קוראים ל-`readLine()` ומפענחים.
6. **סוגרים** כשמסיימים: `disconnectFromHost()`.

## האפליקציה

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
        if self.socket.state() != QAbstractSocket.SocketState.ConnectedState:
            self.log.appendPlainText("Not connected")
            return
        text = self.entry.text()
        self.socket.write((text + "\n").encode())
        self.log.appendPlainText("▶ " + text)
        self.entry.clear()

    def receive(self):
        # 5. Read every complete line that has arrived
        while self.socket.canReadLine():
            line = self.socket.readLine().data().decode(errors="replace").strip()
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

## משהו לדבר איתו

צריך שרת שמאזין בפורט `5000`. הריצו את האפליקציה מהפריט הבא, **שרת TCP/IP ב-PySide6**, או ב-Linux או Mac פתחו טרמינל והריצו `nc -l 5000`. אחר כך הפעילו את הלקוח, הקלידו שורה ולחצו Enter. מה שתקלידו בטרמינל של `nc` יופיע בלקוח.

כדי להגיע למחשב אחר או לשרת על ESP32, שנו את `HOST` לכתובת שלו באותה רשת Wi-Fi.

## למה לולאת האירועים חשובה

`readyRead` מופעל כשמגיעים **כמה** בתים, לא בהכרח הודעה שלמה. TCP הוא **זרם**: `"temp=23.5\n"` יכול להגיע כ-`"tem"` ואחר כך `"p=23.5\n"`, ושתי שורות קצרות יכולות להגיע ביחד. `QTcpSocket` שומר את הבתים בחוצץ (buffer), ו-`canReadLine()` אומר לכם מתי יש שם שורה מלאה. השאר מחכה ל-`readyRead` הבא.

בינתיים החלון נשאר חי: בזמן שה-socket מתחבר או מחכה לנתונים, לולאת האירועים ממשיכה לטפל בלחיצות ובהקלדה. לעולם אל תשתמשו ב-`waitForConnected()` או ב-`waitForReadyRead()` בממשק גרפי, כי הן חוסמות בדיוק כמו לולאת `while` ומקפיאות את החלון.

## סיכום

- `QTcpSocket` + אותות: `connected`, `readyRead`, `disconnected`, `errorOccurred`.
- `connectToHost()` רק **מתחיל** להתחבר. שולחים אחרי ש-`connected` מופעל.
- שולחים **בתים**: `write((text + "\n").encode())`, עם `\n` שמסמן את סוף כל הודעה.
- קוראים ב-`readyRead`, רק **שורות שלמות**, עם `canReadLine()` / `readLine()`.
- תנו ל-`app.exec()` לעשות את ההמתנה. בלי לולאות, בלי `waitFor…()`.
