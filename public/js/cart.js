// Cart state persisted in localStorage; UI subscribes to changes.
const KEY = 'parcel_cart';
let items = [];
try { items = JSON.parse(localStorage.getItem(KEY)) || []; } catch { items = []; }
const subs = new Set();
const save = () => { localStorage.setItem(KEY, JSON.stringify(items)); subs.forEach((f) => f(items)); };

export const cart = {
  get items() { return items; },
  count: () => items.reduce((n, i) => n + i.qty, 0),
  total: () => items.reduce((n, i) => n + i.qty * i.price, 0),
  add(p, qty = 1) {
    const found = items.find((i) => i.id === p.id);
    found ? (found.qty = Math.min(found.qty + qty, 10))
          : items.push({ id: p.id, title: p.title, price: p.price, thumbnail: p.thumbnail, qty });
    save();
  },
  setQty(id, qty) { items = items.map((i) => i.id === id ? { ...i, qty } : i).filter((i) => i.qty > 0); save(); },
  clear() { items = []; save(); },
  subscribe(f) { subs.add(f); f(items); },
};
