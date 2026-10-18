# שליחת נתונים שאינם מחרוזות

עד עכשיו כל מה ששלחנו בפורט הטורי היה **טקסט**: `"LED ON"`, `"temp=23.5\n"`. טקסט קל לקרוא וקל לדבג, אבל הוא לא האפשרות היחידה. הפורט הטורי בכלל לא יודע מה זה אותיות. הוא מעביר **בתים** (bytes), וכל בית הוא פשוט מספר בין 0 ל-255. אפשר לשים בבתים האלה כל ערך שרוצים.

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
| **הערך 60000** | 5 בתים | 2 בתים |
| **קריא ב-Serial Monitor** | כן | לא |
| **צריך מפריד** | כן, למשל `\n` או `,` | לא, אם שני הצדדים מכירים את הפורמט |
| **המקלט צריך** | לפענח את הטקסט בחזרה למספר | לדעת כמה בתים תופס כל ערך |

בתים קטנים ומהירים יותר, ואין מה לפענח. המחיר הוא ששני הצדדים חייבים להסכים בדיוק על ה**פורמט**: איזה בית אומר מה.

## הקסדצימלי: השפה של הבתים

כשעובדים עם בתים גולמיים כותבים אותם ב**הקסדצימלי** (hex, ראו את הפריט הקסדצימלי ביחידה [Binary Rep.](topic.html?id=binary-representation)). כל בית הוא בדיוק **שתי ספרות hex**, מ-`0x00` עד `0xFF`, וכל ספרה היא 4 ביטים, כך שקל לראות את הביטים שבפנים:

| עשרוני | hex | בינארי |
|---------|-----|--------|
| 0 | `0x00` | `0000 0000` |
| 10 | `0x0A` | `0000 1010` |
| 65 | `0x41` | `0100 0001` (וגם האות `'A'`) |
| 170 | `0xAA` | `1010 1010` |
| 200 | `0xC8` | `1100 1000` |
| 255 | `0xFF` | `1111 1111` |

גם C וגם Python מבינות את הקידומת `0x`, ולכן `Serial.write(0xC8)` ו-`Serial.write(200)` הם אותו דבר.

### לראות את הבתים

ה-Serial Monitor של סביבת Arduino מציג הכול כטקסט. בית כמו `0xC8` או `0x04` הוא לא אות שאפשר להדפיס, ולכן הוא מופיע כסימן מוזר, כסימן שאלה או בכלל לא. כדי לבדוק מה באמת הגיע צריך **תצוגת hex**:

![אותם 7 בתים מוצגים ב-Serial Monitor כסימנים מוזרים, ובתצוגת hex כ-AA 04 EB 00 58 02 B1](assets/serial/nonstring-hex-view.svg)

- ב-**Python**, `data.hex(" ")` הופכת בתים ל-`"aa 04 eb 00 58 02 b1"`, ו-`bytes.fromhex("AA 04 EB")` עושה את ההפך.
- ב-**Arduino**, `Serial.print(b, HEX)` מדפיסה בית ב-hex. היא לא מוסיפה אפס מוביל, אז הוסיפו אותו בעצמכם: `if (b < 0x10) Serial.print('0');`.
- גם לתוכנות טרמינל טורי כמו **CoolTerm** יש תצוגת hex.

## ערכים גדולים מבית אחד

בית אחד מחזיק רק 0 עד 255. קריאת חיישן של 1000 צריכה **שני בתים**. מפצלים אותה ל**בית גבוה** (high byte) ול**בית נמוך** (low byte), שולחים את שניהם, והמקלט מחבר אותם שוב:

![1000 הוא 0x03E8. הבית הגבוה שלו הוא 0x03 והבית הנמוך הוא 0xE8. השולח שולח קודם את 0xE8 ואז את 0x03. המקלט מחשב (hi << 8) | lo = 0x03E8 = 1000](assets/serial/nonstring-split-int.svg)

ב-Arduino:

```c
uint16_t light = 1000;           // 0x03E8
Serial.write(lowByte(light));    // 0xE8
Serial.write(highByte(light));   // 0x03
```

בצד השני:

```c
uint16_t light = (hi << 8) | lo; // 0x03 << 8 = 0x0300, | 0xE8 = 0x03E8 = 1000
```

שני דברים שצריך להסכים עליהם:

- **סדר הבתים.** שליחת הבית הנמוך קודם נקראת **little-endian**. ה-ESP32 והמחשב שלכם שומרים מספרים בזיכרון בדיוק כך, ולכן זו הבחירה הטבעית. גם big-endian (הבית הגבוה קודם) עובד, כל עוד שני הצדדים משתמשים באותו סדר.
- **הגודל של כל ערך.** ב-Nano ESP32 משתנה `int` תופס **4 בתים**, אבל ב-Arduino Uno הוא תופס 2. השתמשו בטיפוסים שהגודל כתוב בשם שלהם: `uint8_t` (בית אחד), `int16_t` / `uint16_t` (2 בתים), `int32_t` / `uint32_t` (4 בתים).

גם `float` תופס 4 בתים. אפשר לשלוח את הבתים שלו כמו שהם בזיכרון עם `Serial.write((uint8_t*)&f, 4);`, ו-Python קוראת אותם בחזרה עם `struct.unpack("<f", data)`. לרוב פשוט יותר לשלוח מספר שלם במקום: 23.5 °C הופך ל-`235`, והמקלט מחלק ב-10.

## חבילות: איפה הודעה מתחילה?

הודעות טקסט נגמרות ב-`\n`, כך שהמקלט תמיד יודע איפה הודעה אחת נגמרת והבאה מתחילה. בבתים גולמיים **כל** ערך יכול להופיע בנתונים, אפילו `0x0A`, הקוד של `\n`. אם המקלט מפספס בית, או מתחיל להאזין באמצע הודעה, כל ערך מאותו רגע יהיה שגוי.

הפתרון הוא לעטוף כל הודעה ב**חבילה** (packet):

![חבילה של 7 בתים: בית התחלה 0xAA, אורך 0x04, ארבעה בתי נתונים EB 00 58 02 שמחזיקים temp = 235 (23.5 °C) ו-light = 600, ו-checksum 0xB1, ה-XOR של בתי הנתונים](assets/serial/nonstring-packet.svg)

| חלק | מטרה |
|------|---------|
| **בית התחלה** (start byte) | ערך קבוע (כאן `0xAA`) שאומר למקלט "כאן מתחילה חבילה" |
| **אורך** (length) | כמה בתי נתונים באים אחריו |
| **נתונים** (data) | הערכים, בסדר ובגודל שסוכמו |
| **סכום ביקורת** (checksum) | מחושב מהנתונים. המקלט מחשב אותו שוב, ואם הוא לא מתאים, החבילה נזרקת |

גם הנתונים יכולים להכיל `0xAA`, ולכן המקלט עלול לפעמים להתחיל במקום הלא נכון. סכום הביקורת תופס את זה: לחבילה שמתחילה בבית הלא נכון כמעט אף פעם אין checksum נכון, אז המקלט זורק בית אחד ומחפש את ה-`0xAA` הבא.

> זה אותו רעיון כמו מסגרת ה-UART, רמה אחת למעלה. המסגרת עוטפת כל **בית** בביט התחלה ובביט עצירה; החבילה עוטפת כל **הודעה** בבית התחלה ובסכום ביקורת.

### Arduino: שליחת חבילה

```c
const uint8_t START = 0xAA;

void sendPacket(int16_t temp10, uint16_t light) {
  uint8_t data[4] = {
    lowByte(temp10), highByte(temp10),   // temperature × 10
    lowByte(light),  highByte(light)     // light level
  };

  uint8_t checksum = 0;
  for (int i = 0; i < 4; i++) checksum ^= data[i];   // XOR of the data bytes

  Serial.write(START);
  Serial.write(sizeof(data));     // length = 4
  Serial.write(data, sizeof(data));
  Serial.write(checksum);
}

void setup() {
  Serial.begin(9600);
}

void loop() {
  sendPacket(235, 600);           // 23.5 °C, light 600
  delay(1000);
}
```

כל שנייה הלוח שולח `AA 04 EB 00 58 02 B1`.

### Python: קבלת החבילה

ה-`receive()` הזו מחליפה את זו שבאפליקציה מהפריט **Serial in PySide**. בתים יכולים להגיע כמה בכל פעם, ולכן אוספים אותם במאגר (buffer) ומוציאים ממנו חבילה רק כשכולה כבר שם. המודול `struct` של Python הופך את בתי הנתונים בחזרה למספרים: `"<hH"` פירושו little-endian (`<`), ערך של 16 ביט עם סימן (`h`) וערך של 16 ביט בלי סימן (`H`).

```python
import struct

# in __init__:  self.buffer = bytearray()

def receive(self):
    self.buffer += self.port.readAll().data()
    while len(self.buffer) >= 2:
        if self.buffer[0] != 0xAA:              # not a start byte: drop it
            del self.buffer[0]
            continue
        size = self.buffer[1]
        if len(self.buffer) < size + 3:         # start + length + data + checksum
            break                               # wait for the rest
        data = self.buffer[2:2 + size]
        checksum = 0
        for b in data:
            checksum ^= b
        if size != 4 or checksum != self.buffer[2 + size]:
            del self.buffer[0]                  # bad packet: look for the next 0xAA
            continue
        del self.buffer[:size + 3]              # remove the packet from the buffer
        temp10, light = struct.unpack("<hH", data)
        self.log.appendPlainText(f"{data.hex(' ')}  →  temp={temp10 / 10} °C  light={light}")
```

היומן מציג `eb 00 58 02  →  temp=23.5 °C  light=600`.

## הכיוון השני: מהמחשב ל-Arduino

שליחת בתים מ-Python קלה באותה מידה. `bytes([...])` בונה בתים מרשימה של מספרים, ו-`struct.pack()` הופכת מספרים לבתים:

```python
self.port.write(bytes([0xAA, 200]))            # start byte + brightness 200
self.port.write(struct.pack("<H", 1000))       # b'\xe8\x03', the 2 bytes of 1000
```

ב-Arduino, `Serial.read()` מחזירה את הבית הבא כמספר בין 0 ל-255 (או `-1` אם אין כלום שמחכה). הסקיצה הזו קובעת את הבהירות של נורית LED לפי פקודה של 2 בתים:

```c
void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  if (Serial.available() >= 2) {         // wait until the whole command is here
    if (Serial.read() == 0xAA) {         // start byte?
      int brightness = Serial.read();    // 0..255
      analogWrite(LED_BUILTIN, brightness);
    }                                    // if not, that byte is dropped and we try again
  }
}
```

חברו `QSlider` עם טווח 0 עד 255 ל-`self.port.write(bytes([0xAA, value]))`, והנורית תעקוב אחרי המחוון. כדי לקרוא הרבה בתים בבת אחת, `Serial.readBytes(buffer, n)` ממלאת מערך ב-`n` בתים.

## סיכום

- הפורט הטורי מעביר **בתים**, ערכים מ-0 עד 255. טקסט הוא רק דרך אחת להשתמש בהם.
- `Serial.print(200)` שולחת את הטקסט `"200"` (3 בתים). `Serial.write(200)` שולחת בית אחד, `0xC8`.
- כתבו בתים ב-**hex**: בית אחד הוא תמיד 2 ספרות hex. השתמשו בתצוגת hex כדי לראות מה באמת הגיע.
- ערכים גדולים מפוצלים לבתים. הסכימו על ה**סדר** (הבית הנמוך קודם הוא little-endian) והשתמשו בטיפוסים עם גודל כמו `uint16_t`.
- עטפו הודעות ב**חבילה** עם בית התחלה, אורך וסכום ביקורת, כדי שהמקלט ימצא כל הודעה וידחה הודעות פגומות.
- ב-Python, `bytes([...])`, `struct.pack()` / `struct.unpack()` ו-`.hex(" ")` עושים את העבודה.
