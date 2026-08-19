# -*- coding: utf-8 -*-
"""Содержательные тесты страниц курса «Высшая математика».

Структурная целостность проверяется в test_site.py; здесь проверяется то,
что специфично для этого сайта: единый каркас страниц, наличие блока
«Коротко» в каждой аналитической главе, шаблон разбора задачи на страницах ТР,
корректность записи формул KaTeX и рамка у собственных SVG-схем.

Раздел «Численные методы» (страницы n-*) влит из отдельного сайта и живёт по
своим правилам: у его глав нет блока «Коротко», зато каждая обязана нести
ссылку на парную аналитическую главу, а страницы живых расчётов — подключать
свои скрипты. Тесты этого раздела собраны в конце файла.
"""
import os
import re

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')

THEORY = sorted(f for f in os.listdir(SITE) if f.startswith('t-') and f.endswith('.html'))
TASKS = sorted(f for f in os.listdir(SITE) if f.startswith('z-') and f.endswith('.html'))
CHAPTERS = THEORY + TASKS
PAGES = sorted(f for f in os.listdir(SITE) if f.endswith('.html'))

# раздел «Численные методы»: главы теории и страницы живых расчётов
NUM_THEORY = sorted(f for f in os.listdir(SITE)
                    if f.startswith('n-') and not f.startswith('n-calc-') and f.endswith('.html'))
NUM_CALC = sorted(f for f in os.listdir(SITE) if f.startswith('n-calc-') and f.endswith('.html'))
NUMERIC = NUM_THEORY + NUM_CALC

# пара «численная глава ↔ аналитическая глава» (ссылки обязаны быть в обе стороны)
PAIRS = {
    'n-errors': 't-limits',
    'n-interp': 't-series',
    'n-integr': 't-integral',
    'n-roots': 't-derivative',
    'n-linalg': 't-linear',
    'n-ode': 't-diffeq',
    'n-pde': 't-fnp',
}


def read(name):
    with open(os.path.join(SITE, name), encoding='utf-8') as fh:
        return fh.read()


def test_all_chapters_present():
    """Все главы и разборы, объявленные в навигации, лежат на диске."""
    js = read(os.path.join('assets', 'site.js'))
    declared = {h for h in re.findall(r"h:\s*'([a-z0-9-]*)'", js) if h}
    assert declared, 'в site.js не найдено ни одной главы'
    missing = sorted(n for n in declared if not os.path.isfile(os.path.join(SITE, n + '.html')))
    assert not missing, 'в навигации есть, а файла нет: %s' % ', '.join(missing)


@pytest.mark.parametrize('name', PAGES)
def test_page_skeleton(name):
    """Единый каркас: кодировка, viewport, описание, общие стили и скрипт шапки."""
    html = read(name)
    assert '<meta charset="utf-8">' in html, 'нет кодировки'
    assert 'name="viewport"' in html, 'нет viewport'
    assert re.search(r'<meta name="description" content="[^"]{40,}"', html), \
        'нет содержательного description'
    assert 'assets/style.css' in html, 'не подключён общий стиль'
    assert 'assets/site.js' in html, 'не подключён общий скрипт шапки'
    assert re.search(r'<title>\s*\S', html), 'нет заголовка страницы'


@pytest.mark.parametrize('name', CHAPTERS)
def test_no_stub_left(name):
    """Ни одна глава не осталась заглушкой с планом «что будет»."""
    html = read(name)
    for marker in ('Глава готовится', 'Что будет в этой главе', 'class="tldr"'):
        assert marker not in html, 'осталась заглушка: «%s»' % marker


@pytest.mark.parametrize('name', CHAPTERS)
def test_short_block(name):
    """Каждая глава открывается блоком «Коротко»."""
    html = read(name)
    assert 'class="short"' in html, 'нет блока «Коротко»'
    m = re.search(r'class="short"(.{0,4000}?)</div>', html, re.S)
    assert m and 'Коротко' in m.group(1), 'в блоке нет заголовка «Коротко»'
    items = re.findall(r'<li>', m.group(1))
    assert len(items) >= 4, 'в блоке «Коротко» меньше четырёх пунктов сути'


@pytest.mark.parametrize('name', CHAPTERS)
def test_chapter_volume(name):
    """Глава — это изложение, а не аннотация."""
    html = read(name)
    assert len(html) > 18000, 'глава слишком короткая (%d байт)' % len(html)
    if name in THEORY:
        assert html.count('<h2') >= 4, 'в теоретической главе меньше четырёх разделов'
    else:
        # на странице разборов заголовки задач — <h3>, разделов <h2> немного
        assert html.count('<h2') >= 2, 'нет ни «Коротко», ни заключительного раздела'
        assert html.count('<h3') >= 5, 'меньше пяти заголовков разобранных задач'


@pytest.mark.parametrize('name', TASKS)
def test_task_template(name):
    """Разбор задачи: условие, шаги «формула = подстановка = результат», ответ, проверка."""
    html = read(name)
    tasks = re.findall(r'<div class="task"', html)
    assert len(tasks) >= 5, 'на странице меньше пяти разобранных задач'
    for block in ('class="given"', 'class="steps"', 'class="step"',
                  'class="what"', 'class="calc"', 'class="sub"'):
        assert block in html, 'нет элемента шаблона разбора: %s' % block
    assert html.count('class="answer"') >= len(tasks), 'не у каждой задачи есть ответ'
    assert html.count('class="check"') >= len(tasks), 'не у каждой задачи есть проверка'
    # слова «Ответ.»/«Проверка.» подставляет CSS — руками их дублировать не нужно
    assert not re.search(r'class="answer">\s*Ответ', html), 'дублируется слово «Ответ»'
    assert not re.search(r'class="check">\s*Проверка', html), 'дублируется слово «Проверка»'


@pytest.mark.parametrize('name', PAGES)
def test_katex_delimiters(name):
    """Формулы: парные $$ и \\( \\), внутри формул нет «сырого» знака «меньше»."""
    html = read(name)
    assert html.count('$$') % 2 == 0, 'непарные $$'
    assert html.count(r'\(') == html.count(r'\)'), r'непарные \( \)'
    # одиночный $ как разделитель не поддерживается mathfmt.js
    assert not re.search(r'(?<!\$)\$(?!\$)', html), 'одиночный $ — такой разделитель не работает'
    for f in re.findall(r'\$\$(.+?)\$\$', html, re.S) + re.findall(r'\\\((.+?)\\\)', html, re.S):
        assert '<' not in f, 'в формуле «сырой» знак «меньше», нужен &lt;: %s' % f[:80]
    for t in re.findall(r'\\text\{([^{}]*)\}', html):
        assert '·' not in t, 'точка-умножения внутри \\text{}: %s' % t


@pytest.mark.parametrize('name', PAGES)
def test_own_svg_frame(name):
    """Собственные схемы: рамка 640 по ширине и ограничение по ширине блока."""
    html = read(name)
    for tag in re.findall(r'<svg[^>]*class="[^"]*geo-board[^"]*"[^>]*>', html):
        assert re.search(r'viewBox="0 0 640 \d+(\.\d+)?"', tag), \
            'у схемы не канонический viewBox: %s' % tag[:120]
        assert 'max-width:640px' in tag.replace(' ', ''), \
            'у схемы нет max-width:640px: %s' % tag[:120]
    assert '<img' not in html, 'на странице растровая картинка — схемы должны быть своими SVG'


# ======================= раздел «Численные методы» =======================
# Перенесены из репозитория nummet и адаптированы: имена страниц другие,
# каркас и стили — общие с остальным сайтом.

def test_numeric_section_complete():
    """Раздел на месте целиком: обзор, семь глав теории, шесть живых расчётов."""
    assert os.path.isfile(os.path.join(SITE, 'numeric.html')), 'нет обзора раздела'
    assert len(NUM_THEORY) == 7, 'глав теории не семь: %s' % ', '.join(NUM_THEORY)
    assert len(NUM_CALC) == 6, 'страниц живых расчётов не шесть: %s' % ', '.join(NUM_CALC)


@pytest.mark.parametrize('name', NUMERIC)
def test_numeric_uses_common_shell(name):
    """Страницы раздела живут на общем каркасе, а не тащат свой."""
    html = read(name)
    assert 'assets/shell.js' in html, 'не подключён общий каркас'
    assert 'data-page="numeric"' in html, 'страница не подсвечивает раздел в навигации'
    assert '<style>' not in html, 'осталась собственная врезка стилей — место правил в style.css'
    assert 'class="crumb"' in html, 'нет хлебных крошек раздела'


@pytest.mark.parametrize('name', NUMERIC)
def test_numeric_volume(name):
    """Страница раздела — изложение или работающий расчёт, а не аннотация."""
    html = read(name)
    assert len(html) > 4000, 'страница слишком короткая (%d байт)' % len(html)
    assert html.count('<h2') >= 2, 'меньше двух разделов на странице'


@pytest.mark.parametrize('num,ana', sorted(PAIRS.items()))
def test_pair_links_both_ways(num, ana):
    """Каждая численная глава ссылается на аналитическую пару, и наоборот."""
    n_html, a_html = read(num + '.html'), read(ana + '.html')
    assert 'class="pair"' in n_html, '%s: нет врезки с аналитической парой' % num
    assert 'href="%s"' % ana in n_html, '%s: нет ссылки на пару %s' % (num, ana)
    assert 'class="pair"' in a_html, '%s: нет врезки с численной парой' % ana
    assert 'href="%s"' % num in a_html, '%s: нет обратной ссылки на %s' % (ana, num)


@pytest.mark.parametrize('name', NUM_THEORY + NUM_CALC)
def test_numeric_backlink_to_overview(name):
    """С любой страницы раздела можно вернуться в его оглавление."""
    assert 'href="numeric"' in read(name), 'нет ссылки на обзор раздела'


@pytest.mark.parametrize('name', NUM_CALC)
def test_live_calc_scripts(name):
    """Живой расчёт подключает общие движки и свой скрипт, и все они на диске."""
    html = read(name)
    for common in ('assets/common.js', 'assets/nm.js'):
        assert common in html, 'не подключён %s' % common
    own = re.findall(r'<script src="assets/([a-z0-9-]+\.js)"></script>', html)
    own = [f for f in own if f not in ('shell.js', 'site.js', 'common.js', 'nm.js')]
    assert len(own) == 1, 'ожидался ровно один собственный скрипт расчёта: %s' % own
    for f in ['common.js', 'nm.js'] + own:
        assert os.path.isfile(os.path.join(SITE, 'assets', f)), 'нет файла assets/%s' % f


def test_live_calc_steps_class_not_clashing():
    """Блок «решение по шагам» расчёта не занимает классы разбора типового расчёта.

    На страницах ТР .steps/.step — нумерованный разбор с counter-ами; если бы
    движок расчётов ставил те же классы, разбор бы поехал. Отсюда nm-steps.
    """
    js = read(os.path.join('assets', 'nm.js'))
    assert 'nm-step' in js, 'движок расчётов не использует класс nm-step'
    assert '"step"' not in js and "'steps'" not in js, \
        'движок расчётов занял классы .step/.steps разбора типового расчёта'
    css = read(os.path.join('assets', 'style.css'))
    assert '.nm-steps' in css and '.nm-step ' in css, 'в стилях нет правил nm-steps/nm-step'


def test_relmet_widget_kept():
    """Виджет многокритериального выбора квадратурной формулы переехал целиком."""
    html = read('n-integr.html')
    assert 'class="relmet-choice"' in html, 'нет контейнера виджета'
    assert '/relmet-choice.js' in html, 'не подключён скрипт виджета'
    assert 'application/json' in html, 'нет данных виджета'
    assert '"alternatives"' in html and '"criteria"' in html, 'в данных виджета нет альтернатив/критериев'
    assert 'Трапеции' in html and 'Ромберг' in html, 'потерялась таблица оценок методов'


def test_old_site_links_gone():
    """Ссылок на бывший отдельный сайт численных методов не осталось."""
    bad = [n for n in PAGES if 'duckdns.org/nummet' in read(n)]
    assert not bad, 'ссылка на исчезнувший сайт: %s' % ', '.join(bad)
