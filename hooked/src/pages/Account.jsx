import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../api/client';
import { ScissorsIcon, StitchRow } from '../components/CrochetMotifs';
import './Account.css';

export default function Account() {
  const { customer, isAuthed, checking, logout } = useCustomerAuth();
  const { countries, formatPrice } = useCurrency();
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingAddress, setAddingAddress] = useState(false);

  useEffect(() => {
    if (!isAuthed) return;
    Promise.all([api.customerOrders(), api.customerAddresses()])
      .then(([o, a]) => { setOrders(o); setAddresses(a); })
      .finally(() => setLoading(false));
  }, [isAuthed]);

  if (!checking && !isAuthed) return <Navigate to="/login" replace />;
  if (checking) return null;

  async function handleAddAddress(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const body = {
      label: form.get('label') || 'Home',
      fullName: form.get('fullName'),
      phone: form.get('phone'),
      line1: form.get('line1'),
      city: form.get('city'),
      state: form.get('state'),
      postalCode: form.get('postalCode'),
      countryCode: form.get('countryCode'),
      isDefault: addresses.length === 0,
    };
    const created = await api.customerAddAddress(body);
    setAddresses((prev) => [created, ...prev]);
    setAddingAddress(false);
    e.target.reset();
  }

  async function handleDeleteAddress(id) {
    await api.customerDeleteAddress(id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <section className="section account-page">
      <div className="wrap">
        <div className="section-head" style={{ textAlign: 'left', marginBottom: 20 }}>
          <span className="mono">♡ your account ♡</span>
          <h2>Hi, {customer.fullName.split(' ')[0]}</h2>
        </div>
        <StitchRow count={20} />

        <div className="account-tabs">
          <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>Order History</button>
          <button className={tab === 'addresses' ? 'active' : ''} onClick={() => setTab('addresses')}>Saved Addresses</button>
          <button className="logout-btn" onClick={logout}><ScissorsIcon size={14} /> Log out</button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#7a7161', padding: '50px 0' }}>Loading…</p>
        ) : tab === 'orders' ? (
          orders.length === 0 ? (
            <div className="account-empty">
              <p>No orders yet.</p>
              <Link to="/shop" className="btn btn-solid">Start Shopping →</Link>
            </div>
          ) : (
            <div className="order-list">
              {orders.map((o) => (
                <div className="order-row" key={o.id}>
                  <div>
                    <h3>{o.orderNumber}</h3>
                    <p className="order-date">{new Date(o.createdAt).toLocaleDateString()} · {o.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card'}</p>
                  </div>
                  <span className={`pill-status ${o.status}`}>{o.status.replace('_', ' ')}</span>
                  <span className="order-total">{o.displayCurrency} {Number(o.displayTotal ?? o.total).toFixed(2)}</span>
                  <Link to={`/order/${o.id}`} className="order-view">View →</Link>
                </div>
              ))}
            </div>
          )
        ) : (
          <div>
            <div className="address-list">
              {addresses.map((a) => (
                <div className="address-card" key={a.id}>
                  {a.is_default && <span className="default-pill">Default</span>}
                  <h3>{a.label}</h3>
                  <p>{a.full_name}</p>
                  <p>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
                  <p>{a.city}{a.state ? `, ${a.state}` : ''} {a.postal_code}</p>
                  <p>{countries.find((c) => c.code === a.country_code)?.name || a.country_code}</p>
                  <button className="remove-btn" onClick={() => handleDeleteAddress(a.id)}>Remove</button>
                </div>
              ))}
            </div>

            {addingAddress ? (
              <form className="address-form" onSubmit={handleAddAddress}>
                <input name="label" placeholder="Label (e.g. Home)" />
                <input name="fullName" placeholder="Full name" required />
                <input name="phone" placeholder="Phone" />
                <input name="line1" placeholder="Address line" required />
                <div className="address-row">
                  <input name="city" placeholder="City" required />
                  <input name="state" placeholder="State/Province" />
                  <input name="postalCode" placeholder="Postal code" />
                </div>
                <select name="countryCode" required defaultValue="">
                  <option value="" disabled>Country</option>
                  {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
                <div className="address-form-actions">
                  <button type="button" className="btn btn-sm" onClick={() => setAddingAddress(false)}>Cancel</button>
                  <button type="submit" className="btn btn-solid btn-sm">Save Address</button>
                </div>
              </form>
            ) : (
              <button className="btn btn-solid btn-sm" onClick={() => setAddingAddress(true)}>+ Add Address</button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
