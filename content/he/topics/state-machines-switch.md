# מכונות מצבים עם switch

ב**מבוא** ציירנו מכונות מצבים בעזרת עיגולים וחיצים. עכשיו נהפוך את הציורים האלה לקוד ארדואינו. הכלי הוא פקודת `switch` מהיחידה **שפת C**, ועוד משתנה אחד שזוכר את המצב הנוכחי.

צריך רק את הלוח. הדוגמאות משתמשות בנורות שכבר נמצאות על ה-Nano ESP32, ובכפתור אחד (או סתם חוט).

## המתכון

כל מכונות המצבים בפריט הזה בנויות באותה דרך:

1. **תנו שם לכל מצב** בעזרת `enum`.
2. **שמרו את המצב הנוכחי במשתנה אחד**, והציבו בו את מצב ההתחלה.
3. ב-`loop()`, **קראו את האירועים פעם אחת** בהתחלה: כפתורים, חיישנים, טיימרים. (קריאות שמחכות הן יוצא מן הכלל, ראו בהמשך.)
4. **עשו `switch` על המצב.** כל מצב מקבל `case` משלו. בתוכו:
   - עשו את מה שהמצב הזה עושה (ה**יציאות** שלו),
   - בדקו את האירועים שיוצאים מהמצב הזה, וכשאחד מהם קורה, **שנו את משתנה המצב** (זה **מעבר**),
   - סיימו ב-`break`.

כך כל חלק בדיאגרמת המנורה מהמבוא הופך לחלק בקוד:

![משמאל דיאגרמת המצבים של המנורה, מימין הקוד המתאים. חץ ההתחלה מתאים לשורה שמציבה ערך במשתנה המצב, כל עיגול של מצב מתאים ל-case, הכיתוב בתוך מצב מתאים ל-digitalWrite שלו, וכל חץ מתאים ל-if שמשנה את המצב](assets/state-machines/switch-mapping.svg)

### מה זה `enum`?

`enum` נותן שמות לרשימה של מספרים שלמים:

```c
enum LampState { LAMP_OFF, LAMP_ON };
```

זה יוצר טיפוס חדש, `LampState`, שהערכים שלו הם `LAMP_OFF` (שהוא בעצם 0) ו-`LAMP_ON` (בעצם 1). אפשר היה להשתמש פשוט במספרים 0 ו-1, אבל `case LAMP_ON:` הרבה יותר קל לקריאה מ-`case 1:`, והקומפיילר מזהיר אתכם אם תנסו לשים במשתנה ערך שהוא לא אחד המצבים.

## דוגמה 1: מנורה עם כפתור אחד

חברו לחצן בין פין **D2** ל-**GND**. אין לכם לחצן? קחו חוט מגשר וגעו בקצה החופשי שלו בפין GND. אנחנו מפעילים את נגד ה-**pull-up** המובנה של הפין בעזרת `INPUT_PULLUP`, ולכן הפין קורא **HIGH** כשהכפתור משוחרר ו-**LOW** כשהוא לחוץ. היחידה **חיישנים** מסבירה למה.

```c
const int BUTTON_PIN = D2;
const int LED_PIN = LED_BUILTIN;      // the LED marked "L" on the board

enum LampState { LAMP_OFF, LAMP_ON };
LampState state = LAMP_OFF;           // the start state

int lastButton = HIGH;                // released

// Returns true only at the moment the button goes down.
bool buttonPressed() {
  int button = digitalRead(BUTTON_PIN);
  if (button != lastButton) {         // a change, but the button may still be bouncing...
    delay(5);                         // ...so wait 5 ms
    button = digitalRead(BUTTON_PIN); // ...and read again
  }
  bool pressed = (button == LOW && lastButton == HIGH);
  lastButton = button;
  return pressed;
}

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  bool pressed = buttonPressed();     // read the events once

  switch (state) {
    case LAMP_OFF:
      digitalWrite(LED_PIN, LOW);     // what this state does
      if (pressed) {
        state = LAMP_ON;              // the transition
      }
      break;

    case LAMP_ON:
      digitalWrite(LED_PIN, HIGH);
      if (pressed) {
        state = LAMP_OFF;
      }
      break;
  }
}
```

העלו את הקוד ולחצו על הכפתור: הנורה נדלקת ונכבית לסירוגין.

שני דברים ששווה לשים לב אליהם:

- **אותו אירוע מטופל בשני מקומות.** `pressed` אומר "הדלק" ב-`LAMP_OFF` ו"כבה" ב-`LAMP_ON`. כל `case` מתעניין רק במה שקורה במצב שלו.
- **`buttonPressed()` מחזירה true רק ברגע שהכפתור יורד**, ולא כל הזמן שהוא לחוץ. אחרת המנורה הייתה נדלקת ונכבית אלפי פעמים בשנייה כל עוד אתם מחזיקים את הכפתור.

## דוגמה 2: רמזור עם טיימר

הרמזור מהמבוא מחליף מצב אחרי ש**זמן** מסוים עבר. על ה-Nano ESP32 יש **נורת RGB**, אז היא יכולה להיות הרמזור שלנו: אדום, ירוק, ואדום וירוק יחד בשביל צהוב.

הדרך המתבקשת לחכות היא `delay(5000)`. אל תשתמשו בה במכונת מצבים: בזמן `delay()` הלוח לא עושה שום דבר אחר, ולכן הוא לא יכול לשים לב לכפתור, לחיישן או לכל דבר אחר שקורה. השתמשו במקום זה ב-`millis()`.

`millis()` מחזירה כמה מילישניות עברו מאז שהלוח התחיל לעבוד. כשנכנסים למצב, רושמים את השעה. אחר כך, בכל סיבוב של `loop()`, בודקים כמה זמן אנחנו כבר במצב:

```c
// The RGB LED is "upside down": LOW turns a colour on, HIGH turns it off.
const int LED_ON = LOW;
const int LED_OFF = HIGH;

enum LightState { LIGHT_RED, LIGHT_GREEN, LIGHT_YELLOW };
LightState state = LIGHT_RED;          // the start state
unsigned long enteredAt = 0;           // millis() when we entered the current state

void goTo(LightState next) {
  state = next;
  enteredAt = millis();                // start timing the new state
}

void setColour(int red, int green) {
  digitalWrite(LED_RED, red);
  digitalWrite(LED_GREEN, green);
}

void setup() {
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);
  digitalWrite(LED_BLUE, LED_OFF);     // we don't need blue
}

void loop() {
  unsigned long timeInState = millis() - enteredAt;   // the timer event

  switch (state) {
    case LIGHT_RED:
      setColour(LED_ON, LED_OFF);
      if (timeInState >= 5000) {
        goTo(LIGHT_GREEN);
      }
      break;

    case LIGHT_GREEN:
      setColour(LED_OFF, LED_ON);
      if (timeInState >= 4000) {
        goTo(LIGHT_YELLOW);
      }
      break;

    case LIGHT_YELLOW:
      setColour(LED_ON, LED_ON);       // red + green looks yellow
      if (timeInState >= 1000) {
        goTo(LIGHT_RED);
      }
      break;
  }
}
```

הזמנים כאן קצרים יותר מאשר ברמזור אמיתי, כדי שלא תצטרכו לחכות חצי דקה כדי לראות שזה עובד.

כל מעבר עובר דרך `goTo()`, כך שהטיימר מתאפס בכל פעם שהמצב משתנה, ואי אפשר לשכוח אותו.

## דוגמה 3: מוסיפים כפתור לרמזור

עכשיו מכונת המצבים משתלמת. נוסיף **כפתור להולכי רגל**: לחיצה עליו כשהרמזור ירוק גורמת לו להפוך לצהוב מיד, במקום לחכות.

העתיקו את `BUTTON_PIN`, את `lastButton` ואת `buttonPressed()` מדוגמה 1, הוסיפו `pinMode(BUTTON_PIN, INPUT_PULLUP);` ל-`setup()`, ושנו רק שני מקומות ב-`loop()`:

```c
void loop() {
  unsigned long timeInState = millis() - enteredAt;
  bool pressed = buttonPressed();      // a second event

  switch (state) {
    // ... LIGHT_RED stays the same ...

    case LIGHT_GREEN:
      setColour(LED_OFF, LED_ON);
      if (timeInState >= 4000 || pressed) {   // time is up, OR someone pressed
        goTo(LIGHT_YELLOW);
      }
      break;

    // ... LIGHT_YELLOW stays the same ...
  }
}
```

זה כל השינוי: חץ חדש אחד בדיאגרמה הוא תנאי חדש אחד ב-`case` אחד. לחיצה על הכפתור כשהרמזור אדום או צהוב לא עושה כלום, כי ה-cases האלה אף פעם לא מסתכלים על `pressed`. ומכיוון שאין `delay()`, הכפתור עובד בכל רגע.

## היוצא מן הכלל: קריאות שמחכות

המתכון אומר לקרוא כל אירוע פעם אחת, בתחילת `loop()`, ולא בתוך ה-`case`ים. זה נכון לקריאות **שחוזרות מיד**, אבל יש יוצא מן הכלל לקריאות **שמחכות**:

- **היא חוזרת מיד** (`digitalRead()`, `analogRead()`, בדיקות של `millis()`, פונקציית כפתור כמו `buttonPressed()`): קראו אותה **בתחילת `loop()`**. היא כמעט לא עולה זמן, והמשתנים נקיים ומוכנים לכל מצב שצריך אותם.
- **היא חוסמת או עוצרת** (`delay()`, `pulseIn()`, המתנה להודעה ב-`Serial`): שימו אותה **בתוך ה-`case` של המצב היחיד שצריך אותה**. בתחילת `loop()` היא הייתה רצה בכל סיבוב, בכל מצב, ומאטה את כל המכונה גם כשאף אחד לא משתמש בתוצאה.

לדוגמה, **חיישן המרחק האולטרסוני** מיחידת **חיישנים** משתמש ב-`pulseIn()`, שמחכה שההד יחזור. כאן רק המצב `MEASURE` צריך מרחק, ולכן רק ה-`case` שלו מודד:

```c
void loop() {
  bool pressed = buttonPressed();             // returns at once: read it at the top
  unsigned long timeInState = millis() - enteredAt;
  unsigned long echo = 0;                     // only the MEASURE state fills this in

  switch (state) {
    case IDLE:
      if (pressed) {
        goTo(MEASURE);
      }
      break;

    case MEASURE:
      digitalWrite(TRIG_PIN, HIGH);           // send a sound pulse
      delayMicroseconds(10);
      digitalWrite(TRIG_PIN, LOW);
      echo = pulseIn(ECHO_PIN, HIGH, 30000);  // waits for the echo: up to 30 ms
      if (echo > 0 && echo < 600) {           // something closer than about 10 cm
        goTo(ALARM);
      } else {
        goTo(IDLE);
      }
      break;

    // ... ALARM ...
  }
}
```

את הכפתור עדיין קוראים בתחילת `loop()`, כי `buttonPressed()` חוזרת מיד. `pulseIn()` מחכה, ולכן היא נמצאת ב-`MEASURE` ורצה רק כשהמכונה במצב הזה. בזמן שהיא מחכה הלוח עדיין לא יכול לשים לב לשום דבר אחר, אז שמרו על המתנות כאלה קצרות (כאן ה-timeout מגביל אותה ל-30 מילישניות).

## טעויות נפוצות

| טעות | מה קורה | התיקון |
|---------|--------------|-----|
| שוכחים `break` | התוכנית ממשיכה לרוץ לתוך ה-`case` הבא, וסיבוב אחד עושה את העבודה של שני מצבים | סיימו כל `case` ב-`break;` |
| משתמשים ב-`delay()` בתוך מצב | הלוח מפסיק לשים לב לכפתורים ולחיישנים בזמן שהוא מחכה | מדדו את זמן המצב בעזרת `millis()` |
| קוראים את הכפתור בתוך כל `case` | קל לקרוא אותו פעמיים בסיבוב אחד, או לפספס לחיצה | קראו כל אירוע שחוזר מיד פעם אחת, בתחילת `loop()`. רק קריאות שמחכות נכנסות ל-`case` שלהן |
| מגדירים משתנה בתוך `case` | שגיאות קומפילציה מבלבלות | הגדירו אותו מעל ה-`switch` |
| משנים את `state` בלי לאפס את הטיימר | המצב הבא חושב שהזמן שלו כבר נגמר | שנו מצב תמיד דרך פונקציה אחת, כמו `goTo()` |

## סיכום

- מכונת מצבים בארדואינו היא `enum` של מצבים, משתנה `state` אחד ו-`switch (state)` בתוך `loop()`.
- כל **מצב** הוא `case`. בתוכו קובעים את ה**יציאות**, בודקים את ה**אירועים**, ומשנים את `state` בשביל **מעבר**.
- קוראים את האירועים **פעם אחת** בתחילת `loop()`. היוצא מן הכלל הוא קריאה שמחכה, כמו `pulseIn()`: היא נכנסת ל-`case` שצריך אותה.
- לטיימרים משתמשים ב-`millis()`, אף פעם לא ב-`delay()`, כדי שהלוח ימשיך להקשיב לכל השאר.
- הוספת יכולת היא בדרך כלל הוספה של `case` אחד או של תנאי אחד. שאר הקוד נשאר כמו שהוא.

## אתגר

בנו את **הדלת האוטומטית** מהמבוא. השתמשו בכפתור בתור חיישן "זוהה אדם", בנורה האדומה בשביל "מנוע אחורה" (נסגרת) ובנורה הירוקה בשביל "מנוע קדימה" (נפתחת). פתיחה וסגירה לוקחות 2 שניות כל אחת, והדלת נסגרת אחרי 5 שניות שאין אף אחד. אל תשכחו את החץ האדום: לחיצה בזמן שהדלת **נסגרת** חייבת להחזיר אותה למצב **נפתחת**.
