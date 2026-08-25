/* =========================================================
   ALMA — לוח ניהול החנות
   Supabase JS SDK v2, ES modules, ללא שלב בנייה.

   הרשאות: הגישה נשענת על RLS בדאטהבייס, לא על הסתרה בממשק.
   גם מי שיפתח את הדף הזה בלי חשבון מנהל לא יוכל לשנות דבר —
   כל פוליסת כתיבה דורשת public.is_admin().
   ========================================================= */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://touuyegybctmfdtzlbmt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_OaxEZB5EkKNvGlXk9yrY-w_6gV7zcsI';
const BUCKET = 'media';

/* חשבון המנהל. המסך מבקש סיסמה בלבד, והמייל מולא כאן מראש.
   הסיסמה עצמה לא נמצאת בקוד — היא נבדקת מול Supabase Auth,
   ובלי סשן תקף אין הרשאת כתיבה לשום טבלה. */
const ADMIN_EMAIL = 'batyamanevitz@gmail.com';

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

/* מצב הזיכרון של הלוח */
const state = {
  products: [],
  brands: [],
  categories: [],
  pages: [],
  posts: [],
  settings: [],
  orders: []
};

/* ---------------------------------------------------------
   עזרי DOM
   --------------------------------------------------------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** בריחה מ-HTML. כל טקסט שמגיע מהדאטהבייס עובר דרך כאן. */
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

const money = n => '₪' + Number(n || 0).toLocaleString('he-IL', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
});

const dateHe = iso => iso
  ? new Date(iso).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '';

/** slug מטקסט עברי או לטיני. עברית נשמרת כמו שהיא — Postgres וכתובות תומכים. */
function slugify(txt) {
  return String(txt || '').trim().toLowerCase()
    .replace(/['"’.,()]/g, '')
    .replace(/[\s_/\\]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/* ---------------------------------------------------------
   הודעות חיווי
   --------------------------------------------------------- */
function toast(msg, kind = '') {
  const el = document.createElement('div');
  el.className = 'toast' + (kind ? ' toast--' + kind : '');
  el.innerHTML = `<span>${esc(msg)}</span><button class="toast__x" type="button" aria-label="סגירה">&times;</button>`;
  const kill = () => { el.remove(); };
  el.querySelector('.toast__x').addEventListener('click', kill);
  $('#toasts').appendChild(el);
  setTimeout(kill, kind === 'err' ? 7000 : 3500);
}

const ok  = msg => toast(msg, 'ok');
const err = msg => toast(msg, 'err');

/**
 * עוטף כל קריאה ל-Supabase: מציג שגיאה קריאה במקום להיכשל בשקט.
 * מחזיר null כשנכשל, כדי שהקורא יוכל לעצור.
 */
async function run(promise, failMsg) {
  try {
    const { data, error } = await promise;
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    console.error(failMsg, e);
    err(`${failMsg}: ${e.message || e}`);
    return null;
  }
}

/* ---------------------------------------------------------
   התחברות
   --------------------------------------------------------- */
const gate = $('#gate');
const app  = $('#app');

$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('#loginBtn');
  const box = $('#loginError');
  box.hidden = true;
  btn.disabled = true;
  btn.textContent = 'מתחבר…';

  const { error } = await db.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: $('#loginPassword').value
  });

  btn.disabled = false;
  btn.textContent = 'כניסה';

  if (error) {
    box.textContent = error.message === 'Invalid login credentials'
      ? 'הסיסמה שגויה.'
      : 'ההתחברות נכשלה: ' + error.message;
    box.hidden = false;
    $('#loginPassword').select();
    return;
  }
  $('#loginPassword').value = '';
  boot();
});

$('#logoutBtn').addEventListener('click', async () => {
  await db.auth.signOut();
  location.reload();
});

/** בודק שיש משתמש מחובר וגם שהוא רשום כמנהל. */
async function currentAdmin() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) return null;

  const { data, error } = await db.rpc('is_admin');
  if (error) { console.error('is_admin', error); return null; }
  if (!data) return { user: session.user, denied: true };
  return { user: session.user };
}

async function boot() {
  const admin = await currentAdmin();

  if (!admin) { gate.hidden = false; app.hidden = true; return; }

  if (admin.denied) {
    await db.auth.signOut();
    const box = $('#loginError');
    box.textContent = 'החשבון הזה מחובר אבל אינו מוגדר כמנהל חנות.';
    box.hidden = false;
    gate.hidden = false;
    app.hidden = true;
    return;
  }

  gate.hidden = true;
  app.hidden = false;
  $('#userEmail').textContent = admin.user.email || '';
  await loadAll();
}

/* ---------------------------------------------------------
   טעינת הנתונים
   --------------------------------------------------------- */
async function loadAll() {
  const [products, brands, categories, pages, posts, settings, orders] = await Promise.all([
    run(db.from('products').select('*').order('sort_order'), 'טעינת המוצרים נכשלה'),
    run(db.from('brands').select('*').order('name'), 'טעינת המותגים נכשלה'),
    run(db.from('categories').select('*').order('sort_order'), 'טעינת הקטגוריות נכשלה'),
    run(db.from('pages').select('*').order('sort_order'), 'טעינת דפי התוכן נכשלה'),
    run(db.from('blog_posts').select('*').order('created_at', { ascending: false }), 'טעינת הבלוג נכשלה'),
    run(db.from('site_settings').select('*').order('key'), 'טעינת ההגדרות נכשלה'),
    run(db.from('orders').select('*').order('created_at', { ascending: false }), 'טעינת ההזמנות נכשלה')
  ]);

  state.products   = products   || [];
  state.brands     = brands     || [];
  state.categories = categories || [];
  state.pages      = pages      || [];
  state.posts      = posts      || [];
  state.settings   = settings   || [];
  state.orders     = orders     || [];

  renderProducts();
  renderTaxonomy();
  renderPages();
  renderPosts();
  renderSettings();
  renderOrders();
}

/* עזרי קטגוריות */
const rootCats = () => state.categories.filter(c => !c.parent_id);
const subCats  = parentId => state.categories.filter(c => c.parent_id === parentId);
const catById  = id => state.categories.find(c => c.id === id);
const catBySlug = slug => state.categories.find(c => c.slug === slug);

/* ---------------------------------------------------------
   ניווט בין הלשוניות
   --------------------------------------------------------- */
$$('.side__item').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.side__item').forEach(b => b.classList.toggle('is-active', b === btn));
    const tab = btn.dataset.tab;
    $$('.panel').forEach(p => p.classList.toggle('is-active', p.id === 'tab-' + tab));
    $('#side').classList.remove('is-open');
    $('#navToggle').setAttribute('aria-expanded', 'false');
    $('#main').scrollTo?.(0, 0);
    window.scrollTo(0, 0);
  });
});

$('#navToggle').addEventListener('click', () => {
  const open = $('#side').classList.toggle('is-open');
  $('#navToggle').setAttribute('aria-expanded', String(open));
});

/* ---------------------------------------------------------
   חלון עריכה כללי
   --------------------------------------------------------- */
const modal = $('#modal');
let onSave = null;

function openModal(title, bodyHtml, saveHandler, deleteHandler) {
  $('#modalTitle').textContent = title;
  $('#modalForm').innerHTML = bodyHtml;
  onSave = saveHandler;

  const del = $('#modalDelete');
  del.hidden = !deleteHandler;
  del.onclick = deleteHandler || null;

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  initRTEs();
  setTimeout(() => $('#modalForm input, #modalForm textarea, #modalForm select')?.focus(), 60);
}

function closeModal() {
  modal.hidden = true;
  onSave = null;
  document.body.style.overflow = '';
}

$$('[data-close]').forEach(el => el.addEventListener('click', closeModal));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modal.hidden) closeModal();
});

$('#modalForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (!onSave) return;
  const btn = $('#modalSave');
  btn.disabled = true;
  btn.textContent = 'שומר…';
  try {
    await onSave(new FormData(e.target));
  } finally {
    btn.disabled = false;
    btn.textContent = 'שמירה';
  }
});

/* אישור מחיקה */
const confirmBox = $('#confirm');
let onConfirm = null;

function askDelete(text, handler) {
  $('#confirmText').textContent = text;
  onConfirm = handler;
  confirmBox.hidden = false;
}
$$('[data-confirm-close]').forEach(el => el.addEventListener('click', () => {
  confirmBox.hidden = true; onConfirm = null;
}));
$('#confirmYes').addEventListener('click', async () => {
  const fn = onConfirm;
  confirmBox.hidden = true;
  onConfirm = null;
  if (fn) await fn();
});

/* ---------------------------------------------------------
   העלאת קבצים ל-Storage
   --------------------------------------------------------- */
async function uploadFile(file, folder) {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await db.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000', upsert: false
  });
  if (error) { err('העלאת התמונה נכשלה: ' + error.message); return null; }

  return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** שדה תמונה: כתובת ידנית או העלאה מהמחשב. */
function imageField(name, label, value, hint) {
  return `
    <div class="uploader">
      <span class="field__label">${esc(label)}</span>
      <div class="uploader__row">
        <img class="uploader__preview" src="${esc(value || '')}" alt="" data-preview-for="${name}"
             onerror="this.removeAttribute('src')">
        <input class="field__input" type="text" name="${name}" value="${esc(value || '')}"
               placeholder="assets/…png או כתובת מלאה" dir="ltr" data-img-input>
        <button class="btn btn--sm uploader__btn" type="button">
          העלאה<input type="file" accept="image/*" data-upload-for="${name}" data-folder="${name}">
        </button>
      </div>
      ${hint ? `<span class="field__hint">${esc(hint)}</span>` : ''}
    </div>`;
}

/* העלאה + עדכון התצוגה המקדימה */
document.addEventListener('change', async e => {
  const input = e.target.closest('[data-upload-for]');
  if (!input || !input.files?.[0]) return;

  const name = input.dataset.uploadFor;
  const btn = input.closest('.uploader__btn');
  const label = btn.firstChild;
  const prev = label.nodeValue;
  label.nodeValue = 'מעלה…';

  const url = await uploadFile(input.files[0], input.dataset.folder || 'misc');
  label.nodeValue = prev;
  input.value = '';
  if (!url) return;

  const field = $(`[name="${name}"]`, $('#modalForm'));
  if (field) {
    field.value = url;
    const img = $(`[data-preview-for="${name}"]`, $('#modalForm'));
    if (img) img.src = url;
  }
  ok('התמונה הועלתה');
});

/* תצוגה מקדימה מתעדכנת בהקלדה */
document.addEventListener('input', e => {
  const input = e.target.closest('[data-img-input]');
  if (!input) return;
  const img = $(`[data-preview-for="${input.name}"]`, input.closest('.uploader'));
  if (img) { if (input.value) img.src = input.value; else img.removeAttribute('src'); }
});

/* ---------------------------------------------------------
   עורך טקסט עשיר — כתיבה חופשית או HTML גולמי
   --------------------------------------------------------- */
function rteField(name, label, value, hint) {
  return `
    <div class="field field--wide">
      <span class="field__label">${esc(label)}</span>
      <div class="rte" data-rte>
        <div class="rte__bar">
          <button class="rte__btn" type="button" data-cmd="bold" title="מודגש"><b>B</b></button>
          <button class="rte__btn" type="button" data-cmd="italic" title="נטוי"><i>I</i></button>
          <button class="rte__btn" type="button" data-block="h2" title="כותרת">H2</button>
          <button class="rte__btn" type="button" data-block="h3" title="כותרת משנה">H3</button>
          <button class="rte__btn" type="button" data-block="p" title="פסקה">¶</button>
          <button class="rte__btn" type="button" data-cmd="insertUnorderedList" title="רשימה">• רשימה</button>
          <button class="rte__btn" type="button" data-cmd="insertOrderedList" title="רשימה ממוספרת">1. רשימה</button>
          <button class="rte__btn" type="button" data-link title="קישור">🔗</button>
          <button class="rte__btn" type="button" data-cmd="removeFormat" title="ניקוי עיצוב">✕ עיצוב</button>
          <button class="rte__btn" type="button" data-code title="עריכת HTML">&lt;/&gt;</button>
        </div>
        <div class="rte__area" contenteditable="true" dir="rtl"></div>
        <textarea class="rte__code" spellcheck="false"></textarea>
        <input type="hidden" name="${name}" value="${esc(value || '')}">
      </div>
      ${hint ? `<span class="field__hint">${esc(hint)}</span>` : ''}
    </div>`;
}

/** מאתחל כל עורך שנוצר בחלון: ממלא תוכן ומחבר את הכפתורים. */
function initRTEs() {
  $$('[data-rte]', $('#modalForm')).forEach(rte => {
    const area   = $('.rte__area', rte);
    const code   = $('.rte__code', rte);
    const hidden = $('input[type=hidden]', rte);

    area.innerHTML = hidden.value || '';
    code.value = hidden.value || '';

    const sync = () => { hidden.value = rte.classList.contains('is-code') ? code.value : area.innerHTML; };
    area.addEventListener('input', sync);
    code.addEventListener('input', sync);

    $$('.rte__btn', rte).forEach(btn => {
      btn.addEventListener('mousedown', e => e.preventDefault());
      btn.addEventListener('click', () => {
        if (btn.dataset.code !== undefined) {
          const toCode = !rte.classList.contains('is-code');
          if (toCode) code.value = area.innerHTML;
          else area.innerHTML = code.value;
          rte.classList.toggle('is-code', toCode);
          btn.classList.toggle('is-on', toCode);
          sync();
          return;
        }
        if (rte.classList.contains('is-code')) return;
        area.focus();
        if (btn.dataset.link !== undefined) {
          const url = prompt('כתובת הקישור:', 'https://');
          if (url) document.execCommand('createLink', false, url);
        } else if (btn.dataset.block) {
          document.execCommand('formatBlock', false, btn.dataset.block);
        } else {
          document.execCommand(btn.dataset.cmd, false, null);
        }
        sync();
      });
    });
  });
}

/* =========================================================
   מוצרים
   ========================================================= */
const PRODUCT_KINDS = [
  ['',         'בושם'],
  ['makeup',   'איפור'],
  ['skincare', 'טיפוח פנים'],
  ['hair',     'שיער'],
  ['device',   'מכשיר חשמלי'],
  ['set',      'מארז']
];

function filteredProducts() {
  const q    = $('#productSearch').value.trim().toLowerCase();
  const cat  = $('#productCatFilter').value;
  const stock = $('#productStockFilter').value;

  return state.products.filter(p => {
    if (cat) {
      const inMain = p.category_id === cat;
      const sub = catById(cat);
      const inSub = sub && (p.subs || []).includes(sub.slug);
      if (!inMain && !inSub) return false;
    }
    if (stock === 'in'  && !p.is_in_stock) return false;
    if (stock === 'out' &&  p.is_in_stock) return false;
    if (q) {
      const hay = `${p.title} ${p.brand} ${p.latin || ''} ${p.sku}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderProducts() {
  /* מסנן הקטגוריות — ראשיות ואז תתי קטגוריות בהזחה */
  const sel = $('#productCatFilter');
  const keep = sel.value;
  sel.innerHTML = '<option value="">כל הקטגוריות</option>' + rootCats().map(root =>
    `<option value="${root.id}">${esc(root.name)}</option>` +
    subCats(root.id).map(s => `<option value="${s.id}">&nbsp;&nbsp;${esc(s.name)}</option>`).join('')
  ).join('');
  sel.value = keep;

  const list = filteredProducts();
  const body = $('#productsTable tbody');

  body.innerHTML = list.map(p => {
    const cat = catById(p.category_id);
    return `<tr>
      <td data-label="תמונה"><img class="table__img" src="${esc(p.img)}" alt="" loading="lazy"></td>
      <td data-label="שם">
        <span class="table__name">${esc(p.title)}</span>
        ${p.latin ? `<span class="table__latin">${esc(p.latin)}</span>` : ''}
      </td>
      <td data-label="מותג">${esc(p.brand)}</td>
      <td data-label="קטגוריה">${esc(cat ? cat.name : p.cat)}</td>
      <td data-label="מחיר" class="table__price">
        ${money(p.price)}
        ${p.original_price ? `<span class="table__old">${money(p.original_price)}</span>` : ''}
      </td>
      <td data-label="מלאי">${p.stock_quantity}</td>
      <td data-label="מצב">
        ${p.is_in_stock ? '<span class="tag tag--ok">במלאי</span>' : '<span class="tag tag--out">אזל</span>'}
        ${p.is_featured ? ' <span class="tag tag--gold">מומלץ</span>' : ''}
      </td>
      <td class="table__cell--actions">
        <div class="table__actions">
          <button class="btn btn--sm" type="button" data-edit-product="${esc(p.id)}">עריכה</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  $('#productsEmpty').hidden = list.length > 0;
  $('#productsCount').textContent =
    `${state.products.length} מוצרים בקטלוג` +
    (list.length !== state.products.length ? ` · ${list.length} מוצגים` : '');
}

$('#productSearch').addEventListener('input', renderProducts);
$('#productCatFilter').addEventListener('change', renderProducts);
$('#productStockFilter').addEventListener('change', renderProducts);

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-edit-product]');
  if (btn) productForm(state.products.find(p => p.id === btn.dataset.editProduct));
});

$('#newProduct').addEventListener('click', () => productForm(null));

function productForm(p) {
  const isNew = !p;
  p = p || {
    id: '', title: '', latin: '', brand_id: '', category_id: '', subs: [],
    price: '', original_price: '', sku: '', stock_quantity: 25,
    is_in_stock: true, is_featured: false, img: '', images: [],
    short_description: '', full_description: '', who: '', love: '',
    kind: '', style: '', note: '', need: '', rating: 5, reviews: 0,
    sort_order: state.products.length
  };

  const brandOpts = state.brands.map(b =>
    `<option value="${b.id}" ${b.id === p.brand_id ? 'selected' : ''}>${esc(b.name)}</option>`).join('');

  const catOpts = rootCats().map(c =>
    `<option value="${c.id}" ${c.id === p.category_id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');

  /* תתי הקטגוריות מקובצות תחת הקטגוריה הראשית שלהן */
  const subChips = rootCats().map(root => `
    <p class="field__hint" style="margin:10px 0 5px">${esc(root.name)}</p>
    <div class="chipset">
      ${subCats(root.id).map(s => `
        <label><input type="checkbox" name="subs" value="${esc(s.slug)}"
          ${(p.subs || []).includes(s.slug) ? 'checked' : ''}>${esc(s.name)}</label>`).join('')}
    </div>`).join('');

  openModal(isNew ? 'מוצר חדש' : 'עריכת מוצר', `
    <p class="sectitle">פרטי המוצר</p>
    <div class="fields">
      <label class="field field--wide">
        <span class="field__label">שם המוצר *</span>
        <input class="field__input" type="text" name="title" value="${esc(p.title)}" required>
      </label>

      <label class="field">
        <span class="field__label">שם לועזי</span>
        <input class="field__input" type="text" name="latin" value="${esc(p.latin)}" dir="ltr">
      </label>

      <label class="field">
        <span class="field__label">מק״ט *</span>
        <input class="field__input" type="text" name="sku" value="${esc(p.sku)}" required dir="ltr">
      </label>

      <label class="field">
        <span class="field__label">מותג *</span>
        <select class="field__select" name="brand_id" required>
          <option value="">בחירת מותג</option>${brandOpts}
        </select>
      </label>

      <label class="field">
        <span class="field__label">קטגוריה ראשית *</span>
        <select class="field__select" name="category_id" required>
          <option value="">בחירת קטגוריה</option>${catOpts}
        </select>
      </label>

      <label class="field">
        <span class="field__label">מחיר מכירה *</span>
        <input class="field__input" type="number" name="price" value="${esc(p.price)}"
               step="0.01" min="0" required dir="ltr">
      </label>

      <label class="field">
        <span class="field__label">מחיר לפני הנחה</span>
        <input class="field__input" type="number" name="original_price"
               value="${esc(p.original_price ?? '')}" step="0.01" min="0" dir="ltr">
        <span class="field__hint">ריק = בלי מבצע. אחרת יוצג קו חוצה.</span>
      </label>

      <label class="field">
        <span class="field__label">כמות במלאי</span>
        <input class="field__input" type="number" name="stock_quantity"
               value="${esc(p.stock_quantity)}" min="0" step="1" dir="ltr">
      </label>

      <label class="field">
        <span class="field__label">סוג מוצר</span>
        <select class="field__select" name="kind">
          ${PRODUCT_KINDS.map(([v, l]) =>
            `<option value="${v}" ${v === (p.kind || '') ? 'selected' : ''}>${esc(l)}</option>`).join('')}
        </select>
        <span class="field__hint">״בושם״ מציג את אריחי הניחוח בדף המוצר.</span>
      </label>

      <div class="field field--wide">
        <label class="checkline">
          <input type="checkbox" name="is_in_stock" ${p.is_in_stock ? 'checked' : ''}>
          <span>המוצר במלאי ומוצג בחנות</span>
        </label>
        <label class="checkline">
          <input type="checkbox" name="is_featured" ${p.is_featured ? 'checked' : ''}>
          <span>מוצר מומלץ</span>
        </label>
      </div>
    </div>

    <p class="sectitle">תמונות</p>
    ${imageField('img', 'תמונה ראשית *', p.img, 'זו התמונה שמופיעה בכרטיס המוצר ברשת.')}
    <div class="field field--wide">
      <span class="field__label">גלריית דף המוצר</span>
      <div class="uploader__row">
        <button class="btn btn--sm uploader__btn" type="button">
          הוספת תמונה<input type="file" accept="image/*" data-gallery-add>
        </button>
      </div>
      <div class="gallerylist" id="galleryList"></div>
      <input type="hidden" name="images" value="${esc(JSON.stringify(p.images || []))}">
      <span class="field__hint">ריק = דף המוצר מציג רק את התמונה הראשית.</span>
    </div>

    <p class="sectitle">תתי קטגוריות</p>
    <div class="field field--wide">
      ${subChips}
      <span class="field__hint">מוצר יכול להופיע בכמה תתי קטגוריות.</span>
    </div>

    <p class="sectitle">תיאורים</p>
    <div class="fields">
      <label class="field field--wide">
        <span class="field__label">תיאור קצר</span>
        <textarea class="field__area" name="short_description" style="min-height:60px">${esc(p.short_description)}</textarea>
      </label>
      ${rteField('full_description', 'תיאור מלא — הטאב ״על המוצר״', p.full_description)}
      <label class="field">
        <span class="field__label">הטאב ״למי זה מתאים״</span>
        <textarea class="field__area" name="who">${esc(p.who)}</textarea>
      </label>
      <label class="field">
        <span class="field__label">הטאב ״למה תתאהבי בו״</span>
        <textarea class="field__area" name="love">${esc(p.love)}</textarea>
      </label>
    </div>

    <p class="sectitle">מאפייני בישום ודירוג</p>
    <div class="fields">
      <label class="field">
        <span class="field__label">סגנון הניחוח</span>
        <input class="field__input" type="text" name="style" value="${esc(p.style)}"
               list="styleList" placeholder="פירותיי, אבקתי…">
        <datalist id="styleList">
          <option value="פירותיי"><option value="אבקתי"><option value="מתוק">
          <option value="רענן"><option value="אגוזי">
        </datalist>
      </label>
      <label class="field">
        <span class="field__label">מרכיב עיקרי</span>
        <input class="field__input" type="text" name="note" value="${esc(p.note)}"
               list="noteList" placeholder="פירות, צמחים…">
        <datalist id="noteList">
          <option value="פירות"><option value="צמחים"><option value="שרף">
          <option value="זרעים"><option value="מושק">
        </datalist>
      </label>
      <label class="field">
        <span class="field__label">מתאים ל־</span>
        <input class="field__input" type="text" name="need" value="${esc(p.need)}"
               list="needList" placeholder="יומיומי, ערב, אירוע">
        <datalist id="needList">
          <option value="יומיומי"><option value="ערב"><option value="אירוע">
        </datalist>
      </label>
      <label class="field">
        <span class="field__label">סדר הצגה</span>
        <input class="field__input" type="number" name="sort_order"
               value="${esc(p.sort_order)}" step="1" dir="ltr">
        <span class="field__hint">מספר קטן = מוקדם יותר ברשת.</span>
      </label>
      <label class="field">
        <span class="field__label">דירוג (0–5)</span>
        <input class="field__input" type="number" name="rating" value="${esc(p.rating)}"
               min="0" max="5" step="1" dir="ltr">
      </label>
      <label class="field">
        <span class="field__label">מספר חוות דעת</span>
        <input class="field__input" type="number" name="reviews" value="${esc(p.reviews)}"
               min="0" step="1" dir="ltr">
      </label>
    </div>
  `, async fd => {
    const row = {
      title: fd.get('title').trim(),
      latin: fd.get('latin').trim(),
      sku: fd.get('sku').trim(),
      brand_id: fd.get('brand_id'),
      category_id: fd.get('category_id'),
      price: Number(fd.get('price')),
      original_price: fd.get('original_price') ? Number(fd.get('original_price')) : null,
      stock_quantity: Number(fd.get('stock_quantity') || 0),
      is_in_stock: fd.get('is_in_stock') === 'on',
      is_featured: fd.get('is_featured') === 'on',
      kind: fd.get('kind') || null,
      img: fd.get('img').trim(),
      images: JSON.parse(fd.get('images') || '[]'),
      subs: fd.getAll('subs'),
      short_description: fd.get('short_description').trim() || null,
      full_description: fd.get('full_description').trim() || null,
      who: fd.get('who').trim() || null,
      love: fd.get('love').trim() || null,
      style: fd.get('style').trim() || null,
      note: fd.get('note').trim() || null,
      need: fd.get('need').trim() || null,
      sort_order: Number(fd.get('sort_order') || 0),
      rating: Number(fd.get('rating') || 5),
      reviews: Number(fd.get('reviews') || 0)
    };

    if (!row.img) { err('צריך תמונה ראשית'); return; }
    if (row.original_price !== null && row.original_price <= row.price) {
      err('המחיר לפני ההנחה צריך להיות גבוה ממחיר המכירה');
      return;
    }

    let res;
    if (isNew) {
      /* המזהה נכנס לכתובת (product.html?id=…), לכן הוא נשאר לטיני.
         שם עברי בלבד מקבל מזהה נוצר במקום עברית מקודדת בכתובת. */
      const base = slugify(row.latin);
      row.id = /[a-z0-9]/.test(base) ? base : 'product-' + Date.now().toString(36);
      if (state.products.some(x => x.id === row.id)) row.id += '-' + Date.now().toString(36);
      row.slug = row.id;
      res = await run(db.from('products').insert(row).select().single(), 'שמירת המוצר נכשלה');
    } else {
      res = await run(db.from('products').update(row).eq('id', p.id).select().single(), 'עדכון המוצר נכשל');
    }
    if (!res) return;

    closeModal();
    ok(isNew ? 'המוצר נוסף' : 'המוצר עודכן');
    state.products = await run(db.from('products').select('*').order('sort_order'), 'רענון הקטלוג נכשל') || state.products;
    renderProducts();
    renderTaxonomy();
  }, isNew ? null : () => {
    askDelete(`למחוק את "${p.title}"? הפעולה לא הפיכה.`, async () => {
      const res = await run(db.from('products').delete().eq('id', p.id), 'מחיקת המוצר נכשלה');
      if (res === null) return;
      closeModal();
      ok('המוצר נמחק');
      state.products = state.products.filter(x => x.id !== p.id);
      renderProducts();
      renderTaxonomy();
    });
  });

  drawGallery(p.images || []);
}

/* גלריית דף המוצר */
function drawGallery(list) {
  const wrap = $('#galleryList');
  if (!wrap) return;
  wrap.innerHTML = list.map((src, i) => `
    <div class="gallerylist__item">
      <img src="${esc(src)}" alt="">
      <button class="gallerylist__x" type="button" data-gallery-remove="${i}" aria-label="הסרה">&times;</button>
    </div>`).join('');
  const hidden = $('[name="images"]', $('#modalForm'));
  if (hidden) hidden.value = JSON.stringify(list);
}

function galleryList() {
  const hidden = $('[name="images"]', $('#modalForm'));
  try { return JSON.parse(hidden.value || '[]'); } catch { return []; }
}

document.addEventListener('change', async e => {
  const input = e.target.closest('[data-gallery-add]');
  if (!input || !input.files?.[0]) return;
  const btn = input.closest('.uploader__btn');
  const label = btn.firstChild;
  const prev = label.nodeValue;
  label.nodeValue = 'מעלה…';
  const url = await uploadFile(input.files[0], 'products');
  label.nodeValue = prev;
  input.value = '';
  if (!url) return;
  drawGallery([...galleryList(), url]);
  ok('התמונה נוספה לגלריה');
});

document.addEventListener('click', e => {
  const x = e.target.closest('[data-gallery-remove]');
  if (!x) return;
  const list = galleryList();
  list.splice(Number(x.dataset.galleryRemove), 1);
  drawGallery(list);
});

/* =========================================================
   קטגוריות ומותגים
   ========================================================= */
function productCountForCat(cat) {
  return cat.parent_id
    ? state.products.filter(p => (p.subs || []).includes(cat.slug)).length
    : state.products.filter(p => p.category_id === cat.id).length;
}

function renderTaxonomy() {
  $('#categoryTree').innerHTML = rootCats().map(root => `
    <div class="tnode" data-edit-cat="${root.id}" role="button" tabindex="0">
      <img class="tnode__img" src="${esc(root.image_url || '')}" alt="" onerror="this.style.visibility='hidden'">
      <span class="tnode__txt">
        <span class="tnode__name">${esc(root.name)}</span>
        <span class="tnode__slug">${esc(root.slug)}</span>
      </span>
      <span class="tnode__n">${productCountForCat(root)} מוצרים</span>
    </div>
    ${subCats(root.id).map(s => `
      <div class="tnode tnode--child" data-edit-cat="${s.id}" role="button" tabindex="0">
        <img class="tnode__img" src="${esc(s.image_url || '')}" alt="" onerror="this.style.visibility='hidden'">
        <span class="tnode__txt">
          <span class="tnode__name">${esc(s.name)}</span>
          <span class="tnode__slug">${esc(s.slug)}</span>
        </span>
        <span class="tnode__n">${productCountForCat(s)} מוצרים</span>
      </div>`).join('')}
  `).join('');

  $('#brandList').innerHTML = state.brands.map(b => `
    <div class="brow" data-edit-brand="${b.id}" role="button" tabindex="0">
      <img class="brow__logo" src="${esc(b.logo_url || '')}" alt="" onerror="this.style.visibility='hidden'">
      <span class="brow__name">${esc(b.name)}</span>
      <span class="brow__n">${state.products.filter(p => p.brand_id === b.id).length}</span>
    </div>`).join('');
}

document.addEventListener('click', e => {
  const c = e.target.closest('[data-edit-cat]');
  if (c) return categoryForm(catById(c.dataset.editCat));
  const b = e.target.closest('[data-edit-brand]');
  if (b) return brandForm(state.brands.find(x => x.id === b.dataset.editBrand));
});

$('#newCategory').addEventListener('click', () => categoryForm(null));
$('#newBrand').addEventListener('click', () => brandForm(null));

function categoryForm(c) {
  const isNew = !c;
  c = c || { id: '', name: '', slug: '', parent_id: '', image_url: '', description: '', sort_order: 99 };
  const used = productCountForCat(c);

  const parentOpts = rootCats()
    .filter(r => r.id !== c.id)
    .map(r => `<option value="${r.id}" ${r.id === c.parent_id ? 'selected' : ''}>${esc(r.name)}</option>`).join('');

  openModal(isNew ? 'קטגוריה חדשה' : 'עריכת קטגוריה', `
    <div class="fields">
      <label class="field">
        <span class="field__label">שם *</span>
        <input class="field__input" type="text" name="name" value="${esc(c.name)}" required>
      </label>
      <label class="field">
        <span class="field__label">slug *</span>
        <input class="field__input" type="text" name="slug" value="${esc(c.slug)}" required dir="ltr">
        <span class="field__hint">המפתח בכתובת: category.html?cat=<b>${esc(c.slug || 'slug')}</b></span>
      </label>
      <label class="field">
        <span class="field__label">קטגוריית אב</span>
        <select class="field__select" name="parent_id">
          <option value="">— קטגוריה ראשית —</option>${parentOpts}
        </select>
      </label>
      <label class="field">
        <span class="field__label">סדר הצגה</span>
        <input class="field__input" type="number" name="sort_order" value="${esc(c.sort_order)}" step="1" dir="ltr">
      </label>
      <div class="field field--wide">
        ${imageField('image_url', 'תמונת הקטגוריה', c.image_url, 'מוצגת בעיגולי הניווט בדף הקטגוריה.')}
      </div>
      <label class="field field--wide">
        <span class="field__label">תיאור</span>
        <textarea class="field__area" name="description" style="min-height:60px">${esc(c.description)}</textarea>
      </label>
    </div>
    ${!isNew && used ? `<p class="field__hint">משויכים לקטגוריה הזו ${used} מוצרים. שינוי ה-slug ישבור קישורים קיימים אליה.</p>` : ''}
  `, async fd => {
    const row = {
      name: fd.get('name').trim(),
      slug: slugify(fd.get('slug')) || slugify(fd.get('name')),
      parent_id: fd.get('parent_id') || null,
      image_url: fd.get('image_url').trim() || null,
      description: fd.get('description').trim() || null,
      sort_order: Number(fd.get('sort_order') || 0)
    };
    const res = isNew
      ? await run(db.from('categories').insert(row).select().single(), 'שמירת הקטגוריה נכשלה')
      : await run(db.from('categories').update(row).eq('id', c.id).select().single(), 'עדכון הקטגוריה נכשל');
    if (!res) return;
    closeModal();
    ok(isNew ? 'הקטגוריה נוספה' : 'הקטגוריה עודכנה');
    state.categories = await run(db.from('categories').select('*').order('sort_order'), 'רענון הקטגוריות נכשל') || state.categories;
    renderTaxonomy();
    renderProducts();
  }, isNew ? null : () => {
    askDelete(
      used ? `לקטגוריה "${c.name}" משויכים ${used} מוצרים. למחוק בכל זאת? המוצרים לא יימחקו.`
           : `למחוק את הקטגוריה "${c.name}"?`,
      async () => {
        const res = await run(db.from('categories').delete().eq('id', c.id), 'מחיקת הקטגוריה נכשלה');
        if (res === null) return;
        closeModal();
        ok('הקטגוריה נמחקה');
        state.categories = state.categories.filter(x => x.id !== c.id);
        renderTaxonomy();
        renderProducts();
      });
  });
}

function brandForm(b) {
  const isNew = !b;
  b = b || { id: '', name: '', slug: '', logo_url: '', sort_order: 99 };
  const used = state.products.filter(p => p.brand_id === b.id).length;

  openModal(isNew ? 'מותג חדש' : 'עריכת מותג', `
    <div class="fields">
      <label class="field">
        <span class="field__label">שם המותג *</span>
        <input class="field__input" type="text" name="name" value="${esc(b.name)}" required>
      </label>
      <label class="field">
        <span class="field__label">slug *</span>
        <input class="field__input" type="text" name="slug" value="${esc(b.slug)}" required dir="ltr">
      </label>
      <div class="field field--wide">
        ${imageField('logo_url', 'לוגו', b.logo_url)}
      </div>
    </div>
    ${!isNew && used ? `<p class="field__hint">משויכים למותג הזה ${used} מוצרים.</p>` : ''}
  `, async fd => {
    const row = {
      name: fd.get('name').trim(),
      slug: slugify(fd.get('slug')) || slugify(fd.get('name')),
      logo_url: fd.get('logo_url').trim() || null
    };
    const res = isNew
      ? await run(db.from('brands').insert(row).select().single(), 'שמירת המותג נכשלה')
      : await run(db.from('brands').update(row).eq('id', b.id).select().single(), 'עדכון המותג נכשל');
    if (!res) return;
    closeModal();
    ok(isNew ? 'המותג נוסף' : 'המותג עודכן');
    state.brands = await run(db.from('brands').select('*').order('name'), 'רענון המותגים נכשל') || state.brands;
    /* שם המותג מסונכרן במוצרים על ידי טריגר — מרעננים כדי לראות את זה */
    state.products = await run(db.from('products').select('*').order('sort_order'), 'רענון הקטלוג נכשל') || state.products;
    renderTaxonomy();
    renderProducts();
  }, isNew ? null : () => {
    askDelete(
      used ? `למותג "${b.name}" משויכים ${used} מוצרים. למחוק בכל זאת?` : `למחוק את המותג "${b.name}"?`,
      async () => {
        const res = await run(db.from('brands').delete().eq('id', b.id), 'מחיקת המותג נכשלה');
        if (res === null) return;
        closeModal();
        ok('המותג נמחק');
        state.brands = state.brands.filter(x => x.id !== b.id);
        renderTaxonomy();
      });
  });
}

/* =========================================================
   דפי תוכן
   ========================================================= */
function renderPages() {
  $('#pageList').innerHTML = state.pages.map(pg => `
    <article class="doc">
      <h3 class="doc__title">${esc(pg.title)}</h3>
      <div class="doc__meta">
        <span class="doc__slug">/${esc(pg.slug)}</span>
        ${pg.is_published ? '<span class="tag tag--ok">מפורסם</span>' : '<span class="tag tag--muted">טיוטה</span>'}
        <span>עודכן ${dateHe(pg.updated_at)}</span>
      </div>
      <div class="doc__foot">
        <button class="btn btn--sm" type="button" data-edit-page="${pg.id}">עריכה</button>
      </div>
    </article>`).join('') || '<p class="empty">אין עדיין דפי תוכן.</p>';
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-edit-page]');
  if (b) pageForm(state.pages.find(p => p.id === b.dataset.editPage));
});
$('#newPage').addEventListener('click', () => pageForm(null));

function pageForm(pg) {
  const isNew = !pg;
  pg = pg || { id: '', title: '', slug: '', content: '', is_published: false, sort_order: state.pages.length };

  openModal(isNew ? 'דף חדש' : 'עריכת דף', `
    <div class="fields">
      <label class="field">
        <span class="field__label">כותרת *</span>
        <input class="field__input" type="text" name="title" value="${esc(pg.title)}" required>
      </label>
      <label class="field">
        <span class="field__label">slug *</span>
        <input class="field__input" type="text" name="slug" value="${esc(pg.slug)}" required dir="ltr">
      </label>
      ${rteField('content', 'תוכן הדף', pg.content)}
      <div class="field field--wide">
        <label class="checkline">
          <input type="checkbox" name="is_published" ${pg.is_published ? 'checked' : ''}>
          <span>מפורסם באתר</span>
        </label>
      </div>
    </div>
  `, async fd => {
    const row = {
      title: fd.get('title').trim(),
      slug: slugify(fd.get('slug')) || slugify(fd.get('title')),
      content: fd.get('content'),
      is_published: fd.get('is_published') === 'on',
      sort_order: pg.sort_order ?? 0
    };
    const res = isNew
      ? await run(db.from('pages').insert(row).select().single(), 'שמירת הדף נכשלה')
      : await run(db.from('pages').update(row).eq('id', pg.id).select().single(), 'עדכון הדף נכשל');
    if (!res) return;
    closeModal();
    ok(isNew ? 'הדף נוסף' : 'הדף עודכן');
    state.pages = await run(db.from('pages').select('*').order('sort_order'), 'רענון הדפים נכשל') || state.pages;
    renderPages();
  }, isNew ? null : () => {
    askDelete(`למחוק את הדף "${pg.title}"?`, async () => {
      const res = await run(db.from('pages').delete().eq('id', pg.id), 'מחיקת הדף נכשלה');
      if (res === null) return;
      closeModal();
      ok('הדף נמחק');
      state.pages = state.pages.filter(x => x.id !== pg.id);
      renderPages();
    });
  });
}

/* =========================================================
   בלוג
   ========================================================= */
function renderPosts() {
  $('#postList').innerHTML = state.posts.map(po => `
    <article class="doc">
      ${po.cover_image ? `<img class="doc__cover" src="${esc(po.cover_image)}" alt="" loading="lazy">` : ''}
      <h3 class="doc__title">${esc(po.title)}</h3>
      <div class="doc__meta">
        ${po.is_published ? '<span class="tag tag--ok">מפורסם</span>' : '<span class="tag tag--muted">טיוטה</span>'}
        <span>${esc(po.author)}</span>
        <span>${dateHe(po.created_at)}</span>
      </div>
      ${po.summary ? `<p class="doc__sum">${esc(po.summary)}</p>` : ''}
      <div class="doc__foot">
        <button class="btn btn--sm" type="button" data-edit-post="${po.id}">עריכה</button>
      </div>
    </article>`).join('') || '<p class="empty">אין עדיין מאמרים.</p>';
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-edit-post]');
  if (b) postForm(state.posts.find(p => p.id === b.dataset.editPost));
});
$('#newPost').addEventListener('click', () => postForm(null));

function postForm(po) {
  const isNew = !po;
  po = po || {
    id: '', title: '', slug: '', summary: '', content: '',
    cover_image: '', author: 'מערכת ALMA', is_published: false
  };

  openModal(isNew ? 'מאמר חדש' : 'עריכת מאמר', `
    <div class="fields">
      <label class="field">
        <span class="field__label">כותרת *</span>
        <input class="field__input" type="text" name="title" value="${esc(po.title)}" required>
      </label>
      <label class="field">
        <span class="field__label">slug *</span>
        <input class="field__input" type="text" name="slug" value="${esc(po.slug)}" required dir="ltr">
      </label>
      <label class="field">
        <span class="field__label">מחבר</span>
        <input class="field__input" type="text" name="author" value="${esc(po.author)}">
      </label>
      <div class="field">
        <label class="checkline" style="margin-top:26px">
          <input type="checkbox" name="is_published" ${po.is_published ? 'checked' : ''}>
          <span>מפורסם באתר</span>
        </label>
      </div>
      <div class="field field--wide">
        ${imageField('cover_image', 'תמונת נושא', po.cover_image)}
      </div>
      <label class="field field--wide">
        <span class="field__label">תקציר</span>
        <textarea class="field__area" name="summary" style="min-height:60px">${esc(po.summary)}</textarea>
      </label>
      ${rteField('content', 'תוכן המאמר', po.content)}
    </div>
  `, async fd => {
    const row = {
      title: fd.get('title').trim(),
      slug: slugify(fd.get('slug')) || slugify(fd.get('title')),
      summary: fd.get('summary').trim() || null,
      content: fd.get('content'),
      cover_image: fd.get('cover_image').trim() || null,
      author: fd.get('author').trim() || 'מערכת ALMA',
      is_published: fd.get('is_published') === 'on'
    };
    const res = isNew
      ? await run(db.from('blog_posts').insert(row).select().single(), 'שמירת המאמר נכשלה')
      : await run(db.from('blog_posts').update(row).eq('id', po.id).select().single(), 'עדכון המאמר נכשל');
    if (!res) return;
    closeModal();
    ok(isNew ? 'המאמר נוסף' : 'המאמר עודכן');
    state.posts = await run(
      db.from('blog_posts').select('*').order('created_at', { ascending: false }), 'רענון הבלוג נכשל') || state.posts;
    renderPosts();
  }, isNew ? null : () => {
    askDelete(`למחוק את המאמר "${po.title}"?`, async () => {
      const res = await run(db.from('blog_posts').delete().eq('id', po.id), 'מחיקת המאמר נכשלה');
      if (res === null) return;
      closeModal();
      ok('המאמר נמחק');
      state.posts = state.posts.filter(x => x.id !== po.id);
      renderPosts();
    });
  });
}

/* =========================================================
   הגדרות החנות
   ========================================================= */
const LONG_SETTINGS = ['hero_subtitle', 'announcement_bar'];

function renderSettings() {
  $('#settingsFields').innerHTML = state.settings.map(s => {
    const long = LONG_SETTINGS.includes(s.key);
    return `
      <label class="field ${long ? 'field--wide' : ''}">
        <span class="field__label">${esc(s.label || s.key)}</span>
        ${long
          ? `<textarea class="field__area" name="${esc(s.key)}" style="min-height:60px">${esc(s.value)}</textarea>`
          : `<input class="field__input" type="text" name="${esc(s.key)}" value="${esc(s.value)}">`}
        <span class="field__hint" dir="ltr" style="text-align:start">${esc(s.key)}</span>
      </label>`;
  }).join('');
}

$('#settingsForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = 'שומר…';

  const fd = new FormData(e.target);
  const rows = state.settings.map(s => ({
    key: s.key, value: String(fd.get(s.key) ?? ''), label: s.label
  }));

  const res = await run(db.from('site_settings').upsert(rows, { onConflict: 'key' }).select(), 'שמירת ההגדרות נכשלה');

  btn.disabled = false;
  btn.textContent = 'שמירת הגדרות';
  if (!res) return;

  state.settings = res.sort((a, b) => a.key.localeCompare(b.key));
  ok('ההגדרות נשמרו');
});

/* =========================================================
   הזמנות
   ========================================================= */
const STATUS_HE = {
  pending: 'ממתין', processing: 'בטיפול', shipped: 'נשלח',
  completed: 'הושלם', cancelled: 'בוטל'
};

function renderOrders() {
  const q = $('#orderSearch').value.trim().toLowerCase();
  const st = $('#orderStatusFilter').value;

  const list = state.orders.filter(o => {
    if (st && o.status !== st) return false;
    if (q) {
      const hay = `${o.customer_name} ${o.customer_email} ${o.order_number}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  $('#ordersTable tbody').innerHTML = list.map(o => {
    const items = Array.isArray(o.items) ? o.items : [];
    const count = items.reduce((n, i) => n + (Number(i.qty) || 1), 0);
    return `<tr>
      <td data-label="הזמנה">#${esc(o.order_number)}</td>
      <td data-label="לקוח">
        <span class="table__name">${esc(o.customer_name)}</span>
        <span class="table__latin">${esc(o.customer_email)}</span>
      </td>
      <td data-label="פריטים">${count}</td>
      <td data-label="סכום" class="table__price">${money(o.total_price)}</td>
      <td data-label="תאריך">${dateHe(o.created_at)}</td>
      <td data-label="סטטוס"><span class="tag tag--${esc(o.status)}">${esc(STATUS_HE[o.status] || o.status)}</span></td>
      <td class="table__cell--actions">
        <div class="table__actions">
          <button class="btn btn--sm" type="button" data-edit-order="${o.id}">פתיחה</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  $('#ordersEmpty').hidden = list.length > 0;

  const pending = state.orders.filter(o => o.status === 'pending').length;
  const badge = $('#ordersBadge');
  badge.textContent = pending;
  badge.hidden = pending === 0;

  $('#ordersCount').textContent = state.orders.length
    ? `${state.orders.length} הזמנות · ${pending} ממתינות לטיפול`
    : 'אין עדיין הזמנות. הן ייווצרו כאשר דף התשלום יחובר לדאטהבייס.';
}

$('#orderSearch').addEventListener('input', renderOrders);
$('#orderStatusFilter').addEventListener('change', renderOrders);

document.addEventListener('click', e => {
  const b = e.target.closest('[data-edit-order]');
  if (b) orderForm(state.orders.find(o => o.id === b.dataset.editOrder));
});

function orderForm(o) {
  const items = Array.isArray(o.items) ? o.items : [];
  const addr = o.shipping_address || {};

  openModal(`הזמנה #${o.order_number}`, `
    <p class="sectitle">הלקוח</p>
    <div class="fields">
      <div class="field"><span class="field__label">שם</span><div>${esc(o.customer_name)}</div></div>
      <div class="field"><span class="field__label">דוא״ל</span><div dir="ltr" style="text-align:start">${esc(o.customer_email)}</div></div>
      <div class="field"><span class="field__label">טלפון</span><div dir="ltr" style="text-align:start">${esc(o.customer_phone || '—')}</div></div>
      <div class="field"><span class="field__label">תאריך</span><div>${dateHe(o.created_at)}</div></div>
      <div class="field field--wide">
        <span class="field__label">כתובת למשלוח</span>
        <div>${esc([addr.street, addr.city, addr.zip].filter(Boolean).join(', ') || '—')}</div>
      </div>
    </div>

    <p class="sectitle">פריטים</p>
    <div class="tablewrap" style="box-shadow:none">
      <table class="table">
        <thead><tr><th>מוצר</th><th>כמות</th><th>מחיר</th></tr></thead>
        <tbody>
          ${items.length ? items.map(i => `
            <tr>
              <td data-label="מוצר">${esc(i.name || i.title || i.id || '—')}</td>
              <td data-label="כמות">${esc(i.qty || 1)}</td>
              <td data-label="מחיר" class="table__price">${money(i.price)}</td>
            </tr>`).join('') : '<tr><td colspan="3">אין פריטים</td></tr>'}
          <tr>
            <td><b>סה״כ</b></td><td></td>
            <td class="table__price"><b>${money(o.total_price)}</b></td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="sectitle">טיפול</p>
    <div class="fields">
      <label class="field">
        <span class="field__label">סטטוס</span>
        <select class="field__select" name="status">
          ${Object.entries(STATUS_HE).map(([v, l]) =>
            `<option value="${v}" ${v === o.status ? 'selected' : ''}>${esc(l)}</option>`).join('')}
        </select>
      </label>
      <label class="field field--wide">
        <span class="field__label">הערה פנימית</span>
        <textarea class="field__area" name="notes" style="min-height:60px">${esc(o.notes || '')}</textarea>
      </label>
    </div>
  `, async fd => {
    const row = { status: fd.get('status'), notes: fd.get('notes').trim() || null };
    const res = await run(db.from('orders').update(row).eq('id', o.id).select().single(), 'עדכון ההזמנה נכשל');
    if (!res) return;
    closeModal();
    ok('ההזמנה עודכנה');
    Object.assign(o, res);
    renderOrders();
  }, () => {
    askDelete(`למחוק את הזמנה #${o.order_number}? הפעולה לא הפיכה.`, async () => {
      const res = await run(db.from('orders').delete().eq('id', o.id), 'מחיקת ההזמנה נכשלה');
      if (res === null) return;
      closeModal();
      ok('ההזמנה נמחקה');
      state.orders = state.orders.filter(x => x.id !== o.id);
      renderOrders();
    });
  });
}

/* ---------------------------------------------------------
   הפעלה
   --------------------------------------------------------- */
db.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') { gate.hidden = false; app.hidden = true; }
});

boot();
