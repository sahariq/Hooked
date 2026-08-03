import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { api } from '../api/client';
import './Shop.css';

export default function Shop() {
  const { category } = useParams();
  const [sort, setSort] = useState('featured');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeCat = categories.find((c) => c.slug === category);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = {};
    if (category) params.category = category;
    if (sort !== 'featured') params.sort = sort;
    api.getProducts(params)
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [category, sort]);

  return (
    <section className="section shop-page">
      <div className="wrap">
        <div className="breadcrumb" style={{ marginBottom: 14 }}>
          <Link to="/">Home</Link> / <span>{activeCat ? activeCat.name : 'Shop'}</span>
        </div>
        <div className="section-head" style={{ textAlign: 'left', marginBottom: 40 }}>
          <span className="mono">♡ the full collection ♡</span>
          <h2>{activeCat ? activeCat.name : 'Shop All'}</h2>
          <p style={{ margin: '14px 0 0' }}>{activeCat ? activeCat.blurb : 'Every handmade piece currently in stock, made in small batches.'}</p>
        </div>

        <div className="shop-toolbar">
          <div className="pill-row">
            <Link to="/shop" className={`pill ${!category ? 'active' : ''}`}>All</Link>
            {categories.map((c) => (
              <Link key={c.slug} to={`/shop/${c.slug}`} className={`pill ${category === c.slug ? 'active' : ''}`}>{c.name}</Link>
            ))}
          </div>
          <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products">
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>

        {loading ? (
          <p style={{ color: '#7a7161', textAlign: 'center', padding: '60px 0' }}>Loading pieces…</p>
        ) : error ? (
          <p style={{ color: 'var(--cherry-dark)', textAlign: 'center', padding: '60px 0' }}>
            Couldn't load products ({error}). Is the backend running?
          </p>
        ) : products.length === 0 ? (
          <p style={{ color: '#7a7161', textAlign: 'center', padding: '60px 0' }}>No pieces here yet — check back soon!</p>
        ) : (
          <div className="prod-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
