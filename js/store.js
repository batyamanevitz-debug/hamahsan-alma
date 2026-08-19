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


  /* ---------- catalog (for search) ---------- */
  Store.products = [
    { id:'creed-spice',      brand:'CREED',           name:'ספייס והוד א.ד.פ',            price:1629.9, img:'assets/p-creed-spice.png',      url:'category.html' },
    { id:'maison-amyris',    brand:'MAISON FRANCIS',  name:'אמיריס פם א.ד.פ',             price:1549.9, img:'assets/p-maison-amyris.png',    url:'category.html' },
    { id:'roja-oud',         brand:'ROJA',            name:'אוד קריסטל פרפיום',           price:1439.9, img:'assets/p-roja-oud.png',         url:'category.html' },
    { id:'chanel-coromandel',brand:'CHANEL',          name:'קורומנדאל א.ד.פ',             price:2199.9, img:'assets/p-chanel-coromandel.png',url:'category.html' },
    { id:'malle-portrait',   brand:'FREDERIC MALLE',  name:'פורטרייט אוף ליידי א.ד.פ',    price:1119.9, img:'assets/p-malle-portrait.png',   url:'category.html' },
    { id:'marly-palatine',   brand:'DE MARLY',        name:'פלאטין א.ד.פ',                price:1039.9, img:'assets/p-marly-palatine.png',   url:'product.html' },
    { id:'marly-delina',     brand:'DE MARLY',        name:'דאלינה א.ד.פ',                price:969.9,  img:'assets/p-marly-delina.png',     url:'category.html' },
    { id:'creed-carmina',    brand:'CREED',           name:'קרמינה א.ד.פ',                price:959.9,  img:'assets/p-creed-carmina.png',    url:'category.html' },
    { id:'tomford-tobacco',  brand:'TOM FORD',        name:'טוברוס א.ד.פ',                price:949.9,  img:'assets/p-tomford-tobacco.png',  url:'category.html' },
    { id:'creed-wind',       brand:'CREED',           name:'ווינד פלוארס א.ד.פ',          price:949.9,  img:'assets/p-creed-windflowers.png',url:'category.html' },
    { id:'penh-halfeti',     brand:'PENHALIGONS',     name:'חאלפטי לדר א.ד.פ',            price:919.9,  img:'assets/p-penh-halfeti.png',     url:'category.html' },
    { id:'creed-virgin',     brand:'CREED',           name:'וירגי׳ניה איסלנד ווטר א.ד.פ', price:919.9,  img:'assets/p-creed-virgin.png',     url:'category.html' },
    { id:'penh-constance',   brand:'PENHALIGONS',     name:'צאנגינג קונסטנס א.ד.פ',       price:899.9,  img:'assets/p-penh-constance.png',   url:'category.html' },
    { id:'malle-lipstick',   brand:'FREDERIC MALLE',  name:'ליפסטיק רוז א.ד.פ',           price:899.9,  img:'assets/p-malle-lipstick.png',   url:'category.html' },
    { id:'marly-oriana',     brand:'DE MARLY',        name:'אוריאנה א.ד.פ',               price:849.9,  img:'assets/p-marly-oriana.png',     url:'category.html' },
    { id:'bond-goldcoast',   brand:'BOND NO.9',       name:'גולד קוסט א.ד.פ',             price:839.9,  img:'assets/p-bond-goldcoast.png',   url:'category.html' },
    { id:'cortex-styling',   brand:'CORTEX',          name:'Hair Styling',                price:179,    img:'assets/prod-cortex.png',        url:'index.html' },
    { id:'loreal-concealer', brand:'L’ORÉAL PARIS',   name:'Concealer 330 Pecan',         price:71.99,  img:'assets/prod-loreal.png',        url:'index.html' },
    { id:'montblanc-legend', brand:'MONT BLANC',      name:'Legend א.ד.פ',                price:134,    img:'assets/prod-montblanc.png',     url:'index.html' },
    { id:'marly-greenley',   brand:'DE MARLY',        name:'גרינלי א.ד.פ',                price:499.9,  img:'assets/rel-greenley.png',       url:'product.html' },
    { id:'marly-perseus',    brand:'DE MARLY',        name:'פרסאוס א.ד.פ',                price:779.9,  img:'assets/rel-perseus.png',        url:'product.html' },
    { id:'marly-valaya',     brand:'DE MARLY',        name:'ואלאיה א.ד.פ',                price:1039.9, img:'assets/rel-valaya.png',         url:'product.html' }
  ];

  Store.search = function (q) {
    q = (q || '').trim().toLowerCase();
    if (q.length < 2) return [];
    return Store.products.filter(function (p) {
      return (p.brand + ' ' + p.name).toLowerCase().indexOf(q) > -1;
    }).slice(0, 6);
  };

  window.AlmaStore = Store;
})(window);
