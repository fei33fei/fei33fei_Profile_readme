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

  /* ---------- 6. 复制邮箱 ---------- */
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

  function boot() {
    initNav();
    initReveal();
    initTakeover();
    initFilters();
    initCopy();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
