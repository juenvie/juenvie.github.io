/* ══════════════════════════════════════════════════════════
   site.js — masonry équilibrée + animations premium
   Chargé en defer sur toutes les pages. Zéro dépendance.
   ══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. Masonry équilibrée ─────────────────────────────────
     Remplace les colonnes CSS par une distribution "colonne la
     plus courte d'abord", calculée depuis les attributs
     width/height des images (aucune attente de chargement).   */
  function initMasonry(grid) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.photo-card'));
    if (cards.length < 3) return;
    var current = 0;

    function colCount() { return window.innerWidth <= 768 ? 2 : 3; }

    function build() {
      var n = colCount();
      if (n === current) return;
      current = n;

      cards.forEach(function (c) { if (c.parentNode) c.parentNode.removeChild(c); });
      while (grid.firstChild) grid.removeChild(grid.firstChild);

      grid.classList.add('masonry-active');
      var cols = [], heights = [];
      for (var i = 0; i < n; i++) {
        var col = document.createElement('div');
        col.className = 'masonry-col';
        grid.appendChild(col);
        cols.push(col);
        heights.push(0);
      }
      var gapRatio = (window.innerWidth <= 768 ? 6 : 8) / (grid.clientWidth / n || 400);
      var placed = [];

      cards.forEach(function (card) {
        var img = card.querySelector('img');
        var ratio = 4 / 3;
        if (img) {
          var w = parseInt(img.getAttribute('width'), 10);
          var h = parseInt(img.getAttribute('height'), 10);
          if (w > 0 && h > 0) ratio = h / w;
        }
        var min = 0;
        for (var i = 1; i < n; i++) if (heights[i] < heights[min] - 0.001) min = i;
        cols[min].appendChild(card);
        heights[min] += ratio + gapRatio;
        placed.push({ img: img, ratio: ratio, col: min });
        /* stagger en cascade : délai par colonne + position, pour
           une révélation gauche→droite naturelle au scroll */
        card.style.setProperty('--d', (min * 0.07 + (cols[min].children.length % 3) * 0.05).toFixed(2) + 's');
      });

      /* Égalisation des bas de colonnes : recadrage subtil et
         plafonné (±15 %, centré via object-fit) réparti sur chaque
         colonne pour que toutes finissent à la même hauteur.
         Quand N photos / N colonnes tombe juste, scale ≈ 1 : aucun effet. */
      var target = heights.reduce(function (a, b) { return a + b; }, 0) / n;
      placed.forEach(function (p) {
        if (!p.img) return;
        var scale = Math.max(0.85, Math.min(1.15, target / heights[p.col]));
        if (Math.abs(scale - 1) < 0.02) return;
        p.img.style.aspectRatio = (1 / (p.ratio * scale)).toFixed(4);
        p.img.style.objectFit = 'cover';
      });
    }

    build();
    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(build, 150);
    }, { passive: true });
  }
  document.querySelectorAll('.photo-grid').forEach(initMasonry);

  /* ── 2. Compteurs animés sur les stats ───────────────────── */
  function animateCounter(el) {
    var original = el.textContent.trim();
    var m = original.match(/^([\d.,]+)\s*(.*)$/);
    if (!m) return;
    var target = parseFloat(m[1].replace(',', '.'));
    if (!isFinite(target) || target <= 0) return;
    var suffix = m[2] || '';
    var decimals = target < 10 ? 1 : 0;
    var dur = 1100, t0 = null;
    function frame(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); /* ease-out cubic */
      var val = target * eased;
      el.textContent = (p < 1 ? val.toFixed(decimals) : m[1]) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var counters = document.querySelectorAll('.stat-number, .case-number');
  if (counters.length && !reduce && 'IntersectionObserver' in window) {
    var seen = new WeakSet();
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !seen.has(e.target)) {
          seen.add(e.target);
          animateCounter(e.target);
          cio.unobserve(e.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ── 3. Parallax léger du hero (index) ────────────────────── */
  var heroVisual = document.querySelector('.hero-visual');
  if (heroVisual && !reduce) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < window.innerHeight * 1.2) {
          heroVisual.style.transform = 'translateY(' + (y * 0.08).toFixed(1) + 'px)';
        }
        ticking = false;
      });
    }, { passive: true });
  }
})();
