/*
 * Full-screen "field lines" background: a grid of short needles that drift
 * with a slow flow and curl around the mouse (or finger on phones) like
 * iron filings around a current-carrying wire. Click / tap sends out a pulse
 * that flips the needles outward as it passes.
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

  const ALPHA_STEPS = 8;
  const FRAME_MS = 1000 / 30;
  const PULSE_SPEED = 340;  // px per second
  const PULSE_LIFE = 1.8;   // seconds
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  let w = 0, h = 0, gap = 24, cols = 0, rows = 0, radius = 160;
  let colors = ['110,231,183', '247,163,92'];
  let time = 0, lastFrame = 0, rafId = 0;
  const dimTarget = () => (canvas.dataset.intensity === 'dim' ? 0.16 : 1);
  let dimFactor = dimTarget();  // eases toward dimTarget() so intensity changes fade
  const pointer = { x: -1e4, y: -1e4, strength: 0, target: 0, spin: 1 };
  const pulses = [];
  // lines[color][alphaStep] = flat list of x1, y1, x2, y2
  const lines = [0, 1].map(() => Array.from({ length: ALPHA_STEPS }, () => []));
  // dots[alphaStep] = flat list of x, y (the faint grid that shows where needles rest)
  const dots = Array.from({ length: ALPHA_STEPS }, () => []);

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
    gap = small ? 22 : 26;
    radius = small ? 120 : 180;
    cols = Math.ceil(w / gap) + 1;
    rows = Math.ceil(h / gap) + 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    if (reduced.matches) draw();
  }

  // Slowly turning flow direction (radians) and a sparse "energy" level (0..1).
  function flow(x, y, t) {
    const a =
      Math.sin(x * 0.004 + t * 0.15) * 1.6 +
      Math.cos(y * 0.005 - t * 0.12) * 1.6 +
      Math.sin((x - y) * 0.002 + t * 0.08);
    const e =
      Math.sin(x * 0.009 - t * 0.6) +
      Math.sin(y * 0.012 + t * 0.45) +
      Math.sin((x + y) * 0.006 - t * 0.3);
    return [a, Math.max(0, (e + 3) / 6 - 0.45) / 0.55];
  }

  function draw() {
    for (const group of lines) for (const b of group) b.length = 0;
    for (const b of dots) b.length = 0;

    const r2 = 2 * radius * radius;
    const ps = pointer.strength;
    const half = gap * 0.42;

    for (let r = 0; r < rows; r++) {
      // Offset every other row for a less mechanical, hex-like grid.
      const y = r * gap;
      const xo = r & 1 ? gap / 2 : 0;
      for (let c = 0; c < cols; c++) {
        const x = c * gap + xo;
        let [angle, energy] = flow(x, y, time);

        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const d2 = dx * dx + dy * dy;
        const infl = ps > 0.01 ? ps * Math.exp(-d2 / r2) : 0;
        if (infl > 0.01) {
          // Field lines circle the pointer; blend toward the tangent direction.
          const tangent = Math.atan2(dy, dx) + (Math.PI / 2) * pointer.spin;
          let diff = tangent - angle;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          angle += diff * Math.min(1, infl * 1.6);
        }

        let kick = 0;
        for (const p of pulses) {
          const pd = Math.hypot(x - p.x, y - p.y) - p.r;
          if (pd > -50 && pd < 50) {
            const k = Math.exp(-(pd * pd) / 600) * p.fade;
            if (k > kick) {
              kick = k;
              // The passing pulse points needles straight away from where it started.
              const radial = Math.atan2(y - p.y, x - p.x);
              let diff = radial - angle;
              diff = Math.atan2(Math.sin(diff), Math.cos(diff));
              angle += diff * Math.min(1, k * 1.4);
            }
          }
        }

        const b = Math.min(1, energy * 0.7 + infl * 0.9 + kick);
        const restAlpha = 0.18 * dimFactor;
        if (b < 0.05) {
          dots[Math.min(ALPHA_STEPS - 1, Math.floor(restAlpha * ALPHA_STEPS))].push(x, y);
          continue;
        }

        const len = half * (0.35 + b * 0.85);
        const ux = Math.cos(angle) * len;
        const uy = Math.sin(angle) * len;
        const alpha = (0.12 + b * 0.78) * dimFactor;
        const step = Math.min(ALPHA_STEPS - 1, Math.floor(alpha * ALPHA_STEPS));
        const hot = infl + kick > 0.35 ? 1 : 0;
        lines[hot][step].push(x - ux, y - uy, x + ux, y + uy);
      }
    }

    ctx.clearRect(0, 0, w, h);

    for (let s = 0; s < ALPHA_STEPS; s++) {
      const list = dots[s];
      if (!list.length) continue;
      ctx.fillStyle = `rgba(${colors[0]},${((s + 0.5) / ALPHA_STEPS).toFixed(3)})`;
      ctx.beginPath();
      for (let i = 0; i < list.length; i += 2) ctx.rect(list[i] - 0.75, list[i + 1] - 0.75, 1.5, 1.5);
      ctx.fill();
    }

    for (let k = 0; k < 2; k++) {
      ctx.lineWidth = k ? 2 : 1.5;
      for (let s = 0; s < ALPHA_STEPS; s++) {
        const list = lines[k][s];
        if (!list.length) continue;
        ctx.strokeStyle = `rgba(${colors[k]},${((s + 0.5) / ALPHA_STEPS).toFixed(3)})`;
        ctx.beginPath();
        for (let i = 0; i < list.length; i += 4) {
          ctx.moveTo(list[i], list[i + 1]);
          ctx.lineTo(list[i + 2], list[i + 3]);
        }
        ctx.stroke();
      }
    }
  }

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    if (now - lastFrame < FRAME_MS) return;
    const dt = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;
    time += dt;

    pointer.strength += (pointer.target - pointer.strength) * Math.min(1, dt * 4);
    dimFactor += (dimTarget() - dimFactor) * Math.min(1, dt * 2.5);
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.age += dt;
      p.r = p.age * PULSE_SPEED;
      p.fade = 1 - p.age / PULSE_LIFE;
      if (p.fade <= 0) pulses.splice(i, 1);
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
  const addPulse = (x, y) => {
    if (reduced.matches) return;
    if (pulses.length > 5) pulses.shift();
    pulses.push({ x, y, age: 0, r: 0, fade: 1 });
    pointer.spin = -pointer.spin;  // each click reverses the "current"
  };

  window.addEventListener('pointermove', (e) => move(e.clientX, e.clientY), { passive: true });
  window.addEventListener('pointerdown', (e) => {
    move(e.clientX, e.clientY);
    addPulse(e.clientX, e.clientY);
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
  start();
})();
