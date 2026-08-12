import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { api } from '../api/client';
import './Shop.css';

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const slideIn = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

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
    <motion.section 
      className="section shop-page"
      initial="hidden"
      animate="visible"
      variants={fadeUp}
    >
      <div className="wrap">
        <motion.div 
          className="breadcrumb" 
          style={{ marginBottom: 14 }}
          variants={slideIn}
        >
          <Link to="/">Home</Link> / <span>{activeCat ? activeCat.name : 'Shop'}</span>
        </motion.div>
        
        <motion.div 
          className="section-head" 
          style={{ textAlign: 'left', marginBottom: 40 }}
          variants={fadeUp}
        >
          <span className="mono">♡ the full collection ♡</span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            {activeCat ? activeCat.name : 'Shop All'}
          </motion.h2>
          <motion.p 
            style={{ margin: '14px 0 0' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {activeCat ? activeCat.blurb : 'Every handmade piece currently in stock, made in small batches.'}
          </motion.p>
        </motion.div>

        <motion.div 
          className="shop-toolbar"
          variants={fadeUp}
        >
          <motion.div 
            className="pill-row"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp}>
              <Link to="/shop" className={`pill ${!category ? 'active' : ''}`}>All</Link>
            </motion.div>
            {categories.map((c) => (
              <motion.div key={c.slug} variants={fadeUp}>
                <Link 
                  to={`/shop/${c.slug}`} 
                  className={`pill ${category === c.slug ? 'active' : ''}`}
                >
                  {c.name}
                </Link>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.select 
            className="sort-select" 
            value={sort} 
            onChange={(e) => setSort(e.target.value)} 
            aria-label="Sort products"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </motion.select>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.p 
                style={{ color: '#7a7161', textAlign: 'center', padding: '60px 0' }}
                animate={{ 
                  opacity: [0.5, 1, 0.5],
                  scale: [0.98, 1.02, 0.98]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                Loading pieces…
              </motion.p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <p style={{ color: 'var(--cherry-dark)', textAlign: 'center', padding: '60px 0' }}>
                Couldn't load products ({error}). Is the backend running?
              </p>
            </motion.div>
          ) : products.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <p style={{ color: '#7a7161', textAlign: 'center', padding: '60px 0' }}>
                No pieces here yet — check back soon!
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="products"
              className="prod-grid"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {products.map((p, index) => (
                <motion.div 
                  key={p.id} 
                  variants={fadeUp}
                  whileHover={{ 
                    y: -6,
                    transition: { duration: 0.2 }
                  }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}