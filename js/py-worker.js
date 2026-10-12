/*
 * Runs students' Python (Pyodide) inside a Web Worker, away from the page.
 * The playground stops the whole worker if code runs too long or prints too much.
 */
/* global importScripts, loadPyodide */
'use strict';

const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
importScripts(`${PYODIDE}pyodide.js`);

// Set up once: stdin is replaced by the Input box, a few imports are blocked,
// and every run gets a fresh namespace with tracebacks trimmed to the student's code.
const SETUP = `
import sys, builtins, linecache, traceback

_BLOCKED = {'js', 'pyodide', 'pyodide_js', '_pyodide', 'micropip', 'pyodide_http'}
_real_import = builtins.__import__

def _guarded_import(name, globals=None, locals=None, fromlist=(), level=0):
    if level == 0 and name.split('.')[0] in _BLOCKED and (globals or {}).get('__name__') == '__main__':
        raise ImportError(f"'{name}' is not available in the practice area")
    return _real_import(name, globals, locals, fromlist, level)

builtins.__import__ = _guarded_import

_inputs = iter(())

def _input(prompt=''):
    sys.stdout.write(str(prompt))
    try:
        value = next(_inputs)
    except StopIteration:
        sys.stdout.write('\\n')
        raise EOFError('input() has no more values. Type them in the Input box, one per line.') from None
    sys.stdout.write(value + '\\n')
    return value

builtins.input = _input

def _run(src, inputs):
    global _inputs
    _inputs = iter(list(inputs))
    namespace = {'__name__': '__main__'}
    linecache.cache['main.py'] = (len(src), None, src.splitlines(True), 'main.py')
    try:
        exec(compile(src, 'main.py', 'exec'), namespace)
    except SystemExit:
        pass
    except BaseException as e:
        frames = [f for f in traceback.extract_tb(e.__traceback__) if f.filename == 'main.py']
        lines = ['Traceback (most recent call last):\\n', *traceback.format_list(frames)] if frames else []
        lines += traceback.format_exception_only(type(e), e)
        sys.stderr.write(''.join(lines))
    finally:
        sys.stdout.flush()
        sys.stderr.flush()
`;

// Output is sent in batches (a message per print could freeze the page),
// and a program that prints too much is ended here, inside the worker.
const OUTPUT_LIMIT = 100000; // characters
let pending = [];
let pendingSize = 0;
let total = 0;
let lastFlush = 0;
let recentFlushes = 0;

function flush() {
  if (pending.length) postMessage({ type: 'chunks', chunks: pending });
  pending = [];
  pendingSize = 0;
  const now = Date.now();
  recentFlushes = now - lastFlush > 50 ? 0 : recentFlushes + 1;
  lastFlush = now;
}

function stream(type) {
  const decoder = new TextDecoder();
  return {
    write(bytes) {
      const text = decoder.decode(bytes, { stream: true });
      total += text.length;
      if (total > OUTPUT_LIMIT) {
        flush();
        postMessage({ type: 'flood' });
        throw new Error('too much output');
      }
      const last = pending[pending.length - 1];
      if (last && last.type === type) last.text += text;
      else pending.push({ type, text });
      pendingSize += text.length;
      // Normal printing is sent right away; only a flood of prints is batched.
      if (recentFlushes < 20 || pendingSize > 8000 || Date.now() - lastFlush > 50) flush();
      return bytes.length;
    },
  };
}

const ready = (async () => {
  const pyodide = await loadPyodide({ indexURL: PYODIDE });
  pyodide.setStdout(stream('out'));
  pyodide.setStderr(stream('err'));
  pyodide.runPython(SETUP);
  return pyodide.globals.get('_run');
})();

ready
  .then(() => postMessage({ type: 'ready' }))
  .catch((err) => postMessage({ type: 'fail', text: String(err && err.message || err) }));

onmessage = async (e) => {
  if (!e.data || e.data.type !== 'run') return;
  const run = await ready;
  total = 0;
  recentFlushes = 0;
  try {
    run(e.data.code, e.data.inputs || []);
  } catch {
    // Only reached after a 'flood' message; the playground replaces this worker.
    return;
  }
  flush();
  postMessage({ type: 'done' });
};
