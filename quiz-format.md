# Quiz file format: instructions for writing quizzes

These are instructions for writing a quiz for the Practical Programming course website. The site reads the quiz from a Markdown file and turns it into an interactive multiple-choice quiz. Students answer every question and press **Submit answers**. They then see their score, which options were right or wrong, the feedback for each option, and an explanation for each question.

Follow the format below **exactly**. The site uses a simple line-by-line reader, not a full Markdown parser. A line in the wrong place is silently ignored or attached to the wrong part of the quiz.

---

## 1. File structure

```
# Quiz title                       ← optional, first line
                                   
Intro text shown above the quiz.   ← optional, any Markdown, before the first question

## Question 1 text                 ← each "## " line starts a new question
Extra question text or a code block (optional)
- [ ] wrong option
  > feedback for this option
- [x] correct option
  > feedback for this option
> explanation for the whole question (optional, always last)

## Question 2 text
...
```

| Part | Syntax | Required |
|---|---|---|
| Quiz title | `# Title` on the first line | No (the site falls back to "Quiz") |
| Intro | Any Markdown between the title and the first question | No |
| Question | A line starting with `## ` | Yes |
| Question body | Markdown lines between the `## ` line and the first option, including code blocks | No |
| Option | `- [ ] text` (wrong) or `- [x] text` (correct), starting at the **beginning of the line** | Yes, at least 2 |
| Option feedback | **Indented** `  > text` lines directly under the option | No, but strongly recommended |
| Explanation | **Unindented** `> text` lines after **all** the options | No |

---

## 2. Rules in detail

### Title and intro
- The title is the first line that starts with a single `# ` and comes before any question. Only one title.
- Everything else before the first `## ` line is the intro, rendered as Markdown. Keep it to one or two sentences.
- Don't use `# ` anywhere else in the file.

### Questions
- Each question starts with `## ` followed by the question text **on one line**.
- The `## ` line supports inline Markdown only: `` `code` ``, `**bold**`, `*italic*`. Put any Python code in backticks.
- Don't number the questions. The site numbers them automatically.
- Don't use `###` or deeper headings anywhere.

### Question body (optional)
- Any lines after the `## ` line and before the first option are part of the question. Use them for extra context or a code snippet.
- **Code blocks are only allowed here.** Use fenced blocks with a language tag:
  ````
  ```python
  x = 5
  print(x * 2)
  ```
  ````
- Lines inside a code block are never treated as options or feedback, even if they start with `- [ ]` or `>`.

### Options
- An option is a line that starts **at column 0** with `- [ ] ` or `- [x] ` (lowercase or uppercase `X`). There must be text after the brackets.
- `[x]` marks a correct option and `[ ]` marks a wrong one.
- **Exactly one `[x]`:** the question shows radio buttons (pick one).
- **Two or more `[x]`:** the question shows checkboxes and the hint "Choose all that apply". The student must pick **exactly** the correct set to get the point; there is no partial credit.
- A question with no `[x]` or no options is **skipped**, with a warning in the browser console.
- Keep each option on **one line**. Option text supports inline Markdown only (backticks, bold) and **no code blocks**.
- Options are shown in the order written; the site does not shuffle them. **Vary the position of the correct answer** across questions.
- Use 3–5 options per question.

### Option feedback
- Feedback lines go **directly under their option**, indented by **two spaces**, then `> `:
  ```
  - [ ] 6
    > That's the sum of the items, which is what `sum()` returns.
  ```
- Several indented `>` lines under one option are joined into one paragraph. Inline Markdown is allowed and code blocks are not.
- After submitting, feedback is shown for **every option the student chose** and **every correct option**. So:
  - For a **wrong** option, explain *why* it's wrong: the misconception behind it, not just "Wrong".
  - For a **correct** option, confirm *why* it's right.
- Don't start feedback with "Correct!" or "Wrong!" alone. The site already marks options ✓/✗. A short opener followed by a reason is fine ("Right! `range(3)` stops before 3.").

### Explanation (optional)
- One or more **unindented** `> ` lines after **all** of the question's options.
- It's shown under the question after submitting, as a summary of the concept being tested.
- It must come **last** in the question. Any option written after an explanation is ignored.
- It supports Markdown such as inline code and bold, but no code blocks. A line that is just `>` starts a new paragraph.

### Blank lines
- Blank lines between questions, options and feedback are allowed and ignored. Use one blank line before each `## ` for readability.

---

## 3. Common mistakes to avoid

| Mistake | What happens | Fix |
|---|---|---|
| Feedback `>` not indented | It becomes the question's explanation, and all options after it are ignored | Indent option feedback with two spaces: `  > ...` |
| Indented option `  - [ ] ...` | It isn't recognised as an option | Start option lines at column 0 |
| A code block in an option, feedback or explanation | The code block is dropped | Put code in the question body, or use inline `` `code` `` |
| No `[x]` in a question | The question is skipped | Mark at least one correct option |
| `[v]`, `[✓]`, `(x)`, `1.` lists | Not recognised as options | Use exactly `- [ ]` and `- [x]` |
| Numbering questions (`## 1. What…`) | Shows "1. 1. What…" | Don't number questions |
| Explanation before the options | It's treated as question text, so the explanation is lost | Put the explanation after the last option |
| `<` or `>` comparisons outside backticks | They may be read as HTML and disappear | Put code and comparisons in backticks: `` `x < 5` `` |
| Wrapping the whole file in a code block | The site sees no questions | Output the raw Markdown only |

---

## 4. Complete example

````markdown
# Python Basics Quiz

Answer all the questions, then press **Submit answers** to see your score and the corrections.

## What does `len([1, 2, 3])` return?
- [ ] 2
  > Not quite. `len` counts the items; it doesn't give the last index.
- [x] 3
  > Correct! The list has three items.
- [ ] 6
  > That's the sum of the items, which is what `sum()` returns.

## What does this code print?
```python
x = 5
x = x + 2
print(x)
```
- [ ] 5
  > The second line changes `x`, so it's no longer 5 when it's printed.
- [x] 7
  > Right! `x + 2` is calculated first, then the result is stored back in `x`.
- [ ] x + 2
  > `print(x)` prints the value of `x`, not the expression that created it.
> A variable is a name for a value. Assigning to it again replaces the old value.

## Which of these are valid variable names in Python?
- [x] `total_sum`
  > Valid: letters and underscores are fine.
- [ ] `2nd_place`
  > Invalid: a name can't start with a digit.
- [x] `_count`
  > Valid: a name may start with an underscore.
- [ ] `my-name`
  > Invalid: `-` is the minus operator, not part of a name.
````

---

## 5. Writing good questions

- Test **one idea per question**, matching what the course material teaches.
- Prefer "What does this code print?" and "What happens when…" over definitions. Short code snippets (3–8 lines) work best.
- Make wrong options **plausible**, based on real beginner mistakes such as off-by-one errors, confusing `=` with `==`, integer vs float division, or mutating vs returning.
- Avoid "all of the above" and "none of the above". Use a multiple-answer question instead.
- Avoid trick questions and ambiguous wording. Each question must have one indisputable correct set of answers.
- Mix single-answer and multiple-answer questions. About 1 in 4 multiple-answer questions works well.
- Make sure all code is valid Python 3 and that the stated output is exactly what it prints.
- 5–10 questions per quiz is a good length.

---

## 6. Output instructions (for an LLM)

When asked to create a quiz:
1. Output **only** the content of the `.md` file, starting with the `# ` title line. No commentary before or after.
2. If your interface needs a code block to show the file, use a **four-backtick** fence (````` ```` `````) so the quiz's own ```` ``` ```` code blocks stay intact. Never use a three-backtick fence around the whole file.
3. Before answering, check every question:
   - It has a `## ` line, at least 2 options and at least one `[x]`.
   - Options start at column 0, and feedback lines are indented two spaces with `> `.
   - The explanation, if present, is unindented and comes after the last option.
   - Code blocks appear only in the question body.
   - The correct answer is actually correct, after running the code mentally, step by step.

---

## 7. Adding the quiz to the site (for the course owner)

1. Save the file as `content/quizzes/<name>.md` in UTF-8, for example `content/quizzes/numpy-basics.md`.
2. In `content/topics.json`, add it to a topic:
   ```json
   "quizzes": ["quizzes/numpy-basics.md"]
   ```
   To show a title different from the file's `# ` line:
   ```json
   "quizzes": [{ "title": "Week 3 quiz", "file": "quizzes/numpy-basics.md" }]
   ```
3. Open the topic page locally and take the quiz once. If a question is missing, press F12 and look at the Console. It names any question that was skipped and why.
