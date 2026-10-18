# תקשורת טורית ב-Arduino

אתם כבר יודעים מה עובר על החוט: מסגרות של ביט התחלה, נתונים וביט עצירה. עכשיו בואו נשתמש בזה. ב-Arduino כל זה מוסתר מאחורי אובייקט אחד, **`Serial`**, וכמה פונקציות. הפריט הזה עוסק בשליחה, בקבלה, ב-Serial Monitor וב-Serial Plotter, ובאיך קוראים פקודות בלי להקפיא את התוכנית.

## שני פורטים טוריים ב-Nano ESP32

ל-Nano ESP32 יש יותר מפורט טורי אחד. השניים שתפגשו ראשונים הם:

![ל-Nano ESP32 יש את Serial, שעובר בכבל ה-USB אל ה-Serial Monitor, ה-Serial Plotter או אפליקציית ה-PySide שלכם במחשב, ואת Serial0 על הפינים D1 (TX) ו-D0 (RX), שמחוברים בהצלבה למודול GPS או לכרטיס אחר](assets/serial/arduino-two-ports.svg)

| שם | לאן הוא מוביל | משתמשים בו בשביל |
|------|---------------|------------|
| **`Serial`** | **כבל ה-USB** אל המחשב | Serial Monitor, Serial Plotter, אפליקציית ה-Python שלכם, דיבוג |
| **`Serial0`** | הפינים **D1 (TX)** ו-**D0 (RX)** | כרטיס אחר, מודול GPS או Bluetooth |

שניהם עובדים באותה צורה: כל מה שמופיע בהמשך עם `Serial.` עובד גם עם `Serial0.`. כשמחברים שני כרטיסים דרך `Serial0`, החוטים **מוצלבים** (TX ל-RX, ו-RX ל-TX) וצריך לחבר גם את האדמות (GND), כמו בפריט **מבוא**.

> ב-Arduino Uno יש רק פורט חומרה אחד, `Serial`, והוא משתמש **גם** בכבל ה-USB וגם בפינים 0 ו-1. בגלל זה העלאת קוד ל-Uno נכשלת כשמשהו מחובר לפינים האלה. ל-Nano ESP32 אין את הבעיה הזו.

## הפעלת הפורט

```c
void setup() {
  Serial.begin(9600);          // 9600 baud, 8N1
}
```

`Serial.begin()` קובעת את קצב הבאוד ואת מבנה המסגרת (ראו את הפריט **מסגרת טורית**). הצד השני חייב להשתמש באותם ערכים, ולכן המהירות שתבחרו ב-Serial Monitor חייבת להתאים.

שני דברים מיוחדים בפורט ה-USB של ה-Nano ESP32:

- ב-`Serial` קצב הבאוד לא באמת משנה, כי ה-USB קובע מהירות משלו. ב-`Serial0` הוא כן משנה, כי שם יוצאות מסגרות אמיתיות על הפינים.
- הכרטיס **לא** מתחיל מחדש כשפותחים את ה-Serial Monitor, כך שמה ש-`setup()` הדפיסה אולי כבר עבר. כדי לחכות למחשב, הוסיפו `while (!Serial) { }` אחרי `Serial.begin()`. הסירו את זה כשהכרטיס עובד בלי מחשב, אחרת הוא יחכה לנצח.

## שליחה: `print`, `println` ו-`printf`

```c
int light = 600;
float temp = 23.5;

Serial.print("light = ");     // text, no new line
Serial.println(light);        // the number as text, then "\r\n"
Serial.println(temp, 2);      // 23.50 (2 digits after the point)
Serial.println(light, HEX);   // 258
Serial.println(light, BIN);   // 1001011000
Serial.printf("temp=%.1f light=%d\n", temp, light);  // like C's printf
```

| פונקציה | מה היא שולחת |
|----------|---------------|
| `Serial.print(x)` | את `x` כ**טקסט** |
| `Serial.println(x)` | את `x` כטקסט, ואחריו `'\r'` ו-`'\n'` |
| `Serial.printf(...)` | טקסט מעוצב, כמו `printf` ב-C (עובד ב-ESP32, לא ב-Uno) |
| `Serial.write(b)` | **בית** גולמי אחד עם הערך `b`, לא טקסט |

כל אלה שולחות טקסט חוץ מ-`write()`. `Serial.print(200)` שולחת את שלושת התווים `'2'`, `'0'`, `'0'`. כדי לשלוח בתים גולמיים וחבילות שלמות, ראו את הפריט **שליחת נתונים שאינם מחרוזות**.

שליחה לוקחת זמן: ב-9600 באוד כל תו לוקח בערך 1 ms. ה-Arduino שם את מה שמדפיסים ב**מאגר שליחה** (transmit buffer) ושולח אותו ברקע, אבל אם מדפיסים יותר ממה שנכנס, `print()` מחכה עד שמתפנה מקום. הדפסה של הרבה טקסט בקצב באוד נמוך מאטה את כל ה-`loop()`.

## ה-Serial Monitor וה-Serial Plotter

בסביבת Arduino:

- **Tools → Serial Monitor** מציג את הטקסט שהכרטיס שולח, ויש בו תיבה למעלה לשליחת טקסט אל הכרטיס. לידה, תפריט **סוף השורה** (line ending) בוחר מה מתווסף כשלוחצים Enter: *No Line Ending*, *New Line* (`\n`), *Carriage Return* (`\r`) או *Both NL & CR*. בחרו **New Line** בשביל הדוגמאות שבהמשך.
- **Tools → Serial Plotter** מצייר גרף חי. הדפיסו את המספרים בשורה אחת, מופרדים בפסיקים, וסיימו את השורה. `name:` לפני ערך נותן לו שם במקרא:

```c
Serial.print("temp:");
Serial.print(temp);
Serial.print(",light:");
Serial.println(light);       // temp:23.5,light:600
```

רק תוכנית אחת יכולה להשתמש בפורט בכל רגע. סגרו את ה-Serial Monitor לפני שאתם מריצים את אפליקציית ה-PySide, וסגרו את האפליקציה לפני העלאת קוד.

## קבלה: מאגר הקבלה

בתים יכולים להגיע בכל רגע, גם כשהקוד שלכם עסוק במשהו אחר. ה-Arduino שומר אותם ב**מאגר קבלה** (receive buffer) עד שקוראים אותם:

![המחשב שולח "LED ON\n". ארבעה בתים, L, E, D ורווח, כבר נמצאים במאגר ושלושה עוד בדרך. Serial.available() מחזירה 4, Serial.read() מחזירה את הבית הוותיק ביותר 'L', ומחזירה -1 כשהמאגר ריק](assets/serial/arduino-rx-buffer.svg)

| פונקציה | מה היא עושה |
|----------|--------------|
| `Serial.available()` | כמה בתים מחכים. לא מוציאה כלום |
| `Serial.read()` | מוציאה את הבית הוותיק ביותר ומחזירה אותו (0 עד 255), או `-1` אם אין |
| `Serial.peek()` | כמו `read()`, אבל משאירה את הבית במאגר |

המאגר קטן (64 בתים ב-Uno, כמה מאות ב-ESP32). אם לא קוראים אותו, בתים חדשים נזרקים.

התוכנית הפשוטה ביותר קוראת תו אחד בכל פעם, פקודה של אות אחת:

```c
void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  if (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '1') digitalWrite(LED_BUILTIN, HIGH);
    if (c == '0') digitalWrite(LED_BUILTIN, LOW);
  }
}
```

הקלידו `1` או `0` ב-Serial Monitor. גם ה-`'\n'` שה-Monitor מוסיף נקרא, ופשוט לא עושים איתו כלום.

## קריאה של שורות ומספרים שלמים

ל-Arduino יש פונקציות שקוראות יותר מבית אחד בבת אחת:

| פונקציה | קוראת עד | מחזירה |
|----------|-------------|---------|
| `Serial.readStringUntil('\n')` | `'\n'` (לא כולל) | `String` |
| `Serial.readString()` | שלא מגיע כלום לזמן מה | `String` |
| `Serial.parseInt()` | שהמספר נגמר | `long`, או `0` אם לא הגיע מספר |
| `Serial.parseFloat()` | שהמספר נגמר | `float` |

```c
void loop() {
  if (Serial.available() > 0) {
    int brightness = Serial.parseInt();   // "128\n" → 128
    analogWrite(LED_BUILTIN, brightness);
  }
}
```

קל להשתמש בהן, אבל יש בהן מלכודת: הן **מחכות**. אם שאר השורה עוד לא הגיע, הן ממשיכות לחכות עד שהוא מגיע, או עד שנגמר ה**זמן הקצוב** (timeout, שנייה אחת כברירת מחדל, ומשנים אותו עם `Serial.setTimeout(ms)`). כל אותו זמן ה-`loop()` תקוע.

## קריאה בלי לחכות

![שני צירי זמן. עם readStringUntil הנורית מהבהבת, ואז קופאת מהבית הראשון עד שמגיע '\n'. כשקוראים תו אחד בכל פעם, הנורית ממשיכה להבהב כל הזמן והשורה מוכנה כשמגיע '\n'](assets/serial/arduino-blocking.svg)

כשהתוכנית חייבת להמשיך לעשות דברים אחרים (להבהב, לקרוא חיישנים, להפעיל מנוע), אספו את השורה בעצמכם, תו אחד בכל `loop()`, ופעלו רק כשמגיע `'\n'`:

```c
char line[32];      // the line being collected
int len = 0;

void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
}

void handleCommand(const char *cmd) {
  if (strcmp(cmd, "LED ON") == 0)  digitalWrite(LED_BUILTIN, HIGH);
  else if (strcmp(cmd, "LED OFF") == 0) digitalWrite(LED_BUILTIN, LOW);
  else if (strncmp(cmd, "PWM ", 4) == 0) analogWrite(LED_BUILTIN, atoi(cmd + 4));
  else {
    Serial.print("unknown: ");
    Serial.println(cmd);
    return;
  }
  Serial.println("ok");
}

void loop() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\r') continue;           // ignore '\r' from "Both NL & CR"
    if (c == '\n') {                   // the line is complete
      line[len] = '\0';
      handleCommand(line);
      len = 0;
    } else if (len < sizeof(line) - 1) {
      line[len++] = c;                 // add the character
    }
  }

  // ...the rest of loop() keeps running: sensors, motors, a blinking LED
}
```

- `line` היא מחרוזת C: מערך של `char` שמסתיים ב-`'\0'` (ראו [שפת C](topic.html?id=c-language)).
- `len < sizeof(line) - 1` מונע משורה ארוכה מדי לכתוב מעבר לסוף המערך.
- `strcmp()` משווה בין שתי מחרוזות ומחזירה `0` כשהן שוות. `atoi()` הופכת טקסט כמו `"128"` למספר.

שלחו `LED ON`, `LED OFF` או `PWM 50` והכרטיס יענה `ok`. זה אותו סוג של פרוטוקול טקסט שבו משתמשת האפליקציה בפריט **תקשורת טורית ב-PySide**.

## פרוטוקול: מסכימים על ההודעות

**פרוטוקול** הוא ההסכמה בין שני הצדדים על איך ההודעות נראות. פרוטוקול טקסט טוב לפרויקט:

- **הודעה אחת בכל שורה**, שמסתיימת ב-`'\n'`.
- **מילת פקודה** קודם, ואחריה ערכים, מופרדים ברווחים או בפסיקים: `PWM 128`, `MOTOR 1,200`.
- הכרטיס **עונה** על כל פקודה (`ok`, `error`, או הערך שביקשו), כדי שהמחשב יידע שהיא התקבלה.
- קריאות חיישנים בצורה קבועה, כמו `temp=23.5,light=600`, שקל לפצל ב-Python.

## סיכום

- `Serial` עובר ב-USB אל המחשב. `Serial0` משתמש בפינים D1 (TX) ו-D0 (RX).
- `Serial.begin(baud)` מפעילה את הפורט. שני הצדדים חייבים להשתמש באותן הגדרות.
- `print()` ו-`println()` שולחות **טקסט**. `write()` שולחת בתים גולמיים.
- ה-Serial Monitor שולח ומציג טקסט. ה-Serial Plotter מצייר גרף של מספרים מופרדים בפסיקים.
- בתים שהתקבלו מחכים במאגר. `available()` אומרת כמה יש, `read()` לוקחת אחד.
- `readStringUntil()` ו-`parseInt()` קלות אבל **מחכות**. כדי שה-`loop()` ימשיך לרוץ, אספו תווים בעצמכם עד `'\n'`.
