/*
 * Path finding on a 10 x 10 grid, for "simulations" in topics.json ({ "type": "grid-path" }).
 * Students place the start, the goal and walls, pick BFS, DFS or A*, and watch it search.
 * The searches follow the code in the Graph Navigation notes: squares are (row, col),
 * neighbours come in the order up, down, left, right, and A* guesses with the Manhattan distance.
 */
(() => {
  'use strict';

  const SIZE = 10;
  const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // up, down, left, right
  const SPEEDS = [700, 400, 200, 90, 30];         // ms between steps, slow to fast
  const SHOW_WAITING = 24;                        // how many waiting squares are listed

  const rowOf = (i) => Math.floor(i / SIZE);
  const colOf = (i) => i % SIZE;
  const name = (i) => `(${rowOf(i)}, ${colOf(i)})`;

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value == null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else node.setAttribute(key, value);
    }
    for (const child of children) if (child != null) node.append(child);
    return node;
  }

  function neighbours(i, walls) {
    const result = [];
    for (const [dr, dc] of DIRS) {
      const r = rowOf(i) + dr;
      const c = colOf(i) + dc;
      if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && !walls.has(r * SIZE + c)) result.push(r * SIZE + c);
    }
    return result;
  }

  function pathTo(cameFrom, goal) {
    if (!cameFrom.has(goal)) return null;
    const path = [];
    for (let cell = goal; cell !== -1; cell = cameFrom.get(cell)) path.unshift(cell);
    return path;
  }

  // Each search is a generator. It yields once for every square it takes out of its
  // waiting list: { current, explored (in visiting order), waiting, path, done }.
  // `waiting` is the list as the student should picture it: [{ cell, note }].

  function* bfs(walls, start, goal) {
    const cameFrom = new Map([[start, -1]]);
    const queue = [start]; // first in, first out
    const explored = [];
    while (queue.length) {
      const cell = queue.shift();
      explored.push(cell);
      if (cell === goal) break;
      for (const nb of neighbours(cell, walls)) {
        if (!cameFrom.has(nb)) {
          cameFrom.set(nb, cell);
          queue.push(nb);
        }
      }
      yield { current: cell, explored, waiting: queue.map((c) => ({ cell: c })) };
    }
    return { current: explored[explored.length - 1], explored, waiting: queue.map((c) => ({ cell: c })), path: pathTo(cameFrom, goal) };
  }

  function* dfs(walls, start, goal) {
    const cameFrom = new Map();
    const stack = [[start, -1]]; // last in, first out
    const explored = [];
    // top first; a square pushed twice is listed once, where it is nearest the top
    const waiting = () => [...new Set(stack.map(([c]) => c).filter((c) => !cameFrom.has(c)).reverse())]
      .map((c) => ({ cell: c }));
    while (stack.length) {
      const [cell, from] = stack.pop();
      if (cameFrom.has(cell)) continue; // already visited through another way
      cameFrom.set(cell, from);
      explored.push(cell);
      if (cell === goal) break;
      // reversed, so the first neighbour (up) is on top and is visited next
      for (const nb of neighbours(cell, walls).reverse()) {
        if (!cameFrom.has(nb)) stack.push([nb, cell]);
      }
      yield { current: cell, explored, waiting: waiting() };
    }
    return { current: explored[explored.length - 1], explored, waiting: waiting(), path: pathTo(cameFrom, goal) };
  }

  function* astar(walls, start, goal) {
    const guess = (i) => Math.abs(rowOf(i) - rowOf(goal)) + Math.abs(colOf(i) - colOf(goal));
    const steps = new Map([[start, 0]]); // g: the real number of steps from the start
    const cameFrom = new Map([[start, -1]]);
    let toVisit = [{ f: guess(start), cell: start }];
    const explored = [];
    const done = new Set();
    // Like Python's heapq with (f, (row, col)) pairs: smallest f first, then by row and column.
    const order = (a, b) => a.f - b.f || a.cell - b.cell;
    const waiting = () => toVisit
      .filter((e) => !done.has(e.cell) && steps.get(e.cell) + guess(e.cell) === e.f) // skip outdated entries
      .sort(order)
      .map((e) => ({ cell: e.cell, note: `${steps.get(e.cell)}+${guess(e.cell)}=${e.f}`, f: e.f }));
    while (toVisit.length) {
      toVisit.sort(order);
      const { cell } = toVisit.shift();
      if (done.has(cell)) continue; // an older entry for a square we already explored
      done.add(cell);
      explored.push(cell);
      if (cell === goal) break;
      for (const nb of neighbours(cell, walls)) {
        const newSteps = steps.get(cell) + 1;
        if (!steps.has(nb) || newSteps < steps.get(nb)) { // a new square, or a shorter way to it
          steps.set(nb, newSteps);
          cameFrom.set(nb, cell);
          toVisit.push({ f: newSteps + guess(nb), cell: nb });
        }
      }
      yield { current: cell, explored, waiting: waiting() };
    }
    return { current: explored[explored.length - 1], explored, waiting: waiting(), path: pathTo(cameFrom, goal) };
  }

  const ALGORITHMS = {
    bfs: { label: 'BFS', search: bfs, list: 'Queue (front → back)', about: 'Takes the square that has waited longest: it spreads out in rings.' },
    dfs: { label: 'DFS', search: dfs, list: 'Stack (top → bottom)', about: 'Takes the square added last: it dives deep, then backtracks.' },
    astar: { label: 'A*', search: astar, list: 'Priority queue (smallest f = g + h first)', about: 'Takes the square with the smallest f = steps so far (g) + guess to the goal (h).' },
  };

  const TOOLS = {
    start: { label: 'Start', mark: 'S' },
    goal: { label: 'Goal', mark: 'G' },
    wall: { label: 'Wall', mark: '■' },
    erase: { label: 'Erase', mark: '□' },
  };

  function segmented(label, options, selected, onPick) {
    const buttons = new Map();
    const group = el('div', { class: 'sim-seg', role: 'group', 'aria-label': label });
    for (const [id, opt] of Object.entries(options)) {
      const b = el('button', { type: 'button', 'aria-pressed': String(id === selected) },
        opt.mark ? el('span', { class: `sim-mark sim-mark-${id}`, 'aria-hidden': 'true', text: opt.mark }) : null,
        opt.label);
      b.addEventListener('click', () => {
        for (const [other, ob] of buttons) ob.setAttribute('aria-pressed', String(other === id));
        onPick(id);
      });
      buttons.set(id, b);
      group.append(b);
    }
    return group;
  }

  function create() {
    let start = 4 * SIZE + 1;
    let goal = 5 * SIZE + 8;
    const walls = new Set([2, 3, 4, 5, 6, 7].map((r) => r * SIZE + 5));
    let tool = 'wall';
    let algo = 'bfs';
    let speed = 2;
    let run = null;     // the search in progress: { gen, state, finished }
    let timer = null;

    const cells = [];
    const grid = el('div', { class: 'sim-grid', role: 'group', 'aria-label': 'Grid, 10 by 10' });
    for (let i = 0; i < SIZE * SIZE; i++) {
      const cell = el('button', { type: 'button', class: 'sim-cell', 'data-i': String(i) });
      cells.push(cell);
      grid.append(cell);
    }

    const playBtn = el('button', { type: 'button', class: 'btn sim-play' });
    const stepBtn = el('button', { type: 'button', class: 'sim-btn', text: 'Step' });
    const resetBtn = el('button', { type: 'button', class: 'sim-btn', text: 'Reset' });
    const clearBtn = el('button', { type: 'button', class: 'sim-btn', text: 'Clear walls' });
    const randomBtn = el('button', { type: 'button', class: 'sim-btn', text: 'Random walls' });
    const speedInput = el('input', { type: 'range', min: '0', max: String(SPEEDS.length - 1), step: '1', value: String(speed), 'aria-label': 'Speed' });
    const about = el('p', { class: 'sim-about' });
    const status = el('p', { class: 'sim-status', role: 'status' });
    const listTitle = el('span', { class: 'sim-list-title' });
    const listBody = el('span', { class: 'sim-list-body' });

    const node = el('div', { class: 'sim' },
      el('div', { class: 'sim-controls' },
        el('div', { class: 'sim-row' }, el('span', { class: 'sim-label', text: 'Algorithm' }),
          segmented('Algorithm', ALGORITHMS, algo, (id) => { algo = id; resetSearch(); })),
        el('div', { class: 'sim-row' }, el('span', { class: 'sim-label', text: 'Place' }),
          segmented('Place on the grid', TOOLS, tool, (id) => { tool = id; })),
      ),
      about,
      el('div', { class: 'sim-stage' },
        grid,
        el('div', { class: 'sim-side' },
          el('div', { class: 'sim-actions' }, playBtn, stepBtn, resetBtn),
          el('label', { class: 'sim-speed' }, el('span', { text: 'Slow' }), speedInput, el('span', { text: 'Fast' })),
          status,
          el('p', { class: 'sim-list' }, listTitle, listBody),
          el('ul', { class: 'sim-legend' },
            el('li', {}, el('span', { class: 'sim-key is-explored', text: '3' }), 'explored (the number is the order)'),
            el('li', {}, el('span', { class: 'sim-key is-waiting' }), 'waiting in the list'),
            el('li', {}, el('span', { class: 'sim-key is-current' }), 'being explored now'),
            el('li', {}, el('span', { class: 'sim-key is-path' }), 'the path found')),
          el('div', { class: 'sim-actions' }, clearBtn, randomBtn),
        ),
      ),
    );

    // ---------- Drawing ----------
    function draw() {
      const state = run && run.state;
      const explored = new Map(state ? state.explored.map((c, n) => [c, n + 1]) : []);
      const waiting = new Map(state ? state.waiting.map((w) => [w.cell, w]) : []);
      const path = new Set(state && state.path ? state.path : []);
      cells.forEach((cell, i) => {
        const r = rowOf(i);
        const c = colOf(i);
        let kind = '';
        let text = '';
        let what = 'empty';
        if (walls.has(i)) { kind = 'is-wall'; what = 'wall'; }
        else if (explored.has(i)) { kind = 'is-explored'; text = String(explored.get(i)); what = `explored ${text}`; }
        else if (waiting.has(i)) { kind = 'is-waiting'; text = algo === 'astar' ? String(waiting.get(i).f) : ''; what = 'waiting'; }
        cell.className = `sim-cell ${kind}`;
        if (path.has(i)) { cell.classList.add('is-path'); what += ', on the path'; }
        if (state && state.current === i && !run.finished) cell.classList.add('is-current');
        if (i === start) { cell.classList.add('is-start'); text = 'S'; what = `start, ${what}`; }
        if (i === goal) { cell.classList.add('is-goal'); text = 'G'; what = `goal, ${what}`; }
        cell.textContent = text;
        cell.setAttribute('aria-label', `Row ${r}, column ${c}: ${what}`);
      });

      const info = ALGORITHMS[algo];
      about.textContent = `${info.label}: ${info.about}`;
      listTitle.textContent = `${info.list}: `;
      if (!state) {
        const h = Math.abs(rowOf(start) - rowOf(goal)) + Math.abs(colOf(start) - colOf(goal));
        listBody.textContent = algo === 'astar' ? `${name(start)} f=0+${h}=${h}` : name(start);
      } else if (!state.waiting.length) {
        listBody.textContent = 'empty';
      } else {
        const shown = state.waiting.slice(0, SHOW_WAITING)
          .map((w) => (w.note ? `${name(w.cell)} f=${w.note}` : name(w.cell)));
        const more = state.waiting.length - shown.length;
        listBody.textContent = shown.join('  ') + (more > 0 ? `  … ${more} more` : '');
      }

      if (!state) status.textContent = 'Press Play or Step to start the search.';
      else if (!run.finished) status.textContent = `Exploring ${name(state.current)} · ${state.explored.length} square${state.explored.length === 1 ? '' : 's'} explored`;
      else if (state.path) status.textContent = `Found the goal! Path: ${state.path.length - 1} steps · ${state.explored.length} squares explored`;
      else status.textContent = `No path: walls block the goal · ${state.explored.length} squares explored`;

      playBtn.textContent = timer ? '❚❚ Pause' : run && run.finished ? '↻ Run again' : '▶ Play';
      stepBtn.disabled = Boolean(run && run.finished);
    }

    // ---------- Running ----------
    function step() {
      if (!run || run.finished) run = { gen: ALGORITHMS[algo].search(walls, start, goal), state: null, finished: false };
      const { value, done } = run.gen.next();
      run.state = value;
      run.finished = done;
      if (done) pause();
      draw();
    }

    function tick() {
      timer = null;
      if (!node.isConnected) return; // the page moved on
      step();
      if (!run.finished) timer = setTimeout(tick, SPEEDS[speed]);
      draw();
    }

    function play() {
      if (run && run.finished) run = null;
      tick();
    }

    function pause() {
      clearTimeout(timer);
      timer = null;
      draw();
    }

    function resetSearch() {
      pause();
      run = null;
      draw();
    }

    playBtn.addEventListener('click', () => (timer ? pause() : play()));
    stepBtn.addEventListener('click', () => { pause(); step(); });
    resetBtn.addEventListener('click', resetSearch);
    speedInput.addEventListener('input', () => { speed = Number(speedInput.value); });
    clearBtn.addEventListener('click', () => { walls.clear(); resetSearch(); });
    randomBtn.addEventListener('click', () => {
      walls.clear();
      for (let i = 0; i < SIZE * SIZE; i++) if (i !== start && i !== goal && Math.random() < 0.28) walls.add(i);
      resetSearch();
    });

    // ---------- Editing the grid: click, or drag to paint walls ----------
    let painting = null; // 'add' or 'remove' while dragging walls

    function apply(i, first) {
      if (tool === 'start' || tool === 'goal') {
        if (i === (tool === 'start' ? goal : start)) return;
        walls.delete(i);
        if (tool === 'start') start = i; else goal = i;
      } else {
        if (i === start || i === goal) return;
        if (first) painting = tool === 'erase' || walls.has(i) ? 'remove' : 'add';
        if (painting === 'add') walls.add(i); else walls.delete(i);
      }
      resetSearch();
    }

    const cellAt = (e) => {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      return target && target.closest && grid.contains(target) && target.closest('.sim-cell');
    };
    let lastCell = -1;
    grid.addEventListener('pointerdown', (e) => {
      const cell = e.target.closest('.sim-cell');
      if (!cell || e.button > 0) return;
      e.preventDefault();
      lastCell = Number(cell.dataset.i);
      apply(lastCell, true);
      grid.setPointerCapture(e.pointerId);
    });
    grid.addEventListener('pointermove', (e) => {
      if (lastCell < 0) return;
      const cell = cellAt(e);
      if (!cell || Number(cell.dataset.i) === lastCell) return;
      lastCell = Number(cell.dataset.i);
      if (tool === 'wall' || tool === 'erase') apply(lastCell, false);
      else apply(lastCell, true); // drag the start or the goal along
    });
    const stopPainting = () => { lastCell = -1; painting = null; };
    grid.addEventListener('pointerup', stopPainting);
    grid.addEventListener('pointercancel', stopPainting);
    // The keyboard (Enter or Space on a square) works too; pointer clicks were handled above.
    grid.addEventListener('click', (e) => {
      const cell = e.target.closest('.sim-cell');
      if (cell && e.detail === 0) apply(Number(cell.dataset.i), true);
    });

    draw();
    return { node, pause };
  }

  window.GridSim = { create };
})();
