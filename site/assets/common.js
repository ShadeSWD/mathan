/* Общие помощники страниц «Численных методов»: короткий доступ к элементу и
 * несколько формул, которые нужны сразу нескольким страницам (раньше они были
 * скопированы в каждый файл). Подключается первым — до nm.js и скрипта
 * страницы. Объявления обычные, верхнего уровня: их видят остальные скрипты. */
'use strict';

/* элемент по id */
const $ = (id) => document.getElementById(id);

/* составная формула Симпсона: 2n разбиений отрезка [a, b] (как Intg(n) в работе) */
function simpson(f, a, b, n) {
  const h = (b - a) / (2 * n);
  let s = f(a) + f(b);
  for (let k = 1; k <= n; k++) s += 4 * f(a + h * (2 * k - 1));
  for (let k = 1; k < n; k++) s += 2 * f(a + h * 2 * k);
  return h / 3 * s;
}

/* многочлен Лежандра Pₙ(x) по рекуррентной формуле */
function legP(n, x) {
  if (n === 0) return 1;
  let p0 = 1, p1 = x;
  for (let k = 2; k <= n; k++) {
    const p2 = ((2 * k - 1) * x * p1 - (k - 1) * p0) / k;
    p0 = p1; p1 = p2;
  }
  return p1;
}

/* разделённые разности (общий случай) → коэффициенты многочлена Ньютона */
function newtonCoef(xs, ys) {
  const c = ys.slice();
  for (let k = 1; k < xs.length; k++)
    for (let i = xs.length - 1; i >= k; i--)
      c[i] = (c[i] - c[i - 1]) / (xs[i] - xs[i - k]);
  return c;
}

/* значение многочлена Ньютона в точке t (схема Горнера) */
function newtonEval(xs, c, t) {
  let s = c[c.length - 1];
  for (let i = c.length - 2; i >= 0; i--) s = s * (t - xs[i]) + c[i];
  return s;
}
