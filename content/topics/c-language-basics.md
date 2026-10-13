# C Language Basics

You already know Python, so you already know how to program. C uses the same ideas (variables, `if`, loops, functions) with a stricter way of writing them. This page shows the basics side by side with what you know.

> **The three big differences from Python**
> 1. Every statement ends with a **semicolon** `;`
> 2. Blocks are marked with **curly braces** `{ }`, not with indentation. Indent anyway, so people can read your code.
> 3. Every variable has a **type** that you declare, and it never changes.

C is also **compiled**: before the program can run, a compiler translates the whole file into machine code. Mistakes such as a missing `;` are reported then, before anything runs.

## The necessary form of a program

Every C program has a function called `main`. The program starts there.

```c
#include <stdio.h>

int main(void)
{
    printf("Hello, world!\n");
    return 0;
}
```

| Line | What it does |
|------|--------------|
| `#include <stdio.h>` | Like Python's `import`. `stdio.h` gives you `printf` and `scanf` |
| `int main(void)` | The `main` function. It takes nothing (`void`) and returns an `int` |
| `{ ... }` | Everything between the braces belongs to `main` |
| `printf(...)` | Prints text. Unlike Python's `print`, it does **not** add a new line, so you write `\n` yourself |
| `return 0;` | Ends the program. `0` means "everything went well" |

Comments are written with `//` for one line, or `/* ... */` for several lines. Python's `#` is not a comment in C.

## Declaring variables

In Python you write `age = 20`. In C you say the type first:

```c
int age = 20;           // whole number
float temperature = 36.6;  // number with a decimal point
double pi = 3.14159265358979;  // decimal number with more precision
char grade = 'A';       // one single character, in single quotes
int counter;            // declared now, given a value later
counter = 0;
```

| Type | Holds | `printf` / `scanf` code |
|------|-------|-------------------------|
| `int` | Whole numbers | `%d` |
| `float` | Decimal numbers, about 7 significant digits | `%f` |
| `double` | Decimal numbers, about 15 significant digits | `%f` in `printf`, `%lf` in `scanf` |
| `char` | One character | `%c` |
| a string | Text (see below) | `%s` |

Python's `float` is really C's `double`. A `float` takes half the memory (4 bytes, not 8), which matters on a small microcontroller, but it is less precise.

To print a variable, put its code in the text and the variable after it:

```c
printf("Age: %d, temperature: %.1f, grade: %c\n", age, temperature, grade);
```

`%.1f` means "one digit after the decimal point". There are no f-strings in C.

> **Watch out:** a variable with no starting value holds **garbage**, not zero. Always give it a value before you use it.

## Math operators

`+`, `-`, `*`, `/` and `%` (remainder) work as in Python, with a few surprises:

| Python | C | Note |
|--------|---|------|
| `7 / 2` gives `3.5` | `7 / 2` gives `3` | Dividing two `int`s throws away the fraction. Write `7.0 / 2` to get `3.5` |
| `7 // 2` | `7 / 2` | There is no `//` operator. In C, `//` starts a comment |
| `2 ** 3` | `pow(2, 3)` | There is no `**`. `pow` needs `#include <math.h>` |
| `x += 1` | `x++;` | `x++` adds one and `x--` subtracts one. `x += 1` also works |
| `and`, `or`, `not` | `&&`, `\|\|`, `!` | The logic operators are symbols |
| `True`, `False` | `1`, `0` | Zero is false, anything else is true |

The comparisons `==`, `!=`, `<`, `>`, `<=`, `>=` are the same as in Python.

## Arrays

An array is like a Python list, but stricter: **all items have the same type** and **the size is fixed** when you create it.

To declare an array, give the type, a name and the size in square brackets:

```c
int scores[5];      // room for 5 ints: scores[0] to scores[4]
```

You put values in and read them back with an index, starting at 0 as in Python:

```c
scores[0] = 90;
scores[1] = 75;
scores[4] = 100;

printf("%d\n", scores[1]);            // prints 75
int total = scores[0] + scores[4];    // 190
```

> **Watch out:** declaring an array does not clear it. `scores[2]` and `scores[3]` were never given a value, so they hold **garbage**: whatever happened to be in that memory.

To avoid garbage, you can give the starting values in braces when you declare the array:

```c
int scores[5] = {90, 75, 82, 60, 100};
```

You do not have to list them all. If you give fewer values than the size, the rest are set to **zero**:

```c
int scores[5] = {90, 75};     // 90, 75, 0, 0, 0
```

This gives a quick way to start with an array full of zeros:

```c
int scores[5] = {0};          // 0, 0, 0, 0, 0
```

The braces only work in the declaration. After that, you change the items one at a time.

Things you cannot do in C:

- No `append`: the array cannot grow or shrink
- No `len()`: you have to remember the size yourself
- No negative indexes: `scores[-1]` is an error in your logic
- No `print(scores)`: you print the items one by one in a loop

> **Watch out:** C does not check your indexes. `scores[7]` will not raise an error. It quietly reads or damages some other memory. Staying inside the array is your job.

## Strings

C has no string type. A string is an **array of `char`**, written in **double quotes**:

```c
char name[20] = "Dana";
printf("Hello, %s!\n", name);
```

C marks the end of the text with a hidden character `'\0'`, so `"Dana"` needs 5 places. Always make the array at least one bigger than the longest text you expect.

Single and double quotes are **not** interchangeable as they are in Python: `'A'` is one `char`, `"A"` is a string.

The Python string operators do not work. Use the functions in `#include <string.h>` instead:

| Python | C |
|--------|---|
| `len(name)` | `strlen(name)` |
| `name = "Noa"` | `strcpy(name, "Noa");` |
| `if name == "Noa":` | `if (strcmp(name, "Noa") == 0)` |
| `a + b` | `strcat(a, b);` |

## Reading input with `scanf`

`scanf` is C's version of `input()`. It uses the same codes as `printf`, and it converts the text to the right type for you.

```c
int age;
float height;
char name[20];

printf("Enter your age: ");
scanf("%d", &age);

printf("Enter your height: ");
scanf("%f", &height);

printf("Enter your name: ");
scanf("%19s", name);
```

> **Rule of thumb:** put `&` before **simple variables** (`int`, `float`, `char`), and **no** `&` before **arrays** (including strings).

Forgetting the `&` is the most common `scanf` mistake, and it usually crashes the program.

Two more things to know: `%s` reads **one word** and stops at a space, and the `19` in `%19s` stops the user from typing more than `name[20]` can hold.

## `if` statements

The condition goes in **parentheses** and the block in **braces**. `elif` is written `else if`.

```c
if (temperature > 38.0) {
    printf("Fever\n");
} else if (temperature < 35.0) {
    printf("Too cold\n");
} else {
    printf("Normal\n");
}
```

> **Watch out:** `=` assigns and `==` compares. `if (x = 5)` is legal C, but it puts 5 in `x` and is always true.

## Loops

A `while` loop is the same as in Python, with parentheses and braces:

```c
int count = 3;
while (count > 0) {
    printf("%d\n", count);
    count--;
}
```

A `for` loop looks different. It has three parts, separated by semicolons: **start; keep going while; step**.

```c
for (int i = 0; i < 5; i++) {
    printf("%d\n", i);
}
```

This is Python's `for i in range(5):` and prints 0 to 4. There is no `for item in list`. To go over an array, loop over its indexes:

```c
for (int i = 0; i < 5; i++) {
    printf("%d\n", scores[i]);
}
```

`break` and `continue` work as in Python.

## The `switch` statement

`switch` replaces a long `if` / `else if` chain that compares one variable with several fixed values.

```c
switch (grade) {
    case 'A':
        printf("Excellent\n");
        break;
    case 'B':
        printf("Good\n");
        break;
    default:
        printf("Keep practicing\n");
        break;
}
```

- `default` runs when no case matches, like a final `else`
- It works with `int` and `char` values only, not with strings or `float`

> **Watch out:** every case needs a `break`. Without it, the program keeps running into the next case.

## Functions

In place of `def`, you write the **type the function returns**, and each parameter gets a type too.

```c
#include <stdio.h>

int add(int a, int b)
{
    return a + b;
}

void greet(void)
{
    printf("Welcome!\n");
}

int main(void)
{
    greet();
    int sum = add(3, 4);
    printf("Sum: %d\n", sum);
    return 0;
}
```

- `void` as the return type means the function returns nothing
- `void` in the parentheses means it takes no parameters
- Calling a function looks the same as in Python: `add(3, 4)`

> **Watch out:** the compiler reads the file from top to bottom, so a function must appear **above** the place where it is called. That is why `main` is at the bottom.

## Cheat sheet

| | Python | C |
|---|--------|---|
| End of statement | new line | `;` |
| Block | indentation | `{ }` |
| Variable | `x = 5` | `int x = 5;` |
| Print | `print(f"x = {x}")` | `printf("x = %d\n", x);` |
| Input | `x = int(input())` | `scanf("%d", &x);` |
| Condition | `if x > 0:` | `if (x > 0) {` |
| Else if | `elif` | `else if` |
| Logic | `and`, `or`, `not` | `&&`, `\|\|`, `!` |
| Count loop | `for i in range(5):` | `for (int i = 0; i < 5; i++) {` |
| Function | `def add(a, b):` | `int add(int a, int b) {` |
| Comment | `# note` | `// note` |
