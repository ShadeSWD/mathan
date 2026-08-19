/* Спецразделы: жорданова форма, e^A, гамма, Бессель, Лежандр, Вольтерра. */
'use strict';
(function () {
  /* ---------- линейная алгебра ---------- */
  function rank(A0, tol) {
    tol = tol || 1e-9;
    const M = A0.map(r => r.slice());
    const rows = M.length, cols = M[0].length;
    let r = 0;
    for (let c = 0; c < cols && r < rows; c++) {
      let p = r;
      for (let i = r + 1; i < rows; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i;
      if (Math.abs(M[p][c]) < tol) continue;
      [M[r], M[p]] = [M[p], M[r]];
      for (let i = 0; i < rows; i++) {
        if (i === r) continue;
        const q = M[i][c] / M[r][c];
        for (let j = c; j < cols; j++) M[i][j] -= q * M[r][j];
      }
      r++;
    }
    return r;
  }
  const subLam = (A, lam) => A.map((row, i) => row.map((v, j) => (i === j ? v - lam : v)));
  function expm(A) {
    const n = A.length;
    const s = 10;
    const As = A.map(r => r.map(v => v / Math.pow(2, s)));
    let E = A.map((r, i) => r.map((_, j) => (i === j ? 1 : 0)));
    let P = E.map(r => r.slice());
    for (let k = 1; k <= 14; k++) {
      P = NM.matmul(P, As).map(r => r.map(v => v / k));
      E = E.map((r, i) => r.map((v, j) => v + P[i][j]));
    }
    for (let k = 0; k < s; k++) E = NM.matmul(E, E);
    return E;
  }
  const matHtml = (M, d) => '<table class="nm"><tr>' +
    M.map(r => r.map(v => `<td>${NM.fnum(v, d === undefined ? 4 : d)}</td>`).join('')).join('</tr><tr>') + '</tr></table>';

  const A3 = [[1, 1, 0], [1, 1, -1], [0, 1, 1]];
  const A4 = [[-2, 4, -1, 4], [3, 0, 1, -3], [1, -1, 2, -1], [-4, 4, -1, 6]];
  const AE = [[0, -3, 3], [-2, -7, 13], [-1, -4, 7]];

  (function linalg() {
    // кратности для A3
    const e3 = NM.eigenvalues(A3);
    const r3 = rank(subLam(A3, 1), 1e-7);
    const Av = NM.matvec(A3, [1, 0, 1]);
    $('out-eig3').innerHTML =
      `живой расчёт: собственные числа λ = ${e3.map(e => NM.fnum(e[0], 3) + (Math.abs(e[1]) > 1e-3 ? (e[1] > 0 ? '+' : '') + NM.fnum(e[1], 3) + 'i' : '')).join(', ')} ` +
      `(тройка единиц); rank(A − E) = <b>${r3}</b> → геометрическая кратность 3 − ${r3} = <b>${3 - r3}</b>; ` +
      `проверка вектора: A·(1,0,1)ᵀ = (${Av.map(v => NM.fnum(v, 3)).join(', ')})ᵀ = 1·(1,0,1)ᵀ`;

    // жорданова структура A4
    const e4 = NM.eigenvalues(A4).map(e => e[0]).sort((a, b) => a - b);
    const r1 = rank(subLam(A4, 1), 1e-6), r2 = rank(subLam(A4, 2), 1e-6);
    $('out-jordan').innerHTML =
      `живой расчёт: собственные числа λ = ${e4.map(v => NM.fnum(v, 3)).join(', ')}; ` +
      `rank(A − 1·E) = <b>${r1}</b> и rank(A − 2·E) = <b>${r2}</b> → по одному собственному ` +
      `вектору на каждое λ → две жордановы клетки размера 2, что и даёт матрицу J из работы`;

    // e^A
    const E = expm(AE);
    $('out-expa').innerHTML = 'ряд с масштабированием (14 членов, s = 10): e^A = ' + matHtml(E, 4) +
      '<span class="small">эталон работы: 5/2, 3/2, −6; −3/2, −9/2, 10; −1/2, −5/2, 5 — совпадение поэлементное</span>';
  })();

  /* ---------- гамма-функция (Ланцош) ---------- */
  const gLanczos = [676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012,
    9.9843695780195716e-6, 1.5056327351493116e-7];
  function gamma(z) {
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    z -= 1;
    let x = 0.99999999999980993;
    for (let i = 0; i < gLanczos.length; i++) x += gLanczos[i] / (z + i + 1);
    const t = z + gLanczos.length - 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  }
  (function gammaBlock() {
    const g05 = gamma(0.5);
    const a = 2;
    const viaGamma = Math.sqrt(Math.PI) * gamma(1 + 1 / a) / (2 * gamma(1.5 + 1 / a));
    const direct = simpson(x => Math.sqrt(Math.max(0, 1 - x * x)), 0, 1, 4000);
    const p = 2, m = 3, q = 2;
    const beta = gamma(p / m) * gamma(q) / (m * gamma(p / m + q));
    const betaDirect = simpson(x => Math.pow(x, p - 1) * Math.pow(1 - Math.pow(x, m), q - 1), 0, 1, 2000);
    $('out-gamma').innerHTML =
      `живой расчёт (аппроксимация Ланцоша): Γ(½) = <b>${g05.toFixed(10)}</b>, √π = ${Math.sqrt(Math.PI).toFixed(10)}<br>` +
      `пример к первой формуле, a = 2: через Γ получается <b>${viaGamma.toFixed(8)}</b>, ` +
      `прямое интегрирование ∫₀¹√(1−x²)dx = ${direct.toFixed(8)}, точно π/4 = ${(Math.PI / 4).toFixed(8)}<br>` +
      `пример ко второй формуле, p = 2, m = 3, q = 2: через Γ <b>${beta.toFixed(8)}</b>, ` +
      `прямое интегрирование ${betaDirect.toFixed(8)}`;
    NM.check('Γ(½) = √π', g05, Math.sqrt(Math.PI), 1e-10);
    NM.check('формула работы через Γ при a=2 равна π/4', viaGamma, Math.PI / 4, 1e-9);
    NM.check('бета-интеграл: Γ-формула против квадратуры', beta, betaDirect, 1e-6);
  })();

  /* ---------- Бессель (аппроксимации Numerical Recipes) ---------- */
  function bessj0(x) {
    const ax = Math.abs(x);
    if (ax < 8) {
      const y = x * x;
      const p1 = 57568490574.0 + y * (-13362590354.0 + y * (651619640.7 + y * (-11214424.18 + y * (77392.33017 + y * (-184.9052456)))));
      const p2 = 57568490411.0 + y * (1029532985.0 + y * (9494680.718 + y * (59272.64853 + y * (267.8532712 + y))));
      return p1 / p2;
    }
    const z = 8 / ax, y = z * z, xx = ax - 0.785398164;
    const p1 = 1 + y * (-0.1098628627e-2 + y * (0.2734510407e-4 + y * (-0.2073370639e-5 + y * 0.2093887211e-6)));
    const p2 = -0.1562499995e-1 + y * (0.1430488765e-3 + y * (-0.6911147651e-5 + y * (0.7621095161e-6 + y * (-0.934935152e-7))));
    return Math.sqrt(0.636619772 / ax) * (Math.cos(xx) * p1 - z * Math.sin(xx) * p2);
  }
  function bessj1(x) {
    const ax = Math.abs(x);
    if (ax < 8) {
      const y = x * x;
      const p1 = x * (72362614232.0 + y * (-7895059235.0 + y * (242396853.1 + y * (-2972611.439 + y * (15704.48260 + y * (-30.16036606))))));
      const p2 = 144725228442.0 + y * (2300535178.0 + y * (18583304.74 + y * (99447.43394 + y * (376.9991397 + y))));
      return p1 / p2;
    }
    const z = 8 / ax, y = z * z, xx = ax - 2.356194491;
    const p1 = 1.0 + y * (0.183105e-2 + y * (-0.3516396496e-4 + y * (0.2457520174e-5 + y * (-0.240337019e-6))));
    const p2 = 0.04687499995 + y * (-0.2002690873e-3 + y * (0.8449199096e-5 + y * (-0.88228987e-6 + y * 0.105787412e-6)));
    const ans = Math.sqrt(0.636619772 / ax) * (Math.cos(xx) * p1 - z * Math.sin(xx) * p2);
    return x < 0 ? -ans : ans;
  }
  function bessy0(x) {
    if (x < 8) {
      const y = x * x;
      const p1 = -2957821389.0 + y * (7062834065.0 + y * (-512359803.6 + y * (10879881.29 + y * (-86327.92757 + y * 228.4622733))));
      const p2 = 40076544269.0 + y * (745249964.8 + y * (7189466.438 + y * (47447.26470 + y * (226.1030244 + y))));
      return p1 / p2 + 0.636619772 * bessj0(x) * Math.log(x);
    }
    const z = 8 / x, y = z * z, xx = x - 0.785398164;
    const p1 = 1 + y * (-0.1098628627e-2 + y * (0.2734510407e-4 + y * (-0.2073370639e-5 + y * 0.2093887211e-6)));
    const p2 = -0.1562499995e-1 + y * (0.1430488765e-3 + y * (-0.6911147651e-5 + y * (0.7621095161e-6 + y * (-0.934935152e-7))));
    return Math.sqrt(0.636619772 / x) * (Math.sin(xx) * p1 + z * Math.cos(xx) * p2);
  }
  function bessy1(x) {
    if (x < 8) {
      const y = x * x;
      const p1 = x * (-4.900604943e13 + y * (1.275274390e13 + y * (-5.153438139e11 + y * (7.349264551e9 + y * (-4.237922726e7 + y * 8.511937935e4)))));
      const p2 = 2.499580570e14 + y * (4.244419664e12 + y * (3.733650367e10 + y * (2.245904002e8 + y * (1.020426050e6 + y * (3.549632885e3 + y)))));
      return p1 / p2 + 0.636619772 * (bessj1(x) * Math.log(x) - 1 / x);
    }
    const z = 8 / x, y = z * z, xx = x - 2.356194491;
    const p1 = 1.0 + y * (0.183105e-2 + y * (-0.3516396496e-4 + y * (0.2457520174e-5 + y * (-0.240337019e-6))));
    const p2 = 0.04687499995 + y * (-0.2002690873e-3 + y * (0.8449199096e-5 + y * (-0.88228987e-6 + y * 0.105787412e-6)));
    return Math.sqrt(0.636619772 / x) * (Math.sin(xx) * p1 + z * Math.cos(xx) * p2);
  }
  // ряд для J1 (первые четыре члена)
  const j1series = x => x / 2 - Math.pow(x, 3) / 16 + Math.pow(x, 5) / 384 - Math.pow(x, 7) / 18432;

  (function besselBlock() {
    const P = NM.plot($('plot-bessel'), { w: 620, h: 380, xmin: 0, xmax: 30, ymin: -0.85, ymax: 1.05, xlab: 'x', ylab: 'J, Y' });
    P.fn(bessj0, { color: NM.C.teal, width: 2.2 });
    P.fn(bessj1, { color: NM.C.green, width: 2.2 });
    P.fn(x => (x < 0.12 ? NaN : bessy0(x)), { color: NM.C.violet, width: 1.8, dash: '6 4' });
    P.fn(x => (x < 0.35 ? NaN : bessy1(x)), { color: NM.C.gray, width: 1.8, dash: '6 4' });
    const yref = [[1.5, -0.412309], [2.5, 0.145918], [3.5, 0.410188]];
    P.pts(yref, { fill: NM.C.red, r: 4.5 });
    P.legend([
      { c: NM.C.teal, t: 'J₀(x)' },
      { c: NM.C.green, t: 'J₁(x)' },
      { c: NM.C.violet, t: 'Y₀(x)', dash: 1 },
      { c: NM.C.gray, t: 'Y₁(x)', dash: 1 },
      { c: NM.C.red, t: 'эталоны Y₁ из работы' },
    ]);
    const yv = [bessy1(1.5), bessy1(2.5), bessy1(3.5)];
    const intJ1 = simpson(x => x * bessj1(x), 0.5, 1.5, 2000);
    $('out-bessel').innerHTML =
      `Y₁(1.5) = <b>${yv[0].toFixed(6)}</b> (работа: −0.412309)<br>` +
      `Y₁(2.5) = <b>${yv[1].toFixed(6)}</b> (работа: 0.145918)<br>` +
      `Y₁(3.5) = <b>${yv[2].toFixed(6)}</b> (работа: 0.410188)<br><br>` +
      `ряд работы для J₁ при x = 1: ${j1series(1).toFixed(8)},<br>аппроксимация J₁(1) = ${bessj1(1).toFixed(8)}<br><br>` +
      `\\(\\displaystyle\\int_{1/2}^{3/2} x\\,J_1(x)\\,dx\\) = <b>${intJ1.toFixed(6)}</b> (работа: 0.453262)`;
    NM.math($('out-bessel'));
    NM.check('Y₁(1.5), Y₁(2.5), Y₁(3.5) (работа)', yv, [-0.412309, 0.145918, 0.410188], 2e-5);
    NM.check('ряд J₁ из работы против аппроксимации при x=1', j1series(1), bessj1(1), 1e-6);
    NM.check('∫x·J₁dx на [0.5, 1.5] (работа: 0.453262)', intJ1, 0.453262, 1e-5);
  })();

  /* ---------- Лежандр (legP() — в common.js) ---------- */
  (function legBlock() {
    const P = NM.plot($('plot-leg'), { w: 620, h: 380, xmin: -1.05, xmax: 1.05, ymin: -1.05, ymax: 1.05, xlab: 'x', ylab: 'Pₙ(x)' });
    P.fn(x => legP(5, x), { color: NM.C.teal, width: 1.8 });
    P.fn(x => legP(6, x), { color: NM.C.green, width: 1.8 });
    P.fn(x => legP(7, x), { color: NM.C.violet, width: 2.4 });
    // корни P7 бисекцией
    const roots = [];
    let prev = legP(7, -1 + 1e-9);
    for (let i = 1; i <= 1400; i++) {
      const x = -1 + 2 * i / 1400;
      const v = legP(7, x);
      if (prev * v < 0) {
        let a = -1 + 2 * (i - 1) / 1400, b = x;
        for (let it = 0; it < 70; it++) {
          const m = (a + b) / 2;
          if (legP(7, a) * legP(7, m) <= 0) b = m; else a = m;
        }
        roots.push(Math.abs((a + b) / 2) < 1e-10 ? 0 : (a + b) / 2);
      } else if (v === 0) roots.push(x);
      prev = v;
    }
    P.pts(roots.map(r => [r, 0]), { fill: NM.C.red, r: 4.5 });
    P.legend([
      { c: NM.C.teal, t: 'P₅' }, { c: NM.C.green, t: 'P₆' }, { c: NM.C.violet, t: 'P₇' },
      { c: NM.C.red, t: 'корни P₇ = узлы Гаусса' },
    ]);
    const v = [legP(5, 0.6), legP(6, 0.6), legP(7, 0.6)];
    $('out-leg').innerHTML =
      `значения в точке 0.6 (сверка с работой):<br>` +
      `P₅(0.6) = <b>${v[0].toFixed(6)}</b> (работа: −0.15264)<br>` +
      `P₆(0.6) = <b>${v[1].toFixed(6)}</b> (работа: 0.172096)<br>` +
      `P₇(0.6) = <b>${v[2].toFixed(6)}</b> (работа: 0.322598)<br><br>` +
      `корни P₇: ${roots.map(r => NM.fnum(r, 6)).join(', ')}<br>` +
      `<span class="small">работа (NSolve): ±0.949108, ±0.741531, ±0.405845, 0 — те же семь чисел, что узлы квадратуры на странице «Интегрирование»</span>`;
    NM.check('P₅(0.6), P₆(0.6), P₇(0.6) (работа: −0.15264, 0.172096, 0.322598)',
      v, [-0.15264, 0.172096, 0.322598], 1e-5);
    NM.check('корни P₇ против NSolve работы',
      roots, [-0.949108, -0.741531, -0.405845, 0, 0.405845, 0.741531, 0.949108], 1e-6);
  })();

  /* ---------- Вольтерра ---------- */
  (function volterra() {
    // численно: трапеции по свёртке; узел t_i входит с нулевым весом (t - t_i = 0) → явная схема
    const Tend = 3, N = 300, h = Tend / N;
    const phi = [0];
    for (let i = 1; i <= N; i++) {
      const t = i * h;
      let s = 0;
      for (let j = 0; j < i; j++) s += (j === 0 ? 0.5 : 1) * (t - j * h) * phi[j];
      phi[i] = t * t + h * s;
    }
    const exact = t => Math.exp(t) + Math.exp(-t) - 2;
    const P = NM.plot($('plot-volt'), { w: 620, h: 380, xmin: 0, xmax: 3, ymin: -0.5, ymax: 18.5, xlab: 't', ylab: 'φ(t)' });
    P.fn(exact, { color: NM.C.ink, width: 2.6 });
    P.poly(phi.map((v, i) => [i * h, v]).filter((_, i) => i % 6 === 0), { color: NM.C.red, width: 0 });
    P.pts(phi.map((v, i) => [i * h, v]).filter((_, i) => i % 15 === 0), { fill: NM.C.red, r: 3.2 });
    P.fn(t => t * t, { color: NM.C.gray, width: 1.4, dash: '5 4' });
    P.legend([
      { c: NM.C.ink, t: 'φ(t) = eᵗ + e⁻ᵗ − 2 (Лаплас)' },
      { c: NM.C.red, t: 'численное решение (трапеции)' },
      { c: NM.C.gray, t: 'свободный член t²', dash: 1 },
    ]);
    $('out-volt').innerHTML =
      `φ(1): аналитически <b>${exact(1).toFixed(6)}</b>, численно ${phi[Math.round(1 / h)].toFixed(6)}<br>` +
      `φ(2): аналитически <b>${exact(2).toFixed(6)}</b>, численно ${phi[Math.round(2 / h)].toFixed(6)}<br>` +
      `φ(3): аналитически <b>${exact(3).toFixed(6)}</b>, численно ${phi[Math.round(3 / h)].toFixed(6)}<br>` +
      `<span class="small">интегральный оператор «накапливает» ошибку, но второй порядок трапеций держит расхождение ~10⁻⁵</span>`;
    NM.steps($('steps-volt'), 'Решение по шагам: преобразование Лапласа', [
      {
        f: '\\mathcal{L}\\bigl[t^2\\bigr]=\\dfrac{2}{p^3},\\qquad \\mathcal{L}[t]=\\dfrac{1}{p^2}',
        note: 'табличные изображения; свёртка (t−s) под интегралом — это ядро t, свёрнутое с φ',
      },
      {
        f: '\\Phi=\\dfrac{2}{p^3}+\\dfrac{\\Phi}{p^2}\\;\\Rightarrow\\;\\Phi\\Bigl(1-\\dfrac{1}{p^2}\\Bigr)',
        s: '\\dfrac{2}{p^3}',
        r: '\\Phi=\\dfrac{2}{p(p-1)(p+1)}',
      },
      {
        f: '\\Phi=-\\dfrac{2}{p}+\\dfrac{1}{p-1}+\\dfrac{1}{p+1}',
        s: '\\text{простейшие дроби}',
        r: '\\varphi(t)=e^{t}+e^{-t}-2',
        note: 'работа получила e⁻ᵗ(eᵗ−1)² и упростила до того же выражения',
      },
      {
        f: '\\varphi(1)',
        s: 'e+e^{-1}-2',
        r: NM.fmt(exact(1), 6),
      },
    ]);
    NM.check('Вольтерра: φ(1) численно против e+1/e−2', phi[Math.round(1 / h)], exact(1), 1e-4);
    NM.check('Вольтерра: φ(2) численно против аналитики', phi[Math.round(2 / h)], exact(2), 1e-3);
  })();

  /* ---------- самопроверки линейной алгебры ---------- */
  (function selfcheck() {
    const e3 = NM.eigenvalues(A3).map(e => e[0]);
    NM.check('собственные числа {{1,1,0},{1,1,−1},{0,1,1}} (работа: 1,1,1)', e3, [1, 1, 1], 2e-3);
    NM.check('rank(A − E) → геом. кратность 1', rank(subLam(A3, 1), 1e-7), 2, 0);
    const e4 = NM.eigenvalues(A4).map(e => e[0]).sort((a, b) => a - b);
    NM.check('собственные числа 4×4 (жорданова форма: 1,1,2,2)', e4, [1, 1, 2, 2], 1e-3);
    NM.check('ранги A−E и A−2E (по клетке на λ)', [rank(subLam(A4, 1), 1e-6), rank(subLam(A4, 2), 1e-6)], [3, 3], 0);
    const E = expm(AE);
    NM.check('e^A против эталона работы (9 элементов)',
      E.flat(), [2.5, 1.5, -6, -1.5, -4.5, 10, -0.5, -2.5, 5], 1e-9);
    NM.checkSummary('страница «Спецразделы»');
  })();
})();
