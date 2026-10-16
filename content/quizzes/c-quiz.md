# C Basics, sprintf and sscanf

Answer all the questions, then press **Submit answers** to see your score and the corrections.

## Why do we use C, and not Python, on small chips like the Arduino? Choose all that apply.
- [x] It runs fast
  > Right. C is turned into the chip's own language before it runs, so it is often 10 to 100 times faster than Python.
- [ ] It warns you when you make a mistake while the program runs
  > It is the other way around. Python gives clear error messages, but a running C program has no safety net.
- [x] It can control hardware directly and precisely
  > Right. C can do that.
- [x] It is small enough to fit on a tiny chip
  > Right. An Arduino Uno has only 32 KB for programs. Python does not fit there, but a C program can take just a few KB.
- [ ] It is shorter and easier to write than Python
  > Python is usually shorter and easier. People choose C for speed, size and control, not because it is easy.
> A microcontroller is a small, slow chip with very little memory. C is fast, small, and can talk to the chip's pins directly, so it is the natural choice there. Python stays on the PC, where it is easier to write.

## You are translating Python into C. Which C lines are correct **and** do what their comment says? Choose all that apply.
- [ ] `area = r ** 2;      // r squared`
  > C has no `**` operator. Use `r * r`, or `pow(r, 2)` with `#include <math.h>`.
- [x] `count++;           // add one to count`
  > Right. `x++` adds one and `x--` subtracts one. `count += 1;` also works.
- [ ] `half = 7 // 2;     // whole-number division`
  > In C, `//` starts a comment, so the compiler only sees `half = 7` and the semicolon is lost. Integer division is written with a single `/`.
- [ ] `avg = 7 / 2;       // gives 3.5`
  > `7` and `2` are both `int`, so C throws away the fraction and the result is `3`. Write `7.0 / 2` to get `3.5`.
- [x] `if (x > 0 && x < 10)   // x is between 0 and 10`
  > Right. Python's `0 < x < 10` must be split into two comparisons joined with `&&`.
> The main operator differences from Python: no `**` (use `pow`), no `//` (dividing two `int`s already drops the fraction), `++` and `--` exist, and `and`, `or`, `not` are written `&&`, `||`, `!`.

## What does this code print?
```c
int v[5] = {3, 7};
v[3] = v[0] + v[1];
printf("%d %d\n", v[3] / 4, v[4]);
```
- [ ] `2.5 0`
  > `v[3]` is an `int` and `4` is an `int`, so the division drops the fraction.
- [ ] `2` followed by a garbage value
  > The first number is right, but `v[4]` is not garbage: when you give some starting values in braces, the rest of the array is set to zero.
- [x] `2 0`
  > Right! `v[3]` is `3 + 7 = 10`, `10 / 4` is `2` in integer division, and `v[4]` was set to `0` by the partial initializer.
- [ ] `2.5` followed by a garbage value
  > Two mistakes: `int / int` gives a whole number, and the missing values in `{3, 7}` are filled with zeros, not garbage.
> `int v[5] = {3, 7};` gives `3, 7, 0, 0, 0`. Without braces (`int v[5];`) all five items would hold garbage. And `int / int` is always a whole number.

## The variable `name` was declared as `char name[20] = "Dana";`. Which line correctly changes its text to `"Noa"`?
- [x] `strcpy(name, "Noa");`
  > Right. `strcpy` copies new text into the string. The destination comes first, just like `name = "Noa"` reads.
- [ ] `name = "Noa";`
  > The `= "..."` form only works in the declaration. Afterwards the compiler refuses to assign to an array.
- [ ] `strcat(name, "Noa");`
  > `strcat` adds text to the end, so `name` would become `"DanaNoa"`.
- [ ] `strcpy("Noa", name);`
  > The arguments are reversed. This tries to copy into the text `"Noa"`, which is not a place you can write to.
> A C string is an array of `char` ending with a hidden `'\0'`. After the declaration you change it with functions from `string.h`: `strcpy` to replace, `strcat` to add, `strcmp` to compare and `strlen` to measure.

## What does this code print?
```c
int mode = 2;

switch (mode) {
    case 1:
        printf("A");
    case 2:
        printf("B");
    case 3:
        printf("C");
        break;
    default:
        printf("D");
}
```
- [ ] `B`
  > `case 2` has no `break`, so the program does not stop after printing `B`.
- [ ] `BCD`
  > The `break` at the end of `case 3` stops the switch before it reaches `default`.
- [ ] `ABC`
  > The switch jumps straight to `case 2`. `case 1` is skipped because `mode` is not 1.
- [x] `BC`
  > Right! The switch jumps to `case 2`, prints `B`, falls through into `case 3` because there is no `break`, prints `C`, and the `break` ends the switch.
> A `switch` jumps to the matching `case` and runs from there **until it meets a `break`**, even through the following cases. That is why every case normally ends with `break;`.

## Which of these variables can **not** be used as the value in `switch (...)`?
- [ ] `char key`
  > A `char` works fine, for example `case 'A':`.
- [x] `float voltage`
  > Right. `switch` works only with whole-number values: `int` and `char`. For a `float`, use an `if` / `else if` chain.
- [ ] `int mode`
  > `int` is the most common type to switch on.
- [ ] `int n`, the value returned by `sscanf`
  > The return value of `sscanf` is an ordinary `int`, so you can switch on it, for example `case 2:`.
> `switch` compares one `int` or `char` with fixed values. It does not work with `float` or with strings, so text commands are compared with `strcmp` in an `if` chain. Also remember: declare any variables you need **above** the switch, never inside a case.

## Which line puts the values of `speed` and `temp` into `msg` as the text `SPEED ... TEMP ...`?
```c
char msg[40];
int speed = 150;
double temp = 23.5;
```
- [ ] `sprintf("SPEED %d TEMP %lf", msg, speed, temp);`
  > The string to write into comes **first**, before the format text.
- [x] `sprintf(msg, "SPEED %d TEMP %lf", speed, temp);`
  > Right! First the string to write into, then the format text, then the values in the same order as their `%` codes: `%d` for the `int`, `%lf` for the `double`.
- [ ] `sprintf(msg, "SPEED %lf TEMP %d", speed, temp);`
  > The codes are swapped. `speed` is an `int` and needs `%d`, and `temp` is a `double` and needs `%lf`. Each code must match the type of its value.
- [ ] `msg = sprintf("SPEED %d TEMP %lf", speed, temp);`
  > `sprintf` does not give the text back with `=`. You hand it the string, and it writes the text into it.
> `sprintf(string, "format text", values...)` is `printf` with one extra argument at the front: the string to write into. The constant text is copied as is, and each `%` code is replaced by the next value.

## Which line reads the numbers out of `line` into `speed` and `temp`?
```c
char line[] = "SPEED 150 TEMP 23.5";
int speed;
float temp;
```
- [ ] `sscanf(line, "%d %f", &speed, &temp);`
  > The string starts with the word `SPEED`, which is not a number, so `%d` fails right away and nothing is read. The constant text must be in the format too.
- [ ] `sscanf(line, "SPEED %d TEMP %f", speed, temp);`
  > The format is right, but `speed` and `temp` are simple variables, so they need an `&` in front.
- [ ] `sscanf("SPEED %d TEMP %f", line, &speed, &temp);`
  > The string to read from comes **first**, then the format text.
- [x] `sscanf(line, "SPEED %d TEMP %f", &speed, &temp);`
  > Right! The constant text `SPEED` and `TEMP` matches the words in `line`, `%d` reads 150 and `%f` reads 23.5, and the `&` lets `sscanf` store them.
> `sscanf(string, "format text", &var1, &var2...)` is `scanf` reading from a string. Any constant text in the format must appear in the string exactly as written, and every simple variable needs an `&`.
