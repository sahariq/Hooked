import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import ProductArt from '../components/ProductArt';
import { api } from '../api/client';
import yarnIcon from '../assets/yarn.png';
import crochetIcon from '../assets/crochet.png';
import './Shop.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

export default function Shop() {
  const { category } = useParams();
  const [sort, setSort] = useState('featured');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0); // bump to retry a failed load

  const activeCat = categories.find((c) => c.slug === category);

  useEffect(() => {
    let cancelled = false;
    api.getCategories()
      .then((cats) => { if (!cancelled) setCategories(cats); })
      .catch((err) => console.error('Failed to load categories', err));
    return () => { cancelled = true; };
  }, []);

  // `cancelled` stops a slow, older request from overwriting the results of a newer one
  // (e.g. clicking through categories quickly)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const params = {};
    if (category) params.category = category;
    if (sort !== 'featured') params.sort = sort;
    api.getProducts(params)
      .then((data) => { if (!cancelled) setProducts(data); })
      .catch((err) => {
        console.error('Failed to load products', err);
        if (!cancelled) setError(true); // customers see a friendly message, never raw error text
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [category, sort, attempt]);

  useEffect(() => {
    const previous = document.title;
    document.title = `${activeCat ? activeCat.name : 'Shop'} · Hooked`;
    return () => { document.title = previous; };
  }, [activeCat]);

  const count = products.length;
  const countLabel = `${count} ${count === 1 ? 'piece' : 'pieces'}`;
  const showCount = !loading && !error;

  return (
    <MotionConfig reducedMotion="user">
      <section className="section shop-page">
        <div className="wrap">
          {/* ───────── banner ───────── */}
          <motion.header
            className="shop-banner"
            style={{ '--c': activeCat?.bg || '#F6D9E4' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="shop-banner-copy">
              <nav className="breadcrumb" aria-label="Breadcrumb">
                <Link to="/">Home</Link> / <span>{activeCat ? activeCat.name : 'Shop'}</span>
              </nav>
              <span className="mono">♡ the full collection ♡</span>
              <h1>{activeCat ? activeCat.name : 'Shop All'}</h1>
              <p>{activeCat ? activeCat.blurb : 'Every handmade piece currently in stock, made in small batches.'}</p>
            </div>

            <div className="shop-banner-art" aria-hidden="true">
              <motion.span
                key={activeCat?.slug || 'all'}
                className="shop-banner-doily"
                initial={{ scale: 0.7, rotate: -12, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 160, damping: 14 }}
              >
                <ProductArt icon={activeCat?.icon || 'star'} stroke="var(--ink)" size="58%" />
              </motion.span>
              <img className="shop-float s1" src={yarnIcon} alt="" />
              <img className="shop-float s2" src={crochetIcon} alt="" />
              {showCount && (
                <span className="shop-count-sticker">
                  <strong>{count}</strong>
                  <span>{count === 1 ? 'piece' : 'pieces'}</span>
                </span>
              )}
            </div>
          </motion.header>

          {/* ───────── filters ───────── */}
          <div className="shop-toolbar">
            <nav aria-label="Categories">
              <ul className="shop-tags">
                <li>
                  <Link
                    to="/shop"
                    className={`shop-tag${!category ? ' active' : ''}`}
                    aria-current={!category ? 'page' : undefined}
                  >
                    All
                  </Link>
                </li>
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      to={`/shop/${c.slug}`}
                      className={`shop-tag${category === c.slug ? ' active' : ''}`}
                      style={{ '--c': c.bg }}
                      aria-current={category === c.slug ? 'page' : undefined}
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <label className="shop-sort">
              <span className="mono">sort by</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>

          <p className="shop-count" aria-live="polite">
            {showCount && count > 0 ? `showing ${countLabel}` : '\u00a0'}
          </p>

          {/* ───────── results ───────── */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.ul
                key="loading"
                className="prod-grid shop-skel-grid"
                aria-busy="true"
                aria-label="Loading pieces"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {Array.from({ length: 8 }, (_, i) => (
                  <li key={i}><div className="shop-skel" /></li>
                ))}
              </motion.ul>
            ) : error ? (
              <motion.div
                key="error"
                className="shop-empty"
                role="alert"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <span className="shop-empty-art"><ProductArt icon="mushroom" size="55%" /></span>
                <h3>Oops, something got tangled</h3>
                <p>We couldn&rsquo;t load the pieces just now. Give it another go?</p>
                <div className="shop-empty-actions">
                  <button type="button" className="btn btn-solid" onClick={() => setAttempt((a) => a + 1)}>
                    Try again
                  </button>
                </div>
              </motion.div>
            ) : count === 0 ? (
              <motion.div
                key="empty"
                className="shop-empty"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="shop-empty-art"><ProductArt icon="star" size="55%" /></span>
                <h3>No pieces here yet</h3>
                <p>New ones are still on the hook. Check back soon, or ask for something made just for you.</p>
                <div className="shop-empty-actions">
                  {category && <Link to="/shop" className="btn">See everything</Link>}
                  <Link to="/custom" className="btn btn-solid">Request a custom piece</Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`products-${category || 'all'}-${sort}`}
                className="prod-grid"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {products.map((p) => (
                  // no extra hover lift here: ProductCard already lifts itself
                  <motion.div key={p.id} variants={fadeUp}>
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ───────── custom-order nudge ───────── */}
          {!loading && !error && (
            <aside className="shop-cta">
              <div>
                <span className="mono">♡ don&rsquo;t see it? ♡</span>
                <h3>let&rsquo;s make something just for you</h3>
                <p>Send a reference photo and your favorite colors, and I&rsquo;ll turn it into a one-of-a-kind piece.</p>
              </div>
              <Link to="/custom" className="btn btn-solid">Start a Custom Order →</Link>
            </aside>
          )}
        </div>
      </section>
    </MotionConfig>
  );
}