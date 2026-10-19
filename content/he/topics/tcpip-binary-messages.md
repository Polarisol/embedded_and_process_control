# הודעות לא טקסטואליות

עד עכשיו הלקוח והשרת שלנו שלחו **טקסט**: `"speed=1500\n"`. טקסט קל לקרוא ולדבג, אבל המחשב צריך להפוך את המספר לתווים, לשלוח אותם, ובצד השני להפוך אותם בחזרה למספר. במקום זה אפשר לשלוח את ה**בתים** של המספר כמו שהם.

![המספר 1500 שנשלח כטקסט הוא 5 בתים, 31 35 30 30 0A, שהמקלט צריך לפענח. כשהוא נשלח בבינארי הוא 2 בתים, 05 DC, שהמקלט משתמש בהם מיד](assets/tcp/bin-text-vs-binary.svg)

## למה לטרוח?

- **קצר יותר:** 1500 הוא 2 בתים במקום 5. באלפי מדידות בשנייה, זה מצטבר.
- **בלי פענוח:** בלי `split()`, בלי `int()`, בלי "מה אם הטקסט הוא `15OO`?". כל ערך יושב במקום ידוע בהודעה.
- **גודל קבוע:** אם כל הודעה היא 4 בתים, המקלט פשוט מחכה ל-4 בתים. לא צריך לחפש `\n`.

ולפעמים אין ברירה. הרבה מוצרים תעשייתיים מדברים **רק** בבינארי. בקר PLC, דרייבר של מנוע או מונה חשמל שמדברים **Modbus TCP** (פורט 502) מבינים הודעות כמו `00 01 00 00 00 06 01 03 00 00 00 02`, ולא מבינים אף מילה של טקסט. כך גם בקרי PLC של Siemens, הרבה מצלמות IP, ורוב משחקי הרשת.

## בתים ב-Python

אובייקט `bytes` הוא רצף של מספרים מ-0 עד 255:

```python
msg = bytes([1, 3, 5, 220])
print(msg.hex(" "))   # 01 03 05 dc
print(msg[2])         # 5, a single byte is just an int
```

מספר גדול מ-255 צריך יותר מבית אחד. `to_bytes` מפרק אותו ו-`from_bytes` מרכיב אותו בחזרה:

```python
(1500).to_bytes(2, "big")             # b'\x05\xdc', high byte first
int.from_bytes(b"\x05\xdc", "big")    # 1500
```

`"big"` אומר שהבית הגבוה הולך ראשון. זה הסדר המקובל ברשתות (וגם ב-Modbus). שני הצדדים רק צריכים להסכים עליו.

## ההודעה שלנו: 4 בתים

נשלח פקודה שקובעת את המהירות של מנוע. כל הודעה היא בדיוק 4 בתים:

![הודעה של 4 בתים 01 03 05 DC: בית 0 הוא הפקודה (1 = קבע מהירות), בית 1 הוא מספר המנוע (3), ובתים 2 ו-3 הם המהירות, 1500, הבית הגבוה ראשון](assets/tcp/bin-message.svg)

## שליחה: הלקוח

מתחילים מאפליקציית הלקוח בפריט **לקוח TCP/IP ב-PySide6**. רק `send()` ו-`receive()` משתנות. מקלידים שלושה מספרים, למשל `1 3 1500`:

```python
    def send(self):
        parts = self.entry.text().split()            # "1 3 1500" -> ["1", "3", "1500"]
        command = int(parts[0])
        motor = int(parts[1])
        speed = int(parts[2])
        msg = bytes([command, motor]) + speed.to_bytes(2, "big")
        self.socket.write(msg)                       # no encode(), no '\n'
        self.log.appendPlainText("▶ " + msg.hex(" "))
        self.entry.clear()

    def receive(self):
        while self.socket.bytesAvailable() >= 4:     # a whole message is here
            msg = self.socket.read(4).data()
            self.log.appendPlainText("◀ " + msg.hex(" "))
```

## קריאה: השרת

מתחילים מאפליקציית השרת בפריט **שרת TCP/IP ב-PySide6** ומחליפים את `receive()`:

```python
    def receive(self):
        client = self.sender()
        while client.bytesAvailable() >= 4:          # wait for all 4 bytes
            msg = client.read(4).data()
            command = msg[0]
            motor = msg[1]
            speed = int.from_bytes(msg[2:4], "big")
            self.log.appendPlainText(f"◀ {msg.hex(' ')}  command={command} motor={motor} speed={speed}")
            client.write(msg)                         # echo it back as "got it"
```

מקלידים `1 3 1500` בלקוח, והשרת מציג `01 03 05 dc  command=1 motor=3 speed=1500`.

שני דברים לשים לב אליהם:

- **לא משתמשים ב-`readLine()`.** המהירות 10 היא הבית `0x0A`, שהוא גם `'\n'`. בהודעה בינארית כל בית יכול להופיע, אז `canReadLine()` היה חותך הודעות במקום הלא נכון. במקום זה סופרים בתים.
- **את השאר משאירים בחוצץ.** TCP הוא זרם, אז יכולים להגיע 6 בתים: הודעה שלמה אחת וחצי מהבאה. `bytesAvailable() >= 4` קורא רק הודעות שלמות, ו-2 הבתים הנוספים מחכים ל-`readyRead` הבא.

## סיכום

- הודעות בינאריות **קצרות יותר**, **לא צריכות פענוח**, ויכולות להיות ב**גודל קבוע**.
- הרבה מוצרים אמיתיים (בקרי PLC, דרייברים ומונים עם Modbus TCP) מדברים **רק** בבינארי.
- בונים הודעה עם `bytes([...])` ו-`to_bytes(n, "big")`. קוראים אותה בחזרה עם `msg[i]` ו-`int.from_bytes(..., "big")`.
- שולחים עם `write(msg)`: בלי `encode()`, בלי `\n`.
- קוראים עם `bytesAvailable()` ו-`read(n)`, אף פעם לא עם `readLine()`.
- `msg.hex(" ")` מראה לכם מה באמת נשלח.
