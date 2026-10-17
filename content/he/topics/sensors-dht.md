# חיישן טמפרטורה ולחות DHT11 / DHT22

**מה זה:** קופסה קטנה כחולה (DHT11) או לבנה (DHT22) עם חורים. בפנים יש תרמיסטור וחיישן לחות, ועוד שבב קטנטן שעושה בשבילכם את המדידה.

**משמש ל:** תחנות מזג אוויר, חממות, תרמוסטטים חכמים ובדיקה אם חדר לח מדי.

**איך הוא מדבר:** **נתונים דיגיטליים**. במקום מתח, השבב שולח הודעה של 40 ביט על חוט יחיד: לחות, טמפרטורה ו**סכום ביקורת** (checksum) כדי לתפוס שגיאות. התזמון מסובך, אז נותנים לספרייה לעשות את זה. התקינו את **"DHT sensor library" by Adafruit** מתוך ה-Library Manager.

![חיישן טמפרטורה ולחות DHT11](assets/sensors/dht.svg)

```c
#include <DHT.h>

DHT dht(2, DHT11);    // data pin 2, sensor type DHT11 (or DHT22)

void setup() {
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  float temp = dht.readTemperature();   // °C
  float hum  = dht.readHumidity();      // %
  Serial.print(temp);
  Serial.print(" °C   ");
  Serial.print(hum);
  Serial.println(" %");
  delay(2000);          // the DHT11 can only measure about once a second
}
```

זו הטעימה הראשונה שלכם מחיישנים ששולחים את הקריאה שלהם כ**נתונים**. הרבה חיישנים מתקדמים (מדי תאוצה, חיישני לחץ, חיישני צבע) עובדים כך, ולעיתים קרובות על פס תקשורת דו-חוטי שנקרא **I²C**.
