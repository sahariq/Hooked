import { useEffect, useState } from 'react';
import ProductArt from '../../components/ProductArt';
import { api } from '../../api/client';

const ICONS = ['strawberry', 'coaster', 'fox', 'bunny', 'flower', 'target', 'mushroom', 'star'];
const emptyForm = { slug: '', name: '', category: '', price: '', bg: '#F6D9E4', icon: 'star', badge: '', description: '', colors: '', details: '' };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null); // null = form closed, object = editing/creating
  const [error, setError] = useState(null);

  function load() {
    setLoading(true);
    Promise.all([api.getProducts(), api.getCategories()])
      .then(([p, c]) => { setProducts(p); setCategories(c); })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setError(null);
    setForm({ ...emptyForm, category: categories[0]?.slug || '' });
  }

  function openEdit(p) {
    setError(null);
    setForm({
      id: p.id, slug: p.slug, name: p.name, category: p.category, price: p.price,
      bg: p.bg, icon: p.icon, badge: p.badge || '', description: p.description,
      colors: (p.colors || []).join(', '), details: (p.details || []).join('\n'),
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const payload = {
      slug: form.slug, name: form.name, category: form.category, price: Number(form.price),
      bg: form.bg, icon: form.icon, badge: form.badge || null, description: form.description,
      colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean),
      details: form.details.split('\n').map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (form.id) {
        await api.adminUpdateProduct(form.id, payload);
      } else {
        await api.adminCreateProduct(payload);
      }
      setForm(null);
      load();
    } catch (err) {
      setError(err.message || 'Could not save product');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this product from the shop?')) return;
    await api.adminDeleteProduct(id);
    load();
  }

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>Products</h1>
          <p>{products.length} active product{products.length === 1 ? '' : 's'}</p>
        </div>
        {!form && <button className="btn btn-solid btn-sm" onClick={openCreate}>+ Add Product</button>}
      </div>

      {form && (
        <form className="admin-product-form" onSubmit={handleSubmit}>
          <label>Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>Slug (url-safe id)
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required disabled={!!form.id} />
          </label>
          <label>Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </label>
          <label>Price ($)
            <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </label>
          <label>Icon
            <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
              {ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </label>
          <label>Badge
            <select value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })}>
              <option value="">None</option>
              <option value="New">New</option>
              <option value="Best Seller">Best Seller</option>
            </select>
          </label>
          <label>Background color
            <input type="color" value={form.bg} onChange={(e) => setForm({ ...form, bg: e.target.value })} />
          </label>
          <label>Colors / styles (comma separated)
            <input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="Blush Pink, Sky Blue" />
          </label>
          <label className="full">Description
            <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label className="full">Details (one per line)
            <textarea rows="3" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder={'Approx. 3 in tall\n100% cotton yarn'} />
          </label>
          {error && <p className="checkout-error full">{error}</p>}
          <div className="form-actions">
            <button type="button" className="btn btn-sm" onClick={() => setForm(null)}>Cancel</button>
            <button type="submit" className="btn btn-solid btn-sm">{form.id ? 'Save Changes' : 'Create Product'}</button>
          </div>
        </form>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Rating</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: '#7a7161' }}>Loading…</td></tr>
            ) : products.map((p) => (
              <tr key={p.id}>
                <td>
                  <span className="icon-thumb" style={{ background: p.bg }}>
                    <ProductArt icon={p.icon} size="65%" />
                  </span>
                  {p.name}
                </td>
                <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                <td>${p.price.toFixed(2)}</td>
                <td>{p.rating}★ ({p.reviews})</td>
                <td>
                  <div className="row-actions">
                    <button onClick={() => openEdit(p)}>Edit</button>
                    <button onClick={() => handleDelete(p.id)}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
