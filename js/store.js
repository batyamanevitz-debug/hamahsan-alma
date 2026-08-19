/* =========================================================
   ALMA — shared store: cart + wishlist (localStorage)
   נטען לפני main.js בכל הדפים
   ========================================================= */
(function (window) {
  'use strict';

  var CART_KEY = 'alma.cart.v1';
  var WISH_KEY = 'alma.wish.v1';
  var listeners = [];

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch (e) { return []; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  var cart = read(CART_KEY);
  var wish = read(WISH_KEY);

  function emit() {
    write(CART_KEY, cart);
    write(WISH_KEY, wish);
    listeners.forEach(function (fn) { fn(); });
  }

  var Store = {
    /* ---------- cart ---------- */
    cart: function () { return cart.slice(); },

    add: function (item, qty) {
      qty = qty || 1;
      var found = cart.filter(function (i) { return i.id === item.id; })[0];
      if (found) found.qty += qty;
      else cart.push({
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        img: item.img || 'assets/pdp-sticky-thumb.png',
        url: item.url || '#',
        qty: qty
      });
      emit();
      return found ? found.qty : qty;
    },

    setQty: function (id, qty) {
      cart.forEach(function (i) { if (i.id === id) i.qty = Math.max(1, qty); });
      emit();
    },

    remove: function (id) {
      cart = cart.filter(function (i) { return i.id !== id; });
      emit();
    },

    clear: function () { cart = []; emit(); },

    count: function () {
      return cart.reduce(function (n, i) { return n + i.qty; }, 0);
    },

    subtotal: function () {
      return cart.reduce(function (n, i) { return n + i.price * i.qty; }, 0);
    },

    /* ---------- wishlist ---------- */
    wish: function () { return wish.slice(); },
    wishCount: function () { return wish.length; },
    inWish: function (id) { return wish.indexOf(id) > -1; },
    toggleWish: function (id) {
      var i = wish.indexOf(id);
      if (i > -1) wish.splice(i, 1); else wish.push(id);
      emit();
      return wish.indexOf(id) > -1;
    },

    /* ---------- helpers ---------- */
    onChange: function (fn) { listeners.push(fn); fn(); },

    money: function (n) {
      return '₪ ' + (Math.round(n * 100) / 100).toLocaleString('he-IL', { maximumFractionDigits: 2 });
    },

    toast: function (msg) {
      var host = document.getElementById('almaToast');
      if (!host) {
        host = document.createElement('div');
        host.id = 'almaToast';
        host.className = 'toast';
        host.setAttribute('role', 'status');
        host.setAttribute('aria-live', 'polite');
        document.body.appendChild(host);
      }
      host.textContent = msg;
      host.classList.add('is-on');
      clearTimeout(host._t);
      host._t = setTimeout(function () { host.classList.remove('is-on'); }, 2200);
    }
  };

  /* keep tabs in sync */
  window.addEventListener('storage', function (e) {
    if (e.key === CART_KEY) { cart = read(CART_KEY); listeners.forEach(function (f) { f(); }); }
    if (e.key === WISH_KEY) { wish = read(WISH_KEY); listeners.forEach(function (f) { f(); }); }
  });


  /* ---------------------------------------------------------
     CATALOG — כל המוצרים באתר. דף המוצר נבנה מכאן לפי ?id=
     --------------------------------------------------------- */
  var P = 'PARFUMS DE MARLY';

  Store.products = [
    /* --- בשמי נשים (דף הקטגוריה) --- */
    { id:'chanel-coromandel', brand:'CHANEL', name:'קורומנדאל א.ד.פ', latin:'Coromandel E.D.P',
      price:2199.9, sku:'425-0512', img:'assets/p-chanel-coromandel.png',
      style:'אבקתי', note:'זרעים', need:'ערב', rating:5, reviews:214, cat:'בשמי נשים' },

    { id:'creed-spice', brand:'CREED', name:'ספייס והוד א.ד.פ', latin:'Spice And Wood E.D.P',
      price:1629.9, sku:'425-0501', img:'assets/p-creed-spice.png',
      style:'אגוזי', note:'שרף', need:'ערב', rating:3, reviews:96, cat:'בשמי נשים' },

    { id:'maison-amyris', brand:'MAISON FRANCIS', name:'אמיריס פם א.ד.פ', latin:'Amyris Femme E.D.P',
      price:1549.9, sku:'425-0502', img:'assets/p-maison-amyris.png',
      style:'מתוק', note:'צמחים', need:'אירוע', rating:5, reviews:181, cat:'בשמי נשים' },

    { id:'roja-oud', brand:'ROJA', name:'אוד קריסטל פרפיום', latin:'Oud Crystal Parfum',
      price:1439.9, sku:'425-0503', img:'assets/p-roja-oud.png',
      style:'אגוזי', note:'שרף', need:'אירוע', rating:5, reviews:143, cat:'בשמי נשים' },

    { id:'malle-portrait', brand:'FREDERIC MALLE', name:'פורטרייט אוף ליידי א.ד.פ', latin:'Portrait Of A Lady E.D.P',
      price:1119.9, sku:'425-0505', img:'assets/p-malle-portrait.png',
      style:'אבקתי', note:'צמחים', need:'ערב', rating:5, reviews:307, cat:'בשמי נשים' },

    { id:'marly-palatine', brand:'Parfumes De Marly', name:'פאלטין א.ד.פ 75 מ”ל', latin:'Palatine E.D.P',
      price:1039.9, sku:'425-0526', img:'assets/pdp-main.png',
      gallery:['assets/pdp-main.png','assets/pdp-thumb-2.png','assets/pdp-thumb-3.png','assets/pdp-thumb-4.png','assets/pdp-thumb-5.png'],
      thumbs:['assets/pdp-thumb-1.png','assets/pdp-thumb-2.png','assets/pdp-thumb-3.png','assets/pdp-thumb-4.png','assets/pdp-thumb-5.png'],
      style:'פירותיי', note:'פירות', need:'יומיומי', rating:5, reviews:520, cat:'בשמי נשים',
      about:'הבושם Palatine E.D.P של מותג בשמי הבוטיק מרלי, שואב את השראתו מאישיות צבעונית מהמאה ה – 18, נסיכת פאלטין שהיתה ידועה בחוכמה ותעוזה, באומץ לב ואלגנטיות. הניחוח נפתח בתערובת תוססת של אגס וברגמוט המעניקים רעננות נעימה, מתפתח לעוצמה שובת לב בזכות זר פרחים מודרני ונשי ומתיישב על בסיס חזק, עמיד ויוקרתי המעניק תחושה מפנקת דרך המאסק.' },

    { id:'marly-delina', brand:P, name:'דאלינה א.ד.פ', latin:'Delina E.D.P',
      price:969.9, sku:'425-0507', img:'assets/p-marly-delina.png',
      gallery:['assets/p-marly-delina.png','assets/rel-delina.png'],
      style:'פירותיי', note:'פירות', need:'יומיומי', rating:5, reviews:412, cat:'בשמי נשים' },

    { id:'creed-carmina', brand:'CREED', name:'קרמינה א.ד.פ', latin:'Carmina E.D.P',
      price:959.9, sku:'425-0508', img:'assets/p-creed-carmina.png',
      style:'מתוק', note:'צמחים', need:'ערב', rating:5, reviews:128, cat:'בשמי נשים' },

    { id:'tomford-tobacco', brand:'TOM FORD', name:'טוברוס א.ד.פ', latin:'Tubereuse Nue E.D.P',
      price:949.9, sku:'425-0509', img:'assets/p-tomford-tobacco.png',
      style:'אגוזי', note:'צמחים', need:'ערב', rating:5, reviews:265, cat:'בשמי נשים' },

    { id:'creed-wind', brand:'CREED', name:'ווינד פלוארס א.ד.פ', latin:'Wind Flowers E.D.P',
      price:949.9, sku:'425-0510', img:'assets/p-creed-windflowers.png',
      style:'רענן', note:'צמחים', need:'יומיומי', rating:5, reviews:174, cat:'בשמי נשים' },

    { id:'penh-halfeti', brand:'PENHALIGONS', name:'חאלפטי לדר א.ד.פ', latin:'Halfeti Leather E.D.P',
      price:919.9, sku:'425-0511', img:'assets/p-penh-halfeti.png',
      style:'אגוזי', note:'שרף', need:'אירוע', rating:5, reviews:99, cat:'בשמי נשים' },

    { id:'creed-virgin', brand:'CREED', name:'וירג’יניה איסלנד ווטר א.ד.פ', latin:'Virgin Island Water E.D.P',
      price:919.9, sku:'425-0513', img:'assets/p-creed-virgin.png',
      style:'רענן', note:'פירות', need:'יומיומי', rating:5, reviews:238, cat:'בשמי נשים' },

    { id:'penh-constance', brand:'PENHALIGONS', name:'צאנגינג קונסטנס א.ד.פ', latin:'Changing Constance E.D.P',
      price:899.9, sku:'425-0514', img:'assets/p-penh-constance.png',
      style:'אבקתי', note:'צמחים', need:'אירוע', rating:5, reviews:87, cat:'בשמי נשים' },

    { id:'malle-lipstick', brand:'FREDERIC MALLE', name:'ליפסטיק רוז א.ד.פ', latin:'Lipstick Rose E.D.P',
      price:899.9, sku:'425-0515', img:'assets/p-malle-lipstick.png',
      style:'מתוק', note:'צמחים', need:'ערב', rating:5, reviews:156, cat:'בשמי נשים' },

    { id:'marly-oriana', brand:P, name:'אוריאנה א.ד.פ', latin:'Oriana E.D.P',
      price:849.9, sku:'425-0516', img:'assets/p-marly-oriana.png',
      style:'פירותיי', note:'פירות', need:'יומיומי', rating:5, reviews:301, cat:'בשמי נשים' },

    { id:'bond-goldcoast', brand:'BOND NO.9', name:'גולד קוסט א.ד.פ', latin:'Gold Coast E.D.P',
      price:839.9, sku:'425-0517', img:'assets/p-bond-goldcoast.png',
      style:'מתוק', note:'מושק', need:'אירוע', rating:5, reviews:64, cat:'בשמי נשים' },

    /* --- נבחר במיוחד עבורך (דף המוצר) --- */
    { id:'marly-greenley', brand:P, name:'גרינלי א.ד.פ', latin:'Greenley E.D.P',
      price:499.9, old:589.9, sku:'425-0518', img:'assets/rel-greenley.png',
      style:'רענן', note:'צמחים', need:'יומיומי', rating:5, reviews:210, cat:'בשמי נשים' },

    { id:'marly-perseus', brand:P, name:'פרסאוס א.ד.פ', latin:'Perseus E.D.P',
      price:779.9, sku:'425-0519', img:'assets/rel-perseus.png',
      style:'רענן', note:'פירות', need:'יומיומי', rating:5, reviews:118, cat:'בשמי נשים' },

    { id:'marly-valaya', brand:P, name:'ואלאיה א.ד.פ', latin:'Valaya E.D.P',
      price:1039.9, sku:'425-0520', img:'assets/rel-valaya.png',
      style:'פירותיי', note:'פירות', need:'יומיומי', rating:5, reviews:342, cat:'בשמי נשים' },

    /* --- המומלצים של לקוחתינו (דף הבית) --- */
    { id:'montblanc-legend', brand:'MONT BLANC', name:'לג’נד א.ד.פ', latin:'Legend E.D.P',
      price:134, old:149.9, sku:'425-0521', img:'assets/prod-montblanc.png',
      style:'אגוזי', note:'שרף', need:'יומיומי', rating:5, reviews:488, cat:'בשמים' },

    { id:'marly-palatin-rec', brand:'Perfumes De Marly', name:'פלאטין א.ד.פ', latin:'Palatin E.D.P',
      price:207, old:229.9, sku:'425-0522', img:'assets/prod-demarly.png',
      style:'פירותיי', note:'פירות', need:'יומיומי', rating:5, reviews:520, cat:'בשמים' },

    { id:'loreal-concealer', brand:'L’ORÉAL PARIS', name:'קונסילר אינפייליבל 330 פקאן', latin:'Infaillible More Than Concealer',
      price:71.99, old:79.9, sku:'425-0523', img:'assets/prod-loreal.png',
      kind:'makeup', rating:5, reviews:1024, cat:'איפור',
      about:'קונסילר בעל כיסוי מלא ועמידות של עד 24 שעות, עם פורמולה קרמית שנמרחת בקלות ולא מתיישבת בקמטוטים. גוון 330 Pecan מתאים לגוני עור בינוניים־חמים, ומעניק גימור מאט טבעי שמאיר את אזור העיניים.',
      who:'מתאים למי שמחפשת כיסוי חזק ליומיום — הסתרת עיגולים, אדמומיות ופגמים, עם מרקם שנשאר נוח לאורך כל היום.',
      love:'מברשת רחבה שמאפשרת גם כיסוי מדויק וגם הארה, עמידות אמיתית של יום שלם, ופורמולה שלא מתייבשת על העור.' },

    { id:'cortex-styling', brand:'CORTEX', name:'מברשת חשמלית Hot Styling', latin:'Hair Styling Brush',
      price:179, old:199.9, sku:'425-0524', img:'assets/prod-cortex.png',
      kind:'device', rating:5, reviews:356, cat:'הכל לשיער',
      about:'מברשת חשמלית לעיצוב השיער שמייבשת, מחליקה ומעניקה נפח בפעולה אחת. גוף קרמי בעל פיזור חום אחיד ששומר על השיער, שתי מהירויות ושלוש רמות חום לשליטה מלאה בתוצאה.',
      who:'מתאימה למי שרוצה בלואו־דריי מסלון בבית תוך דקות, גם על שיער עבה או מתולתל, בלי להחזיק מייבש ומברשת בשתי ידיים.',
      love:'תוצאה חלקה עם נפח בשורשים, ידית ארגונומית קלה, וכבל מסתובב שלא מסתבך תוך כדי עבודה.' }
  ];

  /* טקסטים לטאבים — נבנים מהמאפיינים של המוצר אם לא נכתבו ידנית */
  var NOTE_TXT = {
    'פירות':'תווי פרי עסיסיים', 'צמחים':'תווים ירוקים ופרחוניים',
    'שרף':'שרפים חמים', 'זרעים':'תבלינים וזרעים', 'מושק':'מושק רך'
  };
  var STYLE_TXT = {
    'פירותיי':'פירותי ונשי', 'רענן':'רענן ונקי', 'אגוזי':'אגוזי ועמוק',
    'אבקתי':'אבקתי ואלגנטי', 'מתוק':'מתוק ומעטפתי'
  };
  var NEED_TXT = {
    'יומיומי':'ללבישה יומיומית', 'ערב':'לערבים ולאירועים', 'אירוע':'לאירועים מיוחדים'
  };

  Store.copy = function (p) {
    return {
      about: p.about || ('הבושם ' + (p.latin || p.name) + ' של ' + p.brand + ' הוא ניחוח ' +
        (STYLE_TXT[p.style] || 'ייחודי') + ' שנבנה סביב ' + (NOTE_TXT[p.note] || 'תווים נדירים') +
        '. הפתיחה קלילה ומזמינה, הלב מתפתח לעומק עגול, והבסיס נשאר על העור שעות ארוכות בעקבה מפנקת ומדויקת.'),
      who: p.who || ('מתאים למי שאוהבת ניחוח ' + (STYLE_TXT[p.style] || 'מיוחד') + ' — ' +
        (NEED_TXT[p.need] || 'לכל שעות היום') + ', וגם כמתנה לאוהבות בשמי בוטיק.'),
      love: p.love || ('שילוב של ' + (NOTE_TXT[p.note] || 'תווים נדירים') + ' עם עקבה ' +
        (STYLE_TXT[p.style] || 'עשירה') + ' שמחזיקה שעות. ניחוח שמקבל מחמאות בכל פעם מחדש.')
    };
  };

  Store.get = function (id) {
    var hit = Store.products.filter(function (p) { return p.id === id; })[0];
    return hit || Store.products.filter(function (p) { return p.id === 'marly-palatine'; })[0];
  };

  Store.related = function (id, n) {
    n = n || 4;
    var self = Store.get(id);
    var same = Store.products.filter(function (p) { return p.id !== self.id && p.cat === self.cat; });
    var start = same.length ? Store.products.indexOf(self) % same.length : 0;
    var out = same.slice(start).concat(same.slice(0, start)).slice(0, n);
    /* קטגוריה קטנה — משלימים ממוצרים אחרים כדי שהקרוסלה לא תישאר ריקה */
    if (out.length < n) {
      Store.products.forEach(function (p) {
        if (out.length >= n) return;
        if (p.id === self.id) return;
        if (out.indexOf(p) > -1) return;
        out.push(p);
      });
    }
    return out;
  };

  Store.search = function (q) {
    q = (q || '').trim().toLowerCase();
    if (q.length < 2) return [];
    return Store.products.filter(function (p) {
      return (p.brand + ' ' + p.name + ' ' + (p.latin || '')).toLowerCase().indexOf(q) > -1;
    }).slice(0, 6);
  };

  Store.url = function (p) { return 'product.html?id=' + p.id; };

  window.AlmaStore = Store;
})(window);
