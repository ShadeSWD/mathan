/* Уравнения и системы: итерации, хорды, СЛАУ, Ньютон. */
'use strict';
(function () {
  /* ---------- предустановленные функции ---------- */
  const FUNCS = [
    {
      tex: 'f(x)=x\\cdot 2^{x}-1',
      f: x => x * Math.pow(2, x) - 1,
      df: x => (x * Math.LN2 + 1) * Math.pow(2, x),
      dfTex: "f'(x)=(x\\ln 2+1)\\,2^{x}",
      a: 0.5, b: 1, plot: [-3, 2],
    },
    {
      tex: 'f(x)=x^{3}-2x-5',
      f: x => x * x * x - 2 * x - 5,
      df: x => 3 * x * x - 2,
      dfTex: "f'(x)=3x^{2}-2",
      a: 2, b: 3, plot: [0, 3.2],
    },
    {
      tex: 'f(x)=\\cos x-x',
      f: x => Math.cos(x) - x,
      df: x => -Math.sin(x) - 1,
      dfTex: "f'(x)=-\\sin x-1",
      a: 0, b: 1, plot: [-1.5, 2],
    },
    {
      tex: 'f(x)=\\ln x+x',
      f: x => Math.log(x) + x,
      df: x => 1 / x + 1,
      dfTex: "f'(x)=\\dfrac{1}{x}+1",
      a: 0.1, b: 1, plot: [0.05, 2],
    },
  ];

  // метод простых итераций: x0 = (a+b)/2, φ(x) = x − f(x)/k
  function simpleIter(F, k, a, b, eps) {
    const rows = [];
    let x0 = (a + b) / 2, x1 = x0 - F.f(x0) / k, m = 1;
    rows.push([m, x0, x1]);
    while (Math.abs(x1 - x0) > eps && m < 200) {
      x0 = x1;
      x1 = x0 - F.f(x0) / k;
      m++;
      rows.push([m, x0, x1]);
    }
    return { root: x1, rows };
  }
  // метод хорд ровно по алгоритму работы (счётчик k1)
  function horda(F, a, b, eps) {
    const chords = [];
    let k1 = 0, c = a;
    for (let guard = 0; guard < 200; guard++) {
      chords.push([a, F.f(a), b, F.f(b)]);
      c = a - F.f(a) / (F.f(b) - F.f(a)) * (b - a);
      a = c;
      if (F.f(a) * F.f(c) < 0) b = c;
      k1++;
      if (Math.abs(F.f(c)) < eps) break;
    }
    return { root: c, n: k1, chords };
  }

  function recalcEq() {
    const F = FUNCS[+$('sel-f').value];
    const eps = parseFloat($('in-eps').value) || 1e-3;
    const k = Math.max(Math.abs(F.df(F.a)), Math.abs(F.df(F.b)));
    const kWork = +$('sel-f').value === 0 ? Math.abs(F.df(F.a)) : k; // в работе взят левый конец
    const si = simpleIter(F, kWork, F.a, F.b, eps);
    const ho = horda(F, F.a, F.b, eps);

    // график
    const [x1, x2] = F.plot;
    let ymin = Infinity, ymax = -Infinity;
    for (let i = 0; i <= 200; i++) {
      const y = F.f(x1 + (x2 - x1) * i / 200);
      if (isFinite(y)) { ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
    }
    ymin = Math.max(ymin, -6); ymax = Math.min(ymax, 6);
    const P = NM.plot($('plot-f'), { w: 620, h: 400, xmin: x1, xmax: x2, ymin: ymin - 0.4, ymax: ymax + 0.4, xlab: 'x', ylab: 'f(x)' });
    // отрезок отделения
    NM.E('rect', {
      x: P.X(F.a), y: 12, width: P.X(F.b) - P.X(F.a), height: 400 - 12 - 36,
      fill: 'rgba(26,127,55,.07)',
    }, P.layer);
    P.fn(F.f, { color: NM.C.teal, width: 2.4 });
    // хорды
    ho.chords.forEach((ch, i) => {
      P.seg(ch[0], ch[1], ch[2], ch[3], { color: NM.C.red, width: 1.3, opacity: 0.35 + 0.6 * i / ho.chords.length });
    });
    P.pts([[ho.root, 0]], { fill: NM.C.red, r: 5 });
    P.legend([
      { c: NM.C.teal, t: 'f(x)' },
      { c: NM.C.red, t: 'хорды и найденный корень' },
      { c: '#7bbf8e', t: 'отрезок отделения [a, b]' },
    ]);

    // таблицы итераций
    let ht = '<table class="nm"><tr><th>m</th><th>xₘ</th><th>xₘ₊₁ = φ(xₘ)</th><th>|Δ|</th></tr>';
    for (const [m, a, b] of si.rows)
      ht += `<tr><td>${m}</td><td>${NM.fnum(a, 5)}</td><td>${NM.fnum(b, 5)}</td><td>${NM.fnum(Math.abs(b - a), 5)}</td></tr>`;
    ht += '</table>';
    ht += '<table class="nm"><tr><th colspan="3">метод хорд</th></tr><tr><th>шаг</th><th>c</th><th>f(c)</th></tr>';
    ho.chords.forEach((ch, i) => {
      const c = ch[0] - ch[1] / (ch[3] - ch[1]) * (ch[2] - ch[0]);
      ht += `<tr><td>${i + 1}</td><td>${NM.fnum(c, 5)}</td><td>${NM.fnum(F.f(c), 6)}</td></tr>`;
    });
    ht += '</table>';
    $('out-iter').innerHTML = ht;
    $('out-root').innerHTML =
      `итерации: корень <b>${NM.fnum(si.root, 4)}</b> за ${si.rows.length} шагов; ` +
      `хорды: корень <b>${NM.fnum(ho.root, 4)}</b> за <b>${ho.n}</b> итераций`;

    NM.steps($('steps-eq'), 'Решение по шагам', [
      { f: F.tex, note: 'корень отделён на отрезке [' + F.a + ', ' + F.b + ']: на концах разные знаки, производная знак не меняет' },
      {
        f: 'f(a),\\;f(b)',
        s: NM.fmt(F.f(F.a), 4) + ',\\;' + NM.fmt(F.f(F.b), 4),
        r: 'f(a)f(b)<0',
      },
      {
        f: 'k=\\bigl|' + F.dfTex.replace(/^f'\(x\)=/, '') + '\\bigr|_{x=' + (+$('sel-f').value === 0 ? F.a : 'a,b') + '}',
        s: NM.fmt(kWork, 4),
        r: NM.fmt(kWork, 3),
        note: +$('sel-f').value === 0
          ? 'в работе k взято на левом конце (1.904), хотя максимум |f′| на правом (3.386) — сходимость сохраняется, меняется лишь её скорость'
          : 'k — максимум |f′| на концах отрезка',
      },
      {
        f: '\\varphi(x)=x-\\dfrac{f(x)}{k},\\qquad x_0=\\dfrac{a+b}{2}',
        s: 'x_0=' + NM.fmt((F.a + F.b) / 2, 3),
        r: 'x^{*}=' + NM.fmt(si.root, 4),
      },
      {
        f: 'c=a-\\dfrac{f(a)}{f(b)-f(a)}(b-a)',
        s: NM.fmt(F.a, 3) + '-\\dfrac{' + NM.fmt(F.f(F.a), 3) + '}{' + NM.fmt(F.f(F.b), 3) + '-(' + NM.fmt(F.f(F.a), 3) + ')}\\cdot' + NM.fmt(F.b - F.a, 3),
        r: NM.fmt(ho.chords.length ? (F.a - F.f(F.a) / (F.f(F.b) - F.f(F.a)) * (F.b - F.a)) : 0, 4),
        note: 'первая хорда; после ' + ho.n + ' итераций |f(c)| < ε',
      },
      {
        f: 'x^{*}',
        s: NM.fmt(ho.root, 5),
        r: NM.fmt(ho.root, 3),
        note: 'проверка: f(x*) = ' + NM.fnum(F.f(ho.root), 6),
      },
    ]);
  }

  /* ---------- СЛАУ ---------- */
  const A0 = [[1.3, -3.2, 1.8, -1.2], [1.1, 2.2, 1.8, -1.4], [0.7, 1.9, -2.2, 1.0], [1.6, -0.8, 2.0, 1.1]];
  const B0 = [1, 2, 0.2, 1.2];
  let A = A0.map(r => r.slice()), B = B0.slice();

  function buildMats() {
    $('mat-A').innerHTML = A.map((r, i) => r.map((v, j) =>
      `<input data-i="${i}" data-j="${j}" value="${v}">`).join('')).join('');
    $('mat-B').innerHTML = B.map((v, i) => `<input data-i="${i}" data-j="-1" value="${v}">`).join('');
    document.querySelectorAll('#mat-A input, #mat-B input').forEach(inp => inp.addEventListener('change', () => {
      const v = parseFloat(inp.value.replace(',', '.'));
      const i = +inp.dataset.i, j = +inp.dataset.j;
      if (!isFinite(v)) { inp.value = j < 0 ? B[i] : A[i][j]; return; }
      if (j < 0) B[i] = v; else A[i][j] = v;
      recalcSlau();
    }));
  }

  function slauAll(A, B) {
    const X = NM.gaussSolve(A, B);
    // метод итераций работы: Φ = ε·A², β = (A⁻¹ − εA)B
    const eps = 1e-4;
    const A2 = NM.matmul(A, A);
    const Phi = A2.map(r => r.map(v => v * eps));
    const D = NM.matinv(A).map((r, i) => r.map((v, j) => v - eps * A[i][j]));
    const beta = NM.matvec(D, B);
    let x0 = beta.slice(), it = 0;
    while (it < 500) {
      const x1 = NM.matvec(Phi, x0).map((v, i) => v + beta[i]);
      const d = Math.hypot(...x1.map((v, i) => v - x0[i]));
      x0 = x1; it++;
      if (d <= eps) break;
    }
    const norm1 = M => Math.max(...M[0].map((_, j) => M.reduce((s, r) => s + Math.abs(r[j]), 0)));
    // Зейдель по работе
    const AT = A[0].map((_, j) => A.map(r => r[j]));
    const AC = NM.matmul(AT, A);
    const BC = NM.matvec(AT, B);
    const n = B.length;
    const LD = AC.map((r, i) => r.map((v, j) => (j > i ? 0 : v)));
    const U = AC.map((r, i) => r.map((v, j) => (j > i ? v : 0)));
    const lsolveL = (L, b) => {
      const x = [];
      for (let i = 0; i < n; i++) {
        let s = b[i];
        for (let j = 0; j < i; j++) s -= L[i][j] * x[j];
        x[i] = s / L[i][i];
      }
      return x;
    };
    let z = BC.slice(), kz = 0;
    while (kz < 2000) {
      const rhs = BC.map((v, i) => v - U[i].reduce((s, a, j) => s + a * z[j], 0));
      const z1 = lsolveL(LD, rhs);
      const e = Math.hypot(...z1.map((v, i) => v - z[i]));
      z = z1; kz++;
      if (e < eps) break;
    }
    return { X, Phi, beta, xIter: x0, it, normPhi: norm1(Phi), norm1A: norm1(A), zeidel: z, kz, AC, BC };
  }

  function recalcSlau() {
    let r;
    try { r = slauAll(A, B); } catch (e) { $('out-slau').textContent = 'матрица вырождена'; return; }
    const v = x => '[' + x.map(t => NM.fnum(t, 4)).join(', ') + ']';
    $('out-slau').innerHTML =
      `матричный метод: X = <b>${v(r.X)}</b><br>` +
      `метод итераций (Φ = εA²): X = <b>${v(r.xIter)}</b> за ${r.it} итераций, ‖Φ‖₁ = <b>${NM.fnum(r.normPhi, 4)}</b><br>` +
      `метод Зейделя (по AᵀA): X = <b>${v(r.zeidel)}</b> за <b>${r.kz}</b> итераций`;
    NM.steps($('steps-slau'), 'Решение по шагам: система 4×4', [
      {
        f: '\\vec x = A^{-1}\\vec B',
        note: 'ранг A равен рангу расширенной матрицы и равен 4 — решение существует и единственно',
      },
      {
        f: '\\vec x',
        s: '\\begin{pmatrix}' + r.X.map(t => NM.fmt(t, 4)).join('\\\\').replace(/\\cdot 10\^\{[^}]*\}/g, m => m) + '\\end{pmatrix}',
        r: '\\begin{pmatrix}' + r.X.map(t => NM.fmt(t, 3)).join('\\\\') + '\\end{pmatrix}',
      },
      {
        f: '\\Phi=\\varepsilon A^{2},\\quad \\lVert\\Phi\\rVert_1',
        s: NM.fmt(r.normPhi, 5),
        r: NM.fmt(r.normPhi, 3),
        note: 'норма много меньше единицы — итерации xₘ₊₁ = Φxₘ + β сходятся за ' + r.it + ' шага(ов); для сравнения ‖A‖₁ = ' + NM.fnum(r.norm1A, 2),
      },
      {
        f: 'L_D\\vec x_{m+1}=-U\\vec x_m+A^{\\mathsf T}\\vec B',
        r: 'k=' + r.kz,
        note: 'метод Зейделя по симметризованной системе; сходимость гарантирована положительной определённостью AᵀA, но медленнее — число обусловленности возводится в квадрат',
      },
    ]);
  }

  /* ---------- нелинейная система ---------- */
  const Fsys = (x, y) => [Math.cos(x - 1) + y - 0.5, x - Math.cos(y) - 3];
  function newtonSys(x0, y0, eps) {
    // модифицированный Ньютон: якобиан в начальной точке
    const J = [[-Math.sin(x0 - 1), 1], [1, Math.sin(y0)]];
    const Ji = NM.matinv(J);
    const path = [[x0, y0]];
    let X = [x0, y0], it = 0;
    while (it < 500) {
      const Fv = Fsys(X[0], X[1]);
      const dx = [-(Ji[0][0] * Fv[0] + Ji[0][1] * Fv[1]), -(Ji[1][0] * Fv[0] + Ji[1][1] * Fv[1])];
      X = [X[0] + dx[0], X[1] + dx[1]];
      path.push(X.slice());
      it++;
      if (Math.max(Math.abs(dx[0]), Math.abs(dx[1])) < eps) break;
    }
    return { X, it, path };
  }

  function drawSys() {
    const ns = newtonSys(1, 1, 1e-4);
    const P = NM.plot($('plot-sys'), { w: 560, h: 420, xmin: 0, xmax: 5, ymin: -1, ymax: 3, xlab: 'x', ylab: 'y' });
    // кривая 1: y = 0.5 − cos(x−1)
    P.fn(x => 0.5 - Math.cos(x - 1), { color: NM.C.teal, width: 2.2 });
    // кривая 2: x = 3 + cos(y) → параметрически по y
    const pts2 = [];
    for (let y = -1; y <= 3; y += 0.02) pts2.push([3 + Math.cos(y), y]);
    P.poly(pts2, { color: NM.C.red, width: 2.2 });
    P.poly(ns.path, { color: NM.C.green, width: 1.6, dash: '3 3' });
    P.pts(ns.path.slice(0, 1), { fill: NM.C.gray, r: 4 });
    P.pts([ns.X], { fill: NM.C.green, r: 5.5 });
    P.legend([
      { c: NM.C.teal, t: 'cos(x−1) + y = 0.5' },
      { c: NM.C.red, t: 'x − cos y = 3' },
      { c: NM.C.green, t: 'путь итераций Ньютона', dash: 1 },
    ]);
    let ht = '<table class="nm"><tr><th>m</th><th>x</th><th>y</th></tr>';
    const show = ns.path.length > 8
      ? [...ns.path.slice(0, 4).entries()].concat([[ns.path.length - 2, ns.path[ns.path.length - 2]], [ns.path.length - 1, ns.path[ns.path.length - 1]]])
      : [...ns.path.entries()];
    let prev = -1;
    for (const [i, p] of show) {
      if (i - prev > 1) ht += '<tr><td colspan="3">⋮</td></tr>';
      ht += `<tr><td>${i}</td><td>${NM.fnum(p[0], 5)}</td><td>${NM.fnum(p[1], 5)}</td></tr>`;
      prev = i;
    }
    ht += '</table>';
    $('out-newton').innerHTML = ht;
    $('out-newton-res').innerHTML = `решение: (x, y) = (<b>${NM.fnum(ns.X[0], 3)}</b>, <b>${NM.fnum(ns.X[1], 3)}</b>) за ${ns.it} итераций`;

    NM.steps($('steps-newton'), 'Решение по шагам: метод Ньютона для системы', [
      {
        f: 'W(x,y)=\\begin{pmatrix}-\\sin(x-1)&1\\\\ 1&\\sin y\\end{pmatrix}',
        note: 'матрица Якоби; в модифицированном методе вычисляется один раз в начальной точке (1, 1)',
      },
      {
        f: 'W(1,1)',
        s: '\\begin{pmatrix}0&1\\\\ 1&' + NM.fmt(Math.sin(1), 4) + '\\end{pmatrix}',
        r: '\\det W=' + NM.fmt(-1, 0),
      },
      {
        f: '\\vec x_{m+1}=\\vec x_m-W^{-1}\\vec F(\\vec x_m)',
        s: '\\vec x_1=(' + NM.fmt(ns.path[1][0], 4) + ',\\;' + NM.fmt(ns.path[1][1], 4) + ')',
        r: '\\vec x^{*}=(' + NM.fmt(ns.X[0], 3) + ',\\;' + NM.fmt(ns.X[1], 3) + ')',
        note: 'сходимость линейная (якобиан заморожен), поэтому итераций заметно больше, чем у «полного» Ньютона',
      },
    ]);
  }

  /* ---------- события и старт ---------- */
  $('sel-f').addEventListener('change', recalcEq);
  $('in-eps').addEventListener('input', recalcEq);
  $('btn-slau-reset').addEventListener('click', () => {
    A = A0.map(r => r.slice()); B = B0.slice(); buildMats(); recalcSlau();
  });
  recalcEq();
  buildMats();
  recalcSlau();
  drawSys();

  /* ---------- самопроверки ---------- */
  (function selfcheck() {
    const F = FUNCS[0];
    const ho = horda(F, 0.5, 1, 0.001);
    NM.check('метод хорд: корень (работа: 0.641)', ho.root, 0.641, 1e-3);
    NM.check('метод хорд: число итераций (работа: 4)', ho.n, 4, 0);
    NM.check('f(0.641) (работа: −4.184·10⁻⁴)', F.f(0.641), -4.184e-4, 1e-6);
    const si = simpleIter(F, Math.abs(F.df(0.5)), 0.5, 1.5, 0.001);
    NM.check('простые итерации: корень 0.641', si.root, 0.641, 1e-3);
    NM.check('k = f′(0.5) (работа: 1.904)', Math.abs(F.df(0.5)), 1.904, 1e-3);
    const r = slauAll(A0, B0);
    NM.check('СЛАУ, матричный метод (работа: 0.7512, 0.2040, 0.2141, −0.2425)',
      r.X, [0.7512, 0.2040, 0.2141, -0.2425], 5e-4);
    NM.check('‖Φ‖₁ (работа: 0.002)', r.normPhi, 0.002, 1e-3);
    NM.check('‖A‖₁ (работа: 8.1)', r.norm1A, 8.1, 1e-6);
    NM.check('Зейдель: число итераций (работа: 23)', r.kz, 23, 0);
    NM.check('Зейдель: решение', r.zeidel, [0.751, 0.204, 0.214, -0.242], 5e-3);
    const ns = newtonSys(1, 1, 1e-4);
    NM.check('нелинейная система (работа: 3.356, 1.207)', ns.X, [3.356, 1.207], 1e-3);
    NM.checkSummary('страница «Уравнения»');
  })();
})();
