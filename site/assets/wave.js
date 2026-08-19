/* Струна: явная схема «крест», анимация, профили, сверка с numol. */
'use strict';
(function () {
  const L = 10, T = 10, NX = 100, NT = 100, H = 2, V0 = 1;

  // решение на сетке работы: NX точек по x, NT по t (dx = dt = 10/99, λ = a)
  function solve(g, a, normShape) {
    const dx = L / (NX - 1), dt = T / (NT - 1);
    const lam2 = Math.pow(a * dt / dx, 2);
    const phi = normShape
      ? x => H * (x / L) * (1 - x / L)
      : x => H * x * (1 - x);
    let u0 = [];
    for (let i = 0; i < NX; i++) u0.push(phi(i * dx));
    u0[0] = 0; u0[NX - 1] = 0;
    let u1 = u0.slice();
    for (let i = 1; i < NX - 1; i++) {
      const uxx = (u0[i + 1] - 2 * u0[i] + u0[i - 1]) / (dx * dx);
      u1[i] = u0[i] + dt * V0 + dt * dt / 2 * (a * a * uxx - g);
    }
    u1[0] = 0; u1[NX - 1] = 0;
    const sol = [u0.slice(), u1.slice()];
    for (let n = 2; n < NT; n++) {
      const un = new Array(NX);
      un[0] = 0; un[NX - 1] = 0;
      for (let i = 1; i < NX - 1; i++)
        un[i] = 2 * u1[i] - u0[i] + lam2 * (u1[i + 1] - 2 * u1[i] + u1[i - 1]) - dt * dt * g;
      sol.push(un.slice());
      u0 = u1; u1 = un;
    }
    return { sol, dx, dt };
  }

  /* ---------- профили ---------- */
  function drawProfiles() {
    const norm = $('ck-norm').checked;
    const s0 = solve(0, 1, norm);
    const sg = solve(9, 1, norm);
    const xs = i => i * s0.dx;
    const cols = [5, 15, 30];
    const cc = [NM.C.teal, NM.C.red, NM.C.green];
    const lim0 = norm ? [-1.6, 1.6] : [-90, 40];
    const limg = norm ? [-14, 2] : [-140, 20];
    const P0 = NM.plot($('plot-prof0'), { w: 560, h: 380, xmin: 0, xmax: 10, ymin: lim0[0], ymax: lim0[1], xlab: 'x', ylab: 'u' });
    const Pg = NM.plot($('plot-profg'), { w: 560, h: 380, xmin: 0, xmax: 10, ymin: limg[0], ymax: limg[1], xlab: 'x', ylab: 'u' });
    for (const [P, s] of [[P0, s0], [Pg, sg]]) {
      cols.forEach((c, k) => {
        P.poly(s.sol[c].map((u, i) => [xs(i), u]), { color: cc[k], width: 2 });
      });
      P.poly(s.sol[0].map((u, i) => [xs(i), u]), { color: NM.C.gray, width: 1.4, dash: '4 4' });
    }
    // равновесная парабола на графике с тяжестью
    Pg.fn(x => -9 * x * (L - x) / 2, { color: NM.C.ink, width: 1.2, dash: '2 4', opacity: 0.7 });
    const legend = cols.map((c, k) => ({ c: cc[k], t: 't = ' + NM.fnum(c * s0.dt, 2) + ' (столбец ' + c + ')' }));
    P0.legend(legend.concat([{ c: NM.C.gray, t: 'начальная форма', dash: 1 }]));
    Pg.legend(legend.concat([{ c: NM.C.ink, t: 'равновесная парабола', dash: 1 }]));
  }

  /* ---------- анимация ---------- */
  let anim = { run: true, g: 0, a: 1, norm: false, frame: 0, u0: null, u1: null, t: 0, raf: 0 };
  function animInit() {
    anim.g = $('ck-g').checked ? 9 : 0;
    anim.a = parseFloat($('in-a').value);
    anim.norm = $('ck-norm').checked;
    const dx = L / (NX - 1);
    // шаг по времени фиксирован по сетке: λ = 0.98·a — при a > 1.02 условие
    // Куранта нарушается, и это можно увидеть вживую (счёт сам перезапустится)
    anim.dt = dx * 0.98;
    const phi = anim.norm ? x => H * (x / L) * (1 - x / L) : x => H * x * (1 - x);
    anim.u0 = [];
    for (let i = 0; i < NX; i++) anim.u0.push(phi(i * dx));
    anim.u0[0] = 0; anim.u0[NX - 1] = 0;
    anim.u1 = anim.u0.slice();
    for (let i = 1; i < NX - 1; i++) {
      const uxx = (anim.u0[i + 1] - 2 * anim.u0[i] + anim.u0[i - 1]) / (dx * dx);
      anim.u1[i] = anim.u0[i] + anim.dt * V0 + anim.dt * anim.dt / 2 * (anim.a * anim.a * uxx - anim.g);
    }
    anim.u1[0] = 0; anim.u1[NX - 1] = 0;
    anim.t = anim.dt;
    const lam = anim.a * anim.dt / dx;
    $('out-courant').innerHTML = `условие Куранта: λ = a·τ/hₓ = <b>${NM.fnum(lam, 3)}</b> ` +
      (lam <= 1 ? '<span class="badge ok">схема устойчива</span>' : '<span class="badge bad">λ &gt; 1 — счёт развалится!</span>');
  }
  const AW = 860, AH = 380;
  let asvg, apoly, apoly0, atime;
  function animSetup() {
    const el = $('anim');
    el.innerHTML = '';
    asvg = NM.E('svg', { viewBox: `0 0 ${AW} ${AH}`, class: 'nm-plot' });
    el.appendChild(asvg);
    NM.E('line', { x1: 30, y1: AH / 2, x2: AW - 20, y2: AH / 2, stroke: '#d8d6cf', 'stroke-width': 1 }, asvg);
    apoly0 = NM.E('polyline', { fill: 'none', stroke: NM.C.gray, 'stroke-width': 1.2, 'stroke-dasharray': '4 4', opacity: 0.8 }, asvg);
    apoly = NM.E('polyline', { fill: 'none', stroke: NM.C.teal, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }, asvg);
    // закреплённые концы
    NM.E('circle', { cx: 30, cy: AH / 2, r: 5, fill: NM.C.ink }, asvg);
    NM.E('circle', { cx: AW - 20, cy: AH / 2, r: 5, fill: NM.C.ink }, asvg);
    atime = NM.E('text', { x: AW - 26, y: 26, 'text-anchor': 'end', fill: NM.C.gray, 'font-size': 15, 'font-family': 'ui-monospace,monospace' }, asvg);
  }
  function scaleY() {
    // амплитуда решения работы ~ ±240; нормированного ~ ±1.6 (или прогиб −g·l²/8a²)
    if (anim.norm) return anim.g ? 16 / (AH / 2 - 20) : 1.8 / (AH / 2 - 20);
    return 260 / (AH / 2 - 20);
  }
  function render(u) {
    const sy = scaleY();
    const pts = [];
    for (let i = 0; i < NX; i++) {
      const x = 30 + (AW - 50) * i / (NX - 1);
      pts.push(x.toFixed(1) + ',' + (AH / 2 - u[i] / sy).toFixed(1));
    }
    apoly.setAttribute('points', pts.join(' '));
  }
  function renderInit() {
    const phi = anim.norm ? x => H * (x / L) * (1 - x / L) : x => H * x * (1 - x);
    const sy = scaleY(), dx = L / (NX - 1), pts = [];
    for (let i = 0; i < NX; i++) {
      const x = 30 + (AW - 50) * i / (NX - 1);
      const u = (i === 0 || i === NX - 1) ? 0 : phi(i * dx);
      pts.push(x.toFixed(1) + ',' + (AH / 2 - u / sy).toFixed(1));
    }
    apoly0.setAttribute('points', pts.join(' '));
  }
  function step() {
    const dx = L / (NX - 1);
    const lam2 = Math.pow(anim.a * anim.dt / dx, 2);
    const un = new Array(NX);
    un[0] = 0; un[NX - 1] = 0;
    for (let i = 1; i < NX - 1; i++)
      un[i] = 2 * anim.u1[i] - anim.u0[i] + lam2 * (anim.u1[i + 1] - 2 * anim.u1[i] + anim.u1[i - 1]) - anim.dt * anim.dt * anim.g;
    anim.u0 = anim.u1; anim.u1 = un;
    anim.t += anim.dt;
    // защита от взрыва + зацикливание показа (после t = 40 картина повторяется)
    if (!isFinite(un[Math.floor(NX / 2)]) || Math.abs(un[Math.floor(NX / 2)]) > 1e6 || anim.t > 40) {
      animInit();
    }
  }
  function loop() {
    if (anim.run) {
      const sp = +$('in-speed').value;
      for (let i = 0; i < sp; i++) step();
      render(anim.u1);
      atime.textContent = 't = ' + anim.t.toFixed(2);
    }
    anim.raf = requestAnimationFrame(loop);
  }

  /* ---------- шаги ---------- */
  function drawSteps() {
    const dx = L / (NX - 1), dt = T / (NT - 1);
    const s0 = solve(0, 1, false);
    NM.steps($('steps-wave'), 'Решение по шагам: сетка работы (g = 0)', [
      {
        f: 'h_x=\\dfrac{l}{99},\\quad \\tau=\\dfrac{10}{99}',
        s: NM.fmt(dx, 4) + ',\\;' + NM.fmt(dt, 4),
        r: '\\lambda=\\dfrac{a\\tau}{h_x}=1',
        note: 'сетка 100 точек по x и 100 по t, как у numol в работе; λ = 1 — граница устойчивости и одновременно «магический шаг»',
      },
      {
        f: 'u_i^{0}=\\varphi(x_i)=2x_i(1-x_i)',
        s: '\\varphi(0.101)=' + NM.fmt(s0.sol[0][1], 3) + ',\\;\\varphi(0.505)=' + NM.fmt(s0.sol[0][5], 3),
        r: '0.182,\\;0.5\\ \\text{(строки 1 и 5 матрицы работы)}',
      },
      {
        f: 'u_i^{1}=u_i^{0}+\\tau v+\\dfrac{\\tau^2}{2}a^2(u_{xx})_i^{0}',
        s: 'u_{10}^{1}=' + NM.fmt(s0.sol[1][10], 4),
        r: '0.06\\ \\text{(работа: } sol_{10,1}=0.06)',
      },
      {
        f: 'u_i^{n+1}=2u_i^{n}-u_i^{n-1}+\\lambda^2\\bigl(u_{i+1}^{n}-2u_i^{n}+u_{i-1}^{n}\\bigr)',
        s: 'u_{13}^{7}=' + NM.fmt(s0.sol[7][13], 4),
        r: '-1.115\\ \\text{(работа: } sol_{13,7}=-1.115)',
        note: 'вся строка 13 совпадает с numol с точностью 0.001 — см. самопроверку в консоли',
      },
    ]);
  }

  /* ---------- события ---------- */
  $('ck-g').addEventListener('change', () => { animInit(); renderInit(); });
  $('in-a').addEventListener('input', () => { $('out-a').textContent = $('in-a').value; animInit(); renderInit(); });
  $('btn-pause').addEventListener('click', () => { anim.run = !anim.run; $('btn-pause').textContent = anim.run ? 'Пауза' : 'Пуск'; });
  $('btn-restart').addEventListener('click', () => { animInit(); renderInit(); });
  $('ck-norm').addEventListener('change', () => { animInit(); renderInit(); drawProfiles(); });

  animSetup();
  animInit();
  renderInit();
  loop();
  drawProfiles();
  drawSteps();

  /* ---------- самопроверки (numol-эталоны работы) ---------- */
  (function selfcheck() {
    const s0 = solve(0, 1, false);
    const sg = solve(9, 1, false);
    const row = (s, i, m) => Array.from({ length: m }, (_, j) => s.sol[j][i]);
    NM.check('начальный профиль: строки 1, 2, 5 (работа: 0.182, 0.322, 0.5)',
      [s0.sol[0][1], s0.sol[0][2], s0.sol[0][5]], [0.182, 0.322, 0.5], 1e-3);
    NM.check('g=0, строка 10 против numol (работа: −0.02, 0.06, 0.1, 0.099, 0.057, −0.026, −0.149, −0.312)',
      row(s0, 10, 8), [-0.02, 0.06, 0.1, 0.099, 0.057, -0.026, -0.149, -0.312], 2e-3);
    NM.check('g=0, строка 13 против numol (работа: −0.822 … −1.115)',
      row(s0, 13, 8), [-0.822, -0.742, -0.702, -0.703, -0.745, -0.827, -0.951, -1.115], 2e-3);
    NM.check('g=9, строка 10 против numol (работа: −0.02 … −2.562)',
      row(sg, 10, 8), [-0.02, 0.014, -0.084, -0.314, -0.677, -1.173, -1.801, -2.562], 2e-3);
    NM.check('g=9, строка 13 против numol (работа: −0.822 … −3.365)',
      row(sg, 13, 8), [-0.822, -0.788, -0.886, -1.116, -1.479, -1.975, -2.604, -3.365], 2e-3);
    const lam = 1 * (T / (NT - 1)) / (L / (NX - 1));
    NM.check('условие Куранта на сетке работы: λ ≤ 1', lam, 1, 1e-12);
    NM.checkSummary('страница «Струна»');
  })();
})();
