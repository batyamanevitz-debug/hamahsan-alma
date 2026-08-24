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
     CATALOG — המקור האמיתי הוא טבלת products ב-Supabase.
     הרשימה שכאן היא רשת ביטחון: היא זו שמוצגת אם הדאטהבייס
     לא זמין (למשל אחרי שפרויקט חינמי נכנס להשהיה).
     --------------------------------------------------------- */
  var P = 'PARFUMS DE MARLY';

  Store.products = [
    /* --- בשמי נשים (דף הקטגוריה) --- */
    { id:'chanel-coromandel', subs:['brands','unisex','luxury'], brand:'CHANEL', name:'קורומנדאל א.ד.פ', latin:'Coromandel E.D.P',
      price:2199.9, sku:'425-0512', img:'assets/p-chanel-coromandel.png',
      style:'אבקתי', note:'זרעים', need:'ערב', rating:5, reviews:214, cat:'בשמי נשים' },

    { id:'creed-spice', subs:['brands','unisex','luxury'], brand:'CREED', name:'ספייס והוד א.ד.פ', latin:'Spice And Wood E.D.P',
      price:1629.9, sku:'425-0501', img:'assets/p-creed-spice.png',
      style:'אגוזי', note:'שרף', need:'ערב', rating:3, reviews:96, cat:'בשמי נשים' },

    { id:'maison-amyris', subs:['women','luxury'], brand:'MAISON FRANCIS', name:'אמיריס פם א.ד.פ', latin:'Amyris Femme E.D.P',
      price:1549.9, sku:'425-0502', img:'assets/p-maison-amyris.png',
      style:'מתוק', note:'צמחים', need:'אירוע', rating:5, reviews:181, cat:'בשמי נשים' },

    { id:'roja-oud', subs:['unisex','luxury'], brand:'ROJA', name:'אוד קריסטל פרפיום', latin:'Oud Crystal Parfum',
      price:1439.9, sku:'425-0503', img:'assets/p-roja-oud.png',
      style:'אגוזי', note:'שרף', need:'אירוע', rating:5, reviews:143, cat:'בשמי נשים' },

    { id:'malle-portrait', subs:['brands','women','luxury'], brand:'FREDERIC MALLE', name:'פורטרייט אוף ליידי א.ד.פ', latin:'Portrait Of A Lady E.D.P',
      price:1119.9, sku:'425-0505', img:'assets/p-malle-portrait.png',
      style:'אבקתי', note:'צמחים', need:'ערב', rating:5, reviews:307, cat:'בשמי נשים' },

    { id:'marly-palatine', subs:['brands','women','luxury'], brand:'Parfumes De Marly', name:'פאלטין א.ד.פ 75 מ”ל', latin:'Palatine E.D.P',
      price:1039.9, sku:'425-0526', img:'assets/pdp-main.png',
      gallery:['assets/pdp-main.png','assets/pdp-thumb-2.png','assets/pdp-thumb-3.png','assets/pdp-thumb-4.png','assets/pdp-thumb-5.png'],
      thumbs:['assets/pdp-thumb-1.png','assets/pdp-thumb-2.png','assets/pdp-thumb-3.png','assets/pdp-thumb-4.png','assets/pdp-thumb-5.png'],
      style:'פירותיי', note:'פירות', need:'יומיומי', rating:5, reviews:520, cat:'בשמי נשים',
      about:'הבושם Palatine E.D.P של מותג בשמי הבוטיק מרלי, שואב את השראתו מאישיות צבעונית מהמאה ה – 18, נסיכת פאלטין שהיתה ידועה בחוכמה ותעוזה, באומץ לב ואלגנטיות. הניחוח נפתח בתערובת תוססת של אגס וברגמוט המעניקים רעננות נעימה, מתפתח לעוצמה שובת לב בזכות זר פרחים מודרני ונשי ומתיישב על בסיס חזק, עמיד ויוקרתי המעניק תחושה מפנקת דרך המאסק.' },

    { id:'marly-delina', subs:['brands','women'], brand:P, name:'דאלינה א.ד.פ', latin:'Delina E.D.P',
      price:969.9, sku:'425-0507', img:'assets/p-marly-delina.png',
      gallery:['assets/p-marly-delina.png','assets/rel-delina.png'],
      style:'פירותיי', note:'פירות', need:'יומיומי', rating:5, reviews:412, cat:'בשמי נשים' },

    { id:'creed-carmina', subs:['brands','women'], brand:'CREED', name:'קרמינה א.ד.פ', latin:'Carmina E.D.P',
      price:959.9, sku:'425-0508', img:'assets/p-creed-carmina.png',
      style:'מתוק', note:'צמחים', need:'ערב', rating:5, reviews:128, cat:'בשמי נשים' },

    { id:'tomford-tobacco', subs:['brands','unisex'], brand:'TOM FORD', name:'טוברוס א.ד.פ', latin:'Tubereuse Nue E.D.P',
      price:949.9, sku:'425-0509', img:'assets/p-tomford-tobacco.png',
      style:'אגוזי', note:'צמחים', need:'ערב', rating:5, reviews:265, cat:'בשמי נשים' },

    { id:'creed-wind', subs:['brands','women'], brand:'CREED', name:'ווינד פלוארס א.ד.פ', latin:'Wind Flowers E.D.P',
      price:949.9, sku:'425-0510', img:'assets/p-creed-windflowers.png',
      style:'רענן', note:'צמחים', need:'יומיומי', rating:5, reviews:174, cat:'בשמי נשים' },

    { id:'penh-halfeti', subs:['brands','unisex'], brand:'PENHALIGONS', name:'חאלפטי לדר א.ד.פ', latin:'Halfeti Leather E.D.P',
      price:919.9, sku:'425-0511', img:'assets/p-penh-halfeti.png',
      style:'אגוזי', note:'שרף', need:'אירוע', rating:5, reviews:99, cat:'בשמי נשים' },

    { id:'creed-virgin', subs:['brands','unisex'], brand:'CREED', name:'וירג’יניה איסלנד ווטר א.ד.פ', latin:'Virgin Island Water E.D.P',
      price:919.9, sku:'425-0513', img:'assets/p-creed-virgin.png',
      style:'רענן', note:'פירות', need:'יומיומי', rating:5, reviews:238, cat:'בשמי נשים' },

    { id:'penh-constance', subs:['brands','women'], brand:'PENHALIGONS', name:'צאנגינג קונסטנס א.ד.פ', latin:'Changing Constance E.D.P',
      price:899.9, sku:'425-0514', img:'assets/p-penh-constance.png',
      style:'אבקתי', note:'צמחים', need:'אירוע', rating:5, reviews:87, cat:'בשמי נשים' },

    { id:'malle-lipstick', subs:['brands','women'], brand:'FREDERIC MALLE', name:'ליפסטיק רוז א.ד.פ', latin:'Lipstick Rose E.D.P',
      price:899.9, sku:'425-0515', img:'assets/p-malle-lipstick.png',
      style:'מתוק', note:'צמחים', need:'ערב', rating:5, reviews:156, cat:'בשמי נשים' },

    { id:'marly-oriana', subs:['brands','women'], brand:P, name:'אוריאנה א.ד.פ', latin:'Oriana E.D.P',
      price:849.9, sku:'425-0516', img:'assets/p-marly-oriana.png',
      style:'פירותיי', note:'פירות', need:'יומיומי', rating:5, reviews:301, cat:'בשמי נשים' },

    { id:'bond-goldcoast', subs:['unisex'], brand:'BOND NO.9', name:'גולד קוסט א.ד.פ', latin:'Gold Coast E.D.P',
      price:839.9, sku:'425-0517', img:'assets/p-bond-goldcoast.png',
      style:'מתוק', note:'מושק', need:'אירוע', rating:5, reviews:64, cat:'בשמי נשים' },

    /* --- נבחר במיוחד עבורך (דף המוצר) --- */
    { id:'marly-greenley', subs:['brands','men'], brand:P, name:'גרינלי א.ד.פ', latin:'Greenley E.D.P',
      price:499.9, old:589.9, sku:'425-0518', img:'assets/rel-greenley.png',
      style:'רענן', note:'צמחים', need:'יומיומי', rating:5, reviews:210, cat:'בשמי נשים' },

    { id:'marly-perseus', subs:['brands','men'], brand:P, name:'פרסאוס א.ד.פ', latin:'Perseus E.D.P',
      price:779.9, sku:'425-0519', img:'assets/rel-perseus.png',
      style:'רענן', note:'פירות', need:'יומיומי', rating:5, reviews:118, cat:'בשמי נשים' },

    { id:'marly-valaya', subs:['brands','women','luxury'], brand:P, name:'ואלאיה א.ד.פ', latin:'Valaya E.D.P',
      price:1039.9, sku:'425-0520', img:'assets/rel-valaya.png',
      style:'פירותיי', note:'פירות', need:'יומיומי', rating:5, reviews:342, cat:'בשמי נשים' },

    /* --- המומלצים של לקוחתינו (דף הבית) --- */
    { id:'montblanc-legend', subs:['men'], brand:'MONT BLANC', name:'לג’נד א.ד.פ', latin:'Legend E.D.P',
      price:134, old:149.9, sku:'425-0521', img:'assets/prod-montblanc.png',
      style:'אגוזי', note:'שרף', need:'יומיומי', rating:5, reviews:488, cat:'בשמים' },

    { id:'marly-palatin-rec', subs:['brands','women'], brand:'Perfumes De Marly', name:'פלאטין א.ד.פ', latin:'Palatin E.D.P',
      price:207, old:229.9, sku:'425-0522', img:'assets/prod-demarly.png',
      style:'פירותיי', note:'פירות', need:'יומיומי', rating:5, reviews:520, cat:'בשמים' },

    { id:'loreal-concealer', subs:['beauty-brands','cosmetics'], brand:'L’ORÉAL PARIS', name:'קונסילר אינפייליבל 330 פקאן', latin:'Infaillible More Than Concealer',
      price:71.99, old:79.9, sku:'425-0523', img:'assets/prod-loreal.png',
      kind:'makeup', rating:5, reviews:1024, cat:'איפור',
      about:'קונסילר בעל כיסוי מלא ועמידות של עד 24 שעות, עם פורמולה קרמית שנמרחת בקלות ולא מתיישבת בקמטוטים. גוון 330 Pecan מתאים לגוני עור בינוניים־חמים, ומעניק גימור מאט טבעי שמאיר את אזור העיניים.',
      who:'מתאים למי שמחפשת כיסוי חזק ליומיום — הסתרת עיגולים, אדמומיות ופגמים, עם מרקם שנשאר נוח לאורך כל היום.',
      love:'מברשת רחבה שמאפשרת גם כיסוי מדויק וגם הארה, עמידות אמיתית של יום שלם, ופורמולה שלא מתייבשת על העור.' },

    { id:'cortex-styling', subs:['hair-brands','devices','styling'], brand:'CORTEX', name:'מברשת חשמלית Hot Styling', latin:'Hair Styling Brush',
      price:179, old:199.9, sku:'425-0524', img:'assets/prod-cortex.png',
      kind:'device', rating:5, reviews:356, cat:'הכל לשיער',
      about:'מברשת חשמלית לעיצוב השיער שמייבשת, מחליקה ומעניקה נפח בפעולה אחת. גוף קרמי בעל פיזור חום אחיד ששומר על השיער, שתי מהירויות ושלוש רמות חום לשליטה מלאה בתוצאה.',
      who:'מתאימה למי שרוצה בלואו־דריי מסלון בבית תוך דקות, גם על שיער עבה או מתולתל, בלי להחזיק מייבש ומברשת בשתי ידיים.',
      love:'תוצאה חלקה עם נפח בשורשים, ידית ארגונומית קלה, וכבל מסתובב שלא מסתבך תוך כדי עבודה.' },

    /* --- איפור וטיפוח --- */
    { id:'loreal-freshwear', subs:['beauty-brands','cosmetics'], brand:'L’ORÉAL PARIS', name:'פאונדיישן Infallible Fresh Wear', latin:'Infallible Fresh Wear Foundation',
      price:89.9, old:109.9, sku:'430-0101', img:'assets/ig-7.png',
      kind:'makeup', rating:5, reviews:642, cat:'איפור',
      about:'פאונדיישן בעל כיסוי בינוני עד מלא ועמידות של עד 24 שעות, עם גימור מאט טבעי שלא נמחק ולא עובר לבגדים. הפורמולה קלילה על העור, עמידה למים ולזיעה, ומתאימה גם לימים ארוכים.',
      who:'למי שמחפשת מייק־אפ אחד שמחזיק מהבוקר עד הלילה — לעבודה, לאירועים ולימי קיץ חמים.',
      love:'לא מרגישים אותו על העור, לא צריך לתקן במהלך היום, וקיים במגוון גוונים רחב.' },

    { id:'alma-highlighter', subs:['cosmetics'], brand:'ALMA BEAUTY', name:'פלטת היילייטר', latin:'Glow Highlighter Palette',
      price:64.9, sku:'430-0102', img:'assets/ig-5.png',
      kind:'makeup', rating:5, reviews:238, cat:'איפור',
      about:'פלטת היילייטר עם שלושה גוונים משלימים — שמפניה, ורוד־זהב וברונז — במרקם אבקתי־קרמי שנצמד לעור ומעניק זוהר טבעי בלי נצנצים בולטים.',
      who:'למי שרוצה זוהר עדין ליומיום או הדגשה חזקה יותר לערב, על כל גוני העור.',
      love:'שלושה גוונים בפלטה אחת, נמרח באצבע או במברשת, ומחזיק שעות בלי להתפוגג.' },

    { id:'laroche-cicaplast', subs:['beauty-brands','face'], brand:'LA ROCHE-POSAY', name:'סיקהפלסט באלם B5', latin:'Cicaplast Baume B5',
      price:74.9, old:84.9, sku:'430-0103', img:'assets/blog-1.png',
      kind:'skincare', rating:5, reviews:1187, cat:'איפור',
      about:'באלם רב־תכליתי לעור יבש ומגורה, עם פנתנול, שיאה וגליצרין. מרגיע אדמומיות, מזין אזורים סדוקים ומשקם את מחסום העור — לפנים, לגוף ולשפתיים.',
      who:'למי שיש עור יבש, מגורה או אחרי טיפול — וגם לכל התיק, כמוצר חילוץ לכל מצב.',
      love:'מרקם עשיר שנספג בלי להשאיר שכבה דביקה, בלי בישום, ומתאים גם לתינוקות.' },

    { id:'joseon-glow', subs:['beauty-brands','face'], brand:'BEAUTY OF JOSEON', name:'סרום אורז Glow Deep', latin:'Glow Deep Serum Rice + Alpha Arbutin',
      price:89.9, sku:'430-0104', img:'assets/blog-main.png',
      kind:'skincare', rating:5, reviews:874, cat:'איפור',
      about:'סרום קוריאני על בסיס תמצית אורז ואלפא־ארבוטין שמאיר את העור, משווה את הגוון ומעניק לחות עמוקה. מרקם קליל שנספג מיד ומתאים לשימוש בוקר וערב.',
      who:'למי שמחפשת עור זוהר ואחיד — במיוחד לכתמי פיגמנטציה וגוון עור עייף.',
      love:'תוצאה של זוהר אמיתי תוך שבועות, מרקם נעים שלא מכביד, ומתאים גם לעור רגיש.' },

    { id:'alma-mini-set', subs:['face','body','sets'], brand:'ALMA', name:'סט טיפוח מיני לנסיעות', latin:'Mini Travel Skincare Set',
      price:119.9, old:139.9, sku:'430-0105', img:'assets/blog-3.png',
      kind:'set', rating:5, reviews:96, cat:'איפור',
      about:'סט מוצרי טיפוח באריזות מיני שנכנסות לכל תיק — ניקוי, לחות והגנה, בגדלים שמותרים בטיסה. דרך נוחה להתנסות בשגרת טיפוח מלאה או לקחת אותה לכל מקום.',
      who:'למי שנוסעת, למי שרוצה להתנסות לפני שקונה גדול, ולמי שאוהבת שהשגרה נשארת גם בדרכים.',
      love:'כל השגרה בגודל תיק, אריזה שמתאימה למתנה, ומחיר התנסות נוח.' },

    { id:'bloomfield-lavender', subs:['beauty-brands','body','sets'], brand:'BLOOMFIELD', name:'מארז לבנדר 6 חלקים', latin:'Goodnight Sleep Bath Set',
      price:129, old:169, sku:'430-0106', img:'assets/mega-makeup.png',
      kind:'set', rating:5, reviews:312, cat:'איפור',
      about:'מארז רחצה מפנק בניחוח לבנדר — ג’ל רחצה, קרם גוף, מלח אמבט, מיסט לכרית ועוד. ארוז במגש מתנה מוכן להגשה, בדיוק כמו שהוא.',
      who:'מתנה בטוחה לכל אירוע — יום הולדת, מזל טוב או פינוק עצמי לסוף שבוע ארוך.',
      love:'שישה מוצרים במחיר של אחד־שניים, ניחוח לבנדר מרגיע, ואריזה שלא צריך לעטוף.' },

    /* --- הכל לשיער --- */
    { id:'labeaute-duo', subs:['hair-brands','haircare'], brand:'LA BEAUTE', name:'שמפו ומרכך קרטין וארגן', latin:'Keratin & Argan Duo',
      price:149.9, old:179.9, sku:'440-0101', img:'assets/ig-4.png',
      kind:'hair', rating:5, reviews:521, cat:'הכל לשיער',
      about:'זוג שמפו ומרכך מקצועי עם קרטין ושמן ארגן, לשיער יבש, פגום או מוחלק. מנקה בעדינות בלי סולפטים אגרסיביים, מחזיר גמישות לסיב השיער ומקל על הסירוק.',
      who:'לשיער שעבר צבע, החלקה או מפגש עם מייבש — ולמי שרוצה שהשיער יישאר חלק גם ביום השני.',
      love:'הזוג עובד יחד, מספיק לחודשים, והשיער נשאר רך בלי תחושת כבדות.' },

    { id:'alma-best-set', subs:['hair-brands','sets'], brand:'ALMA', name:'מארז The Best of Alma', latin:'The Best of Alma Beauty Bag',
      price:199.9, old:249.9, sku:'440-0102', img:'assets/ig-2.png',
      kind:'set', rating:5, reviews:143, cat:'הכל לשיער',
      about:'תיק קוסמטיקה בסגול עם המוצרים האהובים של המחסן — טיפוח שיער, לק וציפורניים מודבקות, הכל במארז אחד. בחירה מוכנה למי שלא רוצה להתלבט.',
      who:'למי שמתלבטת מה לקנות, למתנה, או למי שרוצה לנסות כמה קטגוריות בבת אחת.',
      love:'המוצרים הנמכרים ביותר במקום אחד, תיק שנשאר גם אחרי שהמוצרים נגמרים, ומחיר מארז.' },

    { id:'cortex-box', subs:['hair-brands','devices','styling'], brand:'CORTEX BEAUTY', name:'מארז עיצוב שיער', latin:'Styling Gift Box',
      price:229.9, sku:'440-0103', img:'assets/ig-8.png',
      kind:'hair', rating:5, reviews:187, cat:'הכל לשיער',
      about:'מארז עיצוב שיער של קורטקס — מברשת חשמלית לעיצוב עם מוצרי הגנה מחום, ארוז בקופסת מתנה. הכל מה שצריך לבלואו־דריי בבית, בלי לרוץ למכולת מוצרים.',
      who:'למי שרוצה תוצאה של סלון בבית, וגם למתנה למי שאוהבת לשחק עם השיער.',
      love:'המברשת עושה את העבודה של מייבש ומברשת יחד, והמוצרים בפנים שומרים על השיער מחום.' },

    { id:'labeaute-curls', subs:['hair-brands','styling','haircare'], brand:'LA BEAUTE', name:'קרם הגדרת תלתלים', latin:'Curl Defining Cream',
      price:89.9, sku:'440-0104', img:'assets/blog-2.png',
      kind:'hair', rating:4, reviews:264, cat:'הכל לשיער',
      about:'קרם עיצוב לתלתלים שמגדיר את הקפיץ בלי להקשות ובלי להשאיר שאריות לבנות. מכיל לחות שנשארת ביום השני, ומתאים גם לשיער גלי שמתפרק בקלות.',
      who:'לשיער מתולתל או גלי שמחפש הגדרה ולחות — עם או בלי דיפיוזר.',
      love:'תלתל מוגדר ורך למגע, בלי אפקט קרטון, ועובד גם על שיער רטוב וגם על שיער לח.' }
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

  /* קיבוץ לשלוש הקטגוריות הראשיות של האתר */
  /* ---------------------------------------------------------
     Supabase — טעינת הקטלוג מהדאטהבייס
     המפתח הזה ציבורי בכוונה. RLS על הטבלה מתיר קריאה בלבד.
     --------------------------------------------------------- */
  var DB_URL = 'https://touuyegybctmfdtzlbmt.supabase.co';
  var DB_KEY = 'sb_publishable_OaxEZB5EkKNvGlXk9yrY-w_6gV7zcsI';
  var DB_CACHE = 'alma.catalog.v1';
  var DB_TIMEOUT = 5000;

  /* שורה בדאטהבייס -> מוצר כמו שהאתר מכיר */
  function fromRow(r) {
    var p = {
      id: r.id, brand: r.brand, name: r.name, latin: r.latin || '',
      price: Number(r.price), sku: r.sku, cat: r.cat,
      img: r.img, subs: r.subs || [],
      rating: Number(r.rating), reviews: Number(r.reviews)
    };
    if (r.old_price !== null && r.old_price !== undefined) p.old = Number(r.old_price);
    ['kind', 'style', 'note', 'need', 'about', 'who', 'love'].forEach(function (k) {
      if (r[k]) p[k] = r[k];
    });
    if (r.gallery && r.gallery.length) p.gallery = r.gallery;
    if (r.thumbs && r.thumbs.length) p.thumbs = r.thumbs;
    return p;
  }

  function fetchCatalog() {
    if (!window.fetch) return Promise.reject(new Error('no fetch'));
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, DB_TIMEOUT);
    return fetch(DB_URL + '/rest/v1/products?select=*&order=sort_order.asc', {
      headers: { apikey: DB_KEY, Authorization: 'Bearer ' + DB_KEY },
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  /* Store.ready — הדפים ממתינים לזה לפני שהם מציירים מוצרים */
  Store.source = 'fallback';
  Store.ready = fetchCatalog().then(function (rows) {
    if (!rows || !rows.length) throw new Error('empty catalog');
    Store.products = rows.map(fromRow);
    Store.source = 'supabase';
    write(DB_CACHE, rows);
    return Store.products;
  }).catch(function (err) {
    /* אין רשת או שהדאטהבייס מושהה — מנסים עותק שמור, ואם אין נשארים עם המוטמע */
    var cached = read(DB_CACHE);
    if (cached && cached.length) {
      Store.products = cached.map(fromRow);
      Store.source = 'cache';
    }
    if (window.console) console.warn('ALMA: קטלוג מ-' + Store.source, err && err.message);
    return Store.products;
  });

  var GROUPS = {
    women:   { title: "בשמי נשים", crumb: "בשמים", match: function (p) { return p.cat === "בשמי נשים"; } },
    perfume: { title: "בשמים",     crumb: "בשמים", match: function (p) { return p.cat === "בשמי נשים" || p.cat === "בשמים"; } },
    makeup:  { title: "איפור",     crumb: "איפור", match: function (p) { return p.cat === "איפור"; } },
    hair:    { title: "הכל לשיער", crumb: "שיער",  match: function (p) { return p.cat === "הכל לשיער"; } }
  };

  Store.groups = GROUPS;

  /* תתי הקטגוריות שבתפריטים הנפתחים */
  var SUBVIEWS = {
    brands:          { title: "מותגי בישום מובילים", crumb: "בשמים", parent: "perfume" },
    unisex:          { title: "בשמי יוניסקס",        crumb: "בשמים", parent: "perfume" },
    women:           { title: "בשמי נשים",           crumb: "בשמים", parent: "perfume" },
    men:             { title: "בשמי גברים",          crumb: "בשמים", parent: "perfume" },
    luxury:          { title: "בשמי יוקרה",          crumb: "בשמים", parent: "perfume" },
    sets:            { title: "סטים ומארזים",        crumb: "מארזים", parent: "perfume" },
    kids:            { title: "בשמי ילדים",          crumb: "בשמים", parent: "perfume" },
    best:            { title: "הנמכרים ביותר",      crumb: "בשמים", parent: "perfume",
                       match: function (p) { return (p.cat === "בשמי נשים" || p.cat === "בשמים") && p.reviews >= 300; } },
    "beauty-brands": { title: "מותגי יופי מומלצים",  crumb: "איפור", parent: "makeup" },
    cosmetics:       { title: "איפור",                crumb: "איפור", parent: "makeup" },
    body:            { title: "טיפוח הגוף",          crumb: "איפור", parent: "makeup" },
    face:            { title: "טיפוח פנים",          crumb: "איפור", parent: "makeup" },
    "hair-brands":   { title: "מותגי טיפוח שיער",    crumb: "שיער",  parent: "hair" },
    devices:         { title: "מכשירי חשמל לשיער",   crumb: "שיער",  parent: "hair" },
    styling:         { title: "עיצוב שיער",          crumb: "שיער",  parent: "hair" },
    haircare:        { title: "טיפוח שיער",          crumb: "שיער",  parent: "hair" }
  };

  Store.subviews = SUBVIEWS;

  Store.category = function (key) {
    if (!key) key = "women";
    if (SUBVIEWS[key]) {
      var v = SUBVIEWS[key];
      return {
        key: key,
        parent: v.parent,
        title: v.title,
        crumb: v.crumb,
        items: Store.products.filter(v.match || function (p) {
          return (p.subs || []).indexOf(key) > -1;
        })
      };
    }
    var g = GROUPS[key] || GROUPS.women;
    return {
      key: GROUPS[key] ? key : "women",
      parent: GROUPS[key] ? key : "women",
      title: g.title,
      crumb: g.crumb,
      items: Store.products.filter(g.match)
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

  /* ---------------------------------------------------------
     פירורי לחם — קטגוריה ראשית ותת קטגוריה אמיתיות
     --------------------------------------------------------- */
  var TOP = {
    "בשמי נשים": { key: "perfume", label: "בשמים" },
    "בשמים":     { key: "perfume", label: "בשמים" },
    "איפור":     { key: "makeup",  label: "איפור" },
    "הכל לשיער": { key: "hair",    label: "הכל לשיער" }
  };

  /* סדר העדיפות של תת הקטגוריה שתוצג — מהמדויקת ביותר לכללית */
  var SUB_ORDER = {
    perfume: ["kids", "sets", "men", "women", "unisex", "luxury", "brands"],
    makeup:  ["sets", "face", "body", "cosmetics", "beauty-brands"],
    hair:    ["sets", "devices", "styling", "haircare", "hair-brands"]
  };

  function top(p) { return TOP[p.cat] || TOP["בשמי נשים"]; }

  Store.viewUrl = function (key) {
    return "category.html" + (key === "women" ? "" : "?cat=" + key);
  };

  /* הפירור הראשון — הקטגוריה הראשית */
  Store.catCrumb = function (p) {
    var t = top(p);
    return { label: t.label, href: Store.viewUrl(t.key) };
  };

  /* הפירור השני — תת הקטגוריה שהמוצר באמת שייך אליה, או null */
  Store.subCrumb = function (p) {
    var t = top(p);
    var subs = p.subs || [];
    var order = SUB_ORDER[t.key] || [];
    for (var i = 0; i < order.length; i++) {
      var key = order[i];
      if (subs.indexOf(key) < 0) continue;
      var v = SUBVIEWS[key];
      /* תת קטגוריה שנקראת כמו הראשית לא מוסיפה מידע — מדלגים עליה */
      if (!v || v.title === t.label) continue;
      return { label: v.title, href: Store.viewUrl(key) };
    }
    return null;
  };


  Store.url = function (p) { return "product.html?id=" + p.id; };

  window.AlmaStore = Store;
})(window);
