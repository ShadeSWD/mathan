/* Интегрирование: Симпсон + Рунге, Гаусс — Лежандр (7 узлов), связь с P₇. */
'use strict';
(function () {
  const FUNCS = [
    { f: x => x * x / (2 + Math.sin(x)), a: 0, b: 2, exact: 0.912974165925866 },
    { f: x => 4 / (1 + x * x), a: 0, b: 1, exact: Math.PI },
    { f: x => Math.sin(x), a: 0, b: Math.PI, exact: 2 },
    { f: x => Math.exp(-x * x), a: 0, b: 1, exact: 0.7468241328124271 },
  ];

  // simpson() и legP() — в common.js
  function legProots(n) {
    // корни P_n бисекцией по мелкой сетке (плюс точный ноль при нечётном n)
    const roots = [];
    const N = 2000;
    let prev = legP(n, -1 + 1e-12);
    for (let i = 1; i <= N; i++) {
      const x = -1 + 2 * i / N;
      const v = legP(n, x);
      if (prev === 0) roots.push(-1 + 2 * (i - 1) / N);
      else if (prev * v < 0) {
        let a = -1 + 2 * (i - 1) / N, b = x;
        for (let it = 0; it < 80; it++) {
          const m = (a + b) / 2;
          if (legP(n, a) * legP(n, m) <= 0) b = m; else a = m;
        }
        roots.push((a + b) / 2);
      }
      prev = v;
    }
    return roots.map(r => (Math.abs(r) < 1e-12 ? 0 : r));
  }
  function legWeights(n, roots) {
    // A_i = 2 / ((1 - t²) P'ₙ(t)²), производная по рекурренте: P' = n(tP − P₋₁)/(t²−1)
    return roots.map(t => {
      const pn = legP(n, t), pn1 = legP(n - 1, t);
      const dp = n * (t * pn - pn1) / (t * t - 1);
      return 2 / ((1 - t * t) * dp * dp);
    });
  }

  // таблица работы (с опечаткой во втором узле) — для честной самопроверки
  const T_WORK = [-0.94910791, -0.74193119, -0.40584515, 0, 0.40584515, 0.74193119, 0.94910791];
  const A_WORK = [0.12948496, 0.27970540, 0.38183006, 0.41795918, 0.38183006, 0.27970540, 0.12948496];

  const roots7 = legProots(7);
  const w7 = legWeights(7, roots7);

  function gauss7(f, a, b, T, W) {
    let s = 0;
    for (let i = 0; i < 7; i++) s += W[i] * f((b - a) / 2 * T[i] + (b + a) / 2);
    return (b - a) / 2 * s;
  }

  function recalc() {
    const F = FUNCS[+$('sel-f').value];
    const n2 = Math.max(4, Math.round((parseFloat($('in-n').value) || 200) / 2) * 2);
    const n = n2 / 2;
    const I1 = simpson(F.f, F.a, F.b, n);
    const I2 = simpson(F.f, F.a, F.b, 2 * n);
    const runge = (I2 - I1) / (Math.pow(2, 4) - 1);
    const IG = gauss7(F.f, F.a, F.b, roots7, w7);
    const IGwork = gauss7(F.f, F.a, F.b, T_WORK, A_WORK);

    // график
    let ymax = 0;
    for (let i = 0; i <= 200; i++) ymax = Math.max(ymax, F.f(F.a + (F.b - F.a) * i / 200));
    const P = NM.plot($('plot-f'), {
      w: 620, h: 380, xmin: F.a - (F.b - F.a) * 0.05, xmax: F.b + (F.b - F.a) * 0.05,
      ymin: -ymax * 0.08, ymax: ymax * 1.15, xlab: 'x', ylab: 'f(x)',
    });
    // заливка области
    const area = [[F.a, 0]];
    for (let i = 0; i <= 160; i++) { const x = F.a + (F.b - F.a) * i / 160; area.push([x, F.f(x)]); }
    area.push([F.b, 0]);
    NM.E('polygon', {
      points: area.map(p => P.X(p[0]).toFixed(1) + ',' + P.Y(p[1]).toFixed(1)).join(' '),
      fill: 'rgba(21,94,117,.10)', stroke: 'none',
    }, P.layer);
    P.fn(F.f, { color: NM.C.teal, width: 2.4 });
    P.pts(roots7.map(t => {
      const x = (F.b - F.a) / 2 * t + (F.b + F.a) / 2;
      return [x, F.f(x)];
    }), { fill: NM.C.red, r: 4.5 });
    P.legend([
      { c: NM.C.teal, t: 'f(x)' },
      { c: NM.C.red, t: 'узлы Гаусса на [a, b]' },
    ]);

    // таблица сравнения
    const rows = [
      ['Симпсон, ' + n2 + ' разбиений', I1],
      ['Симпсон, ' + 2 * n2 + ' разбиений', I2],
      ['Рунге: I + R', I2 + runge],
      ['Гаусс, 7 узлов', IG],
      ['точное значение', F.exact],
    ];
    let ht = '<table class="nm"><tr><th>метод</th><th>значение</th><th>|Δ| от точного</th></tr>';
    for (const [nm, v] of rows)
      ht += `<tr><td style="text-align:left">${nm}</td><td>${v.toFixed(12)}</td><td>${NM.fnum(Math.abs(v - F.exact), 3)}</td></tr>`;
    ht += '</table>';
    $('out-cmp').innerHTML = ht;

    const h = (F.b - F.a) / n2;
    NM.steps($('steps-simp'), 'Решение по шагам: Симпсон и правило Рунге', [
      {
        f: 'I_h=\\dfrac{h}{3}\\Bigl(f(a)+f(b)+4\\sum f_{\\text{нечёт}}+2\\sum f_{\\text{чёт}}\\Bigr)',
        s: '\\dfrac{' + NM.fmt(h, 5) + '}{3}\\bigl(' + NM.fmt(F.f(F.a), 4) + '+' + NM.fmt(F.f(F.b), 4) + '+4\\Sigma_1+2\\Sigma_2\\bigr)',
        r: NM.fmt(I1, 10),
        note: 'h = (b − a)/' + n2,
      },
      {
        f: 'I_{h/2}',
        s: '\\text{то же с шагом } h/2',
        r: NM.fmt(I2, 10),
      },
      {
        f: 'R=\\dfrac{I_{h/2}-I_h}{2^4-1}',
        s: '\\dfrac{' + NM.fmt(I2 - I1, 4) + '}{15}',
        r: NM.fmt(runge, 4),
        note: 'оценка погрешности; уточнённое значение I + R = ' + NM.fnum(I2 + runge, 12),
      },
    ]);
    NM.steps($('steps-gauss'), 'Решение по шагам: квадратура Гаусса', [
      {
        f: 'x_i=\\dfrac{b-a}{2}t_i+\\dfrac{b+a}{2},\\qquad I\\approx\\dfrac{b-a}{2}\\sum_{i=1}^{7}A_i f(x_i)',
        note: 'узлы tᵢ — корни P₇, найденные на этой странице бисекцией; веса — по формуле через P₇′',
      },
      {
        f: 't_1,\\;t_2,\\;t_3,\\;t_4',
        s: roots7.slice(0, 4).map(v => NM.fmt(v, 6)).join(',\\;'),
        r: '\\dots',
        note: 'остальные симметричны; веса A = [' + w7.slice(0, 4).map(v => NM.fnum(v, 6)).join(', ') + ', …]',
      },
      {
        f: 'I_{\\text{Гаусс}}',
        s: '\\sum A_i f(x_i)\\cdot\\dfrac{b-a}{2}',
        r: NM.fmt(IG, 10),
        note: 'семь узлов дают точность многочлена 13-й степени: |Δ| = ' + NM.fnum(Math.abs(IG - F.exact), 3),
      },
      {
        f: 'I_{\\text{Гаусс}}^{\\text{(таблица работы)}}',
        s: '\\text{с узлом } 0.74193119 \\text{ вместо } 0.74153119',
        r: NM.fmt(IGwork, 9),
        note: +$('sel-f').value === 0 ? 'ровно значение из работы: 0.913086993029280 — расхождение объясняется опечаткой в узле, а не свойствами метода' : 'влияние опечатки в узле на текущую функцию',
      },
    ]);
  }

  /* --- P7 и узлы --- */
  function drawP7() {
    const P = NM.plot($('plot-p7'), { w: 560, h: 360, xmin: -1.05, xmax: 1.05, ymin: -0.6, ymax: 0.6, xlab: 't', ylab: 'P₇(t)' });
    P.fn(t => legP(7, t), { color: NM.C.violet, width: 2.2 });
    P.fn(t => legP(5, t), { color: NM.C.gray, width: 1.4, dash: '4 4', opacity: 0.8 });
    P.fn(t => legP(6, t), { color: NM.C.green, width: 1.4, dash: '4 4', opacity: 0.8 });
    P.pts(roots7.map(r => [r, 0]), { fill: NM.C.red, r: 4.5 });
    P.legend([
      { c: NM.C.violet, t: 'P₇(t)' },
      { c: NM.C.green, t: 'P₆(t)', dash: 1 },
      { c: NM.C.gray, t: 'P₅(t)', dash: 1 },
      { c: NM.C.red, t: 'корни P₇ — узлы квадратуры' },
    ]);
    let ht = '<table class="nm"><tr><th>i</th><th>корень P₇ (бисекция)</th><th>вес Aᵢ</th><th>NSolve из работы</th></tr>';
    const nsolve = [-0.949108, -0.741531, -0.405845, 0, 0.405845, 0.741531, 0.949108];
    roots7.forEach((r, i) => {
      ht += `<tr><td>${i + 1}</td><td>${r.toFixed(8)}</td><td>${w7[i].toFixed(8)}</td><td>${nsolve[i]}</td></tr>`;
    });
    ht += '</table>';
    $('out-nodes').innerHTML = ht;
  }

  /* --- интеграл табличной функции --- */
  function tableIntegral() {
    const X = [0.2, 0.6, 1.0, 1.4, 1.8, 2.2, 2.6, 3.0];
    const Y = [0.18, 0.47, 0.69, 0.87, 1.03, 1.16, 1.28, 1.39];
    // интерполяционный многочлен 7-й степени через разделённые разности
    const c = newtonCoef(X, Y);
    const p = t => newtonEval(X, c, t);
    const Ip0 = simpson(p, 0, 3, 400);   // как в работе: от 0 — левее первого узла!
    const Ip = simpson(p, 0.2, 3, 400);  // строго по таблице
    // сплайн для сравнения — трапеции по плотной сетке сплайна не нужны: трапеции по самой таблице
    let Itr = 0;
    for (let i = 1; i < X.length; i++) Itr += (Y[i] + Y[i - 1]) / 2 * (X[i] - X[i - 1]);
    $('out-table-int').innerHTML =
      `интеграл интерполяционного многочлена P₇ на [0, 3]: <b>${Ip0.toFixed(12)}</b>` +
      ` (работа: 2.545010027204240)<br>` +
      `тот же интеграл строго по области таблицы [0.2, 3]: <b>${Ip.toFixed(12)}</b><br>` +
      `для сравнения, формула трапеций прямо по таблице: <b>${Itr.toFixed(6)}</b> — ` +
      `судостроительная классика: так интегрируют площади ватерлиний по ординатам<br>` +
      `<span class="small">тонкость: нижний предел 0 в работе лежит левее первого узла x₀ = 0.2, ` +
      `то есть на участке [0, 0.2] многочлен экстраполируется — для многочлена это законно, ` +
      `но добавка ∫₀⁰·²P dt ≈ ${(Ip0 - Ip).toFixed(4)} получена вне области данных</span>`;
    return Ip0;
  }

  $('sel-f').addEventListener('change', recalc);
  $('in-n').addEventListener('input', recalc);
  recalc();
  drawP7();
  const Ip = tableIntegral();

  /* --- самопроверки --- */
  (function selfcheck() {
    const F = FUNCS[0];
    NM.check('Симпсон, 200 разбиений (работа: 0.912974166117486)', simpson(F.f, 0, 2, 100), 0.912974166117486, 1e-12);
    NM.check('Симпсон, 400 разбиений (работа: 0.912974165937842)', simpson(F.f, 0, 2, 200), 0.912974165937842, 1e-12);
    NM.check('правило Рунге (работа: −1.1976·10⁻¹¹)',
      (simpson(F.f, 0, 2, 200) - simpson(F.f, 0, 2, 100)) / 15, -1.1976e-11, 1e-13);
    NM.check('Гаусс-7 с таблицей работы (работа: 0.913086993029280)',
      gauss7(F.f, 0, 2, T_WORK, A_WORK), 0.913086993029280, 1e-12);
    NM.check('Гаусс-7 с точными узлами → точное значение интеграла',
      gauss7(F.f, 0, 2, roots7, w7), 0.912974165925866, 1e-9);
    NM.check('корни P₇ (работа, NSolve: ±0.949108, ±0.741531, ±0.405845, 0)',
      roots7, [-0.949108, -0.741531, -0.405845, 0, 0.405845, 0.741531, 0.949108], 1e-6);
    NM.check('сумма весов Гаусса = длине отрезка [−1, 1]', w7.reduce((s, v) => s + v, 0), 2, 1e-10);
    NM.check('интеграл табличной функции на [0, 3] (работа: 2.545010027204240)', Ip, 2.545010027204240, 1e-6);
    NM.checkSummary('страница «Интегрирование»');
  })();
})();
