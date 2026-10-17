# חיישן מרחק אולטרסוני

**מה זה:** ל-HC-SR04 יש שתי "עיניים", אבל בעצם אלה רמקול קטנטן ומיקרופון. הוא צועק צפצוף קצר ב-40 kHz, גבוה מדי בשביל שבני אדם ישמעו, ומקשיב להד, בדיוק כמו עטלף או דולפין.

**משמש ל:** חיישני חניה ברכב, רובוטים שנמנעים מקירות, מדי מפלס במכלים ומטרי מדידה בלי מגע.

**איך הוא מדבר:** **אורך פולס**. שולחים פולס של 10 µs על **TRIG**. החיישן מחזיק אז את **ECHO** ב-HIGH בדיוק כל עוד לקח לצליל לעוף לעצם ובחזרה. ככל שהפולס ארוך יותר, העצם רחוק יותר.

![החיישן האולטרסוני שולח פינג, ההד חוזר, ופין ה-ECHO נשאר HIGH לאורך זמן הנסיעה](assets/sensors/ultrasonic.svg)

```c
const int TRIG_PIN = 9;
const int ECHO_PIN = 10;

void setup() {
  Serial.begin(9600);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
}

void loop() {
  // send a 10 µs pulse to start a measurement
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH);   // microseconds
  float cm = duration * 0.0343 / 2;          // there and back again

  Serial.print(cm);
  Serial.println(" cm");
  delay(100);
}
```

למה מחלקים ב-2? הצליל הולך לעצם **וחוזר**, כך שהוא עובר את המרחק פעמיים.

> **אזהרה ל-ESP:** ה-HC-SR04 צריך 5 V, ופין ה-ECHO שלו עונה ב-5 V. העבירו את ה-ECHO ל-ESP דרך מחלק מתח (למשל 1 kΩ ו-2 kΩ) כדי להוריד אותו לבערך 3.3 V, או השתמשו בגרסת ה-3.3 V, ה-HC-SR04P.

## אתגר

**חיישן חניה:** השמיעו צפצוף בבאזר מהר יותר ויותר ככל שהיד שלכם מתקרבת לחיישן האולטרסוני.
