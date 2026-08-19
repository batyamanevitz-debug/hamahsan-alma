/* =========================================================
   ALMA — category page: real filtering, sorting, paging, cart
   ========================================================= */
(function () {
  'use strict';

  var Store = window.AlmaStore;
  var grid = document.querySelector('.pgrid');
  if (!grid) return;

  var cards = [].slice.call(grid.querySelectorAll('.pcard'));
  var countEl = document.querySelector('.ctitle__count span');
  var pager = document.querySelector('.cpager');
  var PER_PAGE = 8;
  var page = 1;
  var sort = '';

  /* an empty-state message, appended once */
  var noRes = document.createElement('p');
  noRes.className = 'pgrid-empty';
  noRes.hidden = true;
  noRes.textContent = 'לא נמצאו מוצרים שמתאימים לסינון. נסי לנקות חלק מהמסננים.';
  grid.parentNode.insertBefore(noRes, grid.nextSibling);

  /* ---------------------------------------------------------
     filtering
     --------------------------------------------------------- */
  function checkedValues(name) {
    return [].slice.call(document.querySelectorAll('input[name="' + name + '"]:checked'))
      .map(function (i) { return i.value; });
  }

  function maxPrice() {
    var r = document.querySelector('.prange__input');
    return r ? Number(r.value) : Infinity;
  }

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

    /* keep the DOM order in sync with the chosen sort */
    listed.forEach(function (card) { grid.appendChild(card); });

    var pages = Math.max(1, Math.ceil(listed.length / PER_PAGE));
    if (page > pages) page = pages;
    var from = (page - 1) * PER_PAGE;

    cards.forEach(function (c) { c.hidden = true; });
    listed.slice(from, from + PER_PAGE).forEach(function (c) { c.hidden = false; });

    if (countEl) countEl.textContent = String(listed.length);
    noRes.hidden = listed.length > 0;
    grid.hidden = listed.length === 0;

    /* pagination reflects the filtered result */
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
     filter / sort dropdowns
     --------------------------------------------------------- */
  var wraps = [].slice.call(document.querySelectorAll('.fwrap'));

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
  window.addEventListener('resize', function () {
    wraps.forEach(function (w) { if (w.classList.contains('is-open')) clampPanel(w); });
  });

  /* checkboxes drive the grid and label their chip */
  document.querySelectorAll('.fpanel .fopts').forEach(function (list) {
    var wrap = list.closest('.fwrap');
    var chip = wrap.querySelector('.fchip');
    var label = chip.childNodes[0].nodeValue;
    list.addEventListener('change', function () {
      var n = list.querySelectorAll('input:checked').length;
      chip.childNodes[0].nodeValue = n ? label + ' (' + n + ')' : label;
      chip.classList.toggle('has-value', n > 0);
      apply(true);
    });
  });

  /* price slider */
  var range = document.querySelector('.prange__input');
  if (range) {
    var maxLabel = document.querySelector('.prange__max');
    var priceChip = range.closest('.fwrap').querySelector('.fchip');
    var priceLabel = priceChip.childNodes[0].nodeValue;
    range.addEventListener('input', function () {
      maxLabel.textContent = range.value;
      var full = Number(range.max);
      priceChip.childNodes[0].nodeValue = Number(range.value) < full
        ? priceLabel + ' (עד ' + range.value + ')' : priceLabel;
      priceChip.classList.toggle('has-value', Number(range.value) < full);
      apply(true);
    });
  }

  /* sort */
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

  /* ---------------------------------------------------------
     pagination
     --------------------------------------------------------- */
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
     add to cart (real items)
     --------------------------------------------------------- */
  grid.addEventListener('click', function (e) {
    var btn = e.target.closest('.pcard__cart');
    if (!btn) return;
    var card = btn.closest('.pcard');
    var name = card.querySelector('.pcard__name b').textContent.trim() + ' ' +
               card.querySelector('.pcard__name em').textContent.trim();

    Store.add({
      id: card.dataset.id,
      name: name,
      price: Number(card.dataset.price),
      img: card.querySelector('.pcard__media img').getAttribute('src'),
      url: card.querySelector('.pcard__link').getAttribute('href')
    });

    btn.classList.add('is-added');
    btn.textContent = 'נוסף לסל ✓';
    Store.toast(name + ' נוסף לסל');
    setTimeout(function () {
      btn.classList.remove('is-added');
      btn.textContent = 'הוספה לסל';
    }, 1600);
    setTimeout(window.AlmaOpenCart, 260);
  });

  /* ---------------------------------------------------------
     deep link from the search box:  category.html?q=...
     --------------------------------------------------------- */
  var q = new URLSearchParams(location.search).get('q');
  if (q) {
    var needle = q.trim().toLowerCase();
    cards.forEach(function (c) {
      var text = c.querySelector('.pcard__name').textContent.toLowerCase();
      if (text.indexOf(needle) < 0) c.dataset.filteredOut = '1';
    });
    var origMatches = matches;
    matches = function (card) { return !card.dataset.filteredOut && origMatches(card); };
  }

  apply(true);
})();
