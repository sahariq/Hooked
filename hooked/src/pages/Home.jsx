import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ThreadDivider from '../components/ThreadDivider';
import ProductCard from '../components/ProductCard';
import ProductArt from '../components/ProductArt';
import { CrochetHookIcon, ScissorsIcon, StitchMark, YarnBallIcon, StitchRow } from '../components/CrochetMotifs';
import { api } from '../api/client';
import './Home.css';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getProducts().then((all) => setFavorites(all.slice(0, 8))).catch(() => {});
  }, []);

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="hero gingham">
        <div className="hero-inner">
          <div>
            <div className="eyebrow">● now taking summer custom orders</div>
            <h1>get <span className="accent">hooked</span><br />on handmade.</h1>
            <p className="lede">Keychains, coasters, amigurumi &amp; softies — every piece looped, chained, and knotted by hand, one stitch at a time.</p>
            <div className="hero-ctas">
              <Link to="/shop" className="btn btn-solid">Shop the Store →</Link>
              <Link to="/custom" className="btn">Start a Custom Order</Link>
            </div>
            <div className="stitch-row">
              <div className="stitch-item">
                <CrochetHookIcon size={19} color="var(--cherry)" />
                100% handmade
              </div>
              <div className="stitch-item">
                <ScissorsIcon size={19} color="var(--cherry)" />
                small batch, made to order
              </div>
              <div className="stitch-item">
                <StitchMark size={17} color="var(--cherry)" />
                2–3 week turnaround
              </div>
              <div className="stitch-item">
                <YarnBallIcon size={19} color="var(--cherry)" />
                custom colorways
              </div>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-tag tag-1">✓ made to order</div>
            <div className="blob blob-1"><ProductArt icon="fox" stroke="var(--ink)" size="60%" /></div>
            <div className="blob blob-2"><ProductArt icon="bunny" stroke="var(--ink)" size="60%" /></div>
            <div className="blob blob-3"><ProductArt icon="coaster" stroke="var(--cream)" size="60%" /></div>
            <div className="hero-tag tag-2">📦 ships worldwide</div>
          </div>
        </div>
        <ThreadDivider />
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <span className="mono">♡ what we make ♡</span>
            <h2>shop by category</h2>
            <p>From your keys to your coffee table — four ways to bring a little handmade warmth into your day.</p>
          </div>
          <div className="cats">
            {categories.map((c) => (
              <Link key={c.slug} to={`/shop/${c.slug}`} className="cat-card">
                <div className="cat-icon" style={{ background: c.bg }}>
                  <ProductArt icon={c.icon} stroke="var(--ink)" size="46%" />
                </div>
                <h3>{c.name}</h3>
                <p>{c.blurb}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <StitchRow />

      {/* ===== PRODUCTS ===== */}
      <section className="section shop-preview">
        <div className="wrap">
          <div className="section-head">
            <span className="mono">♡ fresh off the hook ♡</span>
            <h2>shop our favorites</h2>
            <p>Best-sellers and new arrivals, restocked in small batches every couple of weeks.</p>
          </div>
          <div className="prod-grid">
            {favorites.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="view-all-wrap">
            <Link to="/shop" className="btn">View All Products →</Link>
          </div>
        </div>
      </section>

      {/* ===== CUSTOM ORDERS ===== */}
      <section className="section">
        <div className="wrap">
          <div className="custom-banner">
            <div>
              <h2>have something in mind? <br />let's make it together.</h2>
              <p>Send a reference photo, pick your colors, and I'll turn it into a one-of-a-kind piece — gifts, portraits of your pet, matching keychains for a wedding party, anything you can dream up.</p>
              <Link to="/custom" className="btn btn-cherry">Request a Custom Order →</Link>
            </div>
            <div className="custom-steps">
              <div className="custom-step">
                <div className="step-num">1</div>
                <div><h4>Tell me your idea</h4><p>Photos, colors, size — the more detail, the better.</p></div>
              </div>
              <div className="custom-step">
                <div className="step-num">2</div>
                <div><h4>Get a quote & mockup</h4><p>I'll confirm pricing and timeline within 2 days.</p></div>
              </div>
              <div className="custom-step">
                <div className="step-num">3</div>
                <div><h4>It ships to your door</h4><p>Made to order in 2–3 weeks, carefully packaged.</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ABOUT PREVIEW ===== */}
      <section className="section about-section">
        <div className="wrap">
          <div className="about">
            <div className="about-visual">
              <div className="yarn-ball yb1"></div>
              <div className="yarn-ball yb2"></div>
              <div className="yarn-ball yb3"></div>
              <div className="about-tag">
                <span className="mono">since 2021</span>
                <p>"one stitch, one hook, one small business at a time."</p>
              </div>
            </div>
            <div className="about-content">
              <span className="mono" style={{ color: 'var(--cherry-dark)' }}>♡ the maker ♡</span>
              <h2>hi, i'm the hands<br />behind <span className="accent">hooked</span></h2>
              <p>I picked up a hook during a rainy week in 2021 and never really put it down. What started as coasters for my own kitchen turned into keychains for friends, then amigurumi for their kids — and now, this little shop.</p>
              <p>Every order is made by hand, one loop at a time, in small batches so I can actually keep up with quality (and my sanity). Thanks for supporting something handmade.</p>
              <Link to="/about" className="btn">More About Hooked →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== NEWSLETTER ===== */}
      <section className="newsletter">
        <div className="wrap">
          <div className="news-inner">
            <span className="mono" style={{ color: 'var(--cherry-dark)' }}>♡ stay in the loop ♡</span>
            <h2>be the first to know</h2>
            <p>New drops, restocks, and the occasional yarn ramble — straight to your inbox.</p>
            <form className="news-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="your email address" required />
              <button type="submit" className="btn btn-solid">Join the List</button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
