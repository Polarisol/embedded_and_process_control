# Starting a Project

Follow these steps every time you start a new project. They assume you have already done everything in **Installation**.

## 1. Create a working folder

Create a new, empty folder for the project, for example `Documents\Projects\my-first-project`.

> Tip: give the folder a short name without spaces or non-English letters (e.g. `my-first-project`). Some tools get confused by them.

## 2. Open the folder in VS Code

Either of these works:

- In File Explorer, right-click the folder and choose **Open with Code**. (This option appears only if you checked the "Add Open with Code" boxes when installing VS Code.)
- Or open VS Code and choose **File → Open Folder…**, then select the folder.

## 3. Trust the folder

A new folder opens in **Restricted Mode**: a banner at the top of the window says so, and a *Restricted Mode* badge appears in the status bar at the bottom. In this mode VS Code blocks the terminal and turns off the Python and Jupyter extensions, so you can't run anything yet.

To trust the folder:

1. Click **Manage** in the banner (or the *Restricted Mode* badge in the status bar). The Workspace Trust page opens.
2. Click **Trust**.

The banner disappears and everything works. VS Code remembers your choice, so you only do this once per folder.

> Tip: you can trust the **parent folder** instead (e.g. `Documents\Projects`). Then every project you create inside it is trusted automatically. Only trust folders whose contents you created yourself or know are safe.

## 4. Open the terminal

Choose **View → Terminal** (or press ``Ctrl+` ``). A terminal opens at the bottom of the window, already inside your project folder.

## 5. Create the project with uv

In the terminal, write:

```bash
uv init --python 3.12
```

Replace `3.12` with another version if your project needs one.

This turns the folder into a Python project. It creates:

- `pyproject.toml`: the project's settings, including the list of libraries it uses
- `.python-version`: the Python version the project uses
- `main.py`: a small example program
- `README.md`: a place to describe your project

**If git is installed**, `uv init` also makes the folder a git repository (with a `.gitignore` file), so you can track your changes and upload the project to GitHub later.

## 6. Add libraries

Add the libraries your project needs, for example:

```bash
uv add jupyter numpy matplotlib
```

The first time you run it, uv creates a `.venv` folder (the project's own Python environment) and installs the libraries into it. It also records them in `pyproject.toml`.

- Need another library later? Run `uv add` again at any time, e.g. `uv add pandas`.
- Added something you don't need? Remove it with `uv remove`, e.g. `uv remove pandas`.

## 7. Write and run code

You can write code in a regular Python file or in a Jupyter notebook.

### A Python file (`.py`)

1. Create a file with a `.py` ending (e.g. `hello.py`), or open `main.py`.
2. Write your code, for example:

   ```python
   print("Hello, world!")
   ```

3. Run it with **Ctrl+F5**. The output appears in the terminal.

> On many laptops the F-keys control volume or brightness by default. If Ctrl+F5 doesn't run your code, hold the **Fn** key too: **Ctrl+Fn+F5**. You can also click the **▷ Run Python File** button at the top right of the editor.

### A Jupyter notebook (`.ipynb`)

This works only if you added `jupyter` in step 6.

1. Create a file with a `.ipynb` ending (e.g. `explore.ipynb`).
2. Write code in a cell.
3. Run the cell with **Shift+Enter**. The output appears right below it, and VS Code moves to the next cell (adding a new one if you're on the last).

### The first run: choosing the interpreter

The first time you run code in a file, VS Code asks which Python to use:

- For a **`.py` file**, it may first ask you to select a debugger. Choose **Python Debugger**, then **Python File**. If it asks for an interpreter, choose the one with **`.venv`** in its name (usually marked *Recommended*). You can also pick it yourself any time with the **Python: Select Interpreter** command (Ctrl+Shift+P, then type it).
- For a **notebook**, it asks you to **Select Kernel** (the button is at the top right of the notebook). Choose **Python Environments…**, then the one with **`.venv`** in its name.

Always choose the `.venv` one. It's the project's own environment and the only one that has the libraries you added with `uv add`. If you pick another one, you'll get errors like `ModuleNotFoundError: No module named 'numpy'`.

To change it later, click the Python version shown at the bottom right of VS Code (for a `.py` file) or at the top right of a notebook.
