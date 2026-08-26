/* =========================================================
   ALMA — דף כל הקטגוריות.
   הקטגוריות הראשיות מהעץ שבדאטהבייס, ותחת כל אחת
   תתי הקטגוריות שלה עם מספר המוצרים בכל אחת.
   ========================================================= */
(function () {
  'use strict';

  var Store = window.AlmaStore;
  var wrap = document.getElementById('catsTree');
  if (!wrap) return;

  /* תמונות העיגולים מהעיצוב, לפי slug */
  var IMG = {
    perfume: 'assets/cat-perfume.png',
    hair:    'assets/cat-hair.png',
    makeup:  'assets/cat-makeup.png',
    kids:    'assets/circ-kids.png',
    sets:    'assets/circ-sets.png',
    unisex:  'assets/circ-unisex.png',
    women:   'assets/circ-women.png',
    best:    'assets/circ-best.png'
  };

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function count(key) {
    try { return Store.category(key).items.length; }
    catch (e) { return 0; }
  }

  function imgFor(key, view) {
    return (view && view.image) || IMG[key] || null;
  }

  Store.ready.then(function () {
    var groups = Store.groups || {};
    var subs = Store.subviews || {};
    var rootKeys = Object.keys(groups);

    if (!rootKeys.length) {
      wrap.innerHTML = '<p class="doc-page__lead">לא נמצאו קטגוריות.</p>';
      return;
    }

    var total = rootKeys.length + Object.keys(subs).length;
    document.getElementById('catsCount').textContent =
      rootKeys.length + ' קטגוריות ראשיות ו-' + Object.keys(subs).length + ' תתי קטגוריות';

    wrap.innerHTML = rootKeys.map(function (rk) {
      var g = groups[rk];
      var img = imgFor(rk, g);
      var kids = Object.keys(subs).filter(function (k) { return subs[k].parent === rk; });

      var head =
        '<a class="catgroup__head" href="' + esc(Store.viewUrl(rk)) + '">' +
          (img ? '<img class="catgroup__img" src="' + esc(img) + '" alt="" loading="lazy">' : '') +
          '<span class="catgroup__txt">' +
            '<b class="catgroup__name">' + esc(g.title) + '</b>' +
            '<span class="catgroup__n">' + count(rk) + ' מוצרים</span>' +
          '</span>' +
        '</a>';

      var list = kids.length
        ? '<ul class="catsub">' + kids.map(function (k) {
            var sImg = imgFor(k, subs[k]);
            return '<li class="catsub__item">' +
              '<a href="' + esc(Store.viewUrl(k)) + '">' +
                (sImg ? '<img class="catsub__img" src="' + esc(sImg) + '" alt="" loading="lazy">'
                      : '<span class="catsub__dot" aria-hidden="true"></span>') +
                '<span class="catsub__txt">' +
                  '<b>' + esc(subs[k].title) + '</b>' +
                  '<em>' + count(k) + ' מוצרים</em>' +
                '</span>' +
              '</a></li>';
          }).join('') + '</ul>'
        : '';   /* מבצעים וחדש מתמלאות לפי כלל ואין להן תתי קטגוריות */

      return '<section class="catgroup">' + head + list + '</section>';
    }).join('');
  });
})();
