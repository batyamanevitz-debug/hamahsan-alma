/* =========================================================
   ALMA — product page. תבנית אחת שנבנית מהקטלוג לפי ?id=
   ========================================================= */
(function () {
  'use strict';

  var Store = window.AlmaStore;
  var id = new URLSearchParams(location.search).get('id') || 'marly-palatine';
  var PRODUCT = Store.get(id);
  var copy = Store.copy(PRODUCT);

  var cartItem = {
    id: PRODUCT.id,
    name: PRODUCT.brand + ' ' + PRODUCT.name,
    price: PRODUCT.price,
    img: PRODUCT.img,
    url: Store.url(PRODUCT)
  };

  /* ---------------------------------------------------------
     fill the template
     --------------------------------------------------------- */
  function text(id, value) { var el = document.getElementById(id); if (el) el.textContent = value; }
  function html(id, value) { var el = document.getElementById(id); if (el) el.innerHTML = value; }

  document.title = PRODUCT.brand + ' ' + PRODUCT.name + ' | ALMA';
  var desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', PRODUCT.brand + ' ' + PRODUCT.name + ' — ' + copy.about.slice(0, 140));

  var catLink = document.getElementById('crumbCat');
  if (catLink) {
    catLink.textContent = PRODUCT.cat;
    catLink.href = Store.catUrl(PRODUCT);
  }

  var subLink = document.getElementById('crumbSub');
  if (subLink) {
    var sub = Store.subCrumb(PRODUCT);
    subLink.textContent = sub.label;
    subLink.href = sub.href;
  }
  text('crumbName', PRODUCT.brand + ' ' + PRODUCT.name);
  text('pBrand', PRODUCT.brand);
  html('pName', PRODUCT.name.replace(' 75 מ”ל', '<br>75 מ”ל'));
  text('pLatin', PRODUCT.latin || '');
  text('pSku', 'מק"ט: ' + PRODUCT.sku);
  text('pReviews', PRODUCT.reviews + ' חוות דעת');

  var priceEl = document.getElementById('pPrice');
  if (priceEl) {
    priceEl.innerHTML = '₪' + PRODUCT.price.toFixed(2) +
      (PRODUCT.old ? ' <s class="pinfo__old">₪' + PRODUCT.old.toFixed(2) + '</s>' : '');
  }

  var starsEl = document.getElementById('pStars');
  if (starsEl) {
    starsEl.innerHTML = '';
    for (var s = 0; s < 5; s++) {
      var im = document.createElement('img');
      im.src = 'assets/star-full.svg';
      im.alt = '';
      im.style.opacity = s < PRODUCT.rating ? '1' : '.25';
      starsEl.appendChild(im);
    }
    starsEl.setAttribute('aria-label', 'דירוג ' + PRODUCT.rating + ' מתוך 5');
  }

  /* tabs content */
  text('tab-about', copy.about);
  text('tab-who', copy.who);
  text('tab-love', copy.love);

  /* notes — only for perfumes (בעיצוב קיימות ארבע אריחי ניחוח בלבד) */
  var notes = document.getElementById('pNotes');
  if (notes && PRODUCT.kind) notes.hidden = true;

  /* wishlist button targets this product */
  var fav = document.querySelector('.gallery__fav');
  if (fav) {
    fav.setAttribute('data-wish', PRODUCT.id);
    var liked = Store.inWish(PRODUCT.id);
    fav.classList.toggle('is-on', liked);
    fav.setAttribute('aria-pressed', String(liked));
  }

  /* sticky bar */
  var sp = document.getElementById('stickyProduct');
  if (sp) {
    sp.querySelector('img').src = PRODUCT.img;
    sp.querySelector('p').textContent = PRODUCT.brand + ' ' + PRODUCT.name;
  }

  /* ---------------------------------------------------------
     gallery
     --------------------------------------------------------- */
  var main = document.getElementById('galleryMain');
  var thumbsWrap = document.getElementById('galleryThumbs');
  var shots = PRODUCT.gallery || [PRODUCT.img];

  if (main) {
    main.src = shots[0];
    main.alt = PRODUCT.brand + ' ' + PRODUCT.name;
  }

  if (thumbsWrap) {
    var thumbSrc = PRODUCT.thumbs || shots;
    thumbsWrap.innerHTML = shots.map(function (src, i) {
      return '<li><button class="thumb' + (i ? '' : ' is-active') + '" type="button" data-full="' + src +
        '" aria-label="תמונה ' + (i + 1) + '"><img src="' + (thumbSrc[i] || src) + '" alt=""></button></li>';
    }).join('');
    /* תמונה אחת — אין טעם בעמודת תמונות קטנות ובחצים */
    var single = shots.length < 2;
    thumbsWrap.hidden = single;
    document.querySelectorAll('.gallery__nav').forEach(function (b) { b.hidden = single; });
  }

  var thumbs = [].slice.call(document.querySelectorAll('#galleryThumbs .thumb'));

  function show(i) {
    if (!thumbs.length) return;
    i = (i + thumbs.length) % thumbs.length;
    var btn = thumbs[i];
    main.src = btn.getAttribute('data-full');
    thumbs.forEach(function (t) { t.classList.remove('is-active'); });
    btn.classList.add('is-active');
  }

  thumbs.forEach(function (btn, i) { btn.addEventListener('click', function () { show(i); }); });

  function current() {
    var i = thumbs.findIndex(function (t) { return t.classList.contains('is-active'); });
    return i < 0 ? 0 : i;
  }

  var prev = document.querySelector('.gallery__nav--prev');
  var next = document.querySelector('.gallery__nav--next');
  if (prev) prev.addEventListener('click', function () { show(current() - 1); });
  if (next) next.addEventListener('click', function () { show(current() + 1); });

  document.addEventListener('keydown', function (e) {
    if (thumbs.length < 2) return;
    if (e.target.closest('input, textarea, select')) return;
    if (e.key === 'ArrowRight') show(current() - 1);
    if (e.key === 'ArrowLeft') show(current() + 1);
  });

  /* ---------------------------------------------------------
     related products — נבנים מהקטלוג
     --------------------------------------------------------- */
  var relTrack = document.querySelector('.related__track');
  if (relTrack) {
    relTrack.innerHTML = Store.related(PRODUCT.id, 4).map(function (p) {
      return '<li class="rel"><a href="' + Store.url(p) + '">' +
        (p.old ? '<span class="rel__tag">מחיר מקורי<br>₪' + p.old.toFixed(2) + '</span>' : '') +
        '<span class="rel__media"><img src="' + p.img + '" alt="' + p.brand + ' ' + p.name + '"></span>' +
        '<span class="rel__name">' + p.name + '</span>' +
        '<span class="rel__prices">' +
          (p.old ? '<s class="rel__old">₪' + p.old.toFixed(2) + '</s>' : '') +
          '<b class="rel__price">₪' + p.price.toFixed(2) + '</b>' +
        '</span></a></li>';
    }).join('');
  }

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
  document.querySelectorAll('.pbtn--cart, .sticky-buy__cart').forEach(function (btn) {
    btn.addEventListener('click', function () {
      Store.add(cartItem);
      Store.toast(cartItem.name + ' נוסף לסל');
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
      Store.add(cartItem);
      window.location.href = 'checkout.html';
    });
  }

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
     reviews
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
      { name: 'רותם כ.', date: '14/10/25', stars: 5, text: 'הגיע ארוז יפה עם דוגמיות מתנה. בדיוק כמו שציפיתי, מעודן ומדויק.' },
      { name: 'יעל ב.', date: '02/10/25', stars: 4, text: 'הפתיחה שלו הכי אהובה עליי. בערב הוא נהיה חמים ומפנק.' },
      { name: 'מיכל א.', date: '18/09/25', stars: 5, text: 'הקנייה הכי מוצלחת שלי השנה. השירות היה מהיר והמשלוח הגיע למחרת.' },
      { name: 'דנה ל.', date: '05/09/25', stars: 5, text: 'קניתי כמתנה לאמא שלי והיא לא מפסיקה להתלהב. אריזה מהממת.' },
      { name: 'נועה ר.', date: '28/08/25', stars: 3, text: 'יפה מאוד אבל עליי הוא מחזיק פחות ממה שקיוויתי. עדיין נהנית ממנו.' }
    ];

    var PER = 3;
    var revPage = 1;
    var starFilter = null;   /* null = הכל, או 1..5 */
    var sortDir = 'new';     /* new = מהחדש לישן, old = הפוך */

    /* תאריך ממוין מתוך המחרוזת dd/mm/yy */
    REVIEWS.forEach(function (r) {
      var p = r.date.split('/');
      r.ts = new Date(2000 + Number(p[2]), Number(p[1]) - 1, Number(p[0])).getTime();
    });

    function starsHtml(n) {
      var out = '';
      for (var i = 5; i >= 1; i--) out += '<img src="' + (i <= n ? STAR_FULL : STAR_EMPTY) + '" alt="">';
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
      if (starFilter) list = list.filter(function (r) { return r.stars === starFilter; });
      list.sort(function (a, b) { return sortDir === 'new' ? b.ts - a.ts : a.ts - b.ts; });
      return list;
    }

    /* מצב הכפתורים מסונכרן עם המצב האמיתי */
    function syncControls(shown) {
      var chip = document.querySelector('[data-rev-filter]');
      if (chip) {
        var on = starFilter === 5;
        chip.classList.toggle('is-on', on);
        chip.setAttribute('aria-pressed', String(on));
      }
      var sortChip = document.querySelector('[data-rev-sort]');
      if (sortChip) {
        sortChip.classList.add('is-on');
        sortChip.classList.toggle('is-reversed', sortDir === 'old');
        sortChip.firstChild.nodeValue = (sortDir === 'new' ? 'החדש ביותר' : 'הישן ביותר') + ' ';
      }
      document.querySelectorAll('.bars li[data-star]').forEach(function (li) {
        var on = starFilter === Number(li.getAttribute('data-star'));
        li.classList.toggle('is-on', on);
        li.setAttribute('aria-pressed', String(on));
      });
      var note = document.getElementById('revFilterNote');
      if (note) {
        note.hidden = !starFilter;
        note.textContent = starFilter ? 'מוצגות ' + shown + ' חוות דעת בדירוג ' + starFilter + ' כוכבים · לניקוי הסינון' : '';
      }
    }

    function renderReviews() {
      var list = sorted();
      var pages = Math.max(1, Math.ceil(list.length / PER));
      if (revPage > pages) revPage = pages;
      var from = (revPage - 1) * PER;
      revList.innerHTML = list.length
        ? list.slice(from, from + PER).map(reviewHtml).join('')
        : '<li class="rev__empty">אין עדיין חוות דעת בדירוג הזה.</li>';
      syncControls(list.length);

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

    function setFilter(star) {
      starFilter = (starFilter === star) ? null : star;
      revPage = 1;
      renderReviews();
    }

    /* צ'יפ '5 כוכבים' — סינון */
    var filterChip = document.querySelector('[data-rev-filter]');
    if (filterChip) {
      filterChip.addEventListener('click', function () {
        setFilter(Number(filterChip.getAttribute('data-rev-filter')));
      });
    }

    /* צ'יפ 'החדש ביותר' — מיון לפי תאריך, לחיצה נוספת הופכת את הסדר */
    var sortChip = document.querySelector('[data-rev-sort]');
    if (sortChip) {
      sortChip.addEventListener('click', function () {
        sortDir = sortDir === 'new' ? 'old' : 'new';
        revPage = 1;
        renderReviews();
      });
    }

    /* פסי הדירוג בסיכום הם כפתורי סינון (כמו בפיגמה) */
    document.querySelectorAll('.bars li[data-star]').forEach(function (li) {
      var star = Number(li.getAttribute('data-star'));
      li.addEventListener('click', function () { setFilter(star); });
      li.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFilter(star); }
      });
    });

    /* שורת מצב + ניקוי סינון */
    var filterNote = document.createElement('button');
    filterNote.type = 'button';
    filterNote.id = 'revFilterNote';
    filterNote.className = 'rev__note';
    filterNote.hidden = true;
    filterNote.addEventListener('click', function () { starFilter = null; revPage = 1; renderReviews(); });
    revList.parentNode.insertBefore(filterNote, revList);

    revList.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-vote]');
      if (!btn) return;
      var num = btn.parentElement.querySelector('span');
      num.textContent = String((parseInt(num.textContent, 10) || 0) + 1);
      btn.disabled = true;
      btn.style.opacity = '.4';
    });

    var write = document.querySelector('.rev__write');
    if (write) {
      write.addEventListener('click', function () {
        Store.toast('תודה! טופס כתיבת חוות דעת ייפתח בקרוב');
      });
    }

    renderReviews();
  }
})();
