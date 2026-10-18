# שליחת נתונים שאינם מחרוזות

עד עכשיו כל מה ששלחנו בפורט הטורי היה **טקסט**: `"LED ON"`, `"temp=23.5\n"`. טקסט קל לקרוא, אבל הוא לא האפשרות היחידה. הפורט הטורי בכלל לא יודע מה זה אותיות. הוא מעביר **בתים** (bytes), וכל בית הוא פשוט מספר בין 0 ל-255. אפשר לשים בבתים האלה כל ערך שרוצים.

הפריט הזה עוסק בשני דברים, כל אחד בשני הכיוונים:

1. שליחה וקבלה של **בית בודד**, או של **משתנה אחד שאורכו כמה בתים** (כמו `float`).
2. שליחה וקבלה של **מערך של בתים**, שבו כל בית הוא ערך בפני עצמו.

## טקסט או בית?

הסתכלו על שתי שורות הקוד האלה ב-Arduino:

```c
Serial.print(200);   // sends the text "200"
Serial.write(200);   // sends one byte with the value 200
```

`Serial.print()` הופכת את המספר לתווים ושולחת את קודי ה-ASCII שלהם: `'2'`, `'0'`, `'0'`, כלומר `0x32`, `0x30`, `0x30`. אלה **3 בתים**. `Serial.write()` שולחת את הערך עצמו, כ**בית אחד**: `0xC8`.

![Serial.print(200) שולחת שלושה בתים, 0x32 0x30 0x30, קודי ה-ASCII של '2', '0', '0'. Serial.write(200) שולחת בית יחיד 0xC8, שהוא 11001000 בבינארי](assets/serial/nonstring-print-vs-write.svg)

| | טקסט (`print`) | בתים (`write`) |
|--|----------------|-----------------|
| **הערך 200** | `0x32 0x30 0x30` (3 בתים) | `0xC8` (בית אחד) |
| **קריא ב-Serial Monitor** | כן | לא |
| **המקלט צריך** | להפוך את הטקסט בחזרה למספר | לדעת כמה בתים מגיעים |

בתים קטנים יותר ואין מה לפענח. המחיר הוא ששני הצדדים חייבים להסכים על **מה נשלח**: כמה בתים, ומה המשמעות של כל אחד.

## הקסדצימלי: השפה של הבתים

כשעובדים עם בתים גולמיים כותבים אותם ב**הקסדצימלי** (hex, ראו את הפריט הקסדצימלי ביחידה [Binary Rep.](topic.html?id=binary-representation)). כל בית הוא בדיוק **שתי ספרות hex**, מ-`0x00` עד `0xFF`:

| עשרוני | hex | בינארי |
|---------|-----|--------|
| 0 | `0x00` | `0000 0000` |
| 65 | `0x41` | `0100 0001` (וגם האות `'A'`) |
| 128 | `0x80` | `1000 0000` |
| 200 | `0xC8` | `1100 1000` |
| 255 | `0xFF` | `1111 1111` |

גם C וגם Python מבינות את הקידומת `0x`, ולכן `Serial.write(0xC8)` ו-`Serial.write(200)` הם אותו דבר.

ה-Serial Monitor מציג הכול כטקסט. בית כמו `0xFF` או `0x00` הוא לא אות שאפשר להדפיס, ולכן הוא מופיע כסימן מוזר או בכלל לא. כדי לראות מה באמת הגיע, הדפיסו את הבתים ב-**hex**:

![הבתים FF 80 00 מוצגים ב-Serial Monitor כסימנים מוזרים, ובתצוגת hex כ-FF 80 00](assets/serial/nonstring-hex-view.svg)

- ב-**Python**, `data.hex(" ")` הופכת בתים ל-`"ff 80 00"`.
- ב-**Arduino**, `Serial.print(b, HEX)` מדפיסה בית ב-hex.

## 1. בית בודד, או משתנה אחד של כמה בתים

### בית בודד

בית אחד מחזיק ערך בין 0 ל-255: בהירות, מהירות באחוזים, מצב של לחצן, מספר של פקודה.

| | שליחה | קבלה |
|--|------|---------|
| **Arduino** | `Serial.write(200);` | `int b = Serial.read();` |
| **Python** | `self.port.write(bytes([200]))` | `b = self.port.read(1).data()[0]` |

`Serial.read()` מחזירה את הבית כמספר בין 0 ל-255, או `-1` אם לא הגיע כלום, ולכן בדקו קודם את `Serial.available()`. ב-Python, `bytes([200])` בונה בית אחד מרשימה עם מספר אחד, ו-`[0]` מוציא את הבית הראשון ממה שנקרא, כמספר.

הסקיצה הזו קובעת את הבהירות של נורית LED לפי בית אחד שהמחשב שולח:

```c
void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  if (Serial.available() >= 1) {
    int brightness = Serial.read();        // 0..255
    analogWrite(LED_BUILTIN, brightness);
  }
}
```

באפליקציה מהפריט **Serial in PySide**, חברו `QSlider` עם טווח 0 עד 255 ל-`self.port.write(bytes([value]))`, והנורית תעקוב אחרי המחוון.

### משתנה אחד של כמה בתים

`float` תופס 4 בתים, `uint16_t` תופס 2. לא צריך לפרק את המשתנה: שולחים את **כל הבתים שלו** בדיוק כמו שהם יושבים בזיכרון, והמקלט מחזיר אותם לאותו טיפוס.

![float temperature = 23.5 הוא 4 הבתים 00 00 BC 41, ו-uint16_t light = 1000 הוא 2 הבתים E8 03. הבתים נשלחים כמו שהם, והמקלט הופך אותם בחזרה ל-23.5 ול-1000](assets/serial/nonstring-variable.svg)

ב-Arduino:

```c
float temperature = 23.5;
Serial.write((uint8_t*)&temperature, sizeof(temperature));   // send its 4 bytes
```

- `&temperature` היא **הכתובת** של המשתנה בזיכרון, ו-`(uint8_t*)` אומר "תסתכל עליה כעל בתים".
- `sizeof(temperature)` הוא מספר הבתים: 4 עבור `float`.

קבלה לתוך משתנה עובדת באותה דרך, ברגע שכל הבתים שלו נמצאים במאגר:

```c
float temperature;
if (Serial.available() >= sizeof(temperature)) {
  Serial.readBytes((uint8_t*)&temperature, sizeof(temperature));
}
```

ב-Python, המודול **`struct`** הופך בתים למספר ובחזרה. האות אומרת מה הטיפוס:

| אות | טיפוס ב-C | בתים |
|--------|--------|-------|
| `B` | `uint8_t` | 1 |
| `h` / `H` | `int16_t` / `uint16_t` | 2 |
| `i` / `I` | `int32_t` / `uint32_t` | 4 |
| `f` | `float` | 4 |

```python
import struct
(temperature,) = struct.unpack("<f", self.port.read(4).data())   # receive: 4 bytes → 23.5
self.port.write(struct.pack("<f", 23.5))                         # send: 23.5 → 4 bytes
```

ה-`<` בהתחלה אומר ל-Python להשתמש באותו סדר בתים כמו ה-ESP32 (והמחשב שלכם). `unpack()` תמיד מחזירה tuple, ולכן כותבים `(temperature,) =`.

> השתמשו בטיפוסים שהגודל כתוב בשם שלהם, כמו `uint16_t` או `int32_t`. משתנה `int` רגיל תופס 4 בתים ב-Nano ESP32 אבל 2 בתים ב-Arduino Uno, ושני הצדדים חייבים להסכים על הגודל.

זוג שלם: ה-Arduino שולח את הטמפרטורה כל שנייה, ואפליקציית ה-PySide מציגה אותה.

```c
void setup() {
  Serial.begin(9600);
}

void loop() {
  float temperature = 23.5;     // in a real project: read it from a sensor
  Serial.write((uint8_t*)&temperature, sizeof(temperature));
  delay(1000);
}
```

```python
def receive(self):
    while self.port.bytesAvailable() >= 4:       # wait until all 4 bytes are here
        (temperature,) = struct.unpack("<f", self.port.read(4).data())
        self.log.appendPlainText(f"temperature = {temperature:.1f}")
```

`readyRead` יכול להופעל כשרק חלק מהבתים הגיעו, ולכן קוראים רק כש-`bytesAvailable()` אומרת שכל 4 הבתים כבר שם.

## 2. מערך של בתים

לעיתים קרובות יש לכם כמה ערכים קטנים, שכל אחד נכנס בבית אחד: האדום, הירוק והכחול של צבע, או כמה קריאות חיישנים בטווח 0–255. שימו אותם במערך של `uint8_t` ושלחו אותם יחד. כל בית הוא ערך בפני עצמו, אז אין מה לפצל או לחבר.

![uint8_t rgb[3] = {255, 128, 0} נשלח עם Serial.write(rgb, 3) כבתים FF 80 00. המקלט קורא 3 בתים ומקבל r = 255, g = 128, b = 0](assets/serial/nonstring-array.svg)

| | שליחה | קבלה |
|--|------|---------|
| **Arduino** | `Serial.write(rgb, 3);` | `Serial.readBytes(rgb, 3);` |
| **Python** | `self.port.write(bytes([255, 128, 0]))` | `r, g, b = self.port.read(3).data()` |

ב-Python, קריאה של 3 בתים ופריסה שלהם ל-3 שמות נותנת 3 מספרים בין 0 ל-255.

### מה-Arduino למחשב: שלוש קריאות

```c
void setup() {
  Serial.begin(9600);
  pinMode(2, INPUT);
}

void loop() {
  uint8_t readings[3];
  readings[0] = map(analogRead(A0), 0, 4095, 0, 255);   // potentiometer
  readings[1] = map(analogRead(A1), 0, 4095, 0, 255);   // light sensor (LDR)
  readings[2] = digitalRead(2);                         // button: 0 or 1
  Serial.write(readings, 3);
  delay(200);
}
```

```python
def receive(self):
    while self.port.bytesAvailable() >= 3:
        pot, light, button = self.port.read(3).data()
        self.log.appendPlainText(f"pot={pot}  light={light}  button={button}")
```

### מהמחשב ל-Arduino: צבע

```python
self.port.write(bytes([255, 128, 0]))   # orange: red 255, green 128, blue 0
```

```c
const int RED_PIN = 9, GREEN_PIN = 10, BLUE_PIN = 11;   // an RGB LED, each colour with its resistor

void setup() {
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() >= 3) {        // wait until all 3 bytes are here
    uint8_t rgb[3];
    Serial.readBytes(rgb, 3);
    analogWrite(RED_PIN, rgb[0]);
    analogWrite(GREEN_PIN, rgb[1]);
    analogWrite(BLUE_PIN, rgb[2]);
  }
}
```

שלושה `QSlider` באפליקציית ה-PySide, שכל אחד מהם שולח `bytes([red, green, blue])` כשהוא זז, יוצרים מערבל צבעים.

> בכל הדוגמאות צד אחד תמיד שולח **אותו מספר בתים**, כך שהצד השני יודע לכמה בתים לחכות. אם שני הצדדים לא מסכימים, למשל השולח שולח 4 בתים והמקלט קורא 3, כל ערך מאותו רגע יהיה שגוי.

## סיכום

- הפורט הטורי מעביר **בתים**, ערכים מ-0 עד 255. טקסט הוא רק דרך אחת להשתמש בהם.
- `Serial.print(200)` שולחת את הטקסט `"200"` (3 בתים). `Serial.write(200)` שולחת בית אחד, `0xC8`.
- כתבו בתים ב-**hex**: בית אחד הוא תמיד 2 ספרות hex.
- **בית בודד:** `Serial.write(b)` / `Serial.read()` ב-Arduino, `bytes([b])` / `read(1).data()[0]` ב-Python.
- **משתנה אחד של כמה בתים:** שולחים את הבתים שלו עם `Serial.write((uint8_t*)&x, sizeof(x))`, וקוראים אותם עם `Serial.readBytes((uint8_t*)&x, sizeof(x))`. ב-Python משתמשים ב-`struct.pack()` / `struct.unpack()`.
- **מערך של בתים:** `Serial.write(arr, n)` / `Serial.readBytes(arr, n)` ב-Arduino, `bytes([...])` / `read(n).data()` ב-Python.
- קוראים רק כש**כל** הבתים הגיעו: `Serial.available() >= n`, `bytesAvailable() >= n`.
