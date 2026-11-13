import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
import { Heart, Scissors } from 'lucide-react';
import ThreadDivider from '../components/ThreadDivider';
import ProductCard from '../components/ProductCard';
import PolaroidStack from '../components/PolaroidStack';
import Categorytiles from '../components/Categorytiles';
import MakerSection from '../components/MakerSection';
import useSeo from '../hooks/useSeo';
import { api } from '../api/client';
import './Home.css';

/* ✏️ SEO ───────────────────────────────────────────────────
   Title: keep under ~60 characters. Description: keep under ~155 characters.
   ─────────────────────────────────────────────────────────── */
const SEO = {
  title: 'Hooked · Handmade Crochet Keychains, Coasters & Amigurumi',
  description:
    'Shop handmade crochet keychains, coasters, amigurumi and softies, made to order in small batches in Islamabad and shipped worldwide. Custom orders welcome.',
  siteName: 'Hooked',
};

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

// Small decorative-heart eyebrow label: screen readers skip the hearts and read only the words.
function Eyebrow({ children, style }) {
  return (
    <span className="mono" style={style}>
      <span aria-hidden="true">♡</span> {children} <span aria-hidden="true">♡</span>
    </span>
  );
}

// Section divider: a "cut along the dotted line" stitch with a little heart in the middle.
function StitchDivider() {
  return (
    <div className="stitch-divider" aria-hidden="true">
 
      <span className="stitch-divider-line" />
      <span className="stitch-divider-heart">
        <Heart size={16} strokeWidth={2} />
      </span>
      <span className="stitch-divider-line" />
    </div>
  );
}

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Page title, meta tags and structured data (see hooks/useSeo.js)
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  useSeo({
    title: SEO.title,
    description: SEO.description,
    path: '/',
    siteName: SEO.siteName,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${origin}/#website`,
          url: `${origin}/`,
          name: SEO.siteName,
          description: SEO.description,
          publisher: { '@id': `${origin}/#organization` },
        },
        {
          '@type': 'Organization',
          '@id': `${origin}/#organization`,
          name: SEO.siteName,
          url: `${origin}/`,
          description: 'Handmade-to-order crochet: coasters, keychains and amigurumi.',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Islamabad',
            addressCountry: 'PK',
          },
          areaServed: 'Worldwide',
        },
      ],
    },
  });

  useEffect(() => {
    let cancelled = false; // avoid setState after unmount
    // allSettled: if one request fails, the other section still shows
    Promise.allSettled([api.getCategories(), api.getProducts()])
      .then(([cats, prods]) => {
        if (cancelled) return;
        if (cats.status === 'fulfilled') setCategories(cats.value);
        else console.error('Failed to load categories', cats.reason);
        if (prods.status === 'fulfilled') setFavorites(prods.value.slice(0, 8));
        else console.error('Failed to load products', prods.reason);
        if (cats.status === 'rejected' && prods.status === 'rejected') setLoadError(true);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* ===== HERO ===== */}
      <motion.section 
        className="hero gingham"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
      >
        <div className="hero-inner">
          <motion.div variants={fadeUp}>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              get <span className="accent">hooked</span><br />on handmade.
            </motion.h1>
            <motion.p 
              className="lede"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Keychains, coasters, amigurumi &amp; softies — every piece looped, chained, and knotted by hand, one stitch at a time.
            </motion.p>
            <motion.div 
              className="hero-ctas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Link to="/shop" className="btn btn-solid">Shop the Store →</Link>
              <Link to="/custom" className="btn">Start a Custom Order</Link>
            </motion.div>
          </motion.div>
          <motion.div 
            className="hero-art"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
          >
            <PolaroidStack />
          </motion.div>
        </div>
        <ThreadDivider />
      </motion.section>

      {/* ===== CATEGORIES ===== */}
      <motion.section 
        className="section"
        aria-labelledby="home-categories-title"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeUp}
      >
        <div className="wrap">
          <div className="section-head">
            <Eyebrow>what we make</Eyebrow>
            <h2 id="home-categories-title">shop by category</h2>
            <p>From your keys to your coffee table — four ways to bring a little handmade warmth into your day.</p>
          </div>
          <Categorytiles categories={categories} loading={loading} error={loadError} />
        </div>
      </motion.section>

      {/* ===== STITCH DIVIDER ===== */}
      <StitchDivider />

      {/* ===== PRODUCTS ===== */}
      <motion.section 
        className="section shop-preview"
        aria-labelledby="home-favorites-title"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={fadeUp}
      >
        <div className="wrap">
          <div className="section-head">
            <Eyebrow>fresh off the hook</Eyebrow>
            <h2 id="home-favorites-title">shop our favorites</h2>
            <p>Best-sellers and new arrivals, restocked in small batches every couple of weeks.</p>
          </div>
          <motion.div 
            className="prod-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {favorites.map((p) => (
              <motion.div key={p.id} variants={fadeUp}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </motion.div>
          <motion.div 
            className="view-all-wrap"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Link to="/shop" className="btn">View All Products →</Link>
          </motion.div>
        </div>
      </motion.section>

      {/* ===== CUSTOM ORDERS ===== */}
      <motion.section 
        className="section"
        aria-labelledby="home-custom-title"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeUp}
      >
        <div className="wrap">
          <motion.div 
            className="custom-banner"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h2 id="home-custom-title">have something in mind? <br />let's make it together.</h2>
              <p>Send a reference photo, pick your colors, and I'll turn it into a one-of-a-kind piece — gifts, portraits of your pet, matching keychains for a wedding party, anything you can dream up.</p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Link to="/custom" className="btn btn-cherry">Request a Custom Order →</Link>
              </motion.div>
            </motion.div>
            <motion.div 
              className="custom-steps"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                { num: 1, title: 'Tell me your idea', desc: 'Photos, colors, size — the more detail, the better.' },
                { num: 2, title: 'Get a quote & mockup', desc: "I'll confirm pricing and timeline within 2 days." },
                { num: 3, title: 'It ships to your door', desc: 'Made to order in 2–3 weeks, carefully packaged.' }
              ].map((step, index) => (
                <motion.div 
                  key={index}
                  className="custom-step"
                  variants={fadeUp}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="step-num">{step.num}</div>
                  <div>
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* ===== ABOUT PREVIEW ===== */}
      <MakerSection />

      {/* ===== NEWSLETTER ===== */}
      <motion.section 
        className="newsletter"
        aria-labelledby="home-newsletter-title"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeUp}
      >
        <div className="wrap">
          <motion.div 
            className="news-inner"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Eyebrow style={{ color: 'var(--cherry-dark)' }}>stay in the loop</Eyebrow>
            <h2 id="home-newsletter-title">be the first to know</h2>
            <p>New drops, restocks, and the occasional yarn ramble — straight to your inbox.</p>
            <motion.form 
              className="news-form" 
              onSubmit={(e) => { e.preventDefault(); /* TODO: POST to a /api/newsletter endpoint (or Mailchimp/Resend) before launch */ }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <input
                type="email"
                name="email"
                autoComplete="email"
                aria-label="Email address"
                placeholder="your email address"
                required
              />
              <motion.button 
                type="submit" 
                className="btn btn-solid"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                Join the List
              </motion.button>
            </motion.form>
          </motion.div>
        </div>
      </motion.section>
    </motion.div>
    </MotionConfig>
  );
}