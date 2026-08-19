/* =========================================================
   ALMA — product page: gallery, tabs, cart, wishlist, reviews
   ========================================================= */
(function () {
  'use strict';

  var Store = window.AlmaStore;

  var PRODUCT = {
    id: 'marly-palatine',
    name: 'Parfumes De Marly פאלטין א.ד.פ 75 מ"ל',
    price: 1039.9,
    img: 'assets/pdp-sticky-thumb.png',
    url: 'product.html'
  };

  /* ---------------------------------------------------------
     gallery
     --------------------------------------------------------- */
  var main = document.getElementById('galleryMain');
  var thumbs = [].slice.call(document.querySelectorAll('#galleryThumbs .thumb'));

  function show(i) {
    if (!thumbs.length) return;
    i = (i + thumbs.length) % thumbs.length;
    var btn = thumbs[i];
    main.src = btn.getAttribute('data-full');
    thumbs.forEach(function (t) { t.classList.remove('is-active'); });
    btn.classList.add('is-active');
  }

  thumbs.forEach(function (btn, i) {
    btn.addEventListener('click', function () { show(i); });
  });

  function current() {
    var i = thumbs.findIndex(function (t) { return t.classList.contains('is-active'); });
    return i < 0 ? 0 : i;
  }

  var prev = document.querySelector('.gallery__nav--prev');
  var next = document.querySelector('.gallery__nav--next');
  if (prev) prev.addEventListener('click', function () { show(current() - 1); });
  if (next) next.addEventListener('click', function () { show(current() + 1); });

  /* keyboard arrows move the gallery too */
  document.addEventListener('keydown', function (e) {
    if (!thumbs.length) return;
    if (e.target.closest('input, textarea, select')) return;
    if (e.key === 'ArrowRight') show(current() - 1);
    if (e.key === 'ArrowLeft') show(current() + 1);
  });

  /* ---------------------------------------------------------
     tabs
     --------------------------------------------------------- */
  var tabs = [].slice.call(document.querySelectorAll('.ptab'));
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
        var p = document.getElementById(t.getAttribute('aria-controls'));
        if (p) { p.hidden = true; p.classList.remove('is-active'); }
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      var panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) { panel.hidden = false; panel.classList.add('is-active'); }
    });
  });

  /* ---------------------------------------------------------
     add to cart / buy now
     --------------------------------------------------------- */
  function addProduct() {
    Store.add(PRODUCT);
    Store.toast(PRODUCT.name + ' נוסף לסל');
  }

  document.querySelectorAll('.pbtn--cart, .sticky-buy__cart').forEach(function (btn) {
    btn.addEventListener('click', function () {
      addProduct();
      var txt = btn.textContent;
      btn.textContent = 'נוסף לסל ✓';
      setTimeout(function () { btn.textContent = txt; }, 1500);
      setTimeout(window.AlmaOpenCart, 200);
    });
  });

  var buy = document.querySelector('.pbtn--buy');
  if (buy) {
    buy.addEventListener('click', function (e) {
      e.preventDefault();
      Store.add(PRODUCT);
      window.location.href = 'checkout.html';
    });
  }

  /* scroll to the reviews from the rating line */
  var count = document.querySelector('.pinfo__count');
  if (count) {
    count.addEventListener('click', function (e) {
      e.preventDefault();
      document.getElementById('reviews').scrollIntoView({ behavior: 'smooth' });
    });
  }

  /* ---------------------------------------------------------
     sticky add-to-cart bar
     --------------------------------------------------------- */
  var sticky = document.getElementById('stickyBuy');
  var anchor = document.querySelector('.pinfo__actions');
  var footer = document.querySelector('.footer');

  if (sticky && anchor) {
    var ticking = false;

    function syncSticky() {
      ticking = false;
      var passed = anchor.getBoundingClientRect().bottom < 0;
      var atFooter = footer ? footer.getBoundingClientRect().top < window.innerHeight : false;
      var on = passed && !atFooter;
      sticky.classList.toggle('is-visible', on);
      sticky.setAttribute('aria-hidden', String(!on));
      document.body.classList.toggle('has-sticky', on);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(syncSticky);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    syncSticky();
  }

  /* ---------------------------------------------------------
     reviews — real paging + sorting + helpful votes
     --------------------------------------------------------- */
  var revList = document.querySelector('.rev__list');
  if (revList) {
    var STAR_FULL = 'assets/star-lilac.svg';
    var STAR_EMPTY = 'assets/star-empty.svg';

    var REVIEWS = [
      { name: 'נאדיה פ.', date: '10/11/25', stars: 5, text: 'שילוב ריחות אלגנטי ומתוחכם, עדין מאוד ופירותיי. מושלם לעונת המעבר. מאוהבת 3&gt;' },
      { name: 'אולגה ו.', date: '06/11/25', stars: 5, text: 'אני מכורה למוצר, קודם כול הוא נעים ויש לו ריח מטורף וזה כיף!' },
      { name: 'פיירוז ו.', date: '30/10/25', stars: 4, text: 'אין הזמנה שהוא לא נכנס לסל. נעים וקליל ונספג ברגע עם ריח מושלם' },
      { name: 'שירה מ.', date: '22/10/25', stars: 5, text: 'קיבלתי מחמאות כל היום הראשון שלבשתי אותו. מחזיק שעות ארוכות בלי להיות מתקתק.' },
      { name: 'רותם כ.', date: '14/10/25', stars: 5, text: 'הגיע ארוז יפה עם דוגמיות מתנה. הריח בדיוק כמו שציפיתי, נשי ומעודן.' },
      { name: 'יעל ב.', date: '02/10/25', stars: 4, text: 'מאוד אוהבת את הפתיחה של האגס והברגמוט. בערב הוא נהיה חמים ומפנק.' },
      { name: 'מיכל א.', date: '18/09/25', stars: 5, text: 'הבושם הכי מוצלח שקניתי השנה. השירות היה מהיר והמשלוח הגיע למחרת.' },
      { name: 'דנה ל.', date: '05/09/25', stars: 5, text: 'קניתי כמתנה לאמא שלי והיא לא מפסיקה להתלהב. אריזה מהממת.' },
      { name: 'נועה ר.', date: '28/08/25', stars: 3, text: 'ריח יפה מאוד אבל עליי הוא מחזיק פחות ממה שקיוויתי. עדיין נהנית ממנו.' }
    ];

    var PER = 3;
    var revPage = 1;
    var order = 'new';

    function starsHtml(n) {
      var out = '';
      for (var i = 5; i >= 1; i--) {
        out += '<img src="' + (i <= n ? STAR_FULL : STAR_EMPTY) + '" alt="">';
      }
      return out;
    }

    function reviewHtml(r) {
      return '<li class="rvi">' +
        '<p class="rvi__date">' + r.date + '</p>' +
        '<div class="rvi__body">' +
          '<div class="rvi__person">' +
            '<span class="rvi__pic"><img class="rvi__avatar" src="assets/rv-avatar.svg" alt="">' +
              '<img class="rvi__badge" src="assets/rv-verified.svg" alt=""></span>' +
            '<div class="rvi__who"><span class="rvi__name">' + r.name + '</span>' +
              '<span class="rvi__verified">כותב חוות דעת מאומת</span></div>' +
            '<span class="stars stars--lilac" aria-label="' + r.stars + ' מתוך 5">' + starsHtml(r.stars) + '</span>' +
          '</div>' +
          '<p class="rvi__text">' + r.text + '</p>' +
        '</div>' +
        '<div class="rvi__helpful">' +
          '<span class="rvi__q">האם הביקורת הזו הייתה מועילה?</span>' +
          '<span class="vote"><button type="button" data-vote="up" aria-label="מועיל">' +
            '<img src="assets/rv-thumb-up.svg" alt=""></button><span>0</span></span>' +
          '<span class="vote"><button type="button" data-vote="down" aria-label="לא מועיל">' +
            '<img src="assets/rv-thumb-down.svg" alt=""></button><span>0</span></span>' +
        '</div></li>';
    }

    function sorted() {
      var list = REVIEWS.slice();
      if (order === 'five') list = list.filter(function (r) { return r.stars === 5; });
      return list;
    }

    function renderReviews() {
      var list = sorted();
      var pages = Math.max(1, Math.ceil(list.length / PER));
      if (revPage > pages) revPage = pages;
      var from = (revPage - 1) * PER;
      revList.innerHTML = list.slice(from, from + PER).map(reviewHtml).join('');

      document.querySelectorAll('.pager__page').forEach(function (btn, i) {
        btn.hidden = i >= pages;
        btn.classList.toggle('is-active', i + 1 === revPage);
        if (i + 1 === revPage) btn.setAttribute('aria-current', 'page');
        else btn.removeAttribute('aria-current');
      });
    }

    document.querySelectorAll('.pager__page').forEach(function (btn, i) {
      btn.addEventListener('click', function () { revPage = i + 1; renderReviews(); });
    });
    var pPrev = document.querySelector('.pager__arrow:not(.pager__arrow--next)');
    var pNext = document.querySelector('.pager__arrow--next');
    if (pPrev) pPrev.addEventListener('click', function () { if (revPage > 1) { revPage--; renderReviews(); } });
    if (pNext) pNext.addEventListener('click', function () { revPage++; renderReviews(); });

    /* sort chips */
    var chips = [].slice.call(document.querySelectorAll('.chip'));
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var five = chip.textContent.indexOf('5') > -1;
        var on = chip.classList.contains('is-on');
        chips.forEach(function (c) { c.classList.remove('is-on'); });
        if (!on) chip.classList.add('is-on');
        order = (!on && five) ? 'five' : 'new';
        revPage = 1;
        renderReviews();
      });
    });

    /* helpful votes */
    revList.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-vote]');
      if (!btn) return;
      var num = btn.parentElement.querySelector('span');
      num.textContent = String((parseInt(num.textContent, 10) || 0) + 1);
      btn.disabled = true;
      btn.style.opacity = '.4';
    });

    /* write a review */
    var write = document.querySelector('.rev__write');
    if (write) {
      write.addEventListener('click', function () {
        Store.toast('תודה! טופס כתיבת חוות דעת ייפתח בקרוב');
      });
    }

    renderReviews();
  }
})();
