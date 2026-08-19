/* Общие инструменты сайта «Численные методы»: SVG-графики, «решение по
 * шагам», перерисовка формул KaTeX после пересчёта, самопроверки. */
'use strict';
window.NM = (function () {
  const NS = 'http://www.w3.org/2000/svg';
  const C = { ink: '#16161a', teal: '#155e75', red: '#b3382e', green: '#1a7f37', gray: '#6b6b74', violet: '#4338ca' };

  /* ---------- формулы ---------- */
  const DELIMS = [
    { left: '$$', right: '$$', display: true },
    { left: '\\(', right: '\\)', display: false },
    { left: '\\[', right: '\\]', display: true },
  ];
  function math(el) {
    if (window.renderMathInElement) {
      try { window.renderMathInElement(el, { delimiters: DELIMS, throwOnError: false }); } catch (e) { /* noop */ }
    } else {
      setTimeout(() => math(el), 250);
    }
  }

  /* ---------- числа ---------- */
  function fmt(v, d) {
    if (!isFinite(v)) return String(v);
    if (d === undefined) d = 4;
    const a = Math.abs(v);
    if (a !== 0 && (a < 1e-3 || a >= 1e6)) return v.toExponential(3).replace('e', '\\cdot 10^{').replace(/\{\+?(-?)0*(\d+)$/, '{$1$2') + '}';
    return String(parseFloat(v.toFixed(d)));
  }
  function fnum(v, d) { // просто число для HTML (не LaTeX)
    if (!isFinite(v)) return String(v);
    if (d === undefined) d = 4;
    const a = Math.abs(v);
    if (a !== 0 && (a < 1e-3 || a >= 1e6)) return v.toExponential(3);
    return String(parseFloat(v.toFixed(d)));
  }

  /* ---------- «решение по шагам» ---------- */
  // steps: массив элементов {h:'заголовок'} либо {f:'формула', s:'подстановка', r:'результат', note:'пояснение'}
  // f/s/r — LaTeX без ограничителей; подстановка серым, результат жирным.
  // Классы блока — nm-steps/nm-step: на сайте «Высшая математика» .steps/.step
  // уже заняты нумерованным разбором типового расчёта.
  function steps(el, title, list) {
    const parts = [];
    if (title) parts.push(`<h4>${title}</h4>`);
    for (const st of list) {
      if (st.h) { parts.push(`<h4>${st.h}</h4>`); continue; }
      if (st.html) { parts.push(st.html); continue; }
      let line = '<div class="nm-step">';
      if (st.f) line += `<span class="s-f">\\(${st.f}\\)</span>`;
      if (st.s) line += ` <span class="s-sub">\\(=${st.s}\\)</span>`;
      if (st.r) line += ` <span class="s-res">\\(=${st.r}\\)</span>`;
      if (st.note) line += `<span class="s-note">${st.note}</span>`;
      line += '</div>';
      parts.push(line);
    }
    el.innerHTML = parts.join('');
    el.classList.add('nm-steps');
    math(el);
  }

  /* ---------- самопроверки ---------- */
  const results = [];
  function check(name, got, want, tol) {
    let ok;
    if (Array.isArray(want)) {
      ok = want.every((w, i) => Math.abs(got[i] - w) <= tol);
    } else {
      ok = Math.abs(got - want) <= tol;
    }
    results.push(ok);
    const g = Array.isArray(got) ? '[' + got.map(v => fnum(v, 6)).join(', ') + ']' : fnum(got, 9);
    const w = Array.isArray(want) ? '[' + want.map(v => fnum(v, 6)).join(', ') + ']' : fnum(want, 9);
    console.log(`[самопроверка] ${name}: получено ${g}, эталон ${w} → ${ok ? 'PASSED' : 'FAILED'}`);
    return ok;
  }
  function checkSummary(pageName) {
    const bad = results.filter(r => !r).length;
    console.log(`[самопроверка] ${pageName}: ${results.length - bad}/${results.length} PASSED${bad ? `, ${bad} FAILED` : ''}`);
  }

  /* ---------- SVG-график ---------- */
  function E(name, attrs, parent) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function niceStep(range, target) {
    const raw = range / (target || 6);
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const m = raw / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  }
  // plot(container, {w,h,xmin,xmax,ymin,ymax,xlab,ylab}) → api
  function plot(el, o) {
    const w = o.w || 560, h = o.h || 360;
    const ml = o.ml || 50, mr = o.mr || 14, mt = o.mt || 12, mb = o.mb || 36;
    el.innerHTML = '';
    const svg = E('svg', { viewBox: `0 0 ${w} ${h}`, class: 'nm-plot' });
    el.appendChild(svg);
    const xmin = o.xmin, xmax = o.xmax, ymin = o.ymin, ymax = o.ymax;
    const X = v => ml + (v - xmin) / (xmax - xmin) * (w - ml - mr);
    const Y = v => h - mb - (v - ymin) / (ymax - ymin) * (h - mt - mb);
    // сетка и оси
    const g = E('g', {}, svg);
    const sx = o.sx || niceStep(xmax - xmin), sy = o.sy || niceStep(ymax - ymin, 5);
    for (let v = Math.ceil(xmin / sx) * sx; v <= xmax + 1e-9; v += sx) {
      E('line', { x1: X(v), y1: Y(ymin), x2: X(v), y2: Y(ymax), stroke: '#ececf1', 'stroke-width': 1 }, g);
      const t = E('text', { x: X(v), y: h - mb + 16, 'text-anchor': 'middle', fill: C.gray, 'font-size': 11.5, 'font-family': 'system-ui' }, g);
      t.textContent = parseFloat(v.toFixed(6));
    }
    for (let v = Math.ceil(ymin / sy) * sy; v <= ymax + 1e-9; v += sy) {
      E('line', { x1: X(xmin), y1: Y(v), x2: X(xmax), y2: Y(v), stroke: '#ececf1', 'stroke-width': 1 }, g);
      const t = E('text', { x: ml - 6, y: Y(v) + 4, 'text-anchor': 'end', fill: C.gray, 'font-size': 11.5, 'font-family': 'system-ui' }, g);
      t.textContent = parseFloat(v.toFixed(6));
    }
    // нулевые оси
    if (ymin < 0 && ymax > 0) E('line', { x1: X(xmin), y1: Y(0), x2: X(xmax), y2: Y(0), stroke: '#b9b9c0', 'stroke-width': 1.2 }, g);
    if (xmin < 0 && xmax > 0) E('line', { x1: X(0), y1: Y(ymin), x2: X(0), y2: Y(ymax), stroke: '#b9b9c0', 'stroke-width': 1.2 }, g);
    E('rect', { x: ml, y: mt, width: w - ml - mr, height: h - mt - mb, fill: 'none', stroke: '#d8d6cf', 'stroke-width': 1 }, svg);
    if (o.xlab) { const t = E('text', { x: w - mr, y: h - 6, 'text-anchor': 'end', fill: C.ink, 'font-size': 13, 'font-style': 'italic', 'font-family': 'Georgia,serif' }, svg); t.textContent = o.xlab; }
    if (o.ylab) { const t = E('text', { x: ml + 4, y: mt + 12, fill: C.ink, 'font-size': 13, 'font-style': 'italic', 'font-family': 'Georgia,serif' }, svg); t.textContent = o.ylab; }
    const clip = E('clipPath', { id: 'clip' + Math.random().toString(36).slice(2, 8) }, svg);
    E('rect', { x: ml, y: mt, width: w - ml - mr, height: h - mt - mb }, clip);
    const layer = E('g', { 'clip-path': `url(#${clip.id})` }, svg);

    const api = {
      svg, X, Y, layer,
      fn(f, opt) {
        opt = opt || {};
        const n = opt.n || 400, pts = [];
        for (let i = 0; i <= n; i++) {
          const x = xmin + (xmax - xmin) * i / n, y = f(x);
          if (isFinite(y)) pts.push(X(x).toFixed(2) + ',' + Y(y).toFixed(2));
        }
        return E('polyline', {
          points: pts.join(' '), fill: 'none', stroke: opt.color || C.ink,
          'stroke-width': opt.width || 2, 'stroke-dasharray': opt.dash || 'none',
          'stroke-linejoin': 'round', opacity: opt.opacity || 1,
        }, layer);
      },
      poly(points, opt) {
        opt = opt || {};
        return E('polyline', {
          points: points.map(p => X(p[0]).toFixed(2) + ',' + Y(p[1]).toFixed(2)).join(' '),
          fill: 'none', stroke: opt.color || C.ink, 'stroke-width': opt.width || 2,
          'stroke-dasharray': opt.dash || 'none', 'stroke-linejoin': 'round', opacity: opt.opacity || 1,
        }, layer);
      },
      pts(points, opt) {
        opt = opt || {};
        for (const p of points) {
          E('circle', {
            cx: X(p[0]), cy: Y(p[1]), r: opt.r || 4, fill: opt.fill || C.ink,
            stroke: opt.stroke || '#fff', 'stroke-width': 1.2,
          }, layer);
        }
      },
      seg(x1, y1, x2, y2, opt) {
        opt = opt || {};
        return E('line', {
          x1: X(x1), y1: Y(y1), x2: X(x2), y2: Y(y2), stroke: opt.color || C.gray,
          'stroke-width': opt.width || 1.4, 'stroke-dasharray': opt.dash || 'none', opacity: opt.opacity || 1,
        }, layer);
      },
      vline(x, opt) { return api.seg(x, ymin, x, ymax, Object.assign({ dash: '5 4' }, opt)); },
      text(x, y, s, opt) {
        opt = opt || {};
        const t = E('text', {
          x: X(x) + (opt.dx || 0), y: Y(y) + (opt.dy || 0), fill: opt.color || C.ink,
          'font-size': opt.size || 12.5, 'font-family': 'system-ui', 'text-anchor': opt.anchor || 'start',
        }, svg);
        t.textContent = s; return t;
      },
      legend(items) {
        const d = document.createElement('div');
        d.className = 'plot-legend';
        d.innerHTML = items.map(it =>
          `<span><span class="sw${it.dash ? ' dash' : ''}" style="border-top-color:${it.c}"></span>${it.t}</span>`).join('');
        el.appendChild(d);
      },
    };
    return api;
  }

  /* ---------- численная алгебра ---------- */
  function gaussSolve(A0, b0) {
    const n = b0.length;
    const M = A0.map((r, i) => [...r, b0[i]]);
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const q = M[r][c] / M[c][c];
        for (let j = c; j <= n; j++) M[r][j] -= q * M[c][j];
      }
    }
    return M.map((r, i) => r[n] / M[i][i]);
  }
  function matmul(A, B) {
    return A.map(r => B[0].map((_, j) => r.reduce((s, v, t) => s + v * B[t][j], 0)));
  }
  function matvec(A, v) { return A.map(r => r.reduce((s, a, j) => s + a * v[j], 0)); }
  function matinv(A0) {
    const n = A0.length;
    const M = A0.map((r, i) => [...r, ...r.map((_, j) => (i === j ? 1 : 0))]);
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      [M[c], M[p]] = [M[p], M[c]];
      const d = M[c][c];
      for (let j = 0; j < 2 * n; j++) M[c][j] /= d;
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const q = M[r][c];
        for (let j = 0; j < 2 * n; j++) M[r][j] -= q * M[c][j];
      }
    }
    return M.map(r => r.slice(n));
  }
  // корни многочлена p(x)=c0+c1 x+...+cn x^n (метод Дюрана — Кернера, комплексно)
  function polyroots(c) {
    const n = c.length - 1;
    const cn = c[n];
    const a = c.map(v => v / cn);
    let z = [];
    for (let i = 0; i < n; i++) {
      const ang = 2 * Math.PI * i / n + 0.4;
      z.push([Math.cos(ang) * 0.9, Math.sin(ang) * 0.9]);
    }
    const cmul = (u, v) => [u[0] * v[0] - u[1] * v[1], u[0] * v[1] + u[1] * v[0]];
    const csub = (u, v) => [u[0] - v[0], u[1] - v[1]];
    const cdiv = (u, v) => { const d = v[0] * v[0] + v[1] * v[1]; return [(u[0] * v[0] + u[1] * v[1]) / d, (u[1] * v[0] - u[0] * v[1]) / d]; };
    const pev = zz => { let r = [a[n], 0]; for (let k = n - 1; k >= 0; k--) r = [r[0] * zz[0] - r[1] * zz[1] + a[k], r[0] * zz[1] + r[1] * zz[0]]; return r; };
    for (let it = 0; it < 300; it++) {
      let move = 0;
      for (let i = 0; i < n; i++) {
        let den = [1, 0];
        for (let j = 0; j < n; j++) if (j !== i) den = cmul(den, csub(z[i], z[j]));
        const d = cdiv(pev(z[i]), den);
        z[i] = csub(z[i], d);
        move = Math.max(move, Math.hypot(d[0], d[1]));
      }
      if (move < 1e-12) break;
    }
    return z.map(v => [Math.abs(v[0]) < 1e-9 ? 0 : v[0], Math.abs(v[1]) < 1e-9 ? 0 : v[1]]);
  }
  // собственные числа через характеристический многочлен (Фаддеев — Леверье)
  function eigenvalues(A) {
    const n = A.length;
    let M = A.map(r => [...r]);
    const c = [1];
    let Mk = A.map((r, i) => r.map((_, j) => (i === j ? 1 : 0)));
    for (let k = 1; k <= n; k++) {
      Mk = matmul(A, Mk);
      const tr = Mk.reduce((s, r, i) => s + r[i], 0);
      const ck = -tr / k;
      c.push(ck);
      for (let i = 0; i < n; i++) Mk[i][i] += ck;
    }
    // c: коэффициенты λ^n + c1 λ^{n-1} + ... ; перевод к возрастающим степеням
    const asc = [];
    for (let k = n; k >= 0; k--) asc.push(c[k]);
    return polyroots(asc);
  }

  /* ---------- RK4 ---------- */
  // векторный РК4: f(t, y[]) → dy[]; возвращает {ts, ys}
  function rk4(f, t0, y0, T, N) {
    const h = (T - t0) / N;
    const ts = [t0], ys = [y0.slice()];
    let t = t0, y = y0.slice();
    const ax = (u, v, c) => u.map((val, i) => val + c * v[i]);
    for (let i = 0; i < N; i++) {
      const k1 = f(t, y);
      const k2 = f(t + h / 2, ax(y, k1, h / 2));
      const k3 = f(t + h / 2, ax(y, k2, h / 2));
      const k4 = f(t + h, ax(y, k3, h));
      y = y.map((val, j) => val + h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
      t += h;
      ts.push(t); ys.push(y.slice());
    }
    return { ts, ys };
  }

  return { C, math, fmt, fnum, steps, check, checkSummary, plot, gaussSolve, matmul, matvec, matinv, polyroots, eigenvalues, rk4, E };
})();
