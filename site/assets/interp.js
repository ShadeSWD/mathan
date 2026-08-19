/* Интерполяция: Лагранж, Ньютон, сплайн, МНК. Данные — практическая работа
 * курса (вариант 2). */
'use strict';
(function () {
  const X0 = [0.2, 0.6, 1.0, 1.4, 1.8, 2.2, 2.6, 3.0];
  const Y0 = [0.18, 0.47, 0.69, 0.87, 1.03, 1.16, 1.28, 1.39];
  let X = X0.slice(), Y = Y0.slice();

  /* ---------- методы ---------- */
  function lagrange(xs, ys, t) {
    let s = 0;
    for (let k = 0; k < xs.length; k++) {
      let p = ys[k];
      for (let i = 0; i < xs.length; i++) if (i !== k) p *= (t - xs[i]) / (xs[k] - xs[i]);
      s += p;
    }
    return s;
  }
  // newtonCoef() и newtonEval() — в common.js
  // таблица конечных разностей: Cl[k][i] = Cl[k][i-1] - Cl[k-1][i-1]
  function diffTable(ys) {
    const n = ys.length;
    const Cl = ys.map(v => new Array(n).fill(0));
    for (let k = 0; k < n; k++) Cl[k][0] = ys[k];
    for (let i = 1; i < n; i++)
      for (let k = i; k < n; k++)
        Cl[k][i] = Cl[k][i - 1] - Cl[k - 1][i - 1];
    return Cl;
  }
  // естественный кубический сплайн: моменты M_i
  function splineBuild(xs, ys) {
    const n = xs.length - 1;
    const h = [];
    for (let i = 1; i <= n; i++) h[i] = xs[i] - xs[i - 1];
    // трёхдиагональная система для M_1..M_{n-1}
    const a = [], b = [], c = [], d = [];
    for (let i = 1; i < n; i++) {
      a[i] = h[i] / 6;
      b[i] = (h[i] + h[i + 1]) / 3;
      c[i] = h[i + 1] / 6;
      d[i] = (ys[i + 1] - ys[i]) / h[i + 1] - (ys[i] - ys[i - 1]) / h[i];
    }
    // прогонка
    const M = new Array(n + 1).fill(0);
    const al = [], be = [];
    al[1] = 0; be[1] = 0; // M_0 = 0
    for (let i = 1; i < n; i++) {
      const den = b[i] + a[i] * (al[i] || 0);
      al[i + 1] = -c[i] / den;
      be[i + 1] = (d[i] - a[i] * (be[i] || 0)) / den;
    }
    for (let i = n - 1; i >= 1; i--) M[i] = al[i + 1] * M[i + 1] + be[i + 1];
    return { M, h };
  }
  function splineEval(xs, ys, sp, t) {
    const n = xs.length - 1;
    let i = 0;
    while (i < n - 1 && t > xs[i + 1]) i++;
    const h = sp.h[i + 1], M0 = sp.M[i], M1 = sp.M[i + 1];
    const A = (xs[i + 1] - t) / h, B = (t - xs[i]) / h;
    return M0 * Math.pow(xs[i + 1] - t, 3) / (6 * h) + M1 * Math.pow(t - xs[i], 3) / (6 * h)
      + (ys[i] - M0 * h * h / 6) * A + (ys[i + 1] - M1 * h * h / 6) * B;
  }
  // МНК степени m через нормальные уравнения
  function lsq(xs, ys, m) {
    const A = [], b = [];
    for (let r = 0; r <= m; r++) {
      A[r] = [];
      for (let c = 0; c <= m; c++) A[r][c] = xs.reduce((s, x) => s + Math.pow(x, r + c), 0);
      b[r] = xs.reduce((s, x, i) => s + Math.pow(x, r) * ys[i], 0);
    }
    return { c: NM.gaussSolve(A, b), A, b };
  }
  const polyEval = (c, t) => c.reduce((s, v, i) => s + v * Math.pow(t, i), 0);

  /* ---------- интерфейс ---------- */
  function buildTable() {
    const t = $('pt-table');
    t.innerHTML = '<tr><th>i</th>' + X.map((_, i) => `<th>${i}</th>`).join('') + '</tr>'
      + '<tr><th>x</th>' + X.map((v, i) => `<td><input data-r="x" data-i="${i}" value="${v}"></td>`).join('') + '</tr>'
      + '<tr><th>y</th>' + Y.map((v, i) => `<td><input data-r="y" data-i="${i}" value="${v}"></td>`).join('') + '</tr>';
    t.querySelectorAll('input').forEach(inp => inp.addEventListener('change', () => {
      const i = +inp.dataset.i, v = parseFloat(inp.value.replace(',', '.'));
      if (!isFinite(v)) { inp.value = (inp.dataset.r === 'x' ? X : Y)[i]; return; }
      (inp.dataset.r === 'x' ? X : Y)[i] = v;
      recalc();
    }));
  }

  function recalc() {
    const t = parseFloat($('in-t').value) || 1.25;
    const nc = newtonCoef(X, Y);
    const sp = splineBuild(X, Y);
    const l1 = lsq(X, Y, 1), l2 = lsq(X, Y, 2);
    const xmin = Math.min(...X), xmax = Math.max(...X);
    const pad = (xmax - xmin) * 0.06;
    const ys = [...Y, lagrange(X, Y, t)];
    const ymin = Math.min(...ys), ymax = Math.max(...ys);
    const ypad = (ymax - ymin) * 0.15 + 0.05;
    const P = NM.plot($('plot-main'), {
      w: 640, h: 420, xmin: xmin - pad, xmax: xmax + pad,
      ymin: ymin - ypad, ymax: ymax + ypad, xlab: 't', ylab: 'y',
    });
    const legend = [];
    if ($('ck-lagr').checked) { P.fn(x => lagrange(X, Y, x), { color: NM.C.teal, width: 2.4 }); legend.push({ c: NM.C.teal, t: 'Лагранж L₇(t)' }); }
    if ($('ck-newt').checked) { P.fn(x => newtonEval(X, nc, x), { color: NM.C.violet, width: 2, dash: '7 6' }); legend.push({ c: NM.C.violet, t: 'Ньютон N₇(t)', dash: 1 }); }
    if ($('ck-spl').checked) { P.fn(x => splineEval(X, Y, sp, x), { color: NM.C.red, width: 2 }); legend.push({ c: NM.C.red, t: 'кубический сплайн' }); }
    if ($('ck-l1').checked) { P.fn(x => polyEval(l1.c, x), { color: NM.C.gray, width: 1.8, dash: '4 4' }); legend.push({ c: NM.C.gray, t: 'МНК-прямая', dash: 1 }); }
    if ($('ck-l2').checked) { P.fn(x => polyEval(l2.c, x), { color: NM.C.green, width: 1.8, dash: '4 4' }); legend.push({ c: NM.C.green, t: 'МНК-парабола', dash: 1 }); }
    P.vline(t, { color: NM.C.gray });
    P.pts(X.map((x, i) => [x, Y[i]]), { fill: NM.C.ink, r: 4.5 });
    legend.push({ c: NM.C.ink, t: 'узлы таблицы' });
    P.legend(legend);

    // значения в точке
    const vals = [
      ['Лагранж', lagrange(X, Y, t)],
      ['Ньютон', newtonEval(X, nc, t)],
      ['сплайн', splineEval(X, Y, sp, t)],
      ['МНК-прямая', polyEval(l1.c, t)],
      ['МНК-парабола', polyEval(l2.c, t)],
    ];
    $('out-values').innerHTML = vals.map(([n, v]) => `${n}(${NM.fnum(t)}) = <b>${NM.fnum(v, 5)}</b>`).join('<br>');

    // таблица конечных разностей
    const Cl = diffTable(Y);
    const n = Y.length;
    let ht = '<table class="nm"><tr><th>k</th><th>y</th>';
    for (let i = 1; i < n; i++) ht += `<th>Δ<sup>${i}</sup></th>`;
    ht += '</tr>';
    for (let k = 0; k < n; k++) {
      ht += `<tr><th>${k}</th>`;
      for (let i = 0; i < n; i++)
        ht += `<td class="${i === k ? 'ok' : ''}">${i <= k ? NM.fnum(Cl[k][i], 3) : ''}</td>`;
      ht += '</tr>';
    }
    ht += '</table>';
    $('out-diff').innerHTML = ht;

    /* --- решение по шагам --- */
    const lk0 = (() => { let p = 1; for (let i = 1; i < n; i++) p *= (t - X[i]) / (X[0] - X[i]); return p; })();
    const terms = X.map((_, k) => {
      let p = 1;
      for (let i = 0; i < n; i++) if (i !== k) p *= (t - X[i]) / (X[k] - X[i]);
      return Y[k] * p;
    });
    NM.steps($('steps-lagr'), 'Решение по шагам: многочлен Лагранжа при t = ' + NM.fnum(t), [
      {
        f: 'L_7(t)=\\sum_{k=0}^{7} y_k\\prod_{i\\ne k}\\dfrac{t-x_i}{x_k-x_i}',
        note: 'восемь слагаемых, по одному на каждый узел таблицы',
      },
      {
        f: 'y_0\\,l_0(' + NM.fmt(t) + ')',
        s: '0.18\\cdot' + NM.fmt(lk0 / 1, 4),
        r: NM.fmt(terms[0], 4),
        note: 'первое слагаемое; остальные считаются так же',
      },
      {
        f: 'L_7(' + NM.fmt(t) + ')',
        s: terms.map(v => NM.fmt(v, 3)).join('+').replace(/\+\-/g, '-'),
        r: NM.fmt(lagrange(X, Y, t), 5),
      },
    ]);
    const uniform = X.every((x, i) => i === 0 || Math.abs((x - X[i - 1]) - (X[1] - X[0])) < 1e-9);
    const h = X[1] - X[0];
    const newtSteps = [
      {
        f: 'N_7(t)=\\sum_{k=0}^{7}\\dfrac{\\Delta^k y_0}{k!\\,h^k}\\prod_{i=0}^{k-1}(t-x_i)',
        note: uniform ? `шаг таблицы h = ${NM.fnum(h)}, разности Δᵏy₀ — диагональ таблицы разностей`
          : 'шаг таблицы неравномерен — сайт использует эквивалентные разделённые разности',
      },
      {
        f: '\\Delta y_0,\\;\\Delta^2 y_0,\\;\\Delta^3 y_0',
        s: [Cl[1][1], Cl[2][2], Cl[3][3]].map(v => NM.fmt(v, 3)).join(',\\;'),
        r: '\\dots',
        note: 'быстрое убывание разностей — данные близки к гладкой функции',
      },
      {
        f: 'N_7(' + NM.fmt(t) + ')',
        r: NM.fmt(newtonEval(X, nc, t), 5),
        note: 'совпадает со значением многочлена Лагранжа — это один и тот же многочлен',
      },
    ];
    NM.steps($('steps-newt'), 'Решение по шагам: многочлен Ньютона', newtSteps);

    const S = m => X.reduce((s, x) => s + Math.pow(x, m), 0);
    const Sy = X.reduce((s, x, i) => s + Y[i], 0);
    const Sxy = X.reduce((s, x, i) => s + x * Y[i], 0);
    NM.steps($('steps-mnk'), 'Решение по шагам: МНК-прямая P₁(t) = a + bt', [
      {
        f: '\\begin{cases} a\\,(n{+}1)+b\\sum x_i=\\sum y_i\\\\ a\\sum x_i+b\\sum x_i^2=\\sum x_i y_i\\end{cases}',
        note: 'нормальная система: производные суммы квадратов уклонений по a и b равны нулю',
      },
      {
        f: '\\begin{cases} ' + n + 'a+' + NM.fmt(S(1), 3) + 'b=' + NM.fmt(Sy, 3) +
          '\\\\ ' + NM.fmt(S(1), 3) + 'a+' + NM.fmt(S(2), 3) + 'b=' + NM.fmt(Sxy, 3) + '\\end{cases}',
        note: 'подстановка сумм по текущей таблице',
      },
      {
        f: 'a',
        s: NM.fmt(l1.c[0], 5),
        r: NM.fmt(l1.c[0], 4),
      },
      {
        f: 'b',
        s: NM.fmt(l1.c[1], 5),
        r: NM.fmt(l1.c[1], 4),
      },
      {
        f: 'P_2(t)=a+bt+ct^2:\\quad (a,b,c)',
        r: '(' + l2.c.map(v => NM.fmt(v, 4)).join(',\\;') + ')',
        note: 'парабола по той же схеме с суммами до Σx⁴',
      },
    ]);
  }

  /* ---------- события ---------- */
  $('in-t').addEventListener('input', recalc);
  for (const id of ['ck-lagr', 'ck-newt', 'ck-spl', 'ck-l1', 'ck-l2'])
    $(id).addEventListener('change', recalc);
  $('btn-reset').addEventListener('click', () => { X = X0.slice(); Y = Y0.slice(); buildTable(); recalc(); });

  buildTable();
  recalc();

  /* ---------- самопроверки (данные работы) ---------- */
  (function selfcheck() {
    const nc = newtonCoef(X0, Y0);
    const sp = splineBuild(X0, Y0);
    const Cl = diffTable(Y0);
    NM.check('Лагранж проходит через узлы: L(x₃)', lagrange(X0, Y0, X0[3]), Y0[3], 1e-10);
    NM.check('Ньютон ≡ Лагранж в t=1.25', newtonEval(X0, nc, 1.25), lagrange(X0, Y0, 1.25), 1e-9);
    NM.check('сплайн проходит через узлы: S(x₅)', splineEval(X0, Y0, sp, X0[5]), Y0[5], 1e-9);
    NM.check('таблица разностей, столбец Δ (работа: 0.29…0.11)',
      [Cl[1][1], Cl[2][1], Cl[3][1], Cl[4][1], Cl[5][1], Cl[6][1], Cl[7][1]],
      [0.29, 0.22, 0.18, 0.16, 0.13, 0.12, 0.11], 5e-3);
    NM.check('таблица разностей, столбец Δ² (работа: −0.07 −0.04 …)',
      [Cl[2][2], Cl[3][2], Cl[4][2], Cl[5][2], Cl[6][2], Cl[7][2]],
      [-0.07, -0.04, -0.02, -0.03, -0.01, -0.01], 5e-3);
    // «МНК степени 7» из работы = интерполяция: невязка в узлах равна нулю
    const l7 = lsq(X0, Y0, 7);
    const res = Math.max(...X0.map((x, i) => Math.abs(polyEval(l7.c, x) - Y0[i])));
    NM.check('regress(X,Y,7) интерполирует точки (макс. невязка)', res, 0, 1e-6);
    NM.checkSummary('страница «Интерполяция»');
  })();
})();
