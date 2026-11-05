# לקוח TCP/IP ב-PySide6

בפריט על TCP ראינו שה**לקוח** הוא הצד ש**מתחיל** את החיבור. עכשיו בואו נכתוב אחד: אפליקציית דסקטופ קטנה שמתחברת לשרת בלחיצת כפתור, שולחת שורות טקסט ומציגה את מה שחוזר.

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

כל החלון הוא מחלקה אחת, `ClientWindow`, שבנויה מארבעה רכיבים:

| רכיב | איפה | מה הוא עושה |
|--------|-------|--------------|
| `QPushButton` "Connect" | למעלה | **מתג** (`setCheckable(True)`): לוחצים כדי להתחבר, ולוחצים שוב כדי להתנתק |
| `QTextEdit` | באמצע | לקריאה בלבד; מציג את כל מה שנשלח (▶), מה שהתקבל (◀) והודעות החיבור |
| `QLineEdit` | למטה | השורה לשליחה |
| `QPushButton` "Send" | למטה, ליד השורה | שולח את השורה (גם Enter עושה את זה) |

לחיצה על המתג רק **מבקשת** חיבור. הטקסט של הכפתור וכפתור השליחה הולכים אחרי ה-**socket**, לא אחרי הלחיצה: `set_connected()` נקראת מ-`connected`, מ-`disconnected` ומ-`errorOccurred`, כך שאם אף אחד לא מאזין, המתג חוזר לבד ל-"Connect", ואי אפשר ללחוץ על Send לפני שיש לאן לשלוח.

המתג משתמש באות `clicked` ולא ב-`toggled`. `clicked` מופעל רק כש**המשתמש** לוחץ על הכפתור, ואילו `toggled` מופעל גם בכל פעם שהקוד שלנו קורא ל-`setChecked()`, והאפליקציה הייתה מתחילה להתחבר ולהתנתק מעצמה.

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

## משהו לדבר איתו

צריך שרת שמאזין בפורט `5000`. הריצו את האפליקציה מהפריט הבא, **שרת TCP/IP ב-PySide6**, או ב-Linux או Mac פתחו טרמינל והריצו `nc -l 5000`. אחר כך הפעילו את הלקוח, לחצו על **Connect**, הקלידו שורה ולחצו על **Send**. מה שתקלידו בטרמינל של `nc` יופיע בלקוח.

כדי להגיע למחשב אחר או לשרת על ESP32, שנו את `HOST` לכתובת שלו באותה רשת Wi-Fi.

## למה לולאת האירועים חשובה

`readyRead` מופעל כשמגיעים **כמה** בתים, לא בהכרח הודעה שלמה. TCP הוא **זרם**: `"temp=23.5\n"` יכול להגיע כ-`"tem"` ואחר כך `"p=23.5\n"`, ושתי שורות קצרות יכולות להגיע ביחד. `QTcpSocket` שומר את הבתים בחוצץ (buffer), ו-`canReadLine()` אומר לכם מתי יש שם שורה מלאה. השאר מחכה ל-`readyRead` הבא.

בינתיים החלון נשאר חי: בזמן שה-socket מתחבר או מחכה לנתונים, לולאת האירועים ממשיכה לטפל בלחיצות ובהקלדה. לעולם אל תשתמשו ב-`waitForConnected()` או ב-`waitForReadyRead()` בממשק גרפי, כי הן חוסמות בדיוק כמו לולאת `while` ומקפיאות את החלון.

## סיכום

- החלון הוא מחלקה: **מתג Connect/Disconnect** למעלה, יומן ב-`QTextEdit`, ו-`QLineEdit` עם כפתור **Send**.
- המתג רק פותח או סוגר את החיבור. מעדכנים את הכפתורים מהאותות של ה-socket, ומשתמשים ב-`clicked` ולא ב-`toggled`.
- `QTcpSocket` + אותות: `connected`, `readyRead`, `disconnected`, `errorOccurred`.
- `connectToHost()` רק **מתחיל** להתחבר. שולחים אחרי ש-`connected` מופעל.
- שולחים **בתים**: `write((text + "\n").encode())`, עם `\n` שמסמן את סוף כל הודעה.
- קוראים ב-`readyRead`, רק **שורות שלמות**, עם `canReadLine()` / `readLine()`.
- תנו ל-`app.exec()` לעשות את ההמתנה. בלי לולאות, בלי `waitFor…()`.
