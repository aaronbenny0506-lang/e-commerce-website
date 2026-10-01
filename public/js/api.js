const KEY = 'parcel_token';
export const session = {
  user: null,
  get token() { return localStorage.getItem(KEY); },
  set token(t) { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); },
};

async function req(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (session.token) headers.Authorization = `Bearer ${session.token}`;
  const res = await fetch(`/api${path}`, { method, headers, body: body && JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
  return data;
}

export const api = {
  products: (params) => req(`/products?${new URLSearchParams(params)}`),
  product: (id) => req(`/products/${id}`),
  categories: () => req('/products/categories'),
  register: (body) => req('/auth/register', { method: 'POST', body }),
  login: (body) => req('/auth/login', { method: 'POST', body }),
  me: () => req('/auth/me'),
  checkout: (items) => req('/checkout', { method: 'POST', body: { items } }),
};
