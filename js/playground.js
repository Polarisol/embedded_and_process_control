/*
 * Python practice area: a side panel where students write and run basic Python.
 * Code runs in a Web Worker (js/py-worker.js), never on the page itself.
 * Runs that take too long or print too much are stopped automatically.
 */
(() => {
  'use strict';

  const TIME_LIMIT_MS = 10000;
  const OUTPUT_LIMIT = 100000; // characters
  const STORE_KEY = 'playground-code';

  const EXAMPLES = {
    hello: '# Change the name and press Run\nname = "Ada"\nprint("Hello,", name)\n',
    variables: 'price = 12.5\nquantity = 3\ntotal = price * quantity\n\nprint(f"{quantity} items cost {total} shekels")\nprint(type(price), type(quantity))\n',
    input: '# Put the values in the Input box, one per line\nname = input("What is your name? ")\nage = int(input("How old are you? "))\n\nprint(f"Hi {name}, next year you will be {age + 1}")\n',
    loops: 'for i in range(1, 6):\n    print(i, "squared is", i * i)\n\nnumbers = [4, 8, 15, 16, 23, 42]\nprint("The sum is", sum(numbers))\n',
    functions: 'def is_even(n):\n    return n % 2 == 0\n\nfor n in range(6):\n    if is_even(n):\n        print(n, "is even")\n    else:\n        print(n, "is odd")\n',
  };

  const panel = document.getElementById('playground');
  const openBtn = document.querySelector('button.py-toggle');
  if (!panel || !openBtn) return;

  const $ = (sel) => panel.querySelector(sel);
  const editor = $('.pg-code');
  const gutter = $('.pg-gutter');
  const stdin = $('.pg-stdin');
  const output = $('.pg-output');
  const status = $('.pg-status');
  const runBtn = $('.pg-run');
  const stopBtn = $('.pg-stop');
  const examples = $('.pg-examples');

  // ---------- Saved code ----------
  function load() {
    try { return localStorage.getItem(STORE_KEY); } catch { return null; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, editor.value); } catch { /* storage unavailable */ }
  }
  editor.value = load() ?? EXAMPLES.hello;

  // ---------- Editor: line numbers, Tab and auto-indent ----------
  function updateGutter() {
    const lines = editor.value.split('\n').length;
    let text = '';
    for (let i = 1; i <= lines; i++) text += `${i}\n`;
    gutter.textContent = text;
    gutter.scrollTop = editor.scrollTop;
  }
  editor.addEventListener('scroll', () => { gutter.scrollTop = editor.scrollTop; });

  // execCommand keeps Ctrl+Z working; setRangeText is the fallback.
  function insert(text) {
    if (!document.execCommand('insertText', false, text)) {
      editor.setRangeText(text, editor.selectionStart, editor.selectionEnd, 'end');
      editor.dispatchEvent(new Event('input'));
    }
  }

  editor.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      run();
    } else if (e.key === 'Tab' && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      const { value, selectionStart: start } = editor;
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      if (e.shiftKey) {
        const spaces = value.slice(lineStart).match(/^ {1,4}/);
        if (spaces) {
          editor.setSelectionRange(lineStart, lineStart + spaces[0].length);
          insert('');
          editor.setSelectionRange(Math.max(lineStart, start - spaces[0].length), Math.max(lineStart, start - spaces[0].length));
        }
      } else {
        insert(' '.repeat(4 - ((start - lineStart) % 4)));
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      // Keep the current indent, and add one level after a line ending in ":".
      e.preventDefault();
      const { value, selectionStart: start } = editor;
      const line = value.slice(value.lastIndexOf('\n', start - 1) + 1, start);
      let indent = line.match(/^ */)[0];
      if (/:\s*(#.*)?$/.test(line)) indent += '    ';
      insert(`\n${indent}`);
    }
  });
  editor.addEventListener('input', () => { updateGutter(); save(); });

  examples.addEventListener('change', () => {
    const code = EXAMPLES[examples.value];
    examples.value = '';
    if (!code) return;
    const edited = editor.value.trim() && !Object.values(EXAMPLES).includes(editor.value);
    if (edited && !confirm('Replace your code with this example?')) return;
    editor.value = code;
    updateGutter();
    save();
    editor.focus();
  });

  // ---------- Running code ----------
  let worker = null;
  let ready = false;
  let running = false;
  let timer = 0;
  let written = 0;
  let startedAt = 0;
  let queued = false;

  function setStatus(text, state = '') {
    status.textContent = text;
    status.dataset.state = state;
  }

  function write(text, cls) {
    if (!text) return;
    written += text.length;
    const last = output.lastChild;
    if (last && last.className === cls) last.textContent += text;
    else output.append(Object.assign(document.createElement('span'), { className: cls, textContent: text }));
    output.scrollTop = output.scrollHeight;
    if (written > OUTPUT_LIMIT) halt('Stopped: the program printed too much. Is there a loop that never ends?');
  }

  function setRunning(on) {
    running = on;
    runBtn.disabled = on;
    stopBtn.disabled = !on;
    panel.dataset.running = on ? 'true' : '';
  }

  function startWorker() {
    ready = false;
    worker = new Worker('js/py-worker.js');
    setStatus('Loading Python… (the first time takes a few seconds)', 'busy');
    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'ready') {
        ready = true;
        setStatus('Ready', 'ok');
        if (queued) { queued = false; run(); }
      } else if (msg.type === 'chunks') {
        if (running) msg.chunks.forEach((c) => write(c.text, c.type));
      } else if (msg.type === 'flood') {
        halt('Stopped: the program printed too much. Is there a loop that never ends?');
      } else if (msg.type === 'done') {
        clearTimeout(timer);
        setRunning(false);
        setStatus(`Finished in ${((performance.now() - startedAt) / 1000).toFixed(2)} s`, 'ok');
        if (!output.childNodes.length) write('(no output: use print() to show something)', 'note');
      } else if (msg.type === 'fail') {
        failed();
      }
    };
    worker.onerror = failed;
  }

  function failed() {
    stopWorker();
    queued = false;
    setRunning(false);
    setStatus('Python could not load. Check your internet connection and try again.', 'error');
  }

  function stopWorker() {
    clearTimeout(timer);
    if (worker) worker.terminate();
    worker = null;
    ready = false;
  }

  // Stopping a run means throwing the whole worker away and loading a fresh one.
  function halt(message) {
    if (!running) return;
    stopWorker();
    setRunning(false);
    write(`\n${message}\n`, 'note');
    startWorker();
  }

  function run() {
    if (running) return;
    if (!worker) startWorker();
    output.replaceChildren();
    written = 0;
    if (!ready) {
      queued = true;
      write('Python is still loading. Your code will run as soon as it is ready…\n', 'note');
      return;
    }
    setRunning(true);
    setStatus('Running…', 'busy');
    startedAt = performance.now();
    timer = setTimeout(
      () => halt(`Stopped: the program ran for more than ${TIME_LIMIT_MS / 1000} seconds. Is there a loop that never ends?`),
      TIME_LIMIT_MS,
    );
    const inputs = stdin.value ? stdin.value.replace(/\n$/, '').split('\n') : [];
    worker.postMessage({ type: 'run', code: editor.value, inputs });
  }

  runBtn.addEventListener('click', run);
  stopBtn.addEventListener('click', () => halt('Stopped.'));
  $('.pg-clear').addEventListener('click', () => { output.replaceChildren(); written = 0; });

  // ---------- Opening and closing the panel ----------
  function setOpen(open) {
    panel.hidden = !open;
    openBtn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('pg-open', open);
    if (open) {
      if (!worker) startWorker();
      updateGutter();
      editor.focus();
    } else {
      openBtn.focus();
    }
  }

  openBtn.addEventListener('click', () => setOpen(panel.hidden));
  $('.pg-close').addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) setOpen(false);
  });
})();
