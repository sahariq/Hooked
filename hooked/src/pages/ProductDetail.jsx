import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import ProductArt from '../components/ProductArt';
import ProductCard from '../components/ProductCard';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { formatPrice, convert, currency } = useCurrency();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [color, setColor] = useState(null);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('details');

  useEffect(() => {
    setProduct(null);
    setNotFound(false);
    api.getProduct(id)
      .then((p) => {
        setProduct(p);
        setColor(p.colors?.[0] || null);
      })
      .catch(() => setNotFound(true));
    api.getRelated(id).then(setRelated).catch(() => setRelated([]));
  }, [id]);

  if (notFound) return <Navigate to="/shop" replace />;
  if (!product) {
    return (
      <section className="section product-page">
        <div className="wrap"><p style={{ color: '#7a7161', padding: '60px 0', textAlign: 'center' }}>Loading…</p></div>
      </section>
    );
  }

  return (
    <section className="section product-page">
      <div className="wrap">
        <div className="breadcrumb" style={{ marginBottom: 30 }}>
          <Link to="/">Home</Link> / <Link to={`/shop/${product.category}`} style={{ textTransform: 'capitalize' }}>{product.category}</Link> / <span>{product.name}</span>
        </div>

        <div className="product-layout">
          <div className="product-visual">
            <div className="product-thumb-lg" style={{ background: product.bg }}>
              {product.badge && <span className={`badge ${product.badge === 'New' ? 'new' : ''}`}>{product.badge}</span>}
              <ProductArt icon={product.icon} size="42%" />
            </div>
          </div>

          <div className="product-info-panel">
            <h1>{product.name}</h1>
            <div className="rating-row">
              <span className="stars">{'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}</span>
              <span className="reviews-count">{product.reviews} reviews</span>
            </div>
            <div className="price-lg">{formatPrice(product.price)}</div>
            <p className="product-desc">{product.description}</p>

            {product.colors?.length > 0 && (
              <div className="option-block">
                <span className="mono option-label">Color / Style</span>
                <div className="swatch-row">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      className={`swatch ${color === c ? 'active' : ''}`}
                      onClick={() => setColor(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="option-block">
              <span className="mono option-label">Quantity</span>
              <div className="qty-row">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="decrease quantity">–</button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} aria-label="increase quantity">+</button>
              </div>
            </div>

            <div className="add-row">
              <button className="btn btn-solid btn-lg" onClick={() => addItem(product, color, qty)}>
                Add to Cart — {currency?.symbol || 'Rs'} {convert(product.price * qty).toFixed(2)}
              </button>
            </div>

            <div className="assurances">
              <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v4H4z"/><path d="M4 8l1.5 12h13L20 8"/></svg> Made to order by hand</div>
              <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg> Ships in 2–3 weeks</div>
              <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h2l1.6 10.6A2 2 0 0 0 8.6 18h9.8a2 2 0 0 0 2-1.7L22 8H6"/></svg> Packaged with care</div>
            </div>

            <div className="tabs">
              <button className={tab === 'details' ? 'active' : ''} onClick={() => setTab('details')}>Details & Care</button>
              <button className={tab === 'custom' ? 'active' : ''} onClick={() => setTab('custom')}>Want it custom?</button>
            </div>
            {tab === 'details' ? (
              <ul className="detail-list">
                {product.details.map((d) => <li key={d}>{d}</li>)}
              </ul>
            ) : (
              <p className="custom-note">
                Want different colors, a bigger size, or a totally different character? <Link to="/custom" className="accent">Start a custom order →</Link>
              </p>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <div className="related-block">
            <div className="section-head" style={{ textAlign: 'left', marginBottom: 30 }}>
              <span className="mono">♡ you might also like ♡</span>
              <h2 style={{ fontSize: 30 }}>more from {product.category}</h2>
            </div>
            <div className="prod-grid">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
