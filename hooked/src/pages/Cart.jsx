import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductArt from '../components/ProductArt';
import { StitchRow } from '../components/CrochetMotifs';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { api } from '../api/client';
import './Cart.css';

export default function Cart() {
  const { cartId, items, loading, removeItem, updateQty, subtotal, clearLocalCart } = useCart();
  const { countries, countryCode: defaultCountry, currencyCode: defaultCurrency, convert, currency } = useCurrency();
  const { isAuthed } = useCustomerAuth();
  const navigate = useNavigate();

  const [checkingOut, setCheckingOut] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry || 'PK');
  const [paymentMethod, setPaymentMethod] = useState('card');

  const country = countries.find((c) => c.code === selectedCountry);
  const shippingPkr = country?.shippingFlat ?? 0;
  const totalPkr = subtotal + shippingPkr;

  async function handleCheckout(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.target);
    try {
      const order = await api.createOrder({
        cartId,
        customerName: form.get('name'),
        customerEmail: form.get('email'),
        shippingAddress: {
          line1: form.get('line1'),
          city: form.get('city'),
          state: form.get('state'),
          zip: form.get('zip'),
        },
        countryCode: selectedCountry,
        currencyCode: defaultCurrency || country?.defaultCurrency || 'PKR',
        paymentMethod,
        notes: form.get('notes') || undefined,
      });
      clearLocalCart();
      navigate(`/order/${order.id}`);
    } catch (err) {
      setError(err.message || 'Something went wrong placing your order.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="section cart-page">
        <div className="wrap"><p style={{ textAlign: 'center', color: '#7a7161', padding: '60px 0' }}>Loading your cart…</p></div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="section cart-page">
        <div className="wrap">
          <div className="empty-cart">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.5"><path d="M3 6h2l1.6 10.6A2 2 0 0 0 8.6 18h9.8a2 2 0 0 0 2-1.7L22 8H6"/><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></svg>
            </div>
            <h2>Your cart is empty</h2>
            <p>Nothing here yet — let's find you something handmade.</p>
            <Link to="/shop" className="btn btn-solid">Browse the Shop →</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section cart-page">
      <div className="wrap">
        <div className="section-head" style={{ textAlign: 'left', marginBottom: 30 }}>
          <span className="mono">♡ your bag ♡</span>
          <h2>Cart</h2>
        </div>
        <StitchRow count={20} />

        <div className="cart-layout" style={{ marginTop: 30 }}>
          <div className="cart-items">
            {items.map((item) => (
              <div className="cart-row" key={item.itemId}>
                <div className="cart-thumb" style={{ background: item.bg }}>
                  <ProductArt icon={item.icon} size="55%" />
                </div>
                <div className="cart-row-info">
                  <h3>{item.name}</h3>
                  <p className="cart-color">{item.color}</p>
                  <div className="qty-row">
                    <button onClick={() => updateQty(item.itemId, item.qty - 1)} aria-label="decrease quantity">–</button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(item.itemId, item.qty + 1)} aria-label="increase quantity">+</button>
                  </div>
                </div>
                <div className="cart-row-right">
                  <span className="price">{currency?.symbol || 'Rs'} {convert(item.price * item.qty).toFixed(2)}</span>
                  <button className="remove-btn" onClick={() => removeItem(item.itemId)}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>

            {!checkingOut && (
              <label className="ship-to-label">
                Shipping to
                <select value={selectedCountry} onChange={(e) => { setSelectedCountry(e.target.value); if (e.target.value !== 'PK' && paymentMethod === 'cod') setPaymentMethod('card'); }}>
                  {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </label>
            )}

            <div className="summary-row"><span>Subtotal</span><span>{currency?.symbol || 'Rs'} {convert(subtotal).toFixed(2)}</span></div>
            <div className="summary-row"><span>Shipping</span><span>{currency?.symbol || 'Rs'} {convert(shippingPkr).toFixed(2)}</span></div>
            <div className="summary-row total"><span>Total</span><span>{currency?.symbol || 'Rs'} {convert(totalPkr).toFixed(2)}</span></div>

            {!checkingOut ? (
              <button className="btn btn-solid btn-lg" onClick={() => setCheckingOut(true)}>Checkout →</button>
            ) : (
              <form className="checkout-form" onSubmit={handleCheckout}>
                <input name="name" placeholder="Full name" required />
                <input name="email" type="email" placeholder="Email" required />
                <input name="line1" placeholder="Shipping address" required />
                <div className="checkout-row">
                  <input name="city" placeholder="City" required />
                  <input name="state" placeholder="State/Province" />
                  <input name="zip" placeholder="Postal code" />
                </div>

                <div className="payment-options">
                  <label className={`payment-option ${paymentMethod === 'card' ? 'active' : ''}`}>
                    <input type="radio" name="pm" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                    Card (Safepay)
                  </label>
                  <label className={`payment-option ${paymentMethod === 'cod' ? 'active' : ''} ${!country?.codAvailable ? 'disabled' : ''}`}>
                    <input type="radio" name="pm" disabled={!country?.codAvailable} checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                    Cash on Delivery {!country?.codAvailable && '(Pakistan only)'}
                  </label>
                </div>

                <textarea name="notes" rows="2" placeholder="Order notes (optional)" />
                {!isAuthed && <p className="guest-note">Checking out as guest — <Link to="/login">sign in</Link> to save this order to your account.</p>}
                {error && <p className="checkout-error">{error}</p>}
                <button type="submit" className="btn btn-solid btn-lg" disabled={submitting}>
                  {submitting ? 'Placing order…' : `Place Order — ${currency?.symbol || 'Rs'} ${convert(totalPkr).toFixed(2)}`}
                </button>
              </form>
            )}
            <Link to="/shop" className="continue-link">← Continue Shopping</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
