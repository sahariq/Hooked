import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductArt from './ProductArt';
import { useCurrency } from '../context/CurrencyContext';
import './ProductCard.css';

// Each card gets its own (stable) tilt + tape colour, derived from its id, so the grid looks hand-placed
const TILTS = [-1.2, 0.8, -0.6, 1.1];
const TAPES = ['pink', 'blue', 'butter', 'sage'];

function hashId(id) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

// "Save to favourites" is remembered in this browser (no account needed)
const FAV_KEY = 'hooked:favorites';
function readFavs() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch { return []; }
}
function writeFavs(list) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch { /* storage blocked: heart just won't persist */ }
}

// product.colors may be ["#f6d9e4", ...] or [{ name, hex }, ...]; only draw values the browser understands as a colour
function getSwatches(colors) {
  if (!Array.isArray(colors) || typeof CSS === 'undefined' || !CSS.supports) return [];
  return colors
    .map((c) => (typeof c === 'string' ? c : c?.hex || c?.value || c?.color))
    .filter((v) => typeof v === 'string' && CSS.supports('color', v));
}

export default function ProductCard({ product }) {
  const { formatPrice } = useCurrency();
  const [saved, setSaved] = useState(() => readFavs().includes(product.id));

  const h = hashId(product.id);
  const tilt = TILTS[h % TILTS.length];
  const tape = TAPES[(h >> 3) % TAPES.length];

  const soldOut = typeof product.stock === 'number' && product.stock <= 0;
  const lowStock = typeof product.stock === 'number' && product.stock > 0 && product.stock <= 5;
  const swatches = getSwatches(product.colors);
  const rating = Math.round(product.rating || 0);

  const toggleSaved = (e) => {
    e.preventDefault();  // the card is a link; don't navigate
    e.stopPropagation();
    const list = readFavs();
    writeFavs(saved ? list.filter((x) => x !== product.id) : [...list, product.id]);
    setSaved(!saved);
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className={`prod-card${soldOut ? ' is-soldout' : ''}`}
      style={{ '--tilt': `${tilt}deg` }}
    >
      <span className={`prod-tape tape-${tape}`} aria-hidden="true" />

      <div className="prod-thumb" style={{ background: product.bg }}>
        {product.badge && (
          <span className={`badge ${product.badge === 'New' ? 'new' : ''}`}>{product.badge}</span>
        )}

        <button
          type="button"
          className={`fav${saved ? ' is-saved' : ''}`}
          aria-label={saved ? 'remove from favorites' : 'save to favorites'}
          aria-pressed={saved}
          onClick={toggleSaved}
        >
          <svg viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M12 21s-7-4.35-9.5-8.5C.7 8.7 2.5 5 6 5c2 0 3.5 1.2 4 2.5.5-1.3 2-2.5 4-2.5 3.5 0 5.3 3.7 3.5 7.5C19 16.65 12 21 12 21z" />
          </svg>
        </button>

        <span className="prod-art">
          <ProductArt icon={product.icon} size="62%" />
        </span>

        {soldOut && <span className="prod-sticker sold" aria-hidden="true">sold out</span>}
        {lowStock && <span className="prod-sticker low">only {product.stock} left!</span>}
        <span className="prod-peek" aria-hidden="true">peek inside &rarr;</span>
      </div>

      <div className="prod-info">
        <h3>{product.name}</h3>

        {swatches.length > 0 && (
          <div className="prod-dots" role="img" aria-label={`${swatches.length} colors available`}>
            {swatches.slice(0, 4).map((c, i) => (
              <span key={i} style={{ background: c }} />
            ))}
            {swatches.length > 4 && <em>+{swatches.length - 4}</em>}
          </div>
        )}

        <div className="meta">
          <span className="price">{formatPrice(product.price)}</span>
          <span className="stars" title={`${rating} out of 5`}>
            {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
            {product.reviews > 0 && <small>({product.reviews})</small>}
          </span>
        </div>
      </div>
    </Link>
  );
}