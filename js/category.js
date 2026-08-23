/* =========================================================
   ALMA — category page. תבנית אחת לכל הקטגוריות לפי ?cat=
   women (ברירת מחדל) | perfume | makeup | hair
   ========================================================= */
(function () {
  'use strict';

  var Store = window.AlmaStore;
  var grid = document.getElementById('catGrid');
  if (!grid) return;

  var VIEW = Store.category(new URLSearchParams(location.search).get('cat'));
  var GROUP = VIEW.parent || VIEW.key;
  var PER_PAGE = 8;
  var page = 1;
  var sort = '';
  var cards = [];

  var BANNERS = {
    women:   'assets/cat-banner.png',
    perfume: 'assets/cat-banner.png',
    makeup:  null,   /* אין באנר ייעודי בעיצוב — רצועת לילך נקייה */
    hair:    null
  };

  var HEADINGS = { women: 'בישום', perfume: 'בישום', makeup: 'יופי וטיפוח', hair: 'שיער' };

  /* המסננים שרלוונטיים לבשמים בלבד */
  var PERFUME_ONLY = ['note', 'style', 'need'];

  /* ---------------------------------------------------------
     כותרת, באנר ופירורי לחם
     --------------------------------------------------------- */
  document.title = VIEW.title + ' | ALMA';
  var meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', VIEW.title + ' — ' + VIEW.items.length + ' מוצרים נבחרים בחנות ALMA. משלוח מהיר ומתנה בכל הזמנה.');

  var titleEl = document.getElementById('catTitle');
  if (titleEl) titleEl.textContent = VIEW.title;

  var bannerImg = document.getElementById('catBannerImg');
  var banner = document.getElementById('catBanner');
  if (bannerImg && banner) {
    var src = BANNERS[GROUP];
    if (src) { bannerImg.src = src; bannerImg.hidden = false; banner.classList.remove('cbanner--plain'); }
    else { bannerImg.hidden = true; banner.classList.add('cbanner--plain'); }
  }

  var crumb = document.getElementById('catCrumb');
  if (crumb) crumb.textContent = VIEW.crumb;
  var heading = document.getElementById('catHeading');
  if (heading) heading.textContent = HEADINGS[GROUP] || VIEW.title;

  /* ---------------------------------------------------------
     עיגולי תתי הקטגוריות
     --------------------------------------------------------- */
  var PERFUME_CIRCLES = [
    { img: 'assets/circ-kids.png',   label: 'ילדים',         href: 'category.html?cat=kids',   key: 'kids' },
    { img: 'assets/circ-sets.png',   label: 'מארזים',        href: 'category.html?cat=sets',   key: 'sets' },
    { img: 'assets/circ-unisex.png', label: 'יוניסקס',       href: 'category.html?cat=unisex', key: 'unisex' },
    { img: 'assets/circ-women.png',  label: 'נשים',          href: 'category.html',            key: 'women' },
    { img: 'assets/circ-best.png',   label: 'הנמכרים ביותר', href: 'category.html?cat=best',   key: 'best' }
  ];

  var MAIN_CIRCLES = [
    { img: 'assets/cat-perfume.png', label: 'בשמים',      href: 'category.html?cat=perfume', key: 'perfume' },
    { img: 'assets/cat-hair.png',    label: 'הכל לשיער',  href: 'category.html?cat=hair',    key: 'hair' },
    { img: 'assets/cat-makeup.png',  label: 'איפור',      href: 'category.html?cat=makeup',  key: 'makeup' }
  ];

  var circles = document.getElementById('catCircles');
  if (circles) {
    var list = GROUP === 'perfume' ? PERFUME_CIRCLES : MAIN_CIRCLES;
    circles.innerHTML = list.map(function (c) {
      var active = c.key === VIEW.key;
      return '<li class="circ' + (active ? ' is-active' : '') + '">' +
        '<a href="' + c.href + '"' + (active ? ' aria-current="page"' : '') + '>' +
        '<img src="' + c.img + '" alt=""><span>' + c.label + '</span></a></li>';
    }).join('');
  }

  /* ---------------------------------------------------------
     כרטיסי המוצרים
     --------------------------------------------------------- */
  function stars(n) {
    var out = '';
    for (var i = 0; i < 5; i++) {
      out += '<img src="assets/' + (i < n ? 'cstar-full' : 'cstar-empty') + '.svg" alt="">';
    }
    return out;
  }

  function cardHtml(p) {
    return '<li class="pcard" data-id="' + p.id + '" data-price="' + p.price + '"' +
      ' data-brand="' + p.brand + '" data-note="' + (p.note || '') + '"' +
      ' data-style="' + (p.style || '') + '" data-need="' + (p.need || '') + '"' +
      ' data-rating="' + p.rating + '">' +
      '<a class="pcard__link" href="' + Store.url(p) + '">' +
        '<span class="pcard__media"><img src="' + p.img + '" alt="' + p.brand + ' ' + p.name + '"></span>' +
        '<span class="pcard__name"><b>' + p.brand + '</b><em>' + p.name + '</em></span>' +
        '<span class="pcard__price">₪' + p.price.toFixed(2) + '</span>' +
        '<span class="pcard__rate">' +
          '<span class="pcard__rev">חוות דעת</span>' +
          '<span class="cstars">' + stars(p.rating) + '</span>' +
        '</span>' +
      '</a>' +
      '<button class="pcard__cart" type="button">הוספה לסל</button></li>';
  }

  grid.innerHTML = VIEW.items.map(cardHtml).join('');
  cards = [].slice.call(grid.querySelectorAll('.pcard'));

  var countEl = document.querySelector('.ctitle__count span');
  var pager = document.querySelector('.cpager');

  var noRes = document.createElement('p');
  noRes.className = 'pgrid-empty';
  noRes.hidden = true;
  noRes.textContent = VIEW.items.length
    ? 'לא נמצאו מוצרים שמתאימים לסינון. נסי לנקות חלק מהמסננים.'
    : 'הקטגוריה הזו עוד מתמלאת — בקרוב יהיו כאן מוצרים.';
  grid.parentNode.insertBefore(noRes, grid.nextSibling);

  /* ---------------------------------------------------------
     בניית המסננים לפי הקטגוריה
     --------------------------------------------------------- */
  var wraps = [].slice.call(document.querySelectorAll('.fwrap'));

  /* מותגים — מהמוצרים שבקטגוריה */
  var brandList = document.querySelector('#f-brand .fopts');
  if (brandList) {
    var brands = [];
    VIEW.items.forEach(function (p) { if (brands.indexOf(p.brand) < 0) brands.push(p.brand); });
    brands.sort();
    brandList.innerHTML = brands.map(function (b) {
      return '<li><label><input type="checkbox" name="brand" value="' + b + '">' +
        '<span class="fbox"></span><span class="ftext">' + b + '</span></label></li>';
    }).join('');
  }

  /* טווח מחירים — לפי המחירים בפועל */
  var range = document.querySelector('.prange__input');
  if (range && VIEW.items.length) {
    var prices = VIEW.items.map(function (p) { return p.price; });
    var lo = Math.floor(Math.min.apply(null, prices));
    var hi = Math.ceil(Math.max.apply(null, prices));
    range.min = lo;
    range.max = hi;
    range.value = hi;
    var minLabel = document.querySelector('.prange__min');
    var maxLabel = document.querySelector('.prange__max');
    if (minLabel) minLabel.textContent = lo;
    if (maxLabel) maxLabel.textContent = hi;
  }

  /* מסננים ייחודיים לבשמים */
  if (GROUP === 'makeup' || GROUP === 'hair') {
    wraps.forEach(function (w) {
      if (PERFUME_ONLY.indexOf(w.getAttribute('data-filter')) > -1) w.hidden = true;
    });
    wraps = wraps.filter(function (w) { return !w.hidden; });
  }

  /* ---------------------------------------------------------
     סינון, מיון ודפדוף
     --------------------------------------------------------- */
  function checkedValues(name) {
    return [].slice.call(document.querySelectorAll('input[name="' + name + '"]:checked'))
      .map(function (i) { return i.value; });
  }

  function maxPrice() { return range ? Number(range.value) : Infinity; }

  function matches(card) {
    var brands = checkedValues('brand');
    var notes = checkedValues('note');
    var styles = checkedValues('style');
    var needs = checkedValues('need');
    var ratings = checkedValues('rating').map(Number);

    if (brands.length && brands.indexOf(card.dataset.brand) < 0) return false;
    if (notes.length && notes.indexOf(card.dataset.note) < 0) return false;
    if (styles.length && styles.indexOf(card.dataset.style) < 0) return false;
    if (needs.length && needs.indexOf(card.dataset.need) < 0) return false;
    if (ratings.length && Number(card.dataset.rating) < Math.min.apply(null, ratings)) return false;
    if (Number(card.dataset.price) > maxPrice()) return false;
    return true;
  }

  function sortCards(listed) {
    var byName = function (a, b) {
      return a.querySelector('.pcard__name em').textContent
        .localeCompare(b.querySelector('.pcard__name em').textContent, 'he');
    };
    if (sort === 'az') listed.sort(byName);
    else if (sort === 'za') listed.sort(function (a, b) { return byName(b, a); });
    else if (sort === 'asc') listed.sort(function (a, b) { return a.dataset.price - b.dataset.price; });
    else if (sort === 'desc') listed.sort(function (a, b) { return b.dataset.price - a.dataset.price; });
    return listed;
  }

  function apply(resetPage) {
    if (resetPage) page = 1;

    var listed = sortCards(cards.filter(matches));
    listed.forEach(function (card) { grid.appendChild(card); });

    var pages = Math.max(1, Math.ceil(listed.length / PER_PAGE));
    if (page > pages) page = pages;
    var from = (page - 1) * PER_PAGE;

    cards.forEach(function (c) { c.hidden = true; });
    listed.slice(from, from + PER_PAGE).forEach(function (c) { c.hidden = false; });

    if (countEl) countEl.textContent = String(listed.length);
    noRes.hidden = listed.length > 0;
    grid.hidden = listed.length === 0;

    if (pager) {
      pager.hidden = listed.length <= PER_PAGE;
      pager.querySelectorAll('.cpager__page').forEach(function (btn, i) {
        btn.hidden = i >= pages;
        btn.classList.toggle('is-active', i + 1 === page);
        if (i + 1 === page) btn.setAttribute('aria-current', 'page');
        else btn.removeAttribute('aria-current');
      });
    }
  }

  /* ---------------------------------------------------------
     חלוניות הסינון והמיון
     --------------------------------------------------------- */
  function closeWrap(wrap) {
    wrap.classList.remove('is-open');
    var btn = wrap.querySelector('.fchip, .fsort');
    if (btn) { btn.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
  }

  function clampPanel(wrap) {
    var panel = wrap.querySelector('.fpanel');
    if (!panel) return;
    panel.style.right = '';
    var r = panel.getBoundingClientRect();
    if (r.left < 8) panel.style.right = Math.round(r.left - 8) + 'px';
    else if (r.right > window.innerWidth - 8) panel.style.right = Math.round(r.right - window.innerWidth + 8) * -1 + 'px';
  }

  function openWrap(wrap) {
    wraps.forEach(function (w) { if (w !== wrap) closeWrap(w); });
    wrap.classList.add('is-open');
    var btn = wrap.querySelector('.fchip, .fsort');
    if (btn) { btn.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
    clampPanel(wrap);
  }

  wraps.forEach(function (wrap) {
    var btn = wrap.querySelector('.fchip, .fsort');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (wrap.classList.contains('is-open')) closeWrap(wrap);
      else openWrap(wrap);
    });
    var panel = wrap.querySelector('.fpanel');
    if (panel) panel.addEventListener('click', function (e) { e.stopPropagation(); });
  });

  document.addEventListener('click', function () { wraps.forEach(closeWrap); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') wraps.forEach(closeWrap);
  });

  function clampAll() { wraps.forEach(clampPanel); }
  window.addEventListener('resize', clampAll);
  window.addEventListener('load', clampAll);
  clampAll();

  /* צ'קבוקסים */
  document.querySelectorAll('.fpanel .fopts').forEach(function (optList) {
    var wrap = optList.closest('.fwrap');
    var chip = wrap.querySelector('.fchip');
    if (!chip) return;
    var label = chip.childNodes[0].nodeValue;
    optList.addEventListener('change', function () {
      var n = optList.querySelectorAll('input:checked').length;
      chip.childNodes[0].nodeValue = n ? label + ' (' + n + ')' : label;
      chip.classList.toggle('has-value', n > 0);
      apply(true);
    });
  });

  /* סליידר מחיר */
  if (range) {
    var priceChip = range.closest('.fwrap').querySelector('.fchip');
    var priceLabel = priceChip.childNodes[0].nodeValue;
    var maxOut = document.querySelector('.prange__max');
    range.addEventListener('input', function () {
      if (maxOut) maxOut.textContent = range.value;
      var full = Number(range.max);
      priceChip.childNodes[0].nodeValue = Number(range.value) < full
        ? priceLabel + ' (עד ' + range.value + ')' : priceLabel;
      priceChip.classList.toggle('has-value', Number(range.value) < full);
      apply(true);
    });
  }

  /* מיון */
  document.querySelectorAll('.fsorts button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.fsorts button').forEach(function (b) { b.classList.remove('is-selected'); });
      btn.classList.add('is-selected');
      sort = btn.getAttribute('data-sort');
      var sortBtn = document.querySelector('.fsort');
      sortBtn.childNodes[0].nodeValue = btn.textContent.trim();
      sortBtn.classList.add('has-value');
      wraps.forEach(closeWrap);
      apply(true);
    });
  });

  /* דפדוף */
  if (pager) {
    pager.querySelectorAll('.cpager__page').forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        page = i + 1;
        apply(false);
        window.scrollTo({ top: grid.offsetTop - 160, behavior: 'smooth' });
      });
    });
    var prev = pager.querySelector('.cpager__arrow--prev');
    var next = pager.querySelector('.cpager__arrow--next');
    if (prev) prev.addEventListener('click', function () { if (page > 1) { page--; apply(false); } });
    if (next) next.addEventListener('click', function () { page++; apply(false); });
  }

  /* ---------------------------------------------------------
     הוספה לסל
     --------------------------------------------------------- */
  grid.addEventListener('click', function (e) {
    var btn = e.target.closest('.pcard__cart');
    if (!btn) return;
    var card = btn.closest('.pcard');
    var p = Store.get(card.dataset.id);

    Store.add({
      id: p.id,
      name: p.brand + ' ' + p.name,
      price: p.price,
      img: p.img,
      url: Store.url(p)
    });

    btn.classList.add('is-added');
    btn.textContent = 'נוסף לסל ✓';
    Store.toast(p.brand + ' ' + p.name + ' נוסף לסל');
    setTimeout(function () {
      btn.classList.remove('is-added');
      btn.textContent = 'הוספה לסל';
    }, 1600);
    setTimeout(window.AlmaOpenCart, 260);
  });

  /* ---------------------------------------------------------
     חיפוש מהכותרת:  category.html?q=...
     --------------------------------------------------------- */
  var q = new URLSearchParams(location.search).get('q');
  if (q) {
    var needle = q.trim().toLowerCase();
    cards.forEach(function (c) {
      var text = c.querySelector('.pcard__name').textContent.toLowerCase();
      if (text.indexOf(needle) < 0) c.dataset.filteredOut = '1';
    });
    var base = matches;
    matches = function (card) { return !card.dataset.filteredOut && base(card); };
  }

  apply(true);
})();
