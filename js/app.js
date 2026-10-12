/*
 * Loads content/topics.json and renders either the home page (content/home.md)
 * or a single topic page (bots, videos, written material, quizzes, simulations, files, links).
 * You should not need to edit this file to add or change topics.
 */
(() => {
  'use strict';

  const CONTENT = 'content/';
  const root = document.documentElement;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Small helpers ----------
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

  // Only allow http(s) links (relative paths like "assets/sheet.pdf" are fine too).
  function safeUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value.trim(), location.href);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
    } catch {
      return null;
    }
  }

  function linkAttrs(url) {
    const external = url.origin !== location.origin;
    return { href: url.href, target: external ? '_blank' : null, rel: external ? 'noopener noreferrer' : null };
  }

  // Accepts a bare ID or any common YouTube URL form.
  function youtubeId(video) {
    const s = String(video.youtube || video.youtubeId || video.url || '').trim();
    if (/^[\w-]{11}$/.test(s)) return s;
    const m = s.match(/(?:[?&]v=|youtu\.be\/|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
    return m ? m[1] : null;
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Network hiccups and busy servers (429, 5xx) are usually gone a moment later, so
  // try again a few times before giving up. Resolves to the last response or rejects.
  async function fetchRetrying(url, options = {}, delays = [600, 2000, 5000]) {
    for (let attempt = 0; ; attempt++) {
      let res = null;
      try {
        res = await fetch(url, options);
        if (res.ok || (res.status !== 429 && res.status < 500)) return res;
      } catch (err) {
        if (attempt >= delays.length) throw err;
      }
      if (attempt >= delays.length) return res;
      const after = res && Number(res.headers.get('Retry-After'));
      await wait(after > 0 ? Math.min(after * 1000, 10000) : delays[attempt]);
    }
  }

  function asList(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  function notice(...children) {
    return el('div', { class: 'notice', role: 'status' }, ...children);
  }

  // ---------- View counts ----------
  // Kept by Abacus, a free counter service. "views" in the site block of topics.json
  // is this site's namespace there; leave it out to turn the counts off.
  const COUNTER = 'https://abacus.jasoncameron.dev';
  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname); // testing doesn't count
  let viewsNs = null;
  const counted = new Set();    // keys already counted since the page loaded
  const viewCounts = new Map(); // key -> promise of its latest count

  // Counter names may only hold letters, digits, "_", "-" and ".", up to 64 characters.
  function viewKey(...parts) {
    return parts.join('.').replace(/https?:\/\//, '').replace(/[^\w.-]+/g, '-').slice(-64).replace(/^[.-]+|[.-]+$/g, '');
  }

  // A topic page asks for many counts at once, and the service turns away bursts,
  // so only a few requests run at a time and refused ones are retried.
  const VIEW_REQUESTS_AT_ONCE = 3;
  let viewRequestsRunning = 0;
  const viewRequestQueue = [];

  function requestViews(action, key) {
    return new Promise((resolve) => {
      viewRequestQueue.push(() => fetchRetrying(`${COUNTER}/${action}/${viewsNs}/${key}`, { keepalive: action === 'hit' })
        .then((res) => (res.ok ? res.json() : res.status === 404 ? { value: 0 } : null))
        .then((data) => (data && Number.isFinite(data.value) ? data.value : null))
        .catch(() => null)
        .then(resolve));
      runViewRequests();
    });
  }

  function runViewRequests() {
    while (viewRequestsRunning < VIEW_REQUESTS_AT_ONCE && viewRequestQueue.length) {
      viewRequestsRunning++;
      viewRequestQueue.shift()().finally(() => {
        viewRequestsRunning--;
        runViewRequests();
      });
    }
  }

  // A faint "👁 12" label. hit() adds one view, at most once per page load.
  function viewCounter(key) {
    const node = el('span', { class: 'views', hidden: '' });
    let shown = -1;
    const update = (hit) => {
      if (!viewsNs) return;
      if (hit && !isLocal && !counted.has(key)) {
        counted.add(key);
        viewCounts.set(key, requestViews('hit', key));
      } else if (!viewCounts.has(key)) {
        viewCounts.set(key, requestViews('get', key));
      }
      viewCounts.get(key).then((n) => {
        if (n == null) {
          // Gave up for now: forget the failure so the next look or click asks again.
          viewCounts.delete(key);
          if (hit) counted.delete(key);
          return;
        }
        if (n <= shown) return;
        shown = n;
        node.textContent = `👁 ${n}`;
        node.title = `Viewed ${n} time${n === 1 ? '' : 's'}`;
        node.hidden = false;
      });
    };
    update(false);
    return { node, hit: () => update(true) };
  }

  // Card view: an item counts as viewed once it scrolls into sight.
  function hitWhenSeen(node, views) {
    if (!('IntersectionObserver' in window)) { views.hit(); return; }
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      views.hit();
    });
    observer.observe(node);
  }

  // ---------- Theme menu ----------
  // One button in the top bar and one on the entry screen; both open the same menu.
  const THEMES = [
    { id: 'light', name: 'Light', bg: '#dedad1', accent: '#0b6a4f' },
    { id: 'dark', name: 'Dark', bg: '#0a0c0f', accent: '#6ee7b7' },
    { id: 'solarized', name: 'Solarized', bg: '#fdf6e3', accent: '#268bd2' },
    { id: 'rose', name: 'Rosé Dawn', bg: '#faf4ed', accent: '#d7827e' },
    { id: 'nord', name: 'Nord', bg: '#2e3440', accent: '#88c0d0' },
    { id: 'dracula', name: 'Dracula', bg: '#282a36', accent: '#bd93f9' },
    { id: 'gruvbox', name: 'Gruvbox', bg: '#282828', accent: '#fabd2f' },
    { id: 'terminal', name: 'Terminal', bg: '#000000', accent: '#33ff33' },
    { id: 'mono', name: 'Black & White', bg: '#bdbdbd', accent: '#242424' },
  ];
  const ICON_PALETTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H16a5 5 0 0 0 5-5c0-4-4-7.2-9-7.2z"/>'
    + '<circle cx="7.5" cy="11.5" r="1.2"/><circle cx="10.5" cy="7.5" r="1.2"/><circle cx="15.5" cy="8" r="1.2"/></svg>';
  const toggles = document.querySelectorAll('.theme-toggle');
  const currentTheme = () => (THEMES.some((t) => t.id === root.dataset.theme) ? root.dataset.theme : 'light');

  const menu = document.createElement('div');
  menu.className = 'theme-menu';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', 'Colour scheme');
  menu.hidden = true;
  for (const t of THEMES) {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'theme-option';
    option.setAttribute('role', 'menuitemradio');
    option.dataset.theme = t.id;
    option.innerHTML = '<span class="theme-swatch" aria-hidden="true"></span>';
    option.append(t.name);
    option.firstChild.style.setProperty('--sw-bg', t.bg);
    option.firstChild.style.setProperty('--sw-accent', t.accent);
    option.addEventListener('click', () => { setTheme(t.id); closeMenu(); });
    menu.append(option);
  }
  document.body.append(menu);
  const options = [...menu.children];
  let menuOpener = null;

  function setTheme(id) {
    root.dataset.theme = id;
    try { localStorage.setItem('theme', id); } catch { /* storage unavailable */ }
    updateToggle();
  }

  function updateToggle() {
    const id = currentTheme();
    const name = THEMES.find((t) => t.id === id).name;
    for (const toggle of toggles) toggle.setAttribute('aria-label', `Colour scheme: ${name}`);
    for (const option of options) option.setAttribute('aria-checked', String(option.dataset.theme === id));
  }

  function openMenu(toggle) {
    menuOpener = toggle;
    menu.hidden = false;
    const r = toggle.getBoundingClientRect();
    const width = menu.offsetWidth;
    menu.style.top = `${r.bottom + 8}px`;
    menu.style.left = `${Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8))}px`;
    toggle.setAttribute('aria-expanded', 'true');
    (options.find((o) => o.getAttribute('aria-checked') === 'true') || options[0]).focus();
  }

  function closeMenu(returnFocus) {
    if (menu.hidden) return;
    menu.hidden = true;
    if (menuOpener) {
      menuOpener.setAttribute('aria-expanded', 'false');
      if (returnFocus) menuOpener.focus();
    }
    menuOpener = null;
  }

  for (const toggle of toggles) {
    toggle.innerHTML = ICON_PALETTE;
    toggle.title = 'Colour scheme';
    toggle.setAttribute('aria-haspopup', 'menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', () => {
      if (menuOpener === toggle) closeMenu(); else { closeMenu(); openMenu(toggle); }
    });
  }

  menu.addEventListener('keydown', (e) => {
    const i = options.indexOf(document.activeElement);
    if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); closeMenu(true); return; }
    let next = null;
    if (e.key === 'ArrowDown') next = (i + 1) % options.length;
    else if (e.key === 'ArrowUp') next = (i - 1 + options.length) % options.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = options.length - 1;
    if (next !== null) { e.preventDefault(); options[next].focus(); }
  });
  document.addEventListener('pointerdown', (e) => {
    if (!menu.hidden && !menu.contains(e.target) && !(menuOpener && menuOpener.contains(e.target))) closeMenu();
  });
  window.addEventListener('resize', () => closeMenu());
  window.addEventListener('scroll', () => closeMenu(), { passive: true });
  updateToggle();

  // ---------- View toggle (cards <-> minimal list), used on every page ----------
  const viewListeners = [];
  const viewToggle = document.querySelector('.view-toggle');
  const ICON_CARDS = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/>'
    + '<rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/>'
    + '<rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>';
  const ICON_LIST = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';

  // The button shows the view you will switch *to*.
  function updateViewToggle() {
    if (!viewToggle) return;
    const list = root.dataset.view === 'list';
    viewToggle.innerHTML = list ? ICON_CARDS : ICON_LIST;
    const label = list ? 'Switch to card view' : 'Switch to list view';
    viewToggle.setAttribute('aria-label', label);
    viewToggle.title = label;
  }

  if (viewToggle) {
    viewToggle.addEventListener('click', () => {
      const list = root.dataset.view !== 'list';
      if (list) root.dataset.view = 'list';
      else delete root.dataset.view;
      try { localStorage.setItem('view', list ? 'list' : 'cards'); } catch { /* storage unavailable */ }
      updateViewToggle();
      viewListeners.forEach((fn) => fn());
    });
    updateViewToggle();
  }

  // ---------- Icons toggle: show or hide the small icons beside unit names ----------
  const iconsToggle = document.querySelector('.icons-toggle');
  const ICON_ICONS = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="6" height="6" rx="1.5"/>'
    + '<path d="M13 8h7.5"/><rect x="3.5" y="13" width="6" height="6" rx="1.5"/><path d="M13 16h7.5"/></svg>';

  function updateIconsToggle() {
    if (!iconsToggle) return;
    const shown = root.dataset.icons !== 'off';
    const label = shown ? 'Hide unit icons' : 'Show unit icons';
    iconsToggle.innerHTML = ICON_ICONS;
    iconsToggle.setAttribute('aria-pressed', String(shown));
    iconsToggle.setAttribute('aria-label', label);
    iconsToggle.title = label;
  }

  if (iconsToggle) {
    iconsToggle.addEventListener('click', () => {
      const shown = root.dataset.icons === 'off';
      if (shown) delete root.dataset.icons;
      else root.dataset.icons = 'off';
      try { localStorage.setItem('icons', shown ? 'on' : 'off'); } catch { /* storage unavailable */ }
      updateIconsToggle();
      // The sidebar marker sits over the selected unit, whose size just changed.
      window.dispatchEvent(new Event('resize'));
    });
    updateIconsToggle();
  }

  // ---------- Data ----------
  async function loadData(container) {
    try {
      const res = await fetch(`${CONTENT}topics.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      data.site = data.site || {};
      data.topics = Array.isArray(data.topics) ? data.topics : [];
      return data;
    } catch (err) {
      const msg = location.protocol === 'file:'
        ? notice(
            el('strong', { text: 'Open this site through a web server. ' }),
            'Browsers block loading content from local files. In this folder run ',
            el('code', { text: 'python -m http.server 8000' }),
            ' and open http://localhost:8000',
          )
        : notice(
            el('strong', { text: 'Could not load content/topics.json. ' }),
            `Check that the file exists and is valid JSON (${err.message}).`,
          );
      container.append(msg);
      return null;
    }
  }

  function applySite(site) {
    const title = site.title || 'Class Resources';
    const fullName = site.author ? `${title} by ${site.author}` : title;
    const fill = (selector, text) =>
      document.querySelectorAll(selector).forEach((n) => { n.textContent = text; });
    fill('[data-site-name]', fullName);
    fill('[data-site-author]', site.author ? `by ${site.author}` : '');
    fill('[data-site-subtitle]', site.subtitle || '');
    fill('[data-site-footer]', site.footer || '');
    return { title, fullName };
  }

  // ---------- Home page ----------
  const GLYPHS = '!<>-_\\/[]{}=+*^?#@$%&';

  // Types text in, with each letter "decoding" from random symbols.
  function scramble(out, text) {
    if (reducedMotion) { out.textContent = text; return; }
    let revealed = 0;
    let tick = 0;
    const timer = setInterval(() => {
      tick++;
      if (tick % 2 === 0) revealed++;
      let s = text.slice(0, revealed);
      for (let i = revealed; i < Math.min(text.length, revealed + 3); i++) {
        s += text[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      out.textContent = s;
      if (revealed >= text.length) clearInterval(timer);
    }, 40);
  }

  function scrambleTitle(node, text) {
    node.setAttribute('aria-label', text);
    const out = el('span', { 'aria-hidden': 'true' });
    node.replaceChildren(out);
    scramble(out, text);
  }

  const topicHref = (id) => (id ? `?id=${encodeURIComponent(id)}` : './');

  // The Main page text comes from a Markdown file (site.home, default "home.md").
  function showHome(main, site) {
    const title = site.title || 'Class Resources';
    document.title = site.author ? `${title} by ${site.author}` : title;
    const heading = el('h1', { class: 'hero-title' });
    scrambleTitle(heading, title);
    const file = site.home || 'home.md';
    const article = el('article', { class: 'prose home-intro' }, el('p', { class: 'muted', text: 'Loading…' }));
    const fill = () => loadMaterial(file)
      .then((text) => article.replaceChildren(...renderMarkdown(text)))
      .catch(() => article.replaceChildren(loadError(file, () => {
        article.replaceChildren(el('p', { class: 'muted', text: 'Loading…' }));
        fill();
      })));
    fill();

    main.replaceChildren(
      el(
        'section',
        { class: 'hero' },
        el('p', { class: 'prompt', text: '$ cat ~/welcome.md' }),
        heading,
        site.author ? el('p', { class: 'hero-byline', text: `by ${site.author}` }) : null,
        site.subtitle ? el('p', { class: 'hero-sub', text: site.subtitle }) : null,
      ),
      article,
    );
  }

  // ---------- Topic page ----------
  function panel(title, ...children) {
    return el('section', { class: 'panel' }, el('h2', { text: title }), ...children);
  }

  function videoFrame(v, autoplay = false) {
    const id = youtubeId(v);
    if (!id) return null;
    const params = new URLSearchParams({ rel: '0' });
    if (Number(v.start) > 0) params.set('start', String(Math.floor(v.start)));
    if (autoplay) params.set('autoplay', '1');
    return el(
      'div',
      { class: 'video-frame' },
      el('iframe', {
        src: `https://www.youtube-nocookie.com/embed/${id}?${params}`,
        title: v.title || 'YouTube video',
        loading: autoplay ? null : 'lazy',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
        allowfullscreen: '',
        referrerpolicy: 'strict-origin-when-cross-origin',
      }),
    );
  }

  function videosPanel(videos, key) {
    const items = videos
      .map((v) => {
        const frame = videoFrame(v);
        if (!frame) return null;
        const views = viewCounter(key('video', youtubeId(v)));
        const figure = el('figure', { class: 'video' }, frame,
          el('figcaption', {}, el('span', { text: v.title || '' }), views.node));
        hitWhenSeen(figure, views);
        return figure;
      })
      .filter(Boolean);
    return items.length ? panel('Videos', el('div', { class: 'video-grid' }, ...items)) : null;
  }

  // A "copy" button on code blocks, so students can paste commands exactly.
  function addCopyButton(pre) {
    const button = el('button', { class: 'copy-btn', type: 'button', text: 'copy' });
    button.addEventListener('click', async () => {
      const code = (pre.querySelector('code') || pre).textContent.replace(/\n$/, '');
      try {
        await navigator.clipboard.writeText(code);
        button.textContent = 'copied ✓';
      } catch {
        // Clipboard blocked: select the text so Ctrl+C works.
        const range = document.createRange();
        range.selectNodeContents(pre.querySelector('code') || pre);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        button.textContent = 'press Ctrl+C';
      }
      setTimeout(() => { button.textContent = 'copy'; }, 1800);
    });
    const wrap = el('div', { class: 'code-wrap' });
    pre.replaceWith(wrap);
    wrap.append(pre, button);
  }

  // A ```math block holds LaTeX, one formula per line, drawn with KaTeX.
  // Without KaTeX (e.g. offline) the LaTeX source stays as a code block.
  function mathBlock(code) {
    if (!window.katex) return;
    const box = el('div', { class: 'math-block' });
    code.textContent.split('\n').filter((line) => line.trim()).forEach((line) => {
      const row = el('div', { class: 'math-line' });
      try {
        window.katex.render(line, row, { displayMode: true, throwOnError: false });
      } catch {
        row.textContent = line;
      }
      box.append(row);
    });
    code.parentElement.replaceWith(box);
  }

  function renderMarkdown(text) {
    if (window.marked && window.DOMPurify) {
      const html = window.DOMPurify.sanitize(window.marked.parse(text));
      const div = el('div');
      div.innerHTML = html;
      div.querySelectorAll('a[href]').forEach((a) => {
        const url = safeUrl(a.getAttribute('href'));
        if (url && url.origin !== location.origin) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        }
      });
      div.querySelectorAll('pre > code.language-math').forEach(mathBlock);
      div.querySelectorAll('pre').forEach(addCopyButton);
      return [...div.childNodes];
    }
    // Libraries failed to load (e.g. offline): show the raw text instead.
    return [el('pre', { text })];
  }

  // marked and DOMPurify come from cdnjs (see index.html). If that didn't load,
  // fetch the same files from a second CDN before any Markdown is shown.
  function loadScript(src, integrity) {
    return new Promise((resolve) => {
      const script = el('script', { src, integrity, crossorigin: 'anonymous' });
      script.onload = script.onerror = resolve;
      document.head.append(script);
    });
  }
  let markdownReady = null;
  function loadMarkdownLibs() {
    if (!markdownReady) {
      markdownReady = Promise.all([
        window.marked || loadScript('https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js',
          'sha384-/TQbtLCAerC3jgaim+N78RZSDYV7ryeoBCVqTuzRrFec2akfBkHS7ACQ3PQhvMVi'),
        window.DOMPurify || loadScript('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',
          'sha384-+VfUPEb0PdtChMwmBcBmykRMDd+v6D/oFmB3rZM/puCMDYcIvF968OimRh4KQY9a'),
      ]);
    }
    return markdownReady;
  }

  // KaTeX is only fetched for material that has ```math blocks.
  let mathReady = null;
  function loadMathLibs() {
    if (!mathReady) {
      const base = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/';
      document.head.append(el('link', {
        rel: 'stylesheet',
        href: `${base}katex.min.css`,
        integrity: 'sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+',
        crossorigin: 'anonymous',
      }));
      mathReady = loadScript(`${base}katex.min.js`,
        'sha384-7zkQWkzuo3B5mTepMUcHkMB5jZaolc2xDwL6VFqjFALcbeS9Ggm/Yr2r3Dy4lfFg');
    }
    return mathReady;
  }

  const materialCache = new Map();
  function loadMaterial(file) {
    if (!materialCache.has(file)) {
      const loading = Promise.all([
        fetchRetrying(`${CONTENT}${file}`, { cache: 'no-cache' }).then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        }),
        loadMarkdownLibs(),
      ]).then(async ([text]) => {
        if (/^```math\s*$/m.test(text)) await loadMathLibs();
        return text;
      });
      // Don't keep a failure, so trying again really loads the file again.
      loading.catch(() => materialCache.delete(file));
      materialCache.set(file, loading);
    }
    return materialCache.get(file);
  }

  // "Could not load ..." with a button that runs retry().
  function loadError(file, retry) {
    const again = el('button', { class: 'btn', type: 'button', text: '↻ Try again' });
    again.addEventListener('click', (e) => {
      e.stopPropagation();
      retry();
    });
    return el('p', { class: 'muted' }, `Could not load ${CONTENT}${file}. `, again);
  }

  function materialPanel(files, key) {
    if (!files.length) return null;
    const body = el('div');
    for (const file of files) {
      const article = el('article', { class: 'prose material' }, el('p', { class: 'muted', text: 'Loading…' }));
      const views = viewCounter(key('text', file));
      body.append(article);
      const fill = () => loadMaterial(file)
        .then((text) => article.replaceChildren(...renderMarkdown(text)))
        .catch(() => article.replaceChildren(loadError(file, () => {
          article.replaceChildren(el('p', { class: 'muted', text: 'Loading…' }));
          fill();
        })))
        .finally(() => article.append(views.node));
      fill();
      hitWhenSeen(article, views);
    }
    return panel('Written material', body);
  }

  // ---------- Quizzes ----------
  // A quiz is a Markdown file in content/quizzes/:
  //   # Quiz title                 (optional)
  //   ## Question                  (each "## " starts a question; text/code below it is part of the question)
  //   - [ ] wrong option           ("- [x]" marks a correct option; several [x] = choose all that apply)
  //     > feedback                 (indented "> " under an option = feedback for that option)
  //   > explanation                (unindented "> " after the options = shown with the corrections)
  const OPTION_RE = /^[-*]\s+\[([ xX])\]\s+(.*)$/;
  const FENCE_RE = /^\s*(```|~~~)/;

  function parseQuiz(text, file) {
    const quiz = { title: '', intro: [], questions: [] };
    let q = null;
    let option = null;
    let fence = false;

    const finish = () => {
      if (!q) return;
      const correct = q.options.filter((o) => o.correct).length;
      if (!q.options.length) console.warn(`${file}: question "${q.heading}" has no options, skipped.`);
      else if (!correct) console.warn(`${file}: question "${q.heading}" has no correct option [x], skipped.`);
      else {
        quiz.questions.push({
          heading: q.heading,
          prompt: q.prompt.join('\n').trim(),
          options: q.options.map((o) => ({ ...o, feedback: o.feedback.join(' ').trim() })),
          explanation: q.explanation.join('\n').trim(),
          multi: correct > 1,
        });
      }
    };

    for (const line of text.split(/\r?\n/)) {
      // Code blocks belong to the question text, whatever they contain.
      if (fence || FENCE_RE.test(line)) {
        if (FENCE_RE.test(line)) fence = !fence;
        if (q && !q.options.length) q.prompt.push(line);
        else if (!q) quiz.intro.push(line);
        continue;
      }
      const h = line.match(/^(#{1,2})\s+(.*)$/);
      if (h && h[1] === '#' && !q && !quiz.title) { quiz.title = h[2].trim(); continue; }
      if (h && h[1] === '##') {
        finish();
        q = { heading: h[2].trim(), prompt: [], options: [], explanation: [] };
        option = null;
        continue;
      }
      if (!q) { quiz.intro.push(line); continue; }

      const opt = line.match(OPTION_RE);
      const quote = line.match(/^(\s*)>\s?(.*)$/);
      if (opt && !q.explanation.length) {
        option = { text: opt[2].trim(), correct: opt[1] !== ' ', feedback: [] };
        q.options.push(option);
      } else if (quote && q.options.length) {
        if (quote[1] && option && !q.explanation.length) option.feedback.push(quote[2]);
        else q.explanation.push(quote[2]);
      } else if (!q.options.length) {
        q.prompt.push(line);
      } else if (option && /^\s+\S/.test(line) && !q.explanation.length) {
        option.text += ` ${line.trim()}`; // an option that continues on the next line
      }
    }
    finish();
    quiz.intro = quiz.intro.join('\n').trim();
    return quiz;
  }

  // Short Markdown (an option, a feedback line) without wrapping paragraphs.
  function renderInline(text) {
    const span = el('span');
    if (window.marked && window.DOMPurify) span.innerHTML = window.DOMPurify.sanitize(window.marked.parseInline(text));
    else span.textContent = text;
    return span;
  }

  // "quizzes" in topics.json: "file.md", ["a.md", "b.md"] or [{ "title": "...", "file": "..." }].
  function quizEntries(value) {
    return asList(value)
      .map((q) => (typeof q === 'string' ? { file: q } : q))
      .filter((q) => q && typeof q.file === 'string');
  }

  function scoreMessage(pct) {
    if (pct === 100) return 'Perfect score! 🎉';
    if (pct >= 80) return 'Great job! Check the corrections for what you missed.';
    if (pct >= 50) return 'Good effort. Read the feedback below, then try again.';
    return 'Keep practicing. Read the feedback below, then try again.';
  }

  let quizCount = 0;

  function buildQuiz(box, quiz, entry, showTitle) {
    const id = ++quizCount;
    const title = entry.title || quiz.title || 'Quiz';
    if (!quiz.questions.length) {
      box.replaceChildren(el('p', { class: 'muted', text: `No valid questions found in ${CONTENT}${entry.file}.` }));
      return;
    }

    const items = quiz.questions.map((q, qi) => {
      const name = `quiz-${id}-q${qi}`;
      const headingId = `${name}-h`;
      const opts = q.options.map((o, oi) => {
        const input = el('input', { type: q.multi ? 'checkbox' : 'radio', name, value: String(oi) });
        const tag = el('span', { class: 'quiz-tag', hidden: '' });
        const feedback = o.feedback ? el('div', { class: 'quiz-feedback', hidden: '' }, renderInline(o.feedback)) : null;
        const row = el('li', { class: 'quiz-opt' },
          el('label', {}, input, el('span', { class: 'quiz-opt-text' }, renderInline(o.text)), tag),
          feedback);
        return { o, input, tag, feedback, row };
      });
      const badge = el('span', { class: 'quiz-badge', hidden: '' });
      const explanation = q.explanation
        ? el('div', { class: 'prose quiz-explain', hidden: '' }, ...renderMarkdown(q.explanation))
        : null;
      const group = el('div', { class: 'quiz-q', role: 'group', 'aria-labelledby': headingId },
        el('p', { class: 'quiz-heading', id: headingId },
          el('span', { class: 'quiz-num', text: `${qi + 1}.` }), renderInline(q.heading), badge),
        q.prompt ? el('div', { class: 'prose quiz-prompt' }, ...renderMarkdown(q.prompt)) : null,
        q.multi ? el('p', { class: 'quiz-hint', text: 'Choose all that apply.' }) : null,
        el('ul', { class: 'quiz-opts' }, ...opts.map((x) => x.row)),
        explanation);
      return { opts, badge, explanation, group };
    });

    const answered = (it) => it.opts.some((x) => x.input.checked);
    const score = el('div', { class: 'quiz-score', role: 'status', tabindex: '-1', hidden: '' });
    const progress = el('span', { class: 'quiz-progress' });
    const submit = el('button', { class: 'btn', type: 'button', text: 'Submit answers' });
    const retry = el('button', { class: 'btn', type: 'button', text: '↻ Try again', hidden: '' });
    const updateProgress = () => {
      progress.textContent = `${items.filter(answered).length} / ${items.length} answered`;
    };

    submit.addEventListener('click', () => {
      const missing = items.filter((it) => !answered(it)).length;
      if (missing && !window.confirm(`${missing} of ${items.length} questions are not answered yet. Submit anyway?`)) return;
      let right = 0;
      for (const it of items) {
        let ok = true;
        for (const x of it.opts) {
          const picked = x.input.checked;
          const correct = x.o.correct;
          if (picked !== correct) ok = false;
          x.input.disabled = true;
          x.row.classList.toggle('is-correct', picked && correct);
          x.row.classList.toggle('is-wrong', picked && !correct);
          x.row.classList.toggle('is-missed', !picked && correct);
          x.tag.hidden = !(picked || correct);
          x.tag.textContent = picked ? (correct ? '✓ your answer' : '✗ your answer') : 'correct answer';
          if (x.feedback) x.feedback.hidden = !(picked || correct);
        }
        if (ok) right++;
        it.group.classList.toggle('is-right', ok);
        it.group.classList.toggle('is-wrong', !ok);
        it.badge.hidden = false;
        it.badge.textContent = ok ? '✓ Correct' : answered(it) ? '✗ Incorrect' : '— Not answered';
        if (it.explanation) it.explanation.hidden = false;
      }
      const pct = Math.round((right / items.length) * 100);
      score.replaceChildren(
        el('strong', { class: 'quiz-score-num', text: `${right} / ${items.length}` }),
        el('span', { class: 'quiz-score-pct', text: `${pct}%` }),
        el('span', { text: scoreMessage(pct) }),
      );
      score.dataset.band = pct === 100 ? 'perfect' : pct >= 50 ? 'pass' : 'low';
      score.hidden = false;
      submit.hidden = true;
      retry.hidden = false;
      progress.hidden = true;
      score.focus({ preventScroll: true });
      score.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'auto' : 'smooth' });
    });

    retry.addEventListener('click', () => {
      for (const it of items) {
        for (const x of it.opts) {
          x.input.checked = false;
          x.input.disabled = false;
          x.row.classList.remove('is-correct', 'is-wrong', 'is-missed');
          x.tag.hidden = true;
          if (x.feedback) x.feedback.hidden = true;
        }
        it.group.classList.remove('is-right', 'is-wrong');
        it.badge.hidden = true;
        if (it.explanation) it.explanation.hidden = true;
      }
      score.hidden = true;
      submit.hidden = false;
      retry.hidden = true;
      progress.hidden = false;
      updateProgress();
      box.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' });
    });

    const n = items.length;
    const bubble = el('p', { class: 'bot-bubble' });
    typeBubble(bubble, `Ready? ${n} question${n === 1 ? '' : 's'}. Let's see what you know!`, 700);
    const hero = el('div', { class: 'quiz-hero' },
      quizMark(),
      bubble);

    box.addEventListener('change', updateProgress);
    updateProgress();
    box.replaceChildren(...[
      showTitle ? el('h3', { class: 'quiz-title', text: title }) : null,
      hero,
      quiz.intro ? el('div', { class: 'prose quiz-intro' }, ...renderMarkdown(quiz.intro)) : null,
      score,
      ...items.map((it) => it.group),
      el('div', { class: 'quiz-actions' }, submit, retry, progress),
    ].filter(Boolean));
  }

  // Spinning, bobbing question mark: the quiz's counterpart to the bots' robot.
  function quizMark() {
    return el('div', { class: 'quiz-mark', 'aria-hidden': 'true' },
      el('span', { class: 'quiz-mark-glyph', text: '?' }), el('span', { class: 'quiz-mark-shadow' }));
  }

  // `onTitle` receives the quiz's title once the file has loaded.
  function quizView(entry, { showTitle = true, onTitle } = {}) {
    const box = el('div', { class: 'quiz' }, el('p', { class: 'muted', text: 'Loading…' }));
    const fill = () => loadMaterial(entry.file)
      .then((text) => {
        const quiz = parseQuiz(text, entry.file);
        buildQuiz(box, quiz, entry, showTitle);
        if (onTitle) onTitle(entry.title || quiz.title || 'Quiz');
      })
      .catch(() => box.replaceChildren(loadError(entry.file, () => {
        box.replaceChildren(el('p', { class: 'muted', text: 'Loading…' }));
        fill();
      })));
    fill();
    return box;
  }

  function quizPanel(quizzes, key) {
    if (!quizzes.length) return null;
    const boxes = quizzes.map((q) => {
      const views = viewCounter(key('quiz', q.file));
      const box = quizView(q, { onTitle: () => box.append(views.node) });
      hitWhenSeen(box, views);
      return box;
    });
    const section = panel(quizzes.length > 1 ? 'Quizzes' : 'Quiz', ...boxes);
    section.classList.add('quiz-panel');
    return section;
  }

  // ---------- Simulations: interactive demos built in the browser ----------
  // "simulations" in topics.json: [{ "title": "...", "type": "grid-path", "description": "..." }].
  // Each type is made by its own script (js/grid-sim.js for "grid-path").
  const SIMULATIONS = {
    'grid-path': () => window.GridSim && window.GridSim.create(),
  };

  function simEntries(value) {
    return asList(value)
      .map((s) => (typeof s === 'string' ? { type: s } : s))
      .filter((s) => s && SIMULATIONS[s.type])
      .map((s, i) => ({ ...s, title: s.title || `Simulation ${i + 1}` }));
  }

  // A small grid whose squares light up one after another, like a search spreading out.
  function simMark() {
    return el('span', { class: 'sim-icon', 'aria-hidden': 'true' },
      ...Array.from({ length: 9 }, (_, i) => el('span', { style: `--n:${Math.floor(i / 3) + (i % 3)}` })));
  }

  function simView(entry) {
    const sim = SIMULATIONS[entry.type]();
    if (sim) return sim;
    return { node: notice('This simulation could not start. Refresh the page to try again.'), pause() {} };
  }

  function simPanel(sims, key) {
    if (!sims.length) return null;
    const boxes = sims.map((s) => {
      const views = viewCounter(key('sim', s.type + (s.title ? `-${s.title}` : '')));
      const box = el('div', { class: 'sim-box' },
        el('h3', { class: 'sim-title' }, el('span', { text: s.title }), views.node),
        s.description ? el('p', { class: 'muted', text: s.description }) : null,
        simView(s).node);
      hitWhenSeen(box, views);
      return box;
    });
    return panel(sims.length > 1 ? 'Simulations' : 'Simulation', ...boxes);
  }

  // ---------- Bots: animated robots at the top of a topic ----------
  const ROBOT_SVG = `
    <svg viewBox="0 0 120 140" width="100%" height="100%" focusable="false">
      <g class="bot-float">
        <line x1="60" y1="24" x2="60" y2="12" class="bot-line"/>
        <circle cx="60" cy="9" r="5" class="bot-light"/>
        <rect x="10" y="44" width="8" height="20" rx="4" class="bot-part"/>
        <rect x="102" y="44" width="8" height="20" rx="4" class="bot-part"/>
        <rect x="16" y="24" width="88" height="62" rx="18" class="bot-shell"/>
        <rect x="27" y="35" width="66" height="40" rx="12" class="bot-screen"/>
        <g class="eye-track"><g class="bot-eyes">
          <ellipse cx="47" cy="53" rx="6" ry="7" class="bot-eye"/>
          <ellipse cx="73" cy="53" rx="6" ry="7" class="bot-eye"/>
        </g></g>
        <path d="M51 65 Q60 71 69 65" class="bot-line"/>
        <rect x="54" y="86" width="12" height="7" class="bot-part"/>
        <path d="M32 100 L19 117" class="bot-arm"/>
        <path d="M88 100 L103 83" class="bot-arm bot-wave"/>
        <rect x="30" y="92" width="60" height="38" rx="12" class="bot-shell"/>
        <circle cx="60" cy="111" r="6" class="bot-light bot-heart"/>
      </g>
    </svg>`;

  function robot() {
    const node = el('div', { class: 'robot', 'aria-hidden': 'true' });
    node.innerHTML = ROBOT_SVG;
    return node;
  }

  // Shows "typing…" dots, then types the greeting into the speech bubble.
  function typeBubble(bubble, text, delay) {
    const visible = el('span', { 'aria-hidden': 'true' });
    bubble.replaceChildren(el('span', { class: 'sr-only', text }), visible);
    if (reducedMotion) { visible.textContent = text; return; }

    visible.append(el('span', { class: 'typing' }, el('i'), el('i'), el('i')));
    setTimeout(() => {
      let i = 0;
      const timer = setInterval(() => {
        visible.textContent = text.slice(0, ++i);
        if (i >= text.length) clearInterval(timer);
      }, 28);
    }, delay);
  }

  // Robots' eyes follow the mouse / finger.
  let eyesBound = false;
  function trackEyes() {
    if (eyesBound || reducedMotion) return;
    eyesBound = true;
    let raf = 0, px = 0, py = 0;
    const update = () => {
      raf = 0;
      document.querySelectorAll('.robot').forEach((r) => {
        const b = r.getBoundingClientRect();
        const dx = px - (b.left + b.width / 2);
        const dy = py - (b.top + b.height * 0.38);
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 160);
        r.style.setProperty('--ex', `${(dx / d) * 4.5 * k}px`);
        r.style.setProperty('--ey', `${(dy / d) * 3.5 * k}px`);
      });
    };
    window.addEventListener('pointermove', (e) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(update);
    }, { passive: true });
  }

  function botsPanel(bots, topic, key) {
    const items = bots
      .map((b, i) => {
        const url = safeUrl(b.url);
        if (!url) return null;
        const greeting = b.description || `Hi! Want to practice ${topic.title || 'this topic'} with me?`;
        const bubble = el('p', { class: 'bot-bubble' });
        typeBubble(bubble, greeting, 700 + i * 1200);
        const views = viewCounter(key('bot', b.url));
        const link = el('a', { class: 'btn btn-bot', ...linkAttrs(url) }, 'Start chatting ↗');
        link.addEventListener('click', views.hit);
        return el(
          'div',
          { class: 'bot-card', style: `--i:${i}` },
          robot(),
          el(
            'div',
            { class: 'bot-body' },
            el('div', { class: 'bot-head' },
              el('strong', { class: 'bot-name', text: b.label || 'Practice bot' }), views.node),
            bubble,
            link,
          ),
        );
      })
      .filter(Boolean);
    if (!items.length) return null;
    trackEyes();
    const section = panel(
      items.length > 1 ? 'Practice with a bot' : 'Practice with the bot',
      el('div', { class: 'bot-grid' }, ...items),
    );
    section.classList.add('bot-panel');
    return section;
  }

  function linksPanel(links, key) {
    const items = links
      .map((l) => {
        const url = safeUrl(l.url);
        if (!url) return null;
        const views = viewCounter(key('link', l.url));
        const link = el('a', linkAttrs(url), l.label || url.hostname, views.node);
        link.addEventListener('click', views.hit);
        return el('li', {}, link);
      })
      .filter(Boolean);
    return items.length ? panel('More resources', el('ul', { class: 'link-list' }, ...items)) : null;
  }

  // "files" in topics.json: "files/code.zip", a list of them, or [{ "label": "...", "file": "..." }].
  // Paths are inside content/. Clicking one downloads it.
  function fileEntries(value) {
    return asList(value)
      .map((f) => (typeof f === 'string' ? { file: f } : f))
      .filter((f) => f && typeof f.file === 'string' && safeUrl(CONTENT + f.file))
      .map((f) => ({ ...f, url: safeUrl(CONTENT + f.file), label: f.label || f.file.split('/').pop() }));
  }

  function filesPanel(files, key) {
    const items = files.map((f) => {
      const views = viewCounter(key('file', f.file));
      const link = el('a', { href: f.url.href, download: '' }, f.label, views.node);
      link.addEventListener('click', views.hit);
      return el('li', {}, link);
    });
    return items.length ? panel('Files', el('ul', { class: 'link-list file-list' }, ...items)) : null;
  }

  // ---------- Topic page, list view: every item is one line ----------
  // Videos and written material expand in place; only one line is open at a time.
  let openLine = null;
  let lineCount = 0;
  const lineItems = new WeakMap(); // line node -> its open/close handle

  const LINE_TYPES = { bot: 'Bot', text: 'Text', video: 'Video', quiz: 'Quiz', sim: 'Sim', file: 'File', link: 'Link' };

  // Every line starts with a coloured type tag: Bot / Text / Video / Quiz / Sim / File / Link.
  function lineParts(type, label, sub, end, icon, views) {
    return [
      el('span', { class: 'line-type', text: LINE_TYPES[type] }),
      icon ? el('span', { class: 'line-icon', 'aria-hidden': 'true' }, icon) : null,
      el('span', { class: 'line-label', text: label }),
      sub ? el('span', { class: 'line-sub', text: sub }) : null,
      views ? views.node : null,
      el('span', { class: 'line-end', 'aria-hidden': 'true', text: end }),
    ];
  }

  function expandableLine(type, label, { onOpen, onClose, icon, views } = {}) {
    const id = `line-body-${++lineCount}`;
    const button = el(
      'button',
      { class: 'line', type: 'button', 'data-type': type, 'aria-expanded': 'false', 'aria-controls': id },
      ...lineParts(type, label, null, '▸', icon, views),
    );
    const body = el('div', { class: 'line-body', id, hidden: '' });
    const item = {
      label: button.querySelector('.line-label'),
      body,
      // `auto`: opened by the page itself, not a click — no scrolling, no autoplay.
      open(auto = false) {
        if (openLine && openLine !== item) openLine.close();
        openLine = item;
        button.setAttribute('aria-expanded', 'true');
        body.hidden = false;
        if (views) views.hit();
        if (onOpen) onOpen(body, auto);
        if (!auto) button.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
      },
      close() {
        if (openLine === item) openLine = null;
        button.setAttribute('aria-expanded', 'false');
        body.hidden = true;
        if (onClose) onClose(body);
      },
    };
    button.addEventListener('click', () => (openLine === item ? item.close() : item.open()));
    const node = el('div', { class: 'line-item' }, button, body);
    lineItems.set(node, item);
    return { node, item };
  }

  function botLines(bots, key) {
    const rows = bots
      .map((b) => {
        const url = safeUrl(b.url);
        if (!url) return null;
        const views = viewCounter(key('bot', b.url));
        const row = el('a', { class: 'line line-bot', 'data-type': 'bot', ...linkAttrs(url) },
          ...lineParts('bot', b.label || 'Practice bot', b.description, 'chat ↗', robot(), views));
        row.addEventListener('click', views.hit);
        return row;
      })
      .filter(Boolean);
    if (rows.length) trackEyes();
    return rows;
  }

  function videoLines(videos, key) {
    const rows = videos
      .filter((v) => youtubeId(v))
      .map((v, i) => expandableLine('video', v.title || `Video ${i + 1}`, {
        onOpen: (body, auto) => body.replaceChildren(videoFrame(v, !auto)),
        onClose: (body) => body.replaceChildren(), // removing the player stops the video
        views: viewCounter(key('video', youtubeId(v))),
      }).node);
    return rows;
  }

  function materialLines(files, key) {
    const rows = files.map((file) => {
      const { node, item } = expandableLine('text', 'Written material', { views: viewCounter(key('text', file)) });
      item.body.classList.add('prose');
      const fill = () => loadMaterial(file)
        .then((text) => {
          let nodes = renderMarkdown(text);
          // The document's first heading becomes the line's label.
          const first = nodes.find((n) => n.nodeType === Node.ELEMENT_NODE);
          if (first && first.tagName === 'H1') {
            item.label.textContent = first.textContent;
            nodes = nodes.filter((n) => n !== first);
          }
          item.body.replaceChildren(...nodes);
        })
        .catch(() => item.body.replaceChildren(loadError(file, () => {
          item.body.replaceChildren(el('p', { class: 'muted', text: 'Loading…' }));
          fill();
        })));
      item.body.append(el('p', { class: 'muted', text: 'Loading…' }));
      fill();
      return node;
    });
    return rows;
  }

  // The quiz is built once, so answers survive closing and reopening the line.
  function quizLines(quizzes, key) {
    return quizzes.map((entry) => {
      const { node, item } = expandableLine('quiz', entry.title || 'Quiz', {
        icon: quizMark(),
        views: viewCounter(key('quiz', entry.file)),
      });
      item.body.append(quizView(entry, {
        showTitle: false,
        onTitle: (title) => { item.label.textContent = title; },
      }));
      return node;
    });
  }

  // Like a quiz, the simulation is built once, so the grid survives closing and reopening the line.
  function simLines(sims, key) {
    return sims.map((s) => {
      let sim = null;
      const { node, item } = expandableLine('sim', s.title, {
        icon: simMark(),
        views: viewCounter(key('sim', s.type + (s.title ? `-${s.title}` : ''))),
        onClose: () => sim && sim.pause(), // closing the line stops the animation
      });
      if (s.description) node.querySelector('.line-label').after(el('span', { class: 'line-sub', text: s.description }));
      sim = simView(s);
      item.body.append(sim.node);
      return node;
    });
  }

  function fileLines(files, key) {
    return files.map((f) => {
      const views = viewCounter(key('file', f.file));
      const row = el('a', { class: 'line', 'data-type': 'file', href: f.url.href, download: '' },
        ...lineParts('file', f.label, null, '⬇', null, views));
      row.addEventListener('click', views.hit);
      return row;
    });
  }

  function linkLines(links, key) {
    const rows = links
      .map((l) => {
        const url = safeUrl(l.url);
        if (!url) return null;
        const views = viewCounter(key('link', l.url));
        const row = el('a', { class: 'line', 'data-type': 'link', ...linkAttrs(url) },
          ...lineParts('link', l.label || url.hostname, null, '↗', null, views));
        row.addEventListener('click', views.hit);
        return row;
      })
      .filter(Boolean);
    return rows;
  }

  // ---------- Topic list (sidebar on wide screens, a strip on phones) ----------
  // "Main" plus every topic; a glowing marker glides to the selected one.
  const MAIN = '';

  // Sidebar on wide screens; on phones, a bar showing the current topic that opens the list.
  function topicNav(topics) {
    const indicator = el('span', { class: 'nav-indicator', 'aria-hidden': 'true' });
    const items = new Map();
    const list = el('ul', { class: 'nav-list', id: 'nav-list' }, indicator);
    const entries = [{ id: SEARCH, title: 'Search Results', icon: '⌕' }, { id: MAIN, title: 'Main', icon: '~' }, ...topics];
    for (const t of entries) {
      const text = t.title || t.id;
      const title = el('span', { class: 'nav-title', text });
      const link = el(
        'a',
        { class: 'nav-item', href: topicHref(t.id), 'data-route': t.id },
        el('span', { class: 'nav-icon', 'aria-hidden': 'true', text: t.icon || '>_' }),
        title,
      );
      items.set(t.id, { link, title, text, icon: t.icon || '>_' });
      list.append(el('li', { hidden: t.id === SEARCH ? '' : null }, link));
    }
    const searchLink = items.get(SEARCH).link;

    const toggleIcon = el('span', { class: 'nav-icon', 'aria-hidden': 'true' });
    const toggleTitle = el('span', { class: 'nav-title' });
    const toggle = el(
      'button',
      { class: 'nav-toggle', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'nav-list' },
      toggleIcon,
      toggleTitle,
      el('span', { class: 'nav-toggle-label', text: 'Topics' }),
      el('span', { class: 'nav-chevron', 'aria-hidden': 'true', text: '▾' }),
    );
    const node = el('nav', { class: 'topic-nav', 'aria-label': 'Topics' }, toggle, list);

    let activeId = null;
    const place = (animate) => {
      const item = items.get(activeId);
      const li = item && item.link.parentElement;
      if (!li || !li.offsetHeight) { indicator.style.opacity = '0'; return; }
      indicator.classList.toggle('no-anim', !animate);
      indicator.style.opacity = '1';
      indicator.style.transform = `translate(${li.offsetLeft}px, ${li.offsetTop}px)`;
      indicator.style.width = `${li.offsetWidth}px`;
      indicator.style.height = `${li.offsetHeight}px`;
    };

    // Scrolls the list (the sidebar on wide screens, the open strip on phones) just
    // enough to show the selected unit, with a little room around it.
    const reveal = (animate) => {
      const item = items.get(activeId);
      const li = item && item.link.parentElement;
      if (!li || !li.offsetHeight) return;
      const box = [node, list].find((b) => b.scrollHeight > b.clientHeight + 1);
      if (!box) return;
      const pad = 24;
      const top = li.getBoundingClientRect().top - box.getBoundingClientRect().top;
      const bottom = top + li.offsetHeight;
      let by = 0;
      if (top < pad) by = top - pad;
      else if (bottom > box.clientHeight - pad) by = bottom - box.clientHeight + pad;
      if (by) box.scrollBy({ top: by, behavior: animate && !reducedMotion ? 'smooth' : 'auto' });
    };

    const setOpen = (open) => {
      node.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (open) { place(false); reveal(false); }
    };
    toggle.addEventListener('click', () => setOpen(!node.classList.contains('open')));
    document.addEventListener('click', (e) => {
      if (node.classList.contains('open') && !node.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && node.classList.contains('open')) { setOpen(false); toggle.focus(); }
    });

    window.addEventListener('resize', () => place(false));
    return {
      node,
      select(id) {
        setOpen(false);
        if (id === activeId) return;
        const first = activeId === null;
        if (items.has(activeId)) items.get(activeId).link.removeAttribute('aria-current');
        activeId = id;
        const item = items.get(id);
        toggleIcon.textContent = item ? item.icon : '?';
        toggleTitle.textContent = item ? item.text : 'Topics';
        if (!item) { place(false); return; }
        item.link.setAttribute('aria-current', 'page');
        scramble(item.title, item.text);
        place(!first);
        reveal(!first);
        // A short burst of light when the marker arrives.
        indicator.classList.remove('arrive');
        void indicator.offsetWidth;
        indicator.classList.add('arrive');
      },
      place,
      // The "Search Results" entry is listed only while there is a search.
      setSearch(query) {
        searchLink.parentElement.hidden = !query;
        if (query) searchLink.href = searchHref(query);
        place(false);
      },
    };
  }

  // ---------- Topic page ----------
  let drawTopicBody = null;
  viewListeners.push(() => drawTopicBody && drawTopicBody());

  function showTopic(main, topic, siteTitle) {
    if (!topic) {
      document.title = `Topic not found · ${siteTitle}`;
      main.replaceChildren(notice('That topic doesn’t exist (yet). Pick one from the list.'));
      return;
    }

    const topicTitle = topic.title || topic.id;
    document.title = `${topicTitle} · ${siteTitle}`;
    const heading = el('h1');
    scrambleTitle(heading, topicTitle);
    const views = viewCounter(viewKey('topic', topic.id));
    views.hit();
    const key = (type, ref) => viewKey(topic.id, type, ref);
    const body = el('div', { class: 'topic-body' });
    main.replaceChildren(
      el(
        'header',
        { class: 'topic-head' },
        el('span', { class: 'card-icon', 'aria-hidden': 'true', text: topic.icon || '>_' }),
        el('div', { class: 'topic-title' }, heading, views.node),
        topic.blurb ? el('p', { text: topic.blurb }) : null,
      ),
      body,
    );

    drawTopicBody = () => {
      openLine = null;
      let sections;
      if (root.dataset.view === 'list') {
        const rows = [
          ...botLines(asList(topic.bots), key),
          ...videoLines(asList(topic.videos), key),
          ...materialLines(asList(topic.material), key),
          ...quizLines(quizEntries(topic.quizzes), key),
          ...simLines(simEntries(topic.simulations), key),
          ...fileLines(fileEntries(topic.files), key),
          ...linkLines(asList(topic.links), key),
        ];
        sections = rows.length ? [el('div', { class: 'line-list topic-lines' }, ...rows)] : [];
        // A topic with a single item shows it opened.
        if (rows.length === 1 && lineItems.has(rows[0])) lineItems.get(rows[0]).open(true);
      } else {
        sections = [
          botsPanel(asList(topic.bots), topic, key),
          videosPanel(asList(topic.videos), key),
          materialPanel(asList(topic.material), key),
          quizPanel(quizEntries(topic.quizzes), key),
          simPanel(simEntries(topic.simulations), key),
          filesPanel(fileEntries(topic.files), key),
          linksPanel(asList(topic.links), key),
        ];
      }
      body.replaceChildren(...sections.filter(Boolean));
    };
    drawTopicBody();
  }

  // ---------- Search: a temporary "Search Results" unit ----------
  // Lists every item whose title or text holds all the searched words, in the order
  // they appear on the site. The items work just as they do on their own topic.
  const SEARCH = '?search'; // the unit's id in the topic list (topic ids have no "?")
  const searchHref = (query) => `?q=${encodeURIComponent(query)}`;

  // Markdown to plain text, good enough for matching and snippets.
  function plainText(md) {
    return md
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/^\s*[-*]\s+\[[ xX]\]\s+/gm, '')
      .replace(/[#*_`>|~]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const firstHeading = (md) => plainText((md.match(/^#\s+(.+)$/m) || [])[1] || '');

  // One entry per item, in site order: topics top to bottom, items as on the topic page.
  // Built once, the first time someone searches.
  let searchIndex = null;
  function loadSearchIndex(topics) {
    if (!searchIndex) {
      const building = buildSearchIndex(topics);
      searchIndex = building;
      // A file that didn't load is missing from the index: build it again next search.
      building.then((index) => { if (index.incomplete && searchIndex === building) searchIndex = null; });
    }
    return searchIndex;
  }

  async function buildSearchIndex(topics) {
    const items = [];
    const add = (topic, type, src, title, text = '') => items.push({ topic, type, src, title, text });
    let incomplete = false;
    const load = (file) => loadMaterial(file).catch(() => { incomplete = true; return ''; });
    for (const t of topics) {
      for (const b of asList(t.bots)) if (safeUrl(b.url)) add(t, 'bot', b, b.label || 'Practice bot', b.description || '');
      asList(t.videos).filter((v) => youtubeId(v)).forEach((v, i) => {
        const title = v.title || `Video ${i + 1}`;
        add(t, 'video', { ...v, title }, title);
      });
      for (const file of asList(t.material)) {
        const md = await load(file);
        add(t, 'text', file, firstHeading(md) || 'Written material', plainText(md));
      }
      for (const q of quizEntries(t.quizzes)) {
        const md = await load(q.file);
        add(t, 'quiz', q, q.title || firstHeading(md) || 'Quiz', plainText(md));
      }
      for (const s of simEntries(t.simulations)) add(t, 'sim', s, s.title, s.description || '');
      for (const f of fileEntries(t.files)) add(t, 'file', f, f.label);
      for (const l of asList(t.links)) {
        const url = safeUrl(l.url);
        if (url) add(t, 'link', l, l.label || url.hostname);
      }
    }
    items.incomplete = incomplete;
    return items;
  }

  const searchWords = (query) => query.toLowerCase().split(/\s+/).filter(Boolean);

  function matches(item, words) {
    const title = item.title.toLowerCase();
    const text = item.text.toLowerCase();
    return words.length > 0 && words.every((w) => title.includes(w) || text.includes(w));
  }

  // Text with every searched word wrapped in <mark>.
  function highlight(text, words) {
    const span = el('span');
    const pattern = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    if (!pattern) { span.textContent = text; return span; }
    text.split(new RegExp(`(${pattern})`, 'gi')).forEach((part, i) => {
      span.append(i % 2 ? el('mark', { text: part }) : part);
    });
    return span;
  }

  // A piece of the text around the first match.
  function snippet(text, words) {
    const lower = text.toLowerCase();
    const at = Math.min(...words.map((w) => lower.indexOf(w)).filter((i) => i >= 0));
    if (!Number.isFinite(at)) return text.length > 140 ? `${text.slice(0, 140)}…` : text;
    let start = Math.max(0, at - 50);
    const space = text.indexOf(' ', start);
    if (start && space >= 0 && space < at) start = space + 1; // begin on a whole word
    const end = Math.min(text.length, at + 110);
    return `${start ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
  }

  const LINE_BUILDERS = { bot: botLines, video: videoLines, text: materialLines, quiz: quizLines, sim: simLines, file: fileLines, link: linkLines };

  // The item's usual line, plus the topic it comes from and a piece of the matching text.
  function resultLine(item, words) {
    const key = (type, ref) => viewKey(item.topic.id, type, ref);
    const node = LINE_BUILDERS[item.type]([item.src], key)[0];
    const line = node.classList.contains('line') ? node : node.querySelector('.line');
    const label = line.querySelector('.line-label');
    const sub = line.querySelector('.line-sub');
    if (sub) sub.remove(); // a bot's description: the snippet shows it instead
    const main = el('span', { class: 'search-main' });
    label.replaceWith(main);
    main.append(label,
      el('span', { class: 'search-topic' },
        el('span', { class: 'search-topic-icon', text: `${item.topic.icon || '>_'} ` }), item.topic.title || item.topic.id));
    if (item.text) main.append(el('span', { class: 'search-snippet' }, highlight(snippet(item.text, words), words)));
    return node;
  }

  // The Search Results page. It is kept while the search lasts, so leaving it for a
  // topic and coming back keeps opened items and quiz answers.
  function searchPage(topics) {
    let shownQuery = null;
    const heading = el('h1');
    const count = el('p', { role: 'status' });
    const list = el('div', { class: 'line-list topic-lines' });
    const node = el('div', {},
      el('header', { class: 'topic-head' },
        el('span', { class: 'card-icon', 'aria-hidden': 'true', text: '⌕' }),
        el('div', { class: 'topic-title' }, heading),
        count),
      el('div', { class: 'topic-body' }, list));

    return {
      node,
      // Puts the page into `main` (again) and brings it up to date with `query`.
      async show(main, query) {
        main.replaceChildren(node);
        scrambleTitle(heading, 'Search Results');
        // Coming back: the line left open is still open.
        const open = [...list.querySelectorAll('.line-item')].find((n) => !n.querySelector('.line-body').hidden);
        if (open) openLine = lineItems.get(open);
        if (query === shownQuery) return;
        shownQuery = query;
        count.textContent = 'Searching…';
        const items = await loadSearchIndex(topics);
        if (query !== shownQuery) return; // a newer search is on its way
        const words = searchWords(query);
        const found = items.filter((item) => matches(item, words));
        openLine = null;
        list.replaceChildren(...found.map((item) => resultLine(item, words)));
        list.hidden = !found.length;
        count.textContent = found.length
          ? `${found.length} item${found.length === 1 ? '' : 's'} match “${query}”`
          : `Nothing matches “${query}”. Try other words.`;
      },
    };
  }

  // ---------- App: one page, switching between Main and topics in place ----------
  async function renderApp() {
    const main = document.getElementById('app');
    const canvas = document.getElementById('ascii-bg');
    const data = await loadData(main);
    if (!data) return;
    const { fullName } = applySite(data.site);
    if (/^[\w.-]{3,64}$/.test(data.site.views || '')) viewsNs = data.site.views;
    const topics = data.topics.filter((t) => t && t.id);
    const urlQuery = () => (new URLSearchParams(location.search).get('q') || '').trim();
    const currentId = () => (urlQuery() ? SEARCH : new URLSearchParams(location.search).get('id') || MAIN);

    const nav = topicNav(topics);
    document.getElementById('topic-nav-slot').replaceWith(nav.node);

    // ----- Search: the box in the top bar runs a temporary "Search Results" unit -----
    const input = document.querySelector('.search-input');
    let query = '';
    let results = null;    // the Search Results page while a search lasts
    let returnTo = MAIN;   // where clearing the search goes back to

    const setQuery = (q) => {
      query = q;
      if (input && input.value.trim() !== q) input.value = q;
      if (!q) results = null;
      else if (!results) results = searchPage(topics);
      nav.setSearch(q);
    };

    const show = (id) => {
      drawTopicBody = null;
      openLine = null;
      if (id === SEARCH) {
        document.title = `Search Results · ${fullName}`;
        results.show(main, query);
      } else if (id === MAIN) showHome(main, data.site);
      else showTopic(main, topics.find((t) => t.id === id), fullName);
      document.body.dataset.page = id === SEARCH ? 'search' : id === MAIN ? 'home' : 'topic';
      if (canvas) canvas.dataset.intensity = entryOpen() ? '' : 'dim';
      nav.select(id);
    };

    const hrefFor = (id) => (id === SEARCH ? searchHref(query) : topicHref(id));
    const go = (id) => {
      if (id === currentId()) return;
      history.pushState({ main: true }, '', hrefFor(id));
      show(id);
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    };

    if (input) {
      input.addEventListener('focus', () => loadSearchIndex(topics), { once: true });
      input.addEventListener('input', () => {
        const q = input.value.trim();
        if (q === query) return;
        if (!q) {
          // Search cleared: the unit goes away; if it was showing, go back.
          setQuery('');
          if (currentId() === SEARCH) {
            history.replaceState(history.state, '', topicHref(returnTo));
            show(returnTo);
          }
          return;
        }
        setQuery(q);
        if (currentId() === SEARCH) {
          history.replaceState(history.state, '', searchHref(q));
          results.show(main, q);
        } else {
          returnTo = currentId();
          go(SEARCH);
        }
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          input.value = '';
          input.dispatchEvent(new Event('input'));
          input.blur();
        }
        if (e.key === 'Enter') input.blur(); // closes the keyboard on phones
      });
      // Typing anywhere on the page goes into the search box ("/" just jumps there).
      // Space is left alone so it still scrolls the page and presses buttons.
      document.addEventListener('keydown', (e) => {
        if (e.key.length !== 1 || e.key === ' ' || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
        if (entryOpen() || e.target === input) return;
        if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
        if (e.key === '/') e.preventDefault();
        input.focus();
        // The key itself then lands in the box, after anything already typed there.
        const end = input.value.length;
        input.setSelectionRange(end, end);
      });
    }

    // The site name in the top bar goes back to the entry screen (over the main page).
    const brand = document.querySelector('.brand');
    if (brand) brand.addEventListener('click', (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      if (query) setQuery('');
      history.pushState({ entry: true }, '', './');
      show(MAIN);
      setEntry(true);
      brand.blur(); // so the Enter key opens the site again
    });

    // Arrow keys: up and down move through the unit list; right steps over to the unit's
    // items (lines in the list view, panels in the cards view), where up and down move
    // between items instead; left steps back to the unit list.
    const pageItems = () => [...main.querySelectorAll(root.dataset.view === 'list' ? '.line' : '.panel')];
    const focusItem = (item) => {
      if (!item.matches('a, button')) item.tabIndex = -1;
      item.focus({ preventScroll: true });
      item.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
    };
    document.addEventListener('keydown', (e) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || entryOpen()) return;
      if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable], [role="menu"]')) return;
      const items = pageItems();
      const active = document.activeElement;
      const at = items.findIndex((i) => (i.closest('.line-item') || i).contains(active));
      const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
      if (at >= 0) {
        // In the item list.
        if (e.key === 'ArrowLeft') { e.preventDefault(); active.blur(); return; }
        if (e.key === 'ArrowRight') return;
        const next = items[at + step];
        e.preventDefault();
        if (next) focusItem(next);
        return;
      }
      // In the unit list.
      if (e.key === 'ArrowLeft') return;
      if (e.key === 'ArrowRight') {
        if (!items.length) return;
        e.preventDefault();
        const open = items.find((i) => i.getAttribute('aria-expanded') === 'true');
        focusItem(open || items[0]);
        return;
      }
      const order = [...(query ? [SEARCH] : []), MAIN, ...topics.map((t) => t.id)];
      const next = order[order.indexOf(currentId()) + step];
      if (next === undefined) return;
      e.preventDefault();
      go(next);
    });

    // Links marked data-route (sidebar) switch pages without a reload.
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-route]');
      if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      go(a.dataset.route);
    });
    window.addEventListener('popstate', () => {
      if (urlQuery()) setQuery(urlQuery());
      show(currentId());
    });
    window.matchMedia('(min-width: 820px)').addEventListener('change', () => nav.place(false));
    if (urlQuery()) setQuery(urlQuery());
    show(currentId());
  }

  // ---------- Entry screen: shown over the main page until ENTER is pressed ----------
  function entryOpen() {
    return 'entry' in document.documentElement.dataset;
  }

  // The entry screen is its own step in the browser history, so Back returns to it.
  function setEntry(open) {
    if (open) document.documentElement.dataset.entry = '';
    else delete document.documentElement.dataset.entry;
    const canvas = document.getElementById('ascii-bg');
    if (canvas) canvas.dataset.intensity = open ? '' : 'dim';
    window.scrollTo(0, 0);
  }

  function setupEntry() {
    const btn = document.querySelector('.entry-btn');
    if (!btn) return;
    if (entryOpen()) history.replaceState({ entry: true }, '');
    const enter = () => {
      history.pushState({ main: true }, '', './');
      setEntry(false);
    };
    btn.addEventListener('click', enter);
    // The Enter key works too, without having to tab to the button first.
    document.addEventListener('keydown', (e) => {
      if (entryOpen() && e.key === 'Enter' && e.target === document.body) enter();
    });
    window.addEventListener('popstate', () => {
      const open = Boolean(history.state && history.state.entry);
      if (open !== entryOpen()) setEntry(open);
    });
  }

  // ---------- Boot ----------
  setupEntry();
  renderApp();
})();
