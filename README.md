# Practical Programming by Dr. Tal Alon

A free, static website for students. It has topic pages with embedded YouTube videos, your written notes, links to your practice bots and an animated ASCII background. It works on laptops and phones.

## See it on your computer

Browsers won't load the content from a double-clicked file, so start a tiny local server:

```bash
cd path/to/this/folder
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Add or change a topic

All content lives in `content/`. You never need to edit the HTML or JavaScript.

1. Open `content/topics.json` and copy an existing topic block. Put a comma between blocks.
2. Edit the fields:

| Field      | What it is |
|------------|------------|
| `id`       | Short name with no spaces, used in the page address (`?id=...`) |
| `title`    | Topic name shown in the side list and on its page |
| `icon`     | A symbol or emoji for the topic, e.g. `☀`, `{ }`, `∑` |
| `blurb`    | One-line description |
| `videos`   | List of `{ "title": "...", "youtube": "<link or video ID>" }`. Add `"start": 90` to start at 1:30 |
| `material` | Path to a Markdown file inside `content/`, e.g. `"topics/my-topic.md"`. It can also be a list of files |
| `bots`     | List of `{ "label": "...", "description": "...", "url": "https://..." }`. Each bot appears **at the top** of the topic as an animated robot. `description` is what the robot "says" in its speech bubble. |
| `quizzes`  | Path to a quiz file inside `content/`, e.g. `"quizzes/my-quiz.md"`, or a list of them. See **Write a quiz** below |
| `simulations` | List of `{ "title": "...", "type": "grid-path", "description": "..." }`. An interactive demo inside the page. `grid-path` is a 10 x 10 grid where students place a start, a goal and walls, and watch BFS, DFS or A* search |
| `files`    | List of `{ "label": "...", "file": "files/my-code.zip" }` for files students download. Put the file in `content/files/`. A bare path or a list of paths works too, and then the file name is the label |
| `links`    | List of `{ "label": "...", "url": "https://..." }`. A file in `assets/` works too, e.g. `"assets/worksheet.pdf"` |

3. Write your notes in `content/topics/<something>.md` using Markdown: `# Heading`, `**bold**`, `- lists`, tables and code blocks. Put images in `assets/` and reference them as `![description](assets/picture.png)`.

Any field can be left out, and its section won't appear on the page.

## Write a quiz

A quiz is a Markdown file in `content/quizzes/`. Students answer every question and press **Submit answers**. They then see their score, which answers were right or wrong, and your feedback. **Try again** starts over.

````markdown
# Python Basics Quiz

## What does `len([1, 2, 3])` return?
- [ ] 2
  > Not quite: len counts the items.
- [x] 3
  > Correct! The list has three items.
- [ ] 6

## Which names are valid?
```python
# code blocks can be part of the question
```
- [x] `total_sum`
- [ ] `2nd_place`
  > A name can't start with a digit.
- [x] `_count`
> Shown after submitting: an explanation for the whole question.
````

- `# ` (optional) is the quiz title. Any text before the first question is shown at the top.
- Each `## ` starts a new question. Text and code blocks under it are part of the question.
- `- [ ]` is an option and `- [x]` is a correct option. If a question has more than one `[x]`, it shows checkboxes with "Choose all that apply". A question is only marked correct if exactly the right options are chosen.
- An **indented** `> ` line under an option is that option's feedback. It shows after submitting, for the options the student chose and for the correct ones.
- An **unindented** `> ` line after the options is an explanation for the whole question.
- A question with no options or no `[x]` is skipped. The browser console (F12) shows a warning that names it.

Then add it to a topic in `topics.json`: `"quizzes": ["quizzes/my-quiz.md"]`. To give it a different title, use `"quizzes": [{ "title": "Week 1 quiz", "file": "quizzes/my-quiz.md" }]`.

The text on the Main page comes from `content/home.md`. Edit it like any other Markdown notes file (to use a different file, set `"home"` in the `site` block).

To change the site name (`title` + `author`, shown as "Practical Programming by Dr. Tal Alon"), subtitle or footer, edit the `site` block at the top of `topics.json`.

> Tip: if the home page shows an error after an edit, the JSON probably has a missing comma or quote. Paste it into <https://jsonlint.com> to find the error.

## View counts

Each topic shows a faint `👁 12` next to its title, and each item (bot, video, written material, quiz, simulation, file, link) shows one too. A topic counts when its page is opened. An item counts when it is opened in list view or scrolled into sight in card view; bots, files and links count when clicked. Each counts at most once per page load, and nothing is counted while you test on `localhost`.

The numbers are kept by [Abacus](https://abacus.jasoncameron.dev), a free counter service, under the name in `"views"` in the `site` block of `content/topics.json`. Remove that line to turn the counts off. An item's count follows its file name or link, so renaming a file or changing a link starts that count again from zero.

## Publish for free with GitHub Pages

1. Create a free account at <https://github.com> and click **New repository**. Name it (e.g. `class-site`) and make it **Public**.
2. Upload the files. Either drag this folder's contents onto **Add file → Upload files**, or use git:
   ```bash
   git init && git add . && git commit -m "Class site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/class-site.git
   git push -u origin main
   ```
3. In the repo go to **Settings → Pages**, choose **Deploy from a branch**, then branch **main** and folder **/ (root)**, and save.
4. After a minute the site is live at `https://<your-username>.github.io/class-site/`. Share that link with students, or put it on a QR code.

To update the site later, upload or push the changed files. The site refreshes by itself within a minute or two.

## Files

```
index.html            the whole site: Main page + every topic (switches in place)
topic.html            redirect for old topic.html?id=... links
css/style.css         colours, layout, colour schemes
js/ascii-bg.js        interactive ASCII background
js/app.js             reads topics.json and builds the pages
js/grid-sim.js        the grid path-finding simulation (BFS, DFS, A*)
content/topics.json   your topics  ← edit this
content/home.md       Main page text ← and this
content/topics/*.md   your notes   ← and these
content/quizzes/*.md  your quizzes ← and these
content/files/        downloads (zip files) ← and these
assets/               images, PDFs, worksheets
```
