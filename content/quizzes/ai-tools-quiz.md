# Using AI Tools Responsibly

Answer all the questions, then press **Submit answers** to see your score and the corrections.

## In this course, what is the main problem with "vibe coding" a project?
- [ ] It is not allowed to use AI tools at all in this course
  > AI tools are allowed in this course. The concern is *how* we use them, not *whether* we use them.
- [ ] The code it produces always contains bugs
  > Vibe-coded code may work fine. The problem is that you can't tell whether it does, or why.
- [x] We don't really know what is going on inside our own code
  > Right! When we vibe code, we lose track of how things are done and whether they are done correctly.
- [ ] It makes the code run much slower
  > Speed isn't the issue here. The issue is understanding and control.
> Vibe coding can be fine for unimportant personal projects, but serious or professional work needs us to understand and control what the code does.

## According to the course rules, how should a scientist or engineer relate to the program they built?
- [x] They should **know** for certain how it works
  > Exactly. Engineers are responsible for what the app does, so they need certainty, not a guess.
- [ ] They should trust that the AI made it work correctly
  > Trusting the AI is the same as believing. You are the one responsible for the app, not the AI.
- [ ] They only need to know that the final output looks right on screen
  > Output that looks right can still hide mistakes. You need to understand *how* the app does its job.
- [ ] They should believe it works if most of the tests passed and nobody complained
  > This is still believing rather than knowing. The rules ask you to be able to explain exactly how the app works.
> The key distinction is **believe vs. know**: you should be able to explain how your app works and be able to change it yourself.

## Which of these do you need in order to stay in control when using AI? (Choose all that apply)
- [x] A basic understanding of the coding language
  > Yes. Even basic knowledge lets you verify, modify and control the code.
- [ ] To be an expert programmer before you start using AI
  > Not needed. The rules say a basic understanding of the language is already enough to stay in control.
- [x] Familiarity with the tools, algorithms and protocols you're using
  > Yes. Without this foundational knowledge you can't steer the development process with good prompts.
- [ ] A paid subscription to the most powerful AI model
  > Control comes from your own understanding, not from which AI tool you pay for.
> Staying in control comes from **your** knowledge: the language, plus the tools and techniques your project uses.

## The AI just wrote a function for your project. What should you do next?
- [ ] Paste it in right away, since AI code is usually correct
  > AI code is often correct, but "usually" isn't good enough. You are responsible for every line you add.
- [ ] Ask the AI if the code is correct, and paste it if it says yes
  > The AI checking its own work doesn't replace your review. You need to understand it yourself.
- [ ] Rewrite the whole function from scratch so nothing from AI is used
  > There's no need to throw it away. The goal is to use AI wisely, not to avoid it.
- [x] Read it, make sure you understand each part, and test it
  > Right! Review it carefully and verify it behaves as expected before integrating it.
> Always review AI-generated code: understand what each part does, and check that it works before it becomes part of your project.

## You need to add a big feature to your app. What is the best way to use AI for this?
- [ ] Ask the AI to build the complete feature in one prompt
  > A whole feature in one go is hard to review, and you lose understanding of how it works.
- [x] Split it into small tasks and handle them one at a time
  > Yes! Small steps keep each part understandable, testable and under your control.
- [ ] Ask the AI to write the whole app, including the feature, so everything fits together
  > This is the "write a whole app at once" approach that both guides warn against.
- [ ] Copy a similar feature from another project without reading it
  > Using code you haven't read means you don't know how your own project works.
> Break your project into small tasks. Ask for one small piece, test it, then move on to the next.

## How can Git help you when working with GitHub Copilot? (Choose all that apply)
- [ ] Git automatically fixes mistakes that Copilot makes
  > Git doesn't fix code. It records versions so *you* can see changes and go back.
- [x] The Git tab in VS Code shows exactly what Copilot added or changed
  > Right. Checking the changes lets you see every line Copilot touched.
- [ ] Git stops Copilot from editing your files
  > Git doesn't block edits. It tracks them so you can review and undo them.
- [x] Small, frequent commits let you go back to an older version if something breaks
  > Yes. With frequent commits, a bad change from Copilot is easy to undo.
> Git is your safety net: review the changes in the Git tab and commit often.

## You found some code in your project that you don't understand. What does the guide suggest?
- [ ] Leave it there, since it probably works
  > The guide says: don't guess. Never use code you don't understand.
- [ ] Delete it so it can't cause problems
  > Deleting code you don't understand might break your app. Understand it first.
- [x] Highlight it, right-click, choose **Copilot** and then **Explain This**
  > Exactly. Copilot will describe in plain English what the code does.
- [ ] Press `Tab` to let Copilot replace it with something simpler
  > `Tab` accepts an auto-complete suggestion. It doesn't explain anything.
> Use **Explain This** to turn unclear code into code you understand, before you rely on it.

## What happens when you use Copilot's inline chat with `Ctrl+I`?
- [x] Copilot shows proposed changes in red and green, and you choose to accept or reject them
  > Right! Red shows removed code, green shows added code, and nothing is permanent until you accept.
- [ ] Copilot opens a new window where it writes a whole new app
  > Inline chat appears right where you are typing, for small changes in your code.
- [ ] Copilot changes your code immediately with no way to review it
  > You always get to see the proposed changes and decide before they are applied.
- [ ] Your current file is saved and committed to Git
  > `Ctrl+I` opens a small prompt; it doesn't save or commit anything.
> Inline chat keeps you in your code and lets you review each change before it becomes permanent. For bigger questions and planning, use the Chat sidebar instead.

## Copilot shows a long auto-complete suggestion in light gray, but you only want the first part of it. What should you do?
- [ ] Press `Tab` to accept it all, then delete what you don't need
  > `Tab` accepts the whole suggestion. It works, but you'll have to clean up afterwards, and you might miss a line.
- [x] Press `Ctrl + Right Arrow` to accept it one word at a time
  > Yes! This lets you take only the words you want.
- [ ] Press `Esc` to accept the first line only
  > `Esc` rejects the whole suggestion; it doesn't accept any part of it.
- [ ] Wait, and Copilot will shorten it automatically
  > Copilot won't shorten a suggestion on its own. You control how much of it you accept.
> Read auto-complete suggestions before accepting them: `Tab` accepts all, `Ctrl + Right Arrow` accepts word by word, and `Esc` dismisses.
