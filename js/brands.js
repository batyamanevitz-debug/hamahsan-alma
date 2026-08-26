/* =========================================================
   ALMA — דף המותגים. רשימת כל המותגים מהדאטהבייס,
   כל אחד מוביל לכל המוצרים שלו.
   ========================================================= */
(function () {
  'use strict';

  var Store = window.AlmaStore;
  var grid = document.getElementById('brandGrid');
  if (!grid) return;

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ראשי התיבות של המותג, כשאין לו לוגו */
  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/).slice(0, 2);
    return parts.map(function (w) { return w.charAt(0); }).join('');
  }

  Promise.all([Store.ready, Store.brands()]).then(function (res) {
    var brands = res[1] || [];

    /* מותג מוצג אם יש לו מוצרים, או אם יש לו לוגו — כך ששישת
       המותגים שברצועה בעמוד הבית מופיעים כאן גם לפני שנוספו
       להם מוצרים. מותג בלי מוצרים ובלי לוגו לא מוסיף כלום. */
    var rows = brands.map(function (b) {
      return {
        b: b,
        n: Store.products.filter(function (p) { return p.brandId === b.id; }).length
      };
    }).filter(function (r) { return r.n > 0 || r.b.logo_url; });

    var note = document.getElementById('brandCount');

    if (!rows.length) {
      note.textContent = 'עוד לא שויכו מוצרים למותגים.';
      grid.innerHTML = '';
      return;
    }

    note.textContent = rows.length + ' מותגים בחנות';

    /* מותג עם לוגו קודם — הרצועה נראית מלאה ולא מנוקדת בראשי תיבות */
    rows.sort(function (a, b) {
      var la = a.b.logo_url ? 0 : 1, lb = b.b.logo_url ? 0 : 1;
      return la - lb || b.n - a.n || a.b.name.localeCompare(b.b.name);
    });

    grid.innerHTML = rows.map(function (r) {
      var logo = r.b.logo_url
        ? '<img class="brandcard__logo" src="' + esc(r.b.logo_url) + '" alt="' + esc(r.b.name) + '" loading="lazy">'
        : '<span class="brandcard__initials" aria-hidden="true">' + esc(initials(r.b.name)) + '</span>';

      return '<li class="brandcard">' +
        '<a href="' + esc(Store.brandUrl(r.b.slug)) + '">' +
          '<span class="brandcard__media">' + logo + '</span>' +
          '<b class="brandcard__name">' + esc(r.b.name) + '</b>' +
          '<span class="brandcard__n">' +
            (r.n ? r.n + (r.n === 1 ? ' מוצר' : ' מוצרים') : 'בקרוב') +
          '</span>' +
        '</a></li>';
    }).join('');
  });
})();
