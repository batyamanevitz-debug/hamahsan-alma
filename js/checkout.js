/* =========================================================
   ALMA — checkout: real order summary, coupon, validation
   ========================================================= */
(function () {
  'use strict';

  var Store = window.AlmaStore;
  var form = document.querySelector('.ck-grid');
  if (!form) return;

  var VAT = 0.18;
  var COUPONS = { ALMA10: 0.10, ALMA20: 0.20, WELCOME: 0.15 };
  var discount = 0;
  var couponCode = '';

  /* ---------------------------------------------------------
     order summary rendered from the cart
     --------------------------------------------------------- */
  var sum = document.querySelector('.sum');
  var firstRow = sum.querySelector('.sum__row');
  var items = document.createElement('div');
  items.className = 'sum__items';
  items.id = 'ckItems';
  firstRow.parentNode.insertBefore(items, firstRow);
  firstRow.remove();

  var totals = sum.querySelector('.totals');
  var rows = totals.querySelectorAll('.totals__row');
  var subVal = rows[0].querySelector('.totals__val');
  var shipVal = rows[1].querySelector('.totals__val');
  var vatVal = rows[2].querySelector('.totals__val');
  var grandVal = rows[3].querySelector('.totals__val');
  var payBtn = sum.querySelector('.ck-pay');

  var discountRow = document.createElement('div');
  discountRow.className = 'totals__row totals__row--discount';
  discountRow.hidden = true;
  discountRow.innerHTML = '<span class="totals__label">הנחה</span><span class="totals__val"></span>';
  totals.insertBefore(discountRow, rows[2]);

  function itemHtml(i) {
    return '<div class="sum__row" data-id="' + i.id + '">' +
      '<div class="sum__product">' +
        '<span class="sum__pic"><img src="' + i.img + '" alt=""></span>' +
        '<p class="sum__name">' + i.name +
          (i.qty > 1 ? '<span class="sum__qty">כמות: ' + i.qty + '</span>' : '') + '</p>' +
      '</div>' +
      '<p class="sum__price">' + (i.price ? Store.money(i.price * i.qty) : 'חינם') + '</p>' +
    '</div>';
  }

  function render() {
    var cart = Store.cart();

    if (!cart.length) {
      items.innerHTML = '<p class="sum__empty">הסל שלך ריק. <a href="category.html">להמשך קנייה</a></p>';
      payBtn.disabled = true;
      payBtn.classList.add('is-disabled');
    } else {
      items.innerHTML = cart.map(itemHtml).join('');
      payBtn.disabled = false;
      payBtn.classList.remove('is-disabled');
    }

    var subtotal = Store.subtotal();
    var off = subtotal * discount;
    var afterDiscount = subtotal - off;
    var vat = afterDiscount * VAT;

    subVal.textContent = Store.money(subtotal);
    shipVal.textContent = 'חינם';
    vatVal.textContent = Store.money(vat);
    grandVal.textContent = Store.money(afterDiscount + vat);

    discountRow.hidden = !discount;
    if (discount) {
      discountRow.querySelector('.totals__val').textContent = '−' + Store.money(off) +
        ' (' + couponCode + ')';
    }
  }

  document.addEventListener('alma:change', render);
  render();

  /* ---------------------------------------------------------
     coupon
     --------------------------------------------------------- */
  var couponBtn = document.querySelector('.coupon__btn');
  var couponInput = document.getElementById('coupon');

  if (couponBtn && couponInput) {
    couponBtn.addEventListener('click', function () {
      var code = couponInput.value.trim().toUpperCase();
      if (!code) { couponInput.focus(); return; }

      if (COUPONS[code]) {
        discount = COUPONS[code];
        couponCode = code;
        couponBtn.textContent = 'הוחל';
        couponBtn.disabled = true;
        couponInput.readOnly = true;
        Store.toast('הקופון ' + code + ' הופעל — ' + (discount * 100) + '% הנחה');
      } else {
        couponInput.value = '';
        couponInput.placeholder = 'קוד לא תקין, נסי שוב';
        Store.toast('קוד הקופון אינו תקין');
      }
      render();
    });
  }

  /* ---------------------------------------------------------
     shipping / billing radios
     --------------------------------------------------------- */
  document.querySelectorAll('.opt input[type="radio"]').forEach(function (input) {
    input.addEventListener('change', function () {
      document.querySelectorAll('input[name="' + input.name + '"]').forEach(function (r) {
        var row = r.closest('.opt');
        if (row) row.classList.toggle('is-selected', r.checked);
      });
      if (input.name === 'shipping') {
        Store.toast(input.value === 'pickup' ? 'נבחר איסוף עצמי מהחנות' : 'נבחר משלוח עד הבית');
      }
    });
  });

  /* payment method buttons */
  var pays = [].slice.call(document.querySelectorAll('.pay-opt'));
  var cardSection = document.querySelector('.card');
  pays.forEach(function (btn) {
    btn.addEventListener('click', function () {
      pays.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      var isCard = btn.textContent.indexOf('אשראי') > -1;
      if (cardSection) cardSection.hidden = !isCard;
      cardSection.querySelectorAll('input, select').forEach(function (f) { f.disabled = !isCard; });
    });
  });

  /* ---------------------------------------------------------
     validation + order confirmation
     --------------------------------------------------------- */
  function fieldError(input, msg) {
    var wrap = input.closest('.field, .tf') || input.parentElement;
    wrap.classList.add('has-error');
    var note = wrap.querySelector('.err');
    if (!note) {
      note = document.createElement('span');
      note.className = 'err';
      wrap.appendChild(note);
    }
    note.textContent = msg;
  }

  function clearError(input) {
    var wrap = input.closest('.field, .tf') || input.parentElement;
    wrap.classList.remove('has-error');
    var note = wrap.querySelector('.err');
    if (note) note.remove();
  }

  form.querySelectorAll('input, textarea, select').forEach(function (f) {
    f.addEventListener('input', function () { clearError(f); });
  });

  function validate() {
    var bad = null;

    form.querySelectorAll('[required]').forEach(function (f) {
      if (f.disabled || f.type === 'checkbox') return;
      clearError(f);
      if (!f.value.trim()) {
        fieldError(f, 'שדה חובה');
        bad = bad || f;
      } else if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value)) {
        fieldError(f, 'כתובת מייל לא תקינה');
        bad = bad || f;
      } else if (f.type === 'tel' && f.value.replace(/\D/g, '').length < 9) {
        fieldError(f, 'מספר טלפון לא תקין');
        bad = bad || f;
      }
    });

    var terms = form.querySelector('input[name="terms"]');
    if (terms && !terms.checked) {
      Store.toast('יש לאשר את תקנון האתר');
      bad = bad || terms;
    }
    return bad;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!Store.cart().length) { Store.toast('הסל שלך ריק'); return; }

    var bad = validate();
    if (bad) {
      bad.focus();
      bad.scrollIntoView({ block: 'center', behavior: 'smooth' });
      Store.toast('נא להשלים את השדות המסומנים');
      return;
    }

    var order = 'ALMA-' + Math.floor(100000 + Math.random() * 900000);
    var name = (form.querySelector('#fname') || {}).value || '';
    var total = grandVal.textContent;

    payBtn.textContent = 'מעבד תשלום…';
    payBtn.disabled = true;

    setTimeout(function () {
      Store.clear();
      document.querySelector('.ck').innerHTML =
        '<div class="ck-done">' +
          '<div class="ck-done__mark">✓</div>' +
          '<h1>תודה' + (name ? ' ' + name : '') + ', ההזמנה התקבלה!</h1>' +
          '<p>מספר הזמנה <b>' + order + '</b> · סה"כ <b>' + total + '</b></p>' +
          '<p class="ck-done__sub">אישור הזמנה נשלח למייל, והחבילה יוצאת לדרך תוך 1–3 ימי עסקים.</p>' +
          '<div class="ck-done__btns">' +
            '<a class="btn btn--primary" href="index.html">חזרה לעמוד הבית</a>' +
            '<a class="btn ck-done__ghost" href="category.html">להמשך קנייה</a>' +
          '</div>' +
        '</div>';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 900);
  });
})();
