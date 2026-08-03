const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const ADMIN_TOKEN_KEY = 'hooked_admin_token';
const CUSTOMER_TOKEN_KEY = 'hooked_customer_token';

export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);
export const setAdminToken = (token) => localStorage.setItem(ADMIN_TOKEN_KEY, token);
export const clearAdminToken = () => localStorage.removeItem(ADMIN_TOKEN_KEY);

export const getCustomerToken = () => localStorage.getItem(CUSTOMER_TOKEN_KEY);
export const setCustomerToken = (token) => localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
export const clearCustomerToken = () => localStorage.removeItem(CUSTOMER_TOKEN_KEY);

// authType: null (public), 'admin', or 'customer' — determines which bearer token, if any, is attached
async function request(path, options = {}, authType = null) {
  const token = authType === 'admin' ? getAdminToken() : authType === 'customer' ? getCustomerToken() : null;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {}
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // storefront
  getCategories: () => request('/categories'),
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? `?${qs}` : ''}`);
  },
  getProduct: (idOrSlug) => request(`/products/${idOrSlug}`),
  getRelated: (idOrSlug) => request(`/products/${idOrSlug}/related`),

  // currency / country
  getCountries: () => request('/currency/countries'),
  getRates: () => request('/currency/rates'),

  // cart
  createCart: () => request('/cart', { method: 'POST' }),
  getCart: (cartId) => request(`/cart/${cartId}`),
  addCartItem: (cartId, body) => request(`/cart/${cartId}/items`, { method: 'POST', body: JSON.stringify(body) }),
  updateCartItem: (cartId, itemId, qty) =>
    request(`/cart/${cartId}/items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ qty }) }),
  removeCartItem: (cartId, itemId) => request(`/cart/${cartId}/items/${itemId}`, { method: 'DELETE' }),

  // orders
  createOrder: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }, 'customer'),
  getOrder: (id) => request(`/orders/${id}`),
  mockPay: (id) => request(`/orders/${id}/mock-pay`, { method: 'POST' }),

  // custom orders
  submitCustomOrder: (body) => request('/custom-orders', { method: 'POST', body: JSON.stringify(body) }),

  // customer accounts
  customerSignup: (body) => request('/customers/signup', { method: 'POST', body: JSON.stringify(body) }),
  customerLogin: (body) => request('/customers/login', { method: 'POST', body: JSON.stringify(body) }),
  customerMe: () => request('/customers/me', {}, 'customer'),
  customerUpdateMe: (body) => request('/customers/me', { method: 'PUT', body: JSON.stringify(body) }, 'customer'),
  customerAddresses: () => request('/customers/me/addresses', {}, 'customer'),
  customerAddAddress: (body) => request('/customers/me/addresses', { method: 'POST', body: JSON.stringify(body) }, 'customer'),
  customerUpdateAddress: (id, body) => request(`/customers/me/addresses/${id}`, { method: 'PUT', body: JSON.stringify(body) }, 'customer'),
  customerDeleteAddress: (id) => request(`/customers/me/addresses/${id}`, { method: 'DELETE' }, 'customer'),
  customerOrders: () => request('/customers/me/orders', {}, 'customer'),

  // admin
  adminLogin: (email, password) => request('/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  adminMe: () => request('/admin/me', {}, 'admin'),
  adminDashboard: () => request('/admin/dashboard', {}, 'admin'),
  adminOrders: (status) => request(`/orders${status ? `?status=${status}` : ''}`, {}, 'admin'),
  adminUpdateOrderStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, 'admin'),
  adminCustomOrders: (status) => request(`/custom-orders${status ? `?status=${status}` : ''}`, {}, 'admin'),
  adminUpdateCustomOrderStatus: (id, status) => request(`/custom-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, 'admin'),
  adminCreateProduct: (body) => request('/products', { method: 'POST', body: JSON.stringify(body) }, 'admin'),
  adminUpdateProduct: (id, body) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }, 'admin'),
  adminDeleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }, 'admin'),
  adminUpdateRate: (code, rateToPkr) => request(`/currency/rates/${code}`, { method: 'PUT', body: JSON.stringify({ rateToPkr }) }, 'admin'),
  adminUpdateCountry: (code, body) => request(`/currency/countries/${code}`, { method: 'PUT', body: JSON.stringify(body) }, 'admin'),
};
