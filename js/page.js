/* =========================================================
   ALMA — דף תוכן. תבנית אחת לשלושה מצבים:
     page.html?slug=about   דף תוכן
     page.html?post=<slug>  מאמר מהבלוג
     page.html?blog         רשימת כל המאמרים
   ========================================================= */
(function () {
  'use strict';

  var Store = window.AlmaStore;
  var wrap = document.getElementById('docPage');
  if (!wrap) return;

  var params = new URLSearchParams(location.search);
  var slug = params.get('slug');
  var post = params.get('post');
  var isBlog = params.has('blog');

  var crumb = document.getElementById('crumbTitle');

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function dateHe(iso) {
    return iso ? new Date(iso).toLocaleDateString('he-IL', {
      day: 'numeric', month: 'long', year: 'numeric'
    }) : '';
  }

  function setTitle(txt) {
    document.title = txt + ' | המחסן ALMA';
    if (crumb) crumb.textContent = txt;
  }

  function notFound(what) {
    setTitle('לא נמצא');
    wrap.innerHTML =
      '<h1 class="doc-page__title">הדף לא נמצא</h1>' +
      '<p class="doc-page__lead">' + esc(what) + '</p>' +
      '<p><a class="doc-page__back" href="index.html">חזרה לעמוד הבית</a></p>';
  }

  /* ---------------------------------------------------------
     רשימת המאמרים
     --------------------------------------------------------- */
  function renderBlogList() {
    wrap.hidden = true;
    var section = document.getElementById('postList');
    var grid = document.getElementById('postGrid');
    section.hidden = false;
    setTitle('Beauty Blog');

    Store.posts().then(function (list) {
      if (!list || !list.length) {
        grid.innerHTML = '<p class="doc-page__lead">עוד אין מאמרים. בקרוב.</p>';
        return;
      }
      grid.innerHTML = list.map(function (p) {
        return '<a class="pcardpost" href="page.html?post=' + encodeURIComponent(p.slug) + '">' +
          (p.cover_image
            ? '<span class="pcardpost__media"><img src="' + esc(p.cover_image) + '" alt="" loading="lazy"></span>'
            : '') +
          '<span class="pcardpost__body">' +
            '<span class="pcardpost__date">' + esc(dateHe(p.created_at)) + '</span>' +
            '<b class="pcardpost__title">' + esc(p.title) + '</b>' +
            (p.summary ? '<span class="pcardpost__sum">' + esc(p.summary) + '</span>' : '') +
          '</span></a>';
      }).join('');
    });
  }

  /* ---------------------------------------------------------
     מאמר בודד
     --------------------------------------------------------- */
  function renderPost() {
    Store.post(post).then(function (p) {
      if (!p) return notFound('ייתכן שהמאמר הוסר או שעדיין לא פורסם.');
      setTitle(p.title);

      var meta = document.querySelector('meta[name="description"]');
      if (meta && p.summary) meta.setAttribute('content', p.summary);

      wrap.innerHTML =
        (p.cover_image
          ? '<img class="doc-page__cover" src="' + esc(p.cover_image) + '" alt="">'
          : '') +
        '<h1 class="doc-page__title">' + esc(p.title) + '</h1>' +
        '<p class="doc-page__meta">' + esc(p.author) + ' · ' + esc(dateHe(p.created_at)) + '</p>' +
        (p.summary ? '<p class="doc-page__lead">' + esc(p.summary) + '</p>' : '') +
        '<div class="doc-page__body">' + p.content + '</div>' +
        '<p><a class="doc-page__back" href="page.html?blog">לכל המאמרים</a></p>';
    });
  }

  /* ---------------------------------------------------------
     דף תוכן
     --------------------------------------------------------- */
  function renderPage() {
    Store.page(slug).then(function (p) {
      if (!p) return notFound('ייתכן שהדף הוסר או שעדיין לא פורסם.');
      setTitle(p.title);
      wrap.innerHTML =
        '<h1 class="doc-page__title">' + esc(p.title) + '</h1>' +
        '<div class="doc-page__body">' + p.content + '</div>';
    });
  }

  if (isBlog) renderBlogList();
  else if (post) renderPost();
  else if (slug) renderPage();
  else notFound('לא צוין איזה דף להציג.');
})();
