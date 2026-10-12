/*
 * Full-screen ASCII field that drifts on its own and reacts to the mouse
 * (or finger on phones). Click / tap sends out a ripple.
 *
 * Usage: <canvas id="ascii-bg" aria-hidden="true"></canvas>
 *        set data-intensity="dim" (any time) for a quieter background behind text.
 * Colours come from the CSS variables --glyph and --glyph-hot.
 */
(() => {
  'use strict';

  const canvas = document.getElementById('ascii-bg');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');

  const RAMP = ' .,:-=+*%#@';
  const ALPHA_STEPS = 8;
  const FRAME_MS = 1000 / 30;
  const RIPPLE_SPEED = 280;  // px per second
  const RIPPLE_LIFE = 1.6;   // seconds
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  let w = 0, h = 0, cw = 0, ch = 0, cols = 0, rows = 0, radius = 120;
  let colors = ['110,231,183', '247,163,92'];
  let time = 0, lastFrame = 0, rafId = 0;
  const dimTarget = () => (canvas.dataset.intensity === 'dim' ? 0.14 : 1);
  let dimFactor = dimTarget();  // eases toward dimTarget() so intensity changes fade
  const pointer = { x: -1e4, y: -1e4, strength: 0, target: 0 };
  const ripples = [];
  // buckets[color][alphaStep] = flat list of x, y, charIndex
  const buckets = [0, 1].map(() => Array.from({ length: ALPHA_STEPS }, () => []));

  function readColors() {
    const s = getComputedStyle(document.documentElement);
    colors = [
      s.getPropertyValue('--glyph').trim() || colors[0],
      s.getPropertyValue('--glyph-hot').trim() || colors[1],
    ];
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    const small = w < 640;
    const size = small ? 15 : 14;
    ch = size * 1.3;
    cw = size * 0.78;
    radius = small ? 90 : 130;
    cols = Math.ceil(w / cw) + 1;
    rows = Math.ceil(h / ch) + 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `${size}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (reduced.matches) draw();
  }

  // Smooth drifting bands built from a few overlapping sine waves.
  function field(x, y, t) {
    const v =
      Math.sin(x * 0.011 + t * 0.7) +
      Math.sin(y * 0.017 - t * 0.5) +
      Math.sin((x + y) * 0.007 + t * 0.35) +
      Math.sin(Math.hypot(x - w * 0.7, y - h * 0.3) * 0.014 - t * 0.9);
    const n = (v + 4) / 8;                 // 0..1
    return Math.max(0, n - 0.5) / 0.5;     // sparse: most cells stay blank
  }

  function draw() {
    for (const group of buckets) for (const b of group) b.length = 0;

    const r2 = 2 * radius * radius;
    const ps = pointer.strength;

    for (let r = 0; r < rows; r++) {
      const y = r * ch;
      for (let c = 0; c < cols; c++) {
        const x = c * cw;
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const d2 = dx * dx + dy * dy;
        const infl = ps > 0.01 ? ps * Math.exp(-d2 / r2) : 0;

        let ring = 0;
        for (const rp of ripples) {
          const rd = Math.hypot(x - rp.x, y - rp.y) - rp.r;
          if (rd > -40 && rd < 40) ring += Math.exp(-(rd * rd) / 450) * rp.fade;
        }

        const b = Math.min(1, field(x, y, time) * 0.8 + infl * 0.95 + ring);
        if (b < 0.04) continue;

        // Characters near the pointer get nudged outward.
        let ox = x, oy = y;
        if (infl > 0.02) {
          const d = Math.sqrt(d2) || 1;
          ox += (dx / d) * infl * 10;
          oy += (dy / d) * infl * 10;
        }

        const ci = 1 + Math.floor(b * (RAMP.length - 2));
        const alpha = (0.1 + b * 0.75) * dimFactor;
        const step = Math.min(ALPHA_STEPS - 1, Math.floor(alpha * ALPHA_STEPS));
        const hot = infl + ring > 0.3 ? 1 : 0;
        buckets[hot][step].push(ox, oy, ci);
      }
    }

    ctx.clearRect(0, 0, w, h);
    for (let k = 0; k < 2; k++) {
      for (let s = 0; s < ALPHA_STEPS; s++) {
        const list = buckets[k][s];
        if (!list.length) continue;
        ctx.fillStyle = `rgba(${colors[k]},${((s + 0.5) / ALPHA_STEPS).toFixed(3)})`;
        for (let i = 0; i < list.length; i += 3) {
          ctx.fillText(RAMP[list[i + 2]], list[i], list[i + 1]);
        }
      }
    }
  }

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    if (now - lastFrame < FRAME_MS) return;
    const dt = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;
    time += dt;

    pointer.strength += (pointer.target - pointer.strength) * Math.min(1, dt * 5);
    dimFactor += (dimTarget() - dimFactor) * Math.min(1, dt * 2.5);
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      rp.age += dt;
      rp.r = rp.age * RIPPLE_SPEED;
      rp.fade = 1 - rp.age / RIPPLE_LIFE;
      if (rp.fade <= 0) ripples.splice(i, 1);
    }
    draw();
  }

  function start() {
    if (rafId || reduced.matches || document.hidden) return;
    lastFrame = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  // ---- Input ----
  const move = (x, y) => {
    pointer.x = x;
    pointer.y = y;
    pointer.target = 1;
  };
  const leave = () => { pointer.target = 0; };
  const addRipple = (x, y) => {
    if (reduced.matches) return;
    if (ripples.length > 5) ripples.shift();
    ripples.push({ x, y, age: 0, r: 0, fade: 1 });
  };

  window.addEventListener('pointermove', (e) => move(e.clientX, e.clientY), { passive: true });
  window.addEventListener('pointerdown', (e) => {
    move(e.clientX, e.clientY);
    addRipple(e.clientX, e.clientY);
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (t) move(t.clientX, t.clientY);
  }, { passive: true });
  window.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') leave(); });
  window.addEventListener('touchend', leave);
  window.addEventListener('blur', leave);
  document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) leave(); });

  // ---- Lifecycle ----
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  reduced.addEventListener('change', () => {
    if (reduced.matches) { stop(); pointer.strength = 0; draw(); } else start();
  });

  const onThemeChange = () => { readColors(); if (reduced.matches) draw(); };
  new MutationObserver(() => { if (reduced.matches) { dimFactor = dimTarget(); draw(); } })
    .observe(canvas, { attributes: true, attributeFilter: ['data-intensity'] });
  new MutationObserver(onThemeChange).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  readColors();
  resize();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
  start();
})();
