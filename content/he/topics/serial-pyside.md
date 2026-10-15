# תקשורת טורית ב-PySide

יש לכם Arduino שמדבר דרך USB. עכשיו בואו ניתן לו **אפליקציית דסקטופ אמיתית**, עם חלון, כפתורים ונתונים חיים, בערך ב-40 שורות של Python.

## המלכודת: לולאת `while` משלכם

הרעיון הראשון שעולה לרוב האנשים הוא:

```python
while True:
    line = ser.readline()   # waits until a line arrives...
    label.setText(line)
```

בממשק גרפי (GUI) זה **מקפיא את החלון**. כל עוד Python יושבת בתוך `readline()`, לא נשאר אף אחד שיצייר מחדש את החלון או יטפל בלחיצות, ומערכת ההפעלה מהר מאוד מציגה *"Not Responding"*.

## הטריק: Qt כבר מריצה לולאה בשבילכם

כשקוראים ל-`app.exec()`, Qt מפעילה את **לולאת האירועים** (event loop) שלה. היא כבר מחכה ללחיצות עכבר, להקשות מקלדת ולטיימרים, והיא יכולה לחכות גם ל**בתים טוריים**. אתם לא כותבים לולאה. אתם רק אומרים *"כשמגיעים נתונים, תקראי לפונקציה הזו"*.

![משמאל: לולאת while נתקעת על readline והחלון קופא. מימין: לולאת האירועים של Qt מטפלת בלחיצות, במקשים ובבתים טוריים, וקוראת ל-receive() כש-readyRead מופעל](assets/serial-pyside/event-loop.svg)

הכלי לזה הוא **`QSerialPort`**, שמגיע עם PySide6 (לא צריך `pyserial`). האות (signal) **`readyRead`** שלו מופעל בכל פעם שמגיעים בתים חדשים.

| במקום… | השתמשו ב- |
|-------------|-----|
| `serial.Serial("COM3", 9600)` | `QSerialPort("COM3")` + `setBaudRate(9600)` |
| `while True: ser.readline()` | `port.readyRead.connect(receive)` |
| תהליכונים (threads) או `time.sleep()` | כלום! לולאת האירועים עושה את זה |

## האפליקציה

![האפליקציה המוגמרת: יומן של שורות שהתקבלו ונשלחו, ותיבת טקסט בתחתית](assets/serial-pyside/app-window.svg)

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

התקינו עם `pip install pyside6`, שנו את `"COM3"` לפורט שלכם והריצו. קודם סגרו את ה-Serial Monitor של Arduino IDE, כי רק תוכנית אחת יכולה לפתוח פורט בכל רגע.

## משהו לדבר איתו

העלו את זה ל-Arduino. הוא מחזיר כהד את כל מה שאתם מקלידים ומדליק או מכבה את ה-LED:

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

הקלידו `LED ON` באפליקציה שלכם, לחצו Enter, ותראו את הלוח נדלק. 🎉

## למה `canReadLine()`?

`readyRead` מופעל כשמגיעים **כמה** בתים, לא בהכרח שורה שלמה. `"temp=23.5\n"` יכול להגיע כ-`"tem"` ואחר כך `"p=23.5\n"`. `QSerialPort` שומר את הבתים בחוצץ (buffer), ולכן אנחנו קוראים רק כש-`canReadLine()` אומר שיש שם שורה מלאה (שמסתיימת ב-`\n`). השאר מחכה ל-`readyRead` הבא.

## לשלב הבא

- **מציאת פורטים אוטומטית:** `QSerialPortInfo.availablePorts()` מחזיר רשימה שלהם. שימו את ה-`portName()` שלהם ב-`QComboBox`.
- **שליחה לפי לוח זמנים:** `QTimer` עם `timeout.connect(...)` יכול לבקש מה-Arduino מדידה כל שנייה, שוב בלי לולאה.
- **גרף של נתונים חיים:** הזינו את המספרים מ-`receive()` לתוך גרף (`pyqtgraph` עובד טוב עם PySide6).

## סיכום

- לעולם אל תחסמו GUI עם לולאת `while` משלכם או עם `readline()`.
- `app.exec()` הוא כבר לולאה. תנו לו לעשות את ההמתנה.
- `QSerialPort` + `readyRead.connect(...)` קורא לפונקציה שלכם בדיוק כשמגיעים נתונים.
- קראו רק **שורות שלמות** עם `canReadLine()` / `readLine()`.
