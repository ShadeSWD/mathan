# -*- coding: utf-8 -*-
"""Содержательные тесты страниц курса «Высшая математика».

Структурная целостность проверяется в test_site.py; здесь проверяется то,
что специфично для этого сайта: единый каркас страниц, наличие блока
«Коротко» в каждой главе, шаблон разбора задачи на страницах ТР, корректность
записи формул KaTeX и рамка у собственных SVG-схем.
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


def read(name):
    with open(os.path.join(SITE, name), encoding='utf-8') as fh:
        return fh.read()


def test_all_chapters_present():
    """Все главы и разборы, объявленные в навигации, лежат на диске."""
    js = read(os.path.join('assets', 'site.js'))
    declared = set(re.findall(r"h:\s*'([tz]-[a-z]+)'", js))
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
