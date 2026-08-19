/* ОДУ: задача Коши (РК4), система двух уравнений, устойчивость. */
'use strict';
(function () {
  /* ---------- задача Коши ---------- */
  const f1 = (x, y) => [Math.cos(x + y[0]) + 0.5 * (x - y[0])];
  const dense = NM.rk4(f1, 0, [0], 20, 2000);
  const denseAt = x => {
    const i = Math.min(1999, Math.max(0, Math.round(x / 0.01)));
    return dense.ys[i][0];
  };

  function drawOde() {
    const N = +$('sel-N').value;
    const sol = NM.rk4(f1, 0, [0], 20, N);
    const P = NM.plot($('plot-ode'), { w: 640, h: 400, xmin: 0, xmax: 20, ymin: -0.5, ymax: 18, xlab: 'x', ylab: 'y' });
    P.poly(dense.ts.map((t, i) => [t, dense.ys[i][0]]), { color: NM.C.ink, width: 2.4 });
    P.poly(sol.ts.map((t, i) => [t, sol.ys[i][0]]), { color: N <= 20 ? NM.C.red : NM.C.teal, width: 1.8 });
    P.pts(sol.ts.map((t, i) => [t, sol.ys[i][0]]).filter((_, i) => i % Math.max(1, N / 40) === 0), { fill: N <= 20 ? NM.C.red : NM.C.teal, r: 3 });
    P.legend([
      { c: NM.C.ink, t: 'эталон: РК4, h = 0.01' },
      { c: N <= 20 ? NM.C.red : NM.C.teal, t: 'РК4, N = ' + N + ' (h = ' + 20 / N + ')' },
    ]);

    // таблица с шагом 0,5 (N = 40)
    const s40 = NM.rk4(f1, 0, [0], 20, 40);
    const ref = [[0, 0], [0.5, 0.431], [1, 0.615], [1.5, 0.621], [2, 0.564], [2.5, 0.526], [3, 0.589], [3.5, 0.892], [4, 1.643], [4.5, 2.619], [5, 3.155], [5.5, 3.348]];
    let ht = '<table class="nm"><tr><th>x</th><th>РК4, h=0.5</th><th>работа (Yr)</th><th>эталон</th></tr>';
    for (const [x, v] of ref) {
      const i = Math.round(x / 0.5);
      ht += `<tr><td>${x}</td><td>${NM.fnum(s40.ys[i][0], 3)}</td><td>${v}</td><td>${NM.fnum(denseAt(x), 3)}</td></tr>`;
    }
    ht += '</table>';
    $('out-tab').innerHTML = ht;

    // шаги: первый шаг РК4
    const h = 20 / N;
    const k1 = f1(0, [0])[0];
    const k2 = f1(h / 2, [h / 2 * k1])[0];
    const k3 = f1(h / 2, [h / 2 * k2])[0];
    const k4 = f1(h, [h * k3])[0];
    const y1 = h / 6 * (k1 + 2 * k2 + 2 * k3 + k4);
    NM.steps($('steps-rk'), 'Решение по шагам: первый шаг РК4 (h = ' + h + ')', [
      { f: 'k_1=f(0,0)', s: '\\cos 0+0.5\\cdot 0', r: NM.fmt(k1, 4) },
      {
        f: 'k_2=f\\bigl(\\tfrac{h}{2},\\ \\tfrac{h}{2}k_1\\bigr)',
        s: '\\cos(' + NM.fmt(h / 2, 3) + '+' + NM.fmt(h / 2 * k1, 3) + ')+0.5(' + NM.fmt(h / 2, 3) + '-' + NM.fmt(h / 2 * k1, 3) + ')',
        r: NM.fmt(k2, 4),
      },
      { f: 'k_3', s: 'f\\bigl(\\tfrac{h}{2},\\ \\tfrac{h}{2}k_2\\bigr)', r: NM.fmt(k3, 4) },
      { f: 'k_4', s: 'f(h,\\ h\\,k_3)', r: NM.fmt(k4, 4) },
      {
        f: 'y_1=y_0+\\dfrac{h}{6}\\bigl(k_1+2k_2+2k_3+k_4\\bigr)',
        s: '\\dfrac{' + NM.fmt(h, 3) + '}{6}\\bigl(' + NM.fmt(k1, 3) + '+2\\cdot' + NM.fmt(k2, 3) + '+2\\cdot' + NM.fmt(k3, 3) + '+' + NM.fmt(k4, 3) + '\\bigr)',
        r: NM.fmt(y1, 4),
        note: 'эталонное значение y(' + h + ') = ' + NM.fnum(denseAt(h), 4) + '; глобальная ошибка накапливается как O(h⁴)',
      },
    ]);
  }

  /* ---------- система двух уравнений ---------- */
  const fs = (t, X) => [Math.cos(t * X[0] + X[1]), Math.sin(X[0] - 4 * X[1])];
  function drawSys() {
    const denseS = NM.rk4(fs, 0, [2, 1], 10, 2000);
    const s = NM.rk4(fs, 0, [2, 1], 10, 50);
    const P = NM.plot($('plot-sys-t'), { w: 560, h: 380, xmin: 0, xmax: 10, ymin: 0, ymax: 2.3, xlab: 't', ylab: 'x, y' });
    P.poly(denseS.ts.map((t, i) => [t, denseS.ys[i][0]]), { color: NM.C.teal, width: 2.2 });
    P.poly(denseS.ts.map((t, i) => [t, denseS.ys[i][1]]), { color: NM.C.red, width: 2.2 });
    P.pts(s.ts.map((t, i) => [t, s.ys[i][0]]).filter((_, i) => i % 2 === 0), { fill: NM.C.teal, r: 2.6 });
    P.pts(s.ts.map((t, i) => [t, s.ys[i][1]]).filter((_, i) => i % 2 === 0), { fill: NM.C.red, r: 2.6 });
    P.legend([
      { c: NM.C.teal, t: 'x(t)' },
      { c: NM.C.red, t: 'y(t)' },
      { c: NM.C.gray, t: 'точки — РК4 с 50 узлами' },
    ]);
    const Q = NM.plot($('plot-sys-phase'), { w: 460, h: 380, xmin: 0.9, xmax: 2.3, ymin: 0.1, ymax: 1.1, xlab: 'x', ylab: 'y' });
    Q.poly(denseS.ys.map(v => [v[0], v[1]]), { color: NM.C.green, width: 2 });
    Q.pts([[2, 1]], { fill: NM.C.ink, r: 5 });
    Q.text(2, 1, ' старт (2, 1)', { dx: 6, dy: -6 });
    Q.legend([{ c: NM.C.green, t: 'фазовая траектория (x, y)' }]);
    return { s, denseS };
  }

  /* ---------- устойчивость ---------- */
  const EX1 = [[-4, 0], [-2, -4]];
  const EX2 = [[2, 8], [-1, -3]];
  let Ast = EX1.map(r => r.slice());

  function buildMat() {
    const n = Ast.length;
    const el = $('mat-St');
    el.style.gridTemplateColumns = `repeat(${n},auto)`;
    el.innerHTML = Ast.map((r, i) => r.map((v, j) => `<input data-i="${i}" data-j="${j}" value="${v}">`).join('')).join('');
    el.querySelectorAll('input').forEach(inp => inp.addEventListener('change', () => {
      const v = parseFloat(inp.value.replace(',', '.'));
      if (!isFinite(v)) { inp.value = Ast[+inp.dataset.i][+inp.dataset.j]; return; }
      Ast[+inp.dataset.i][+inp.dataset.j] = v;
      recalcStab();
    }));
  }

  function verdict(eigs) {
    const re = eigs.map(e => e[0]);
    if (re.every(r => r < -1e-9)) return ['асимптотически устойчиво', 'ok'];
    if (re.some(r => r > 1e-9)) return ['неустойчиво', 'bad'];
    return ['устойчиво (не асимптотически) — есть числа с нулевой вещественной частью', 'ok'];
  }

  function recalcStab() {
    const eigs = NM.eigenvalues(Ast);
    const fmtC = e => e[1] === 0 ? NM.fnum(e[0], 4) : `${NM.fnum(e[0], 3)} ${e[1] > 0 ? '+' : '−'} ${NM.fnum(Math.abs(e[1]), 3)}i`;
    $('out-eig').innerHTML = 'собственные числа: ' + eigs.map(e => `<b>${fmtC(e)}</b>`).join('; ');
    const [text, cls] = verdict(eigs);
    $('out-verdict').innerHTML = `<span class="badge ${cls}">нулевое решение ${text}</span>`;

    // фазовый портрет из начальных точек работы
    const V = Ast.length === 2
      ? [[-2, 5], [1, -1], [3, -3]]
      : [[-2, 5, 1], [1, -1, 2], [3, -3, -1]];
    const fA = (t, X) => NM.matvec(Ast, X);
    let lim = 0.5;
    const trajs = V.map(v0 => {
      const s = NM.rk4(fA, 0, v0.slice(), 10, 400);
      s.ys.forEach(y => { lim = Math.max(lim, Math.min(12, Math.abs(y[0]), 12), Math.min(12, Math.abs(y[1]))); });
      return s;
    });
    lim = Math.min(8, Math.max(1.2, lim * 1.1));
    const P = NM.plot($('plot-phase2'), { w: 460, h: 400, xmin: -lim, xmax: lim, ymin: -lim, ymax: lim, xlab: 'x₀', ylab: 'x₁' });
    const cols = [NM.C.teal, NM.C.red, NM.C.green];
    trajs.forEach((s, i) => {
      P.poly(s.ys.map(y => [y[0], y[1]]), { color: cols[i], width: 1.8 });
      P.pts([[s.ys[0][0], s.ys[0][1]]], { fill: cols[i], r: 4 });
    });
    P.pts([[0, 0]], { fill: NM.C.ink, r: 3.5 });
    P.legend(trajs.map((_, i) => ({ c: cols[i], t: 'из точки (' + V[i].slice(0, 2).join(', ') + (Ast.length === 3 ? ', …' : '') + ')' })));

    // характеристический многочлен — шаги
    const n = Ast.length;
    const tr = Ast.reduce((s, r, i) => s + r[i], 0);
    const det2 = n === 2 ? Ast[0][0] * Ast[1][1] - Ast[0][1] * Ast[1][0] : null;
    const stepList = [
      {
        f: '\\det(A-\\lambda E)=0',
        note: 'характеристическое уравнение; для 2×2: λ² − (tr A)λ + det A = 0',
      },
    ];
    if (n === 2) {
      stepList.push({
        f: '\\lambda^2-(\\operatorname{tr}A)\\lambda+\\det A',
        s: '\\lambda^2-(' + NM.fmt(tr, 3) + ')\\lambda+(' + NM.fmt(det2, 3) + ')',
        r: '0',
      });
      stepList.push({
        f: '\\lambda_{1,2}=\\dfrac{\\operatorname{tr}A}{2}\\pm\\sqrt{\\dfrac{(\\operatorname{tr}A)^2}{4}-\\det A}',
        s: NM.fmt(tr / 2, 3) + '\\pm\\sqrt{' + NM.fmt(tr * tr / 4 - det2, 3) + '}',
        r: eigs.map(e => fmtC(e).replace('−', '-')).join(',\\;'),
      });
    } else {
      stepList.push({
        f: '\\lambda_i',
        s: '\\text{корни кубического уравнения (метод Дюрана — Кернера)}',
        r: eigs.map(e => fmtC(e).replace('−', '-')).join(',\\;'),
      });
    }
    stepList.push({
      f: '\\operatorname{Re}\\lambda_i',
      s: eigs.map(e => NM.fmt(e[0], 3)).join(',\\;'),
      r: '\\text{' + text + '}',
    });
    NM.steps($('steps-eig'), 'Решение по шагам: устойчивость', stepList);
  }

  /* ---------- события ---------- */
  $('sel-N').addEventListener('change', drawOde);
  $('sel-msize').addEventListener('change', () => {
    const n = +$('sel-msize').value;
    Ast = n === 2 ? EX1.map(r => r.slice()) : [[-2, 1, 0], [0, -3, 1], [0, 0, -1]];
    buildMat(); recalcStab();
  });
  $('btn-ex1').addEventListener('click', () => { $('sel-msize').value = '2'; Ast = EX1.map(r => r.slice()); buildMat(); recalcStab(); });
  $('btn-ex2').addEventListener('click', () => { $('sel-msize').value = '2'; Ast = EX2.map(r => r.slice()); buildMat(); recalcStab(); });

  drawOde();
  drawSys();
  buildMat();
  recalcStab();

  /* ---------- самопроверки ---------- */
  (function selfcheck() {
    const s40 = NM.rk4(f1, 0, [0], 20, 40);
    const ref = [[0.5, 0.431], [1, 0.615], [1.5, 0.621], [2, 0.564], [2.5, 0.526], [3, 0.589], [3.5, 0.892], [4, 1.643], [4.5, 2.619], [5, 3.155], [5.5, 3.348]];
    NM.check('РК4 h=0.5 против матрицы Yr работы (11 значений)',
      ref.map(([x]) => s40.ys[Math.round(x / 0.5)][0]),
      ref.map(([, v]) => v), 5e-3);
    const e1 = NM.eigenvalues(EX1);
    NM.check('собственные числа [[−4,0],[−2,−4]] (работа: −4, −4)',
      e1.map(e => e[0]).sort((a, b) => a - b), [-4, -4], 1e-6);
    const e2 = NM.eigenvalues(EX2);
    NM.check('собственные числа [[2,8],[−1,−3]]: Re (работа: −0.5)',
      e2.map(e => e[0]), [-0.5, -0.5], 1e-6);
    NM.check('собственные числа [[2,8],[−1,−3]]: |Im| (работа: 1.32)',
      e2.map(e => Math.abs(e[1])), [1.3228756555, 1.3228756555], 1e-6);
    // характеристический многочлен из работы: 1 + 4λ + 16λ² + 25λ³ + 13λ⁴ + 9λ⁵
    const rts = NM.polyroots([1, 4, 16, 25, 13, 9]);
    const reals = rts.filter(r => Math.abs(r[1]) < 1e-6).map(r => r[0]);
    NM.check('вещественный корень многочлена (работа: −0.591)', reals[0], -0.591, 1e-3);
    const negRe = rts.every(r => r[0] < 0);
    NM.check('все корни в левой полуплоскости (устойчивость)', negRe ? 1 : 0, 1, 0);
    NM.checkSummary('страница «Дифуравнения»');
  })();
})();
