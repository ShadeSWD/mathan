/* Живые построения курса «Высшая математика».
 * Четыре независимых виджета; каждый включается, если на странице есть
 * контейнер с соответствующим id, и целиком строит свою разметку сам:
 *   #ia-secant   — секущая, переходящая в касательную;
 *   #ia-riemann  — сумма Римана при росте числа отрезков;
 *   #ia-series   — частичные суммы числового ряда;
 *   #ia-dirfield — поле направлений и решение задачи Коши.
 * Общая палитра: #16161a, #155e75, #b3382e, #1a7f37, #6b6b74. */
'use strict';
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const INK = '#16161a', BLUE = '#155e75', RED = '#b3382e',
    GREEN = '#1a7f37', GRAY = '#6b6b74';
  const LBL = 'font:11px system-ui,sans-serif;';

  function el(tag, attrs, text) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }
  function label(x, y, t, color, extra) {
    return el('text', {
      x: x, y: y,
      style: LBL + 'fill:' + (color || GRAY) + ';' + (extra || ''),
    }, t);
  }
  function num(v, d) {
    if (!isFinite(v)) return '—';
    return v.toFixed(d == null ? 3 : d).replace('.', ',');
  }
  /* Линейное отображение мира в экран. */
  function mapper(box, xr, yr) {
    const kx = (box.x1 - box.x0) / (xr[1] - xr[0]);
    const ky = (box.y1 - box.y0) / (yr[1] - yr[0]);
    return {
      X: (x) => box.x0 + (x - xr[0]) * kx,
      Y: (y) => box.y1 - (y - yr[0]) * ky,
      xr: xr, yr: yr, box: box,
    };
  }
  /* Оси со стрелками и подписями делений. */
  function axes(g, m, opts) {
    const o = opts || {};
    const b = m.box;
    const y0 = m.yr[0] <= 0 && m.yr[1] >= 0 ? m.Y(0) : b.y1;
    const x0 = m.xr[0] <= 0 && m.xr[1] >= 0 ? m.X(0) : b.x0;
    g.appendChild(el('rect', {
      x: b.x0, y: b.y0, width: b.x1 - b.x0, height: b.y1 - b.y0,
      fill: '#fcfdfd', stroke: '#e4e8e7',
    }));
    (o.gridX || []).forEach((v) => g.appendChild(el('line', {
      x1: m.X(v), y1: b.y0, x2: m.X(v), y2: b.y1,
      stroke: '#e8ecec', 'stroke-width': 1,
    })));
    (o.gridY || []).forEach((v) => g.appendChild(el('line', {
      x1: b.x0, y1: m.Y(v), x2: b.x1, y2: m.Y(v),
      stroke: '#e8ecec', 'stroke-width': 1,
    })));
    g.appendChild(el('line', {
      x1: b.x0, y1: y0, x2: b.x1 + 6, y2: y0, stroke: INK, 'stroke-width': 1.4,
    }));
    g.appendChild(el('line', {
      x1: x0, y1: b.y1, x2: x0, y2: b.y0 - 6, stroke: INK, 'stroke-width': 1.4,
    }));
    g.appendChild(el('path', {
      d: 'M' + (b.x1 + 6) + ' ' + y0 + ' l -7 -3.5 v 7 z', fill: INK,
    }));
    g.appendChild(el('path', {
      d: 'M' + x0 + ' ' + (b.y0 - 6) + ' l -3.5 7 h 7 z', fill: INK,
    }));
    g.appendChild(label(b.x1 - 2, y0 + 16, o.xname || 'x', INK, 'font-style:italic'));
    g.appendChild(label(x0 + 7, b.y0 - 2, o.yname || 'y', INK, 'font-style:italic'));
    (o.ticksX || []).forEach((v) => {
      g.appendChild(el('line', {
        x1: m.X(v), y1: y0 - 3, x2: m.X(v), y2: y0 + 3, stroke: INK, 'stroke-width': 1,
      }));
      g.appendChild(label(m.X(v) - 4, y0 + 15, String(v).replace('.', ','), GRAY));
    });
    (o.ticksY || []).forEach((v) => {
      g.appendChild(el('line', {
        x1: x0 - 3, y1: m.Y(v), x2: x0 + 3, y2: m.Y(v), stroke: INK, 'stroke-width': 1,
      }));
      g.appendChild(label(x0 - 24, m.Y(v) + 4, String(v).replace('.', ','), GRAY));
    });
  }
  function curve(m, f, n, x0, x1) {
    const a = x0 == null ? m.xr[0] : x0, b = x1 == null ? m.xr[1] : x1;
    let d = '';
    for (let i = 0; i <= n; i++) {
      const x = a + (b - a) * i / n, y = f(x);
      if (!isFinite(y)) { d += ''; continue; }
      const yy = Math.max(m.yr[0], Math.min(m.yr[1], y));
      d += (d ? 'L' : 'M') + m.X(x).toFixed(2) + ' ' + m.Y(yy).toFixed(2) + ' ';
    }
    return d;
  }
  /* Панель управления: подписанные ползунки, кнопки, строка результата. */
  function shell(host, title, hint) {
    host.classList.add('panel', 'live');
    host.innerHTML = '';
    const h = document.createElement('div');
    h.className = 'st-title';
    h.textContent = title;
    host.appendChild(h);
    if (hint) {
      const p = document.createElement('div');
      p.className = 'hint';
      p.textContent = hint;
      host.appendChild(p);
    }
    const svg = el('svg', {
      viewBox: '0 0 640 340', class: 'geo-board', style: 'max-width:640px',
    });
    host.appendChild(svg);
    const ctl = document.createElement('div');
    ctl.className = 'controls';
    host.appendChild(ctl);
    const out = document.createElement('div');
    out.className = 'out';
    host.appendChild(out);
    return { svg: svg, ctl: ctl, out: out };
  }
  function slider(ctl, text, min, max, step, val, onIn) {
    const l = document.createElement('label');
    l.append(text + ' ');
    const i = document.createElement('input');
    i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = val;
    const r = document.createElement('span');
    r.className = 'readout';
    l.appendChild(i); l.append(' '); l.appendChild(r);
    ctl.appendChild(l);
    i.addEventListener('input', onIn);
    return { input: i, read: r, get value() { return parseFloat(i.value); } };
  }
  function button(ctl, text, onClick) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn'; b.textContent = text;
    b.addEventListener('click', onClick);
    ctl.appendChild(b);
    return b;
  }
  function picker(ctl, text, items, onCh) {
    const l = document.createElement('label');
    l.append(text + ' ');
    const s = document.createElement('select');
    items.forEach((it, i) => {
      const o = document.createElement('option');
      o.value = String(i); o.textContent = it.t;
      s.appendChild(o);
    });
    l.appendChild(s); ctl.appendChild(l);
    s.addEventListener('change', onCh);
    return s;
  }

  /* ================= 1. Секущая → касательная ================= */
  function secant(host) {
    const f = (x) => 0.25 * x * x + 0.5;
    const df = (x) => 0.5 * x;
    const x0 = 2, y0 = f(x0), k0 = df(x0);
    const ui = shell(host, 'Секущая, переходящая в касательную',
      'Уменьшайте приращение Δx: угловой коэффициент секущей, проведённой через '
      + 'точки (x₀, f(x₀)) и (x₀+Δx, f(x₀+Δx)), стремится к производной f′(x₀).');
    const m = mapper({ x0: 46, y0: 16, x1: 610, y1: 292 }, [-0.6, 6], [-0.4, 9.6]);
    const sH = slider(ui.ctl, 'приращение Δx:', 0.02, 3, 0.01, 3, draw);
    let timer = null;
    const anim = button(ui.ctl, 'Устремить Δx → 0', () => {
      if (timer) { clearInterval(timer); timer = null; anim.textContent = 'Устремить Δx → 0'; return; }
      anim.textContent = 'Остановить';
      timer = setInterval(() => {
        const v = parseFloat(sH.input.value) * 0.93;
        if (v <= 0.02) {
          sH.input.value = 0.02; draw();
          clearInterval(timer); timer = null; anim.textContent = 'Устремить Δx → 0';
          return;
        }
        sH.input.value = v; draw();
      }, 70);
    });
    button(ui.ctl, 'Сброс', () => {
      if (timer) { clearInterval(timer); timer = null; anim.textContent = 'Устремить Δx → 0'; }
      sH.input.value = 3; draw();
    });
    function draw() {
      const h = sH.value;
      const x1 = x0 + h, y1 = f(x1);
      const k = (y1 - y0) / h;
      while (ui.svg.firstChild) ui.svg.removeChild(ui.svg.firstChild);
      const g = el('g', {});
      ui.svg.appendChild(g);
      axes(g, m, {
        ticksX: [1, 2, 3, 4, 5], ticksY: [2, 4, 6, 8],
        gridX: [1, 2, 3, 4, 5], gridY: [2, 4, 6, 8],
      });
      g.appendChild(el('path', {
        d: curve(m, f, 200, -0.6, 6), fill: 'none', stroke: INK, 'stroke-width': 2,
      }));
      g.appendChild(label(m.X(5.05), m.Y(f(5.05)) - 8, 'y = x²/4 + 1/2', INK));
      /* приращения */
      g.appendChild(el('line', {
        x1: m.X(x0), y1: m.Y(y0), x2: m.X(x1), y2: m.Y(y0),
        stroke: GRAY, 'stroke-width': 1, 'stroke-dasharray': '4 3',
      }));
      g.appendChild(el('line', {
        x1: m.X(x1), y1: m.Y(y0), x2: m.X(x1), y2: m.Y(y1),
        stroke: GRAY, 'stroke-width': 1, 'stroke-dasharray': '4 3',
      }));
      if (h > 0.35) {
        g.appendChild(label((m.X(x0) + m.X(x1)) / 2 - 8, m.Y(y0) + 15, 'Δx', GRAY));
        g.appendChild(label(m.X(x1) + 5, (m.Y(y0) + m.Y(y1)) / 2, 'Δy', GRAY));
      }
      /* касательная */
      const tan = (x) => y0 + k0 * (x - x0);
      g.appendChild(el('line', {
        x1: m.X(-0.6), y1: m.Y(tan(-0.6)), x2: m.X(6), y2: m.Y(tan(6)),
        stroke: GREEN, 'stroke-width': 2, 'stroke-dasharray': '7 4',
      }));
      g.appendChild(label(m.X(4.7), m.Y(tan(4.7)) + 16, 'касательная, k = f′(x₀) = 1', GREEN));
      /* секущая */
      const sec = (x) => y0 + k * (x - x0);
      g.appendChild(el('line', {
        x1: m.X(-0.6), y1: m.Y(sec(-0.6)), x2: m.X(6), y2: m.Y(sec(6)),
        stroke: RED, 'stroke-width': 2,
      }));
      g.appendChild(label(m.X(0.1), m.Y(sec(0.1)) - 9, 'секущая', RED));
      g.appendChild(el('circle', { cx: m.X(x0), cy: m.Y(y0), r: 4.5, fill: INK }));
      g.appendChild(el('circle', { cx: m.X(x1), cy: m.Y(y1), r: 4.5, fill: RED }));
      g.appendChild(label(m.X(x0) - 30, m.Y(y0) + 18, 'x₀ = 2', INK));
      g.appendChild(label(46, 318, 'чем меньше Δx, тем ближе красная прямая к зелёной', GRAY));
      ui.out.innerHTML = 'Δx = <b>' + num(h, 3) + '</b> · Δy = <b>' + num(y1 - y0, 3)
        + '</b> · k<sub>сек</sub> = Δy/Δx = <b>' + num(k, 3)
        + '</b> · f′(x₀) = <b>1,000</b> · расхождение <b>' + num(Math.abs(k - k0), 3) + '</b>';
      sH.read.textContent = num(h, 2);
    }
    draw();
  }

  /* ================= 2. Сумма Римана ================= */
  function riemann(host) {
    const f = (x) => 4 - x * x / 4;
    const A = 0, B = 3.6;
    const exact = 4 * B - B * B * B / 12;   /* ∫(4 − x²/4)dx = 4x − x³/12 */
    const ui = shell(host, 'Сумма Римана: от ступенек к площади',
      'Отрезок [0; 3,6] делится на n частей. Площадь ступенчатой фигуры — '
      + 'интегральная сумма; при n → ∞ она сходится к определённому интегралу.');
    const m = mapper({ x0: 46, y0: 16, x1: 610, y1: 288 }, [-0.3, 4], [-0.3, 4.6]);
    const modes = [{ t: 'по левым концам', p: 0 }, { t: 'по правым концам', p: 1 },
      { t: 'по серединам', p: 0.5 }];
    const sN = slider(ui.ctl, 'число отрезков n:', 1, 60, 1, 4, draw);
    const sel = picker(ui.ctl, 'точки выборки:', modes, draw);
    button(ui.ctl, 'n = 60', () => { sN.input.value = 60; draw(); });
    button(ui.ctl, 'Сброс', () => { sN.input.value = 4; sel.value = '0'; draw(); });
    function draw() {
      const n = Math.round(sN.value), p = modes[parseInt(sel.value, 10)].p;
      const dx = (B - A) / n;
      let S = 0;
      while (ui.svg.firstChild) ui.svg.removeChild(ui.svg.firstChild);
      const g = el('g', {});
      ui.svg.appendChild(g);
      axes(g, m, {
        ticksX: [1, 2, 3], ticksY: [1, 2, 3, 4],
        gridX: [1, 2, 3], gridY: [1, 2, 3, 4],
      });
      const bars = el('g', {});
      g.appendChild(bars);
      for (let i = 0; i < n; i++) {
        const xa = A + i * dx, xi = xa + p * dx, h = f(xi);
        S += h * dx;
        bars.appendChild(el('rect', {
          x: m.X(xa), y: m.Y(h), width: Math.max(0.4, m.X(xa + dx) - m.X(xa)),
          height: m.Y(0) - m.Y(h), fill: 'rgba(21,94,117,.13)',
          stroke: BLUE, 'stroke-width': n > 30 ? 0.5 : 1,
        }));
      }
      g.appendChild(el('path', {
        d: curve(m, f, 220, -0.3, 4), fill: 'none', stroke: INK, 'stroke-width': 2,
      }));
      g.appendChild(label(m.X(0.15), m.Y(4.35), 'y = 4 − x²/4', INK));
      g.appendChild(el('line', {
        x1: m.X(B), y1: m.Y(0), x2: m.X(B), y2: m.Y(f(B)),
        stroke: RED, 'stroke-width': 1.6, 'stroke-dasharray': '5 4',
      }));
      g.appendChild(label(m.X(B) - 8, m.Y(0) + 16, 'b', RED, 'font-style:italic'));
      g.appendChild(label(m.X(A) + 4, m.Y(0) + 16, 'a', RED, 'font-style:italic'));
      g.appendChild(label(46, 312,
        'шаг Δx = (b − a)/n = ' + num(dx, 3) + '; сумма площадей прямоугольников', GRAY));
      g.appendChild(label(46, 328,
        'точная площадь криволинейной трапеции = ' + num(exact, 4), GRAY));
      ui.out.innerHTML = 'n = <b>' + n + '</b> · S<sub>n</sub> = <b>' + num(S, 4)
        + '</b> · интеграл = <b>' + num(exact, 4) + '</b> · погрешность = <b>'
        + num(Math.abs(S - exact), 4) + '</b> ('
        + num(100 * Math.abs(S - exact) / exact, 2) + ' %)';
      sN.read.textContent = String(n);
    }
    draw();
  }

  /* ================= 3. Частичные суммы ряда ================= */
  function series(host) {
    const list = [
      { t: '∑ 1/n²  (сходится к π²/6)', a: (n) => 1 / (n * n), L: Math.PI * Math.PI / 6,
        yr: [0, 2], ticks: [0.5, 1, 1.5, 2], lname: 'π²/6 ≈ 1,6449' },
      { t: '∑ (−1)ⁿ⁺¹/n  (сходится к ln 2)', a: (n) => (n % 2 ? 1 : -1) / n, L: Math.LN2,
        yr: [0, 1.1], ticks: [0.25, 0.5, 0.75, 1], lname: 'ln 2 ≈ 0,6931' },
      { t: '∑ 1/2ⁿ  (сходится к 1)', a: (n) => Math.pow(0.5, n), L: 1,
        yr: [0, 1.2], ticks: [0.25, 0.5, 0.75, 1], lname: 'сумма = 1' },
      { t: '∑ 1/n  (гармонический, расходится)', a: (n) => 1 / n, L: null,
        yr: [0, 5.5], ticks: [1, 2, 3, 4, 5], lname: 'предела нет' },
    ];
    const ui = shell(host, 'Частичные суммы ряда',
      'Точка с номером N — частичная сумма S_N = a₁ + … + a_N. Сходимость ряда '
      + 'означает, что последовательность этих точек имеет конечный предел.');
    const sN = slider(ui.ctl, 'число слагаемых N:', 1, 80, 1, 20, draw);
    const sel = picker(ui.ctl, 'ряд:', list, draw);
    button(ui.ctl, 'N = 80', () => { sN.input.value = 80; draw(); });
    function draw() {
      const it = list[parseInt(sel.value, 10)], N = Math.round(sN.value);
      const m = mapper({ x0: 46, y0: 16, x1: 610, y1: 286 }, [0, 82], it.yr);
      while (ui.svg.firstChild) ui.svg.removeChild(ui.svg.firstChild);
      const g = el('g', {});
      ui.svg.appendChild(g);
      axes(g, m, {
        ticksX: [20, 40, 60, 80], ticksY: it.ticks, gridX: [20, 40, 60, 80],
        gridY: it.ticks, xname: 'N', yname: 'S',
      });
      if (it.L != null) {
        g.appendChild(el('line', {
          x1: m.X(0), y1: m.Y(it.L), x2: m.X(82), y2: m.Y(it.L),
          stroke: GREEN, 'stroke-width': 1.8, 'stroke-dasharray': '7 4',
        }));
        g.appendChild(label(m.X(50), m.Y(it.L) - 7, it.lname, GREEN));
      } else {
        g.appendChild(label(m.X(30), m.Y(it.yr[1] * 0.35), it.lname, RED));
      }
      let S = 0, d = '';
      const pts = el('g', {});
      for (let n = 1; n <= 80; n++) {
        S += it.a(n);
        if (n > N) continue;
        const yy = Math.max(it.yr[0], Math.min(it.yr[1], S));
        d += (d ? 'L' : 'M') + m.X(n).toFixed(2) + ' ' + m.Y(yy).toFixed(2) + ' ';
        if (N <= 40 || n === N) {
          pts.appendChild(el('circle', {
            cx: m.X(n), cy: m.Y(yy), r: n === N ? 4.5 : 2.6,
            fill: n === N ? RED : BLUE,
          }));
        }
      }
      g.appendChild(el('path', { d: d, fill: 'none', stroke: BLUE, 'stroke-width': 1.6 }));
      g.appendChild(pts);
      let SN = 0;
      for (let n = 1; n <= N; n++) SN += it.a(n);
      g.appendChild(label(46, 310, 'красная точка — текущая частичная сумма S_N', GRAY));
      g.appendChild(label(46, 326, it.L != null
        ? 'зелёная линия — сумма ряда; остаток r_N = S − S_N убывает'
        : 'частичные суммы неограниченно растут: ряд расходится', GRAY));
      ui.out.innerHTML = 'N = <b>' + N + '</b> · S<sub>N</sub> = <b>' + num(SN, 5) + '</b>'
        + (it.L != null
          ? ' · сумма ряда = <b>' + num(it.L, 5) + '</b> · остаток |r<sub>N</sub>| = <b>'
            + num(Math.abs(it.L - SN), 5) + '</b>'
          : ' · сумма ряда не существует');
      sN.read.textContent = String(N);
    }
    draw();
  }

  /* ================= 4. Поле направлений и задача Коши ================= */
  function dirfield(host) {
    const eqs = [
      { t: 'y′ = x − y', f: (x, y) => x - y,
        exact: (x0, y0) => (x) => (x - 1) + (y0 - x0 + 1) * Math.exp(x0 - x),
        note: 'линейное; общее решение y = x − 1 + C·e^{−x}' },
      { t: 'y′ = y (1 − y)', f: (x, y) => y * (1 - y), exact: null,
        note: 'логистическое; равновесия y = 0 и y = 1' },
      { t: 'y′ = −0,7 y', f: (x, y) => -0.7 * y,
        exact: (x0, y0) => (x) => y0 * Math.exp(-0.7 * (x - x0)),
        note: 'затухание; решение y = y₀·e^{−0,7(x−x₀)}' },
    ];
    const ui = shell(host, 'Поле направлений и решение задачи Коши',
      'Каждый штрих показывает наклон y′, предписанный уравнением в этой точке. '
      + 'Интегральная кривая идёт «по штрихам» из выбранной начальной точки.');
    const xr = [-0.4, 5], yr = [-2.2, 3.2];
    const m = mapper({ x0: 46, y0: 16, x1: 610, y1: 286 }, xr, yr);
    const sY = slider(ui.ctl, 'начальное значение y(0):', -2, 3, 0.05, 2, draw);
    const sel = picker(ui.ctl, 'уравнение:', eqs, draw);
    button(ui.ctl, 'Сброс', () => { sY.input.value = 2; sel.value = '0'; draw(); });
    function rk4(f, x0, y0, x1, n) {
      const h = (x1 - x0) / n;
      let x = x0, y = y0, d = 'M' + m.X(x).toFixed(2) + ' ' + m.Y(y).toFixed(2) + ' ';
      for (let i = 0; i < n; i++) {
        const k1 = f(x, y), k2 = f(x + h / 2, y + h * k1 / 2),
          k3 = f(x + h / 2, y + h * k2 / 2), k4 = f(x + h, y + h * k3);
        y += h * (k1 + 2 * k2 + 2 * k3 + k4) / 6;
        x += h;
        if (!isFinite(y)) break;
        if (y > yr[1] + 1 || y < yr[0] - 1) { d += 'L' + m.X(x).toFixed(2) + ' ' + m.Y(y > 0 ? yr[1] : yr[0]).toFixed(2) + ' '; break; }
        d += 'L' + m.X(x).toFixed(2) + ' ' + m.Y(y).toFixed(2) + ' ';
      }
      return { d: d, y: y, x: x };
    }
    function draw() {
      const eq = eqs[parseInt(sel.value, 10)], y0 = sY.value;
      while (ui.svg.firstChild) ui.svg.removeChild(ui.svg.firstChild);
      const g = el('g', {});
      ui.svg.appendChild(g);
      axes(g, m, {
        ticksX: [1, 2, 3, 4, 5], ticksY: [-2, -1, 1, 2, 3],
        gridX: [1, 2, 3, 4, 5], gridY: [-2, -1, 1, 2, 3],
      });
      const field = el('g', {});
      g.appendChild(field);
      const L = 13;
      for (let i = 0; i <= 22; i++) {
        for (let j = 0; j <= 14; j++) {
          const x = xr[0] + (xr[1] - xr[0]) * i / 22;
          const y = yr[0] + (yr[1] - yr[0]) * j / 14;
          const s = eq.f(x, y);
          if (!isFinite(s)) continue;
          const a = Math.atan(s);
          const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2;
          const cx = m.X(x), cy = m.Y(y);
          field.appendChild(el('line', {
            x1: cx - dx, y1: cy + dy, x2: cx + dx, y2: cy - dy,
            stroke: GRAY, 'stroke-width': 1, opacity: 0.75,
          }));
        }
      }
      const sol = rk4(eq.f, 0, y0, 5, 500);
      const back = rk4(eq.f, 0, y0, -0.4, 60);
      g.appendChild(el('path', { d: back.d, fill: 'none', stroke: RED, 'stroke-width': 1.6, 'stroke-dasharray': '5 4' }));
      g.appendChild(el('path', { d: sol.d, fill: 'none', stroke: RED, 'stroke-width': 2.4 }));
      /* соседние кривые семейства — бледнее */
      [-1.2, -0.6, 0.6, 1.2].forEach((s) => {
        const yy = y0 + s;
        if (yy < yr[0] || yy > yr[1]) return;
        g.appendChild(el('path', {
          d: rk4(eq.f, 0, yy, 5, 300).d, fill: 'none', stroke: BLUE,
          'stroke-width': 1.2, opacity: 0.45,
        }));
      });
      g.appendChild(el('circle', { cx: m.X(0), cy: m.Y(y0), r: 5, fill: RED }));
      g.appendChild(label(m.X(0) + 8, m.Y(y0) - 8, 'начальная точка (0; ' + num(y0, 2) + ')', RED));
      g.appendChild(label(46, 310, eq.note, GRAY));
      g.appendChild(label(46, 326,
        'красная кривая — решение задачи Коши; синие — соседние решения семейства', GRAY));
      let s = 'y(0) = <b>' + num(y0, 2) + '</b> · y(5) ≈ <b>' + num(sol.y, 4) + '</b>';
      if (eq.exact) {
        const ex = eq.exact(0, y0)(5);
        s += ' · точное значение <b>' + num(ex, 4) + '</b> · расхождение <b>'
          + num(Math.abs(ex - sol.y), 6) + '</b>';
      }
      ui.out.innerHTML = s;
      sY.read.textContent = num(y0, 2);
    }
    draw();
  }

  const boot = () => {
    const map = {
      'ia-secant': secant, 'ia-riemann': riemann,
      'ia-series': series, 'ia-dirfield': dirfield,
    };
    for (const id in map) {
      const host = document.getElementById(id);
      if (host) {
        try { map[id](host); } catch (e) { /* виджет не должен ронять страницу */ }
      }
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
