import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { SnipDivider, YarnBallIcon } from '../components/CrochetMotifs';
import './OrderConfirmation.css';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);

  function load() {
    api.getOrder(id).then(setOrder).catch((err) => setError(err.message));
  }
  useEffect(load, [id]);

  async function handleMockPay() {
    setPaying(true);
    try {
      const updated = await api.mockPay(id);
      setOrder(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setPaying(false);
    }
  }

  if (error) {
    return <section className="section"><div className="wrap"><p style={{ textAlign: 'center', padding: '80px 0', color: 'var(--cherry-dark)' }}>{error}</p></div></section>;
  }
  if (!order) {
    return <section className="section"><div className="wrap"><p style={{ textAlign: 'center', padding: '80px 0', color: '#7a7161' }}>Loading…</p></div></section>;
  }

  const needsPayment = order.paymentMethod === 'card' && order.paymentStatus !== 'paid';

  return (
    <section className="section confirm-page">
      <div className="wrap">
        <div className="confirm-card">
          <YarnBallIcon size={40} color="var(--cherry)" />
          <h1>{needsPayment ? 'Almost there!' : 'Thank you!'}</h1>
          <p className="confirm-order-number">Order <strong>{order.orderNumber}</strong></p>

          {needsPayment ? (
            <div className="pay-block">
              <p>Your order is reserved — complete payment to confirm it.</p>
              <button className="btn btn-solid btn-lg" onClick={handleMockPay} disabled={paying}>
                {paying ? 'Processing…' : `Pay ${order.displayCurrency} ${order.displayTotal?.toFixed(2)} via Safepay →`}
              </button>
              <p className="pay-note">Sandbox mode: this simulates a successful Safepay payment.</p>
            </div>
          ) : (
            <p className="confirm-status">
              {order.paymentMethod === 'cod'
                ? "We'll collect payment when your order is delivered."
                : 'Payment received — thank you!'}
            </p>
          )}

          <SnipDivider />

          <div className="confirm-items">
            {order.items.map((item, i) => (
              <div className="confirm-item" key={i}>
                <span>{item.name}{item.color ? ` (${item.color})` : ''} × {item.qty}</span>
                <span>Rs {(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="confirm-totals">
            <div><span>Subtotal</span><span>Rs {order.subtotal.toFixed(2)}</span></div>
            <div><span>Shipping</span><span>Rs {order.shipping.toFixed(2)}</span></div>
            <div className="total"><span>Total</span><span>{order.displayCurrency} {order.displayTotal?.toFixed(2) ?? order.total.toFixed(2)}</span></div>
          </div>

          <p className="confirm-email">A confirmation has been sent to <strong>{order.customerEmail}</strong>.</p>
          <Link to="/shop" className="btn">Continue Shopping →</Link>
        </div>
      </div>
    </section>
  );
}
