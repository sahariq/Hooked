import { Link } from 'react-router-dom';
import './About.css';

export default function About() {
  return (
    <>
      <section className="section about-hero">
        <div className="wrap">
          <div className="about-hero-inner">
            <div className="about-hero-visual">
              <div className="yarn-ball yb1"></div>
              <div className="yarn-ball yb2"></div>
              <div className="yarn-ball yb3"></div>
            </div>
            <div>
              <span className="mono" style={{ color: 'var(--cherry-dark)' }}>♡ the maker ♡</span>
              <h1>hi, i'm the hands<br />behind <span className="accent">hooked</span></h1>
              <p>I picked up a hook during a rainy week in 2021 and never really put it down. What started as coasters for my own kitchen turned into keychains for friends, then amigurumi for their kids — and now, this little shop.</p>
              <p>Every order is made by hand, one loop at a time, in small batches so I can actually keep up with quality (and my sanity). Thanks for supporting something handmade.</p>
              <Link to="/shop" className="btn btn-solid">Shop the Store →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section values-section">
        <div className="wrap">
          <div className="section-head">
            <span className="mono">♡ how hooked works ♡</span>
            <h2>a few things I stand by</h2>
          </div>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">🧶</div>
              <h3>Small batch, always</h3>
              <p>I only make a handful of each piece at a time, so quality never gets rushed.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">✂️</div>
              <h3>Every stitch by hand</h3>
              <p>No machines, no factories — just a hook, good yarn, and a lot of patience.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">📦</div>
              <h3>Packaged with care</h3>
              <p>Every order is wrapped like a gift, because handmade things deserve that.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">💌</div>
              <h3>Custom-friendly</h3>
              <p>Got an idea that's not in the shop? That's basically my favorite kind of order.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="newsletter">
        <div className="wrap">
          <div className="news-inner">
            <span className="mono" style={{ color: 'var(--cherry-dark)' }}>♡ say hi ♡</span>
            <h2>questions before you order?</h2>
            <p>Reach out any time — I read every message myself.</p>
            <a href="mailto:sahariqbalmalik05@gmail.com" className="btn btn-solid">Email Me!</a>
          </div>
        </div>
      </section>
    </>
  );
}
