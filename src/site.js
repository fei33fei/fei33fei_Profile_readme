/* 沈亦菲 · 作品集 — 交互层
   原则：内容先可见，动效是增强层。没有 JS 时页面仍完整可用。 */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;

  /* ---------- 1. 揭示动效的开关（仅在支持 IntersectionObserver 时启用） ---------- */
  var canReveal = 'IntersectionObserver' in window;
  if (canReveal) root.classList.add('js');

  /* ---------- 2. 导航：移动端展开 / 当前章节 ---------- */
  function initNav() {
    var nav = doc.querySelector('[data-nav]');
    if (!nav) return;
    var toggle = nav.querySelector('.nav-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a')) {
          nav.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
    var here = location.pathname.replace(/\/index\.html$/, '/');
    nav.querySelectorAll('.site-nav__links a').forEach(function (a) {
      var href = a.getAttribute('href').replace(/\/index\.html$/, '/');
      if (href === here || (href !== '/' && here.indexOf(href) === 0)) {
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ---------- 3. 滚动揭示 ---------- */
  function initReveal() {
    if (!canReveal) return;
    var items = doc.querySelectorAll('[data-reveal]');
    if (!items.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
    items.forEach(function (el, i) {
      if (!el.style.getPropertyValue('--i')) el.style.setProperty('--i', String(i % 6));
      io.observe(el);
    });
  }

  /* ---------- 4. 纸面接管：细节页顶部切口随滚动展开 ---------- */
  function initTakeover() {
    var edge = doc.querySelector('[data-takeover]');
    if (!edge || !canReveal) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-taken');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });
    io.observe(edge);
  }

  /* ---------- 5. 项目筛选 ---------- */
  function initFilters() {
    var wrap = doc.querySelector('[data-filters]');
    if (!wrap) return;
    var buttons = wrap.querySelectorAll('[data-track-btn]');
    var cards = doc.querySelectorAll('[data-track]');
    var counter = doc.querySelector('[data-filter-count]');
    var live = doc.querySelector('[data-filter-live]');

    function apply(track) {
      var shown = 0;
      cards.forEach(function (card) {
        var match = track === 'all' || card.getAttribute('data-track') === track;
        card.classList.toggle('is-hidden', !match);
        if (match) shown++;
      });
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-track-btn') === track ? 'true' : 'false');
      });
      if (counter) counter.textContent = String(shown).padStart(2, '0') + ' / ' + String(cards.length).padStart(2, '0');
      if (live) live.textContent = '当前显示 ' + shown + ' 个项目';
      var url = new URL(location.href);
      if (track === 'all') url.searchParams.delete('track');
      else url.searchParams.set('track', track);
      history.replaceState(null, '', url);
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () { apply(b.getAttribute('data-track-btn')); });
    });

    var wanted = new URL(location.href).searchParams.get('track');
    var known = Array.prototype.some.call(buttons, function (b) { return b.getAttribute('data-track-btn') === wanted; });
    apply(known ? wanted : 'all');
  }

  /* ---------- 6. 简历版本切换 ---------- */
  function initResumeTabs() {
    var tabs = Array.prototype.slice.call(doc.querySelectorAll('[data-resume-tab]'));
    if (!tabs.length) return;
    var panels = Array.prototype.slice.call(doc.querySelectorAll('[data-resume-panel]'));

    function select(key, animate) {
      var apply = function () {
        tabs.forEach(function (t) {
          var on = t.getAttribute('data-resume-tab') === key;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.setAttribute('tabindex', on ? '0' : '-1');
        });
        panels.forEach(function (p) {
          p.hidden = p.getAttribute('data-resume-panel') !== key;
        });
      };
      if (animate && doc.startViewTransition) {
        doc.startViewTransition(apply);
      } else {
        apply();
      }
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () { select(tab.getAttribute('data-resume-tab'), true); });
      tab.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(tab);
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault(); var n = tabs[(i + 1) % tabs.length]; n.focus(); select(n.getAttribute('data-resume-tab'), true);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault(); var p = tabs[(i - 1 + tabs.length) % tabs.length]; p.focus(); select(p.getAttribute('data-resume-tab'), true);
        } else if (e.key === 'Home') {
          e.preventDefault(); tabs[0].focus(); select(tabs[0].getAttribute('data-resume-tab'), true);
        } else if (e.key === 'End') {
          e.preventDefault(); tabs[tabs.length - 1].focus(); select(tabs[tabs.length - 1].getAttribute('data-resume-tab'), true);
        }
      });
    });

    var initial = new URL(location.href).searchParams.get('v');
    var known = tabs.some(function (t) { return t.getAttribute('data-resume-tab') === initial; });
    select(known ? initial : tabs[0].getAttribute('data-resume-tab'), false);
  }

  /* ---------- 7. 复制邮箱 ---------- */
  function initCopy() {
    doc.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var value = btn.getAttribute('data-copy');
        var done = function () {
          var old = btn.getAttribute('data-label') || btn.textContent;
          btn.setAttribute('data-label', old);
          btn.textContent = '已复制 ' + value;
          setTimeout(function () { btn.textContent = old; }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(value).then(done).catch(function () {});
        }
      });
    });
  }

  /* ---------- 8. 打印 / 导出 PDF ---------- */
  function initPrint() {
    doc.querySelectorAll('[data-print]').forEach(function (btn) {
      btn.addEventListener('click', function () { window.print(); });
    });
  }

  function boot() {
    initNav();
    initReveal();
    initTakeover();
    initFilters();
    initResumeTabs();
    initCopy();
    initPrint();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
