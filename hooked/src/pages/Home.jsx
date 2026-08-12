import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThreadDivider from '../components/ThreadDivider';
import ProductCard from '../components/ProductCard';
import ProductArt from '../components/ProductArt';
import { api } from '../api/client';
import './Home.css';

// Import SVG/PNG assets
import crochetIcon from '../assets/crochet.png';
import scissorsIcon from '../assets/scissors.png';
import yarnIcon from '../assets/yarn.png';
import packageIcon from '../assets/package.png';
import loveMessageIcon from '../assets/love-message.png';
import heroIcon from '../assets/hero.png';

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

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getProducts().then((all) => setFavorites(all.slice(0, 8))).catch(() => {});
  }, []);

  return (
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
            <motion.div 
              className="eyebrow"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <img src={heroIcon} alt="Hero" style={{ width: 16, height: 16, marginRight: 8 }} />
              now taking summer custom orders
            </motion.div>
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
            <motion.div 
              className="stitch-row"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div className="stitch-item" variants={fadeUp}>
                <img src={crochetIcon} alt="Crochet" style={{ width: 20, height: 20 }} />
                100% handmade
              </motion.div>
              <motion.div className="stitch-item" variants={fadeUp}>
                <img src={scissorsIcon} alt="Scissors" style={{ width: 20, height: 20 }} />
                small batch, made to order
              </motion.div>
              <motion.div className="stitch-item" variants={fadeUp}>
                <img src={packageIcon} alt="Package" style={{ width: 20, height: 20 }} />
                2–3 week turnaround
              </motion.div>
              <motion.div className="stitch-item" variants={fadeUp}>
                <img src={yarnIcon} alt="Yarn" style={{ width: 20, height: 20 }} />
                custom colorways
              </motion.div>
            </motion.div>
          </motion.div>
          <motion.div 
            className="hero-art"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
          >
            <motion.div 
              className="hero-tag tag-1"
              whileHover={{ scale: 1.05, rotate: -2 }}
              transition={{ duration: 0.2 }}
            >
              <img src={packageIcon} alt="Package" style={{ width: 16, height: 16, marginRight: 6 }} />
              made to order
            </motion.div>
            <motion.div 
              className="blob blob-1"
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ 
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <ProductArt icon="fox" stroke="var(--ink)" size="60%" />
            </motion.div>
            <motion.div 
              className="blob blob-2"
              animate={{ 
                y: [0, 10, 0],
                rotate: [0, -5, 0]
              }}
              transition={{ 
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            >
              <ProductArt icon="bunny" stroke="var(--ink)" size="60%" />
            </motion.div>
            <motion.div 
              className="blob blob-3"
              animate={{ 
                y: [0, -8, 0],
                rotate: [0, 8, 0]
              }}
              transition={{ 
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            >
              <ProductArt icon="coaster" stroke="var(--cream)" size="60%" />
            </motion.div>
            <motion.div 
              className="hero-tag tag-2"
              whileHover={{ scale: 1.05, rotate: 3 }}
              transition={{ duration: 0.2 }}
            >
              <img src={packageIcon} alt="Package" style={{ width: 16, height: 16, marginRight: 6 }} />
              ships worldwide
            </motion.div>
          </motion.div>
        </div>
        <ThreadDivider />
      </motion.section>

      {/* ===== CATEGORIES ===== */}
      <motion.section 
        className="section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeUp}
      >
        <div className="wrap">
          <div className="section-head">
            <span className="mono">♡ what we make ♡</span>
            <h2>shop by category</h2>
            <p>From your keys to your coffee table — four ways to bring a little handmade warmth into your day.</p>
          </div>
          <motion.div 
            className="cats"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {categories.map((c, index) => (
              <motion.div
                key={c.slug}
                variants={fadeUp}
                whileHover="hover"
                custom={index}
              >
                <Link to={`/shop/${c.slug}`} className="cat-card">
                  <motion.div 
                    className="cat-icon" 
                    style={{ background: c.bg }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProductArt icon={c.icon} stroke="var(--ink)" size="46%" />
                  </motion.div>
                  <h3>{c.name}</h3>
                  <p>{c.blurb}</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ===== STITCH ROW DIVIDER ===== */}
      <div className="stitch-row-divider">
        <img src={yarnIcon} alt="Yarn" style={{ width: 30, height: 30 }} />
        <span className="divider-line"></span>
        <img src={scissorsIcon} alt="Scissors" style={{ width: 30, height: 30 }} />
        <span className="divider-line"></span>
        <img src={crochetIcon} alt="Crochet" style={{ width: 30, height: 30 }} />
      </div>

      {/* ===== PRODUCTS ===== */}
      <motion.section 
        className="section shop-preview"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={fadeUp}
      >
        <div className="wrap">
          <div className="section-head">
            <span className="mono">♡ fresh off the hook ♡</span>
            <h2>shop our favorites</h2>
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
              <h2>have something in mind? <br />let's make it together.</h2>
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
      <motion.section 
        className="section about-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeUp}
      >
        <div className="wrap">
          <div className="about">
            <motion.div 
              className="about-visual"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <motion.div 
                className="yarn-ball yb1"
                animate={{ 
                  y: [0, -15, 0],
                  rotate: [0, 360]
                }}
                transition={{ 
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <img src={yarnIcon} alt="Yarn" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '20%' }} />
              </motion.div>
              <motion.div 
                className="yarn-ball yb2"
                animate={{ 
                  y: [0, 15, 0],
                  rotate: [0, -360]
                }}
                transition={{ 
                  duration: 25,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 2
                }}
              >
                <img src={loveMessageIcon} alt="Love" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '25%' }} />
              </motion.div>
              <motion.div 
                className="yarn-ball yb3"
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 360]
                }}
                transition={{ 
                  duration: 18,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 1
                }}
              >
                <img src={crochetIcon} alt="Crochet" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '20%' }} />
              </motion.div>
              <motion.div 
                className="about-tag"
                whileHover={{ rotate: 0, scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <span className="mono">since 2021</span>
                <p>"one stitch, one hook, one small business at a time."</p>
              </motion.div>
            </motion.div>
            <motion.div 
              className="about-content"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <span className="mono" style={{ color: 'var(--cherry-dark)' }}>♡ the maker ♡</span>
              <h2>hi, i'm the hands<br />behind <span className="accent">hooked</span></h2>
              <p>I picked up a hook during a rainy week in 2021 and never really put it down. What started as coasters for my own kitchen turned into keychains for friends, then amigurumi for their kids — and now, this little shop.</p>
              <p>Every order is made by hand, one loop at a time, in small batches so I can actually keep up with quality (and my sanity). Thanks for supporting something handmade.</p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Link to="/about" className="btn">More About Hooked →</Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ===== NEWSLETTER ===== */}
      <motion.section 
        className="newsletter"
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
            <span className="mono" style={{ color: 'var(--cherry-dark)' }}>♡ stay in the loop ♡</span>
            <h2>be the first to know</h2>
            <p>New drops, restocks, and the occasional yarn ramble — straight to your inbox.</p>
            <motion.form 
              className="news-form" 
              onSubmit={(e) => e.preventDefault()}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <input type="email" placeholder="your email address" required />
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
  );
}