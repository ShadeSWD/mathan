/* Данные каркаса страниц. Машинерия — assets/shell.js. */
'use strict';
(function () {
  const me = document.currentScript;
  const root = (me && me.dataset.root) || './';
  buildSiteShell({
    root,
    page: (me && me.dataset.page) || '',
    brand: 'Высшая математика',
    logo: `
  <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
    <rect x="1" y="1" width="28" height="28" rx="6" fill="#0e7490"/>
    <path d="M4 24 H26" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
    <path d="M6 24 C 11 24 11 7 16 7 C 21 7 23 15 26 10" stroke="#ffd9a0"
      stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M6 24 V6" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
    nav: [
      { h: '', k: 'index', t: 'Обзор' },
      { t: 'Теория', h: 'theory', drop: [
        { h: 'theory', k: 'theory', t: 'Оглавление курса' },
        { h: 't-linear', k: 'theory', t: '1. Линейная алгебра' },
        { h: 't-geometry', k: 'theory', t: '2. Аналитическая геометрия' },
        { h: 't-limits', k: 'theory', t: '3. Пределы и непрерывность' },
        { h: 't-derivative', k: 'theory', t: '4. Производная' },
        { h: 't-integral', k: 'theory', t: '5. Интеграл' },
        { h: 't-fnp', k: 'theory', t: '6. Функции нескольких переменных' },
        { h: 't-series', k: 'theory', t: '7. Ряды' },
        { h: 't-diffeq', k: 'theory', t: '8. Дифференциальные уравнения' },
        { h: 't-probability', k: 'theory', t: '9. Вероятность и статистика' },
      ] },
      { t: 'Задачи', h: 'tasks', drop: [
        { h: 'tasks', k: 'tasks', t: 'Все разборы' },
        { h: 'z-linear', k: 'tasks', t: 'ТР‑1. Матрицы и системы' },
        { h: 'z-geometry', k: 'tasks', t: 'ТР‑1. Векторы и геометрия' },
        { h: 'z-limits', k: 'tasks', t: 'ТР‑2.1. Пределы' },
        { h: 'z-derivative', k: 'tasks', t: 'ТР‑2.2. Производная' },
        { h: 'z-fnp', k: 'tasks', t: 'ТР‑2.2. ФНП' },
        { h: 'z-integral', k: 'tasks', t: 'ТР‑3. Интегралы' },
        { h: 'z-series', k: 'tasks', t: 'ТР. Ряды' },
        { h: 'z-diffeq', k: 'tasks', t: 'ТР. Дифференциальные уравнения' },
        { h: 'z-probability', k: 'tasks', t: 'ТР. Вероятность и статистика' },
      ] },
      { h: 'sources', k: 'sources', t: 'Источники' },
    ],
    footer: `<div>Учебный сайт по курсу «Высшая математика» · кафедра математики СПбГМТУ · теория, разборы типовых расчётов и живые построения</div>`,
    markers: `<marker id="arrE" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
      <path d="M0,0 L10,4 L0,8 z" fill="#16161a"/></marker>
    <marker id="arrS" markerWidth="10" markerHeight="8" refX="1" refY="4" orient="auto">
      <path d="M10,0 L0,4 L10,8 z" fill="#16161a"/></marker>`,
  });
})();
