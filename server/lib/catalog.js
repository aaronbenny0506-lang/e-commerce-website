// Product catalog from dummyjson, cached in memory. Also the source of truth for checkout prices.
const TTL = 10 * 60 * 1000;
let cache = { at: 0, items: [] };

const slim = (p) => ({
  id: p.id, title: p.title, description: p.description, price: p.price,
  category: p.category, brand: p.brand || '', rating: p.rating,
  stock: p.stock, thumbnail: p.thumbnail, images: p.images || [],
});

export async function catalog() {
  if (Date.now() - cache.at < TTL && cache.items.length) return cache.items;
  const res = await fetch('https://dummyjson.com/products?limit=0');
  if (!res.ok) {
    if (cache.items.length) return cache.items; // serve stale on upstream failure
    throw Object.assign(new Error('Product service unavailable'), { status: 502 });
  }
  cache = { at: Date.now(), items: (await res.json()).products.map(slim) };
  return cache.items;
}
