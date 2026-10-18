# שליחת נתונים שאינם מחרוזות

בפריטי הלקוח והשרת כל הודעה הייתה שורת **טקסט** שנגמרת ב-`\n`. טקסט קל לקרוא וקל לדבג, אבל TCP בכלל לא יודע מה זה אותיות. הוא מעביר **בתים** (bytes), וכל בית הוא פשוט מספר בין 0 ל-255. אפשר לשים בבתים האלה כל ערך שרוצים.

## טקסט או בית?

ב-ESP32, ל-`WiFiClient` יש אותן `print()` ו-`write()` כמו ל-`Serial`:

```c
client.print(200);   // sends the text "200"
client.write(200);   // sends one byte with the value 200
```

`print()` הופכת את המספר לתווים ושולחת את קודי ה-ASCII שלהם: `'2'`, `'0'`, `'0'`, כלומר `0x32`, `0x30`, `0x30`. אלה **3 בתים**. `write()` שולחת את הערך עצמו, כ**בית אחד**: `0xC8`.

![client.print(200) שולחת שלושה בתים, 0x32 0x30 0x30, קודי ה-ASCII של '2', '0', '0'. client.write(200) שולחת בית יחיד 0xC8, שהוא 11001000 בבינארי](assets/tcp/binary-print-vs-write.svg)

ב-Python זה אותו הבדל: `"200".encode()` הוא 3 בתים, `bytes([200])` הוא בית אחד.

| | טקסט | בתים |
|--|------|-------|
| **הערך 200** | `0x32 0x30 0x30` (3 בתים) | `0xC8` (בית אחד) |
| **הערך 60000** | 5 בתים | 2 בתים |
| **קריא ב-`nc` או ביומן טקסט** | כן | לא |
| **סוף ההודעה** | `\n` | אורך שנשלח לפני הנתונים |
| **המקלט צריך** | לפענח את הטקסט בחזרה למספר | לדעת כמה בתים תופס כל ערך |

בתים קטנים יותר ואין מה לפענח. המחיר הוא ששני הצדדים חייבים להסכים בדיוק על ה**פורמט**: איזה בית אומר מה.

## הקסדצימלי: השפה של הבתים

כשעובדים עם בתים גולמיים כותבים אותם ב**הקסדצימלי** (hex, ראו את הפריט הקסדצימלי ביחידה [Binary Rep.](topic.html?id=binary-representation)). כל בית הוא בדיוק **שתי ספרות hex**, מ-`0x00` עד `0xFF`, וכל ספרה היא 4 ביטים, כך שקל לראות את הביטים שבפנים:

| עשרוני | hex | בינארי |
|---------|-----|--------|
| 0 | `0x00` | `0000 0000` |
| 4 | `0x04` | `0000 0100` |
| 65 | `0x41` | `0100 0001` (וגם האות `'A'`) |
| 200 | `0xC8` | `1100 1000` |
| 235 | `0xEB` | `1110 1011` |
| 255 | `0xFF` | `1111 1111` |

גם C וגם Python מבינות את הקידומת `0x`, ולכן `client.write(0xC8)` ו-`client.write(200)` הם אותו דבר.

### לראות את הבתים

`nc` ויומן הטקסט באפליקציות ה-PySide שלנו מציגים הכול כטקסט. בית כמו `0xEB` או `0x04` הוא לא אות שאפשר להדפיס, ולכן הוא מופיע כסימן מוזר, כסימן שאלה או בכלל לא. כדי לבדוק מה באמת הגיע צריך **תצוגת hex**:

![אותם 6 בתים מוצגים ביומן טקסט כסימנים מוזרים, ובתצוגת hex כ-00 04 00 EB 02 58](assets/tcp/binary-hex-view.svg)

- ב-**Python**, `data.hex(" ")` הופכת בתים ל-`"00 04 00 eb 02 58"`, ו-`bytes.fromhex("00 04 00 EB")` עושה את ההפך.
- ב-**ESP32**, `Serial.print(b, HEX)` מדפיסה בית ב-hex. היא לא מוסיפה אפס מוביל, אז הוסיפו אותו בעצמכם: `if (b < 0x10) Serial.print('0');`.
- ב-Linux או ב-Mac, `nc -l 5000 | xxd` מציג ב-hex כל מה שלקוח שולח.
- גם **Wireshark** מציג ב-hex את הבתים של כל מקטע TCP.

## ערכים גדולים מבית אחד: סדר בתים של רשת

בית אחד מחזיק רק 0 עד 255. קריאת חיישן של 1000 צריכה **שני בתים**. מפצלים אותה ל**בית גבוה** (high byte) ול**בית נמוך** (low byte), שולחים את שניהם, והמקלט מחבר אותם שוב.

איזה בית נשלח קודם? הפרוטוקולים של האינטרנט עצמם (הכתובות בכותרת IP, הפורטים בכותרת TCP) תמיד שולחים את **הבית הגבוה קודם**. זה נקרא **big-endian**, או **סדר בתים של רשת** (network byte order), וזו הבחירה המקובלת גם להודעות שלכם ב-TCP:

![1000 הוא 0x03E8. הבית הגבוה שלו הוא 0x03 והבית הנמוך הוא 0xE8. השולח שולח קודם את 0x03 ואז את 0xE8. המקלט מחשב (hi << 8) | lo = 0x03E8 = 1000](assets/tcp/binary-network-order.svg)

ב-ESP32:

```c
uint16_t light = 1000;           // 0x03E8
client.write(highByte(light));   // 0x03
client.write(lowByte(light));    // 0xE8
```

בצד השני:

```c
uint16_t light = (hi << 8) | lo; // 0x03 << 8 = 0x0300, | 0xE8 = 0x03E8 = 1000
```

ב-Python, המודול **`struct`** מפצל ומחבר בשבילכם. ה-`!` בתחילת הפורמט פירושו סדר בתים של רשת:

| אות בפורמט | טיפוס | בתים |
|---------------|------|-------|
| `B` | 8 ביט בלי סימן, 0 עד 255 | 1 |
| `h` / `H` | 16 ביט עם סימן / בלי סימן | 2 |
| `i` / `I` | 32 ביט עם סימן / בלי סימן | 4 |
| `f` | `float` | 4 |

```python
import struct
struct.pack("!H", 1000)             # b'\x03\xe8'
struct.unpack("!H", b"\x03\xe8")    # (1000,)
```

שני הצדדים צריכים להסכים גם על ה**גודל** של כל ערך. ב-ESP32 משתנה `int` תופס **4 בתים**, אבל ב-Arduino Uno הוא תופס 2. השתמשו בטיפוסים שהגודל כתוב בשם שלהם: `uint8_t` (בית אחד), `int16_t` / `uint16_t` (2 בתים), `int32_t` / `uint32_t` (4 בתים). את הטמפרטורה הכי קל לשלוח כמספר שלם: 23.5 °C הופך ל-`235`, והמקלט מחלק ב-10.

> ה-ESP32 והמחשב שלכם שומרים מספרים בזיכרון ב-**little-endian** (הבית הנמוך קודם). לכן לא כדאי פשוט לשלוח את הזיכרון של `int` או של `float` כמו שהוא: בנו את הבתים בעצמכם עם `highByte()` / `lowByte()`, או עם `struct` ב-Python.

## איפה הודעה נגמרת?

זכרו מפריט הלקוח ש-TCP הוא **זרם** (stream): מה שכתבתם כהודעה אחת יכול להגיע בכמה חלקים, ושתי הודעות יכולות להגיע יחד. בטקסט, ה-`\n` מסמן את הסוף. בבתים גולמיים **כל** ערך יכול להופיע בנתונים, אפילו `0x0A`, הקוד של `\n`, ולכן צריך דרך אחרת.

התשובה המקובלת היא **קידומת אורך** (length prefix): לפני הנתונים שולחים את האורך שלהם ב-2 בתים. המקלט קורא קודם את האורך, ואז מחכה עד שמגיעים בדיוק כמה בתים שצריך.

![הודעה היא 00 04 (אורך 4), ואחריה 00 EB (טמפרטורה 235 = 23.5 °C) ו-02 58 (אור 600). שתי הודעות כאלה נכתבות אחת אחרי השנייה, אבל readyRead מוסר אותן בשלושה חלקים בגדלים שונים. האורך אומר למקלט איפה כל הודעה נגמרת](assets/tcp/binary-stream.svg)

בקו טורי היינו צריכים גם בית התחלה וסכום ביקורת, כי בתים יכולים ללכת לאיבוד או להשתבש בדרך. TCP כבר דואג לזה (ראו את פריט ה-TCP): כל בית מגיע, בסדר הנכון, ובדוק. כל מה שצריך להוסיף הוא האורך.

### לקוח ESP32: שליחת הודעה

```c
#include <WiFi.h>

WiFiClient client;

void sendMessage(int16_t temp10, uint16_t light) {
  uint8_t msg[6] = {
    0x00, 0x04,                          // length of the data = 4 bytes
    highByte(temp10), lowByte(temp10),   // temperature × 10
    highByte(light),  lowByte(light)     // light level
  };
  client.write(msg, sizeof(msg));        // the whole message in one write
}

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
  sendMessage(235, 600);                   // 23.5 °C, light 600
  delay(1000);
}
```

כל שנייה הלוח שולח `00 04 00 EB 02 58`.

### שרת PySide6: קבלת ההודעות

השינויים האלה נכנסים לאפליקציה מהפריט **TCP/IP Server in PySide6**. לכל לקוח יש מאגר (buffer) משלו, כי הבתים של כל לקוח מגיעים בנפרד. `receive()` מוסיפה את הבתים החדשים למאגר של אותו לקוח ומוציאה ממנו כל הודעה שכבר הגיעה במלואה:

```python
import struct

# in __init__:           self.buffers = {}            # one bytearray per client
# in on_new_connection:  self.buffers[client] = bytearray()
# in on_disconnected:    del self.buffers[client]

def receive(self):
    client = self.sender()
    buffer = self.buffers[client]
    buffer += client.readAll().data()
    while len(buffer) >= 2:
        (size,) = struct.unpack("!H", buffer[:2])   # the 2-byte length
        if len(buffer) < 2 + size:
            break                                   # wait for the rest
        data = bytes(buffer[2:2 + size])
        del buffer[:2 + size]                       # remove the message from the buffer
        temp10, light = struct.unpack("!hH", data)
        self.log.appendPlainText(f"◀ {self.name(client)}: {data.hex(' ')}  →  temp={temp10 / 10} °C  light={light}")
```

היומן מציג `00 eb 02 58  →  temp=23.5 °C  light=600`. `"!hH"` פירושו סדר בתים של רשת (`!`), ערך של 16 ביט עם סימן (`h`) וערך של 16 ביט בלי סימן (`H`).

## הכיוון השני: מהמחשב ל-ESP32

שליחת בתים מ-Python קלה באותה מידה. `struct.pack()` בונה את הנתונים, ושמים את האורך שלהם לפניהם:

```python
data = struct.pack("!B", 200)                        # brightness 200, 1 byte
self.socket.write(struct.pack("!H", len(data)) + data)   # 00 01 C8
```

ב-ESP32, `client.read()` מחזירה את הבית הבא כמספר בין 0 ל-255 (או `-1` אם אין כלום שמחכה), ו-`client.read(buffer, n)` קוראת `n` בתים לתוך מערך. הסקיצה הזו היא **שרת** ESP32 קטן שקובע את הבהירות של נורית LED לפי פקודה כזו של 3 בתים:

```c
#include <WiFi.h>

WiFiServer server(5000);
WiFiClient client;

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  WiFi.begin("MyWiFi", "password");
  while (WiFi.status() != WL_CONNECTED) delay(200);
  server.begin();
}

void loop() {
  if (!client.connected()) {
    client = server.available();         // a new client, if one is waiting
    return;
  }
  if (client.available() >= 3) {         // wait until the whole command is here
    uint8_t msg[3];
    client.read(msg, 3);
    uint16_t size = (msg[0] << 8) | msg[1];
    if (size == 1) analogWrite(LED_BUILTIN, msg[2]);
  }
}
```

כוונו את אפליקציית הלקוח מהפריט **TCP/IP Client in PySide6** לכתובת של ה-ESP32, חברו `QSlider` עם טווח 0 עד 255 לשתי השורות שלמעלה, והנורית תעקוב אחרי המחוון דרך ה-Wi-Fi.

## סיכום

- TCP מעביר **בתים**, ערכים מ-0 עד 255. טקסט הוא רק דרך אחת להשתמש בהם.
- `client.print(200)` שולחת את הטקסט `"200"` (3 בתים). `client.write(200)` שולחת בית אחד, `0xC8`.
- כתבו בתים ב-**hex**: בית אחד הוא תמיד 2 ספרות hex. השתמשו בתצוגת hex (`data.hex(" ")`, `xxd`, Wireshark) כדי לראות מה באמת הגיע.
- ערכים גדולים מפוצלים לבתים. ברשת שולחים את **הבית הגבוה קודם** (סדר בתים של רשת, `!` ב-`struct`) ומשתמשים בטיפוסים עם גודל כמו `uint16_t`.
- TCP הוא זרם, לכן שמים **קידומת אורך** לפני כל הודעה. TCP כבר דואג שכל בית יגיע, בסדר הנכון, ולכן לא צריך בית התחלה או סכום ביקורת.
- ב-Python, `struct.pack()` / `struct.unpack()` ו-`.hex(" ")` עושים את העבודה.
