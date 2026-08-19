/* =========================================================
   ALMA — shared UI behaviour (all pages)
   ========================================================= */
(function () {
  'use strict';

  var Store = window.AlmaStore;

  /* ---------------------------------------------------------
     mobile menu
     --------------------------------------------------------- */
  var burger = document.querySelector('.nav__burger');
  var menu = document.getElementById('primary-menu');

  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      menu.classList.toggle('is-open', !open);
    });

    menu.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      /* a mega-menu trigger only opens its sub-menu — it must not close the drawer */
      if (link && link.parentElement && link.parentElement.classList.contains('has-mega')) return;
      if (link) {
        burger.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open');
      }
    });
  }

  /* ---------------------------------------------------------
     mega menu
     --------------------------------------------------------- */
  var megaItems = [].slice.call(document.querySelectorAll('.has-mega'));
  var desktop = window.matchMedia('(min-width: 1025px)');

  function closeMega(item) {
    item.classList.remove('is-open');
    var t = item.querySelector(':scope > a');
    if (t) t.setAttribute('aria-expanded', 'false');
  }

  function openMega(item) {
    megaItems.forEach(function (other) { if (other !== item) closeMega(other); });
    item.classList.add('is-open');
    var t = item.querySelector(':scope > a');
    if (t) t.setAttribute('aria-expanded', 'true');
  }

  megaItems.forEach(function (item) {
    var trigger = item.querySelector(':scope > a');
    if (!trigger) return;

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      if (item.classList.contains('is-open')) closeMega(item);
      else openMega(item);
    });

    item.addEventListener('mouseenter', function () { if (desktop.matches) openMega(item); });
    item.addEventListener('mouseleave', function () { if (desktop.matches) closeMega(item); });
  });

  if (megaItems.length) {
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.has-mega')) megaItems.forEach(closeMega);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') megaItems.forEach(closeMega);
    });
    desktop.addEventListener('change', function () { megaItems.forEach(closeMega); });
  }

  /* ---------------------------------------------------------
     search panel — live results over the catalog
     --------------------------------------------------------- */
  var searchPanel = document.getElementById('searchPanel');
  var searchBtn = document.querySelector('.nav__icons .nav__icon:first-child');

  if (searchPanel && searchBtn) {
    var searchInput = searchPanel.querySelector('.search-panel__input');
    var results = document.createElement('div');
    results.className = 'search-results';
    results.hidden = true;
    searchPanel.parentNode.appendChild(results);   /* לא בתוך הפאנל, כדי שלא ייחתך */

    var closeSearch = function () {
      searchPanel.classList.remove('is-open');
      searchPanel.setAttribute('aria-hidden', 'true');
      searchBtn.setAttribute('aria-expanded', 'false');
      results.hidden = true;
    };

    var openSearch = function () {
      searchPanel.classList.add('is-open');
      searchPanel.setAttribute('aria-hidden', 'false');
      searchBtn.setAttribute('aria-expanded', 'true');
      setTimeout(function () { searchInput.focus(); }, 180);
    };

    var renderResults = function (list, q) {
      if (!q || q.length < 2) { results.hidden = true; return; }
      if (!list.length) {
        results.innerHTML = '<p class="search-results__empty">לא נמצאו תוצאות עבור &rdquo;' + q + '&rdquo;</p>';
        results.hidden = false;
        return;
      }
      results.innerHTML = list.map(function (p) {
        return '<a class="sres" href="' + p.url + '">' +
          '<img src="' + p.img + '" alt="">' +
          '<span class="sres__txt"><b>' + p.brand + '</b><em>' + p.name + '</em></span>' +
          '<span class="sres__price">' + Store.money(p.price) + '</span></a>';
      }).join('');
      results.hidden = false;
    };

    searchBtn.setAttribute('aria-expanded', 'false');
    searchBtn.setAttribute('aria-controls', 'searchPanel');
    searchBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (searchPanel.classList.contains('is-open')) closeSearch();
      else openSearch();
    });

    searchInput.addEventListener('input', function () {
      var q = searchInput.value.trim();
      renderResults(Store.search(q), q);
    });

    searchPanel.querySelectorAll('[data-search-close]').forEach(function (b) {
      b.addEventListener('click', closeSearch);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && searchPanel.classList.contains('is-open')) {
        closeSearch();
        searchBtn.focus();
      }
    });
    searchPanel.querySelector('.search-panel__form').addEventListener('submit', function (e) {
      e.preventDefault();
      var q = searchInput.value.trim();
      if (!q) { searchInput.focus(); return; }
      var hit = Store.search(q)[0];
      if (hit) window.location.href = hit.url;
      else Store.toast('לא נמצאו תוצאות עבור ' + q);
    });
  }

  /* ---------------------------------------------------------
     header badges
     --------------------------------------------------------- */
  var badges = document.querySelectorAll('.nav__badge');
  var wishBadge = badges[0];
  var cartBadge = badges[1];

  /* ---------------------------------------------------------
     cart drawer — rendered from the store
     --------------------------------------------------------- */
  var drawer = document.getElementById('cartDrawer');
  var overlay = document.getElementById('cartOverlay');
  var renderCart = function () {};

  function openCart() {
    if (!drawer) return;
    overlay.hidden = false;
    requestAnimationFrame(function () { overlay.classList.add('is-open'); });
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cart-open');
    var close = drawer.querySelector('.cart__close');
    if (close) close.focus();
  }

  function closeCart() {
    if (!drawer) return;
    overlay.classList.remove('is-open');
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cart-open');
    setTimeout(function () {
      if (!drawer.classList.contains('is-open')) overlay.hidden = true;
    }, 320);
  }

  window.AlmaOpenCart = openCart;

  if (drawer && overlay) {
    var list = document.getElementById('cartList');
    var totalEl = document.getElementById('cartTotal');
    var emptyEl = document.getElementById('cartEmpty');
    var noteEl = drawer.querySelector('.cart__note');
    var checkoutBtn = drawer.querySelector('.cart__checkout');

    var itemHtml = function (i) {
      return '<li class="citem" data-id="' + i.id + '">' +
        '<div class="citem__row">' +
          '<div class="citem__main">' +
            '<div class="citem__top">' +
              '<button class="citem__close" type="button" data-cart-remove aria-label="הסרת המוצר">' +
                '<img src="assets/cart-close.svg" alt=""></button>' +
              '<p class="citem__name">' + i.name + '</p>' +
            '</div>' +
            '<div class="citem__price">' +
              '<p class="citem__cost' + (i.price ? '' : ' citem__cost--free') + '">' +
                (i.price ? Store.money(i.price * i.qty) : 'חינם') + '</p>' +
              '<div class="qty">' +
                '<button class="qty__btn qty__btn--plus" type="button" data-qty="1" aria-label="הוספת יחידה">' +
                  '<img src="assets/cart-plus.svg" alt=""></button>' +
                '<span class="qty__val">' + i.qty + '</span>' +
                '<button class="qty__btn qty__btn--minus" type="button" data-qty="-1" aria-label="הפחתת יחידה">' +
                  '<img src="assets/cart-minus.svg" alt=""></button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<span class="citem__img"><img src="' + i.img + '" alt=""></span>' +
        '</div></li>';
    };

    renderCart = function () {
      var items = Store.cart();
      list.innerHTML = items.map(itemHtml).join('');
      var empty = !items.length;
      list.hidden = empty;
      if (emptyEl) emptyEl.hidden = !empty;
      if (noteEl) noteEl.hidden = empty;
      if (checkoutBtn) {
        checkoutBtn.classList.toggle('is-disabled', empty);
        checkoutBtn.setAttribute('aria-disabled', String(empty));
      }
      if (totalEl) totalEl.textContent = Store.money(Store.subtotal());
    };

    list.addEventListener('click', function (e) {
      var item = e.target.closest('.citem');
      if (!item) return;
      var id = item.getAttribute('data-id');

      var qtyBtn = e.target.closest('[data-qty]');
      if (qtyBtn) {
        var cur = Store.cart().filter(function (i) { return i.id === id; })[0];
        if (cur) Store.setQty(id, cur.qty + parseInt(qtyBtn.getAttribute('data-qty'), 10));
        return;
      }
      if (e.target.closest('[data-cart-remove]')) Store.remove(id);
    });

    overlay.addEventListener('click', closeCart);
    drawer.querySelectorAll('[data-cart-close]').forEach(function (b) {
      b.addEventListener('click', closeCart);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeCart();
    });
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function (e) {
        if (!Store.cart().length) { e.preventDefault(); Store.toast('הסל שלך ריק'); }
      });
    }

    var cartIcon = document.querySelectorAll('.nav__icon')[3];
    if (cartIcon) cartIcon.addEventListener('click', function (e) { e.preventDefault(); openCart(); });
  }

  /* ---------------------------------------------------------
     wishlist buttons — data-wish="<id>"
     --------------------------------------------------------- */
  function syncWish() {
    document.querySelectorAll('[data-wish]').forEach(function (btn) {
      var on = Store.inWish(btn.getAttribute('data-wish'));
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', String(on));
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-wish]');
    if (!btn) return;
    e.preventDefault();
    var on = Store.toggleWish(btn.getAttribute('data-wish'));
    Store.toast(on ? 'נוסף למועדפים' : 'הוסר מהמועדפים');
  });

  var wishIcon = document.querySelectorAll('.nav__icon')[2];
  if (wishIcon) {
    wishIcon.addEventListener('click', function (e) {
      e.preventDefault();
      var n = Store.wishCount();
      Store.toast(n ? 'יש לך ' + n + ' פריטים במועדפים' : 'רשימת המועדפים ריקה');
    });
  }

  /* ---------------------------------------------------------
     keep the UI in sync with the store
     --------------------------------------------------------- */
  Store.onChange(function () {
    if (cartBadge) cartBadge.textContent = String(Store.count());
    if (wishBadge) wishBadge.textContent = String(Store.wishCount());
    renderCart();
    syncWish();
    document.dispatchEvent(new CustomEvent('alma:change'));
  });


  /* ---------------------------------------------------------
     placeholder links — tell the user instead of jumping to top
     --------------------------------------------------------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href="#"]');
    if (!a) return;
    if (a.parentElement && a.parentElement.classList.contains('has-mega')) return;
    if (a.hasAttribute('data-wish') || a.classList.contains('nav__icon')) return;
    e.preventDefault();
    Store.toast('הדף הזה לא נכלל בעיצוב — בקרוב');
  });

  /* ---------------------------------------------------------
     carousels
     --------------------------------------------------------- */
  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    var track = root.querySelector('[data-track]');
    if (!track) return;

    var section = root.closest('section');
    var dots = section ? section.querySelector('[data-dots]') : null;

    function step() {
      var first = track.firstElementChild;
      if (!first) return 300;
      var gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
      return first.getBoundingClientRect().width + gap;
    }

    function scrollBySteps(dir) {
      var rtl = getComputedStyle(track).direction === 'rtl';
      var amount = step() * (rtl ? -1 : 1);
      track.scrollBy({ left: dir === 'next' ? amount : -amount, behavior: 'smooth' });
    }

    root.querySelectorAll('[data-dir]').forEach(function (btn) {
      btn.addEventListener('click', function () { scrollBySteps(btn.getAttribute('data-dir')); });
    });

    function syncArrows() {
      var max = track.scrollWidth - track.clientWidth;
      var scrollable = max > 8;
      var pos = Math.abs(track.scrollLeft);
      var prev = root.querySelector('.carousel__arrow--prev');
      var next = root.querySelector('.carousel__arrow--next');
      if (prev) prev.style.opacity = scrollable && pos <= 2 ? '.45' : '1';
      if (next) next.style.opacity = scrollable && pos >= max - 2 ? '.45' : '1';

      if (dots) {
        var items = dots.querySelectorAll('.dot');
        if (items.length && max > 0) {
          var idx = Math.round((pos / max) * (items.length - 1));
          items.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
        }
      }
    }

    track.addEventListener('scroll', syncArrows, { passive: true });
    window.addEventListener('resize', syncArrows);
    syncArrows();
  });

  /* ---------------------------------------------------------
     newsletter
     --------------------------------------------------------- */
  var nl = document.querySelector('.newsletter__form');
  if (nl) {
    nl.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = nl.querySelector('input');
      if (!input.checkValidity()) { input.focus(); Store.toast('נא להזין כתובת מייל תקינה'); return; }
      var mail = input.value;
      input.value = '';
      input.placeholder = 'תודה! נרשמת בהצלחה';
      Store.toast('נרשמת לניוזלטר עם ' + mail);
    });
  }
})();
