import { Link } from 'react-router-dom';
import ProductArt from './ProductArt';
import { useCurrency } from '../context/CurrencyContext';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { formatPrice } = useCurrency();
  return (
    <Link to={`/product/${product.id}`} className="prod-card">
      <div className="prod-thumb" style={{ background: product.bg }}>
        {product.badge && (
          <span className={`badge ${product.badge === 'New' ? 'new' : ''}`}>{product.badge}</span>
        )}
        <button className="fav" aria-label="save to favorites" onClick={(e) => e.preventDefault()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-4.35-9.5-8.5C.7 8.7 2.5 5 6 5c2 0 3.5 1.2 4 2.5.5-1.3 2-2.5 4-2.5 3.5 0 5.3 3.7 3.5 7.5C19 16.65 12 21 12 21z"/></svg>
        </button>
        <ProductArt icon={product.icon} />
      </div>
      <div className="prod-info">
        <h3>{product.name}</h3>
        <div className="meta">
          <span className="price">{formatPrice(product.price)}</span>
          <span className="stars">{'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}</span>
        </div>
      </div>
    </Link>
  );
}
