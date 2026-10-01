import { api, session } from './api.js';
import { cart } from './cart.js';

const $ = (s) => document.querySelector(s);
const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const label = (c) => c.replace(/-/g, ' ');
const filter = { q: '', category: '' };
let authMode = 'login';

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 2600);
}

/* ---------- Catalog ---------- */
const card = (p) => `<a class="card" href="#/product/${p.id}"><img src="${esc(p.thumbnail)}" alt="${esc(p.title)}" loading="lazy">
  <div class="card-b"><span class="muted">${esc(label(p.category))}</span><h3>${esc(p.title)}</h3>
  <div class="row"><b>${money(p.price)}</b><span class="muted">${p.rating} / 5</span></div></div></a>`;

async function loadGrid() {
  const grid = $('#grid');
  try {
    const list = await api.products(Object.fromEntries(Object.entries(filter).filter(([, v]) => v)));
    grid.innerHTML = list.length ? list.map(card).join('') : '<p>No products match. Try a different search or category.</p>';
  } catch (e) { grid.innerHTML = `<p class="err">${esc(e.message)}</p>`; }
}

async function loadChips() {
  try {
    const cats = await api.categories();
    $('#chips').innerHTML = ['', ...cats].map((c) =>
      `<button class="chip" data-cat="${esc(c)}" aria-pressed="${c === filter.category}">${c ? esc(label(c)) : 'All'}</button>`).join('');
  } catch { /* grid shows the error */ }
}

async function showDetail(id) {
  const el = $('#detail');
  el.innerHTML = '<p>Loading...</p>';
  try {
    const p = await api.product(id);
    el.innerHTML = `<a href="#/">Back to all products</a><div class="detail">
      <div><img class="main" id="mainImg" src="${esc(p.images[0] || p.thumbnail)}" alt="${esc(p.title)}">
        <div class="thumbs">${p.images.slice(0, 4).map((u) => `<img src="${esc(u)}" alt="" data-img="${esc(u)}">`).join('')}</div></div>
      <div><span class="muted">${esc(label(p.category))}${p.brand ? ` by ${esc(p.brand)}` : ''}</span>
        <h1>${esc(p.title)}</h1><div class="price">${money(p.price)}</div>
        <p>${esc(p.description)}</p><p class="muted">Rated ${p.rating} / 5. ${p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</p>
        <button class="btn big" data-add="${p.id}" ${p.stock > 0 ? '' : 'disabled'}>Add to cart</button></div></div>`;
    el.dataset.product = JSON.stringify({ id: p.id, title: p.title, price: p.price, thumbnail: p.thumbnail });
    document.title = `${p.title} | Parcel`;
  } catch (e) { el.innerHTML = `<p class="err">${esc(e.message)}</p><a href="#/">Back to all products</a>`; }
}

function route() {
  const m = location.hash.match(/^#\/product\/(\d+)/);
  $('#home').hidden = !!m; $('#detail').hidden = !m;
  if (m) { showDetail(m[1]); window.scrollTo(0, 0); } else document.title = 'Parcel | Everyday goods, delivered';
}

/* ---------- Cart UI ---------- */
cart.subscribe((items) => {
  $('#count').textContent = cart.count();
  $('#total').textContent = money(cart.total());
  $('#lines').innerHTML = items.length ? items.map((i) => `<div class="line"><img src="${esc(i.thumbnail)}" alt="">
    <div><div>${esc(i.title)}</div><div class="qty"><button data-dec="${i.id}" aria-label="Decrease quantity">-</button>${i.qty}
    <button data-inc="${i.id}" aria-label="Increase quantity">+</button></div></div><b>${money(i.price * i.qty)}</b></div>`).join('')
    : '<p>Your cart is empty. Add something from the shop.</p>';
  $('#pay').disabled = !items.length;
});

async function pay() {
  if (!session.user) { $('#drawer').hidden = true; return openAuth('login', 'Sign in to check out'); }
  $('#pay').disabled = true;
  try { location.href = (await api.checkout(cart.items.map(({ id, qty }) => ({ id, qty })))).url; }
  catch (e) { toast(e.message); $('#pay').disabled = false; }
}

/* ---------- Auth ---------- */
function renderAcct() { $('#acct').textContent = session.user ? `Sign out (${session.user.name.split(' ')[0]})` : 'Sign in'; }

function openAuth(mode, title) {
  authMode = mode;
  const reg = mode === 'register';
  $('#authTitle').textContent = title || (reg ? 'Create your account' : 'Sign in');
  $('#nameRow').hidden = !reg;
  $('#authSwap').textContent = reg ? 'Have an account? Sign in' : 'New here? Create an account';
  $('#authErr').textContent = '';
  $('#authDlg').showModal();
}

$('#authForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.target));
  try {
    const { token, user } = await (authMode === 'register' ? api.register(body) : api.login(body));
    session.token = token; session.user = user; renderAcct();
    $('#authDlg').close(); e.target.reset(); toast(`Signed in as ${user.name}`);
  } catch (err) { $('#authErr').textContent = err.message; }
});
$('#authSwap').onclick = () => openAuth(authMode === 'login' ? 'register' : 'login');
$('#acct').onclick = () => {
  if (!session.user) return openAuth('login');
  session.token = null; session.user = null; renderAcct(); toast('Signed out');
};

/* ---------- Events ---------- */
document.addEventListener('click', (e) => {
  const t = e.target;
  if (t.dataset.cat !== undefined && t.classList.contains('chip')) { filter.category = t.dataset.cat; loadChips(); loadGrid(); }
  if (t.dataset.add) { cart.add(JSON.parse($('#detail').dataset.product)); toast('Added to cart'); }
  if (t.dataset.img) $('#mainImg').src = t.dataset.img;
  if (t.dataset.inc) cart.setQty(+t.dataset.inc, cart.items.find((i) => i.id === +t.dataset.inc).qty + 1);
  if (t.dataset.dec) cart.setQty(+t.dataset.dec, cart.items.find((i) => i.id === +t.dataset.dec).qty - 1);
  if (t.dataset.close !== undefined) $('#drawer').hidden = true;
});
$('#cartBtn').onclick = () => { $('#drawer').hidden = false; };
$('#pay').onclick = pay;
let timer;
$('#search').addEventListener('input', (e) => { clearTimeout(timer); timer = setTimeout(() => { filter.q = e.target.value.trim(); loadGrid(); }, 250); });
window.addEventListener('hashchange', route);

/* ---------- Init ---------- */
(async function init() {
  if (session.token) { try { session.user = (await api.me()).user; } catch { session.token = null; } }
  renderAcct();
  const status = new URLSearchParams(location.search).get('checkout');
  if (status === 'success') { cart.clear(); toast('Payment received. Thank you!'); }
  if (status === 'cancelled') toast('Checkout cancelled. Your cart is saved.');
  if (status) history.replaceState({}, '', '/');
  loadChips(); loadGrid(); route();
})();
