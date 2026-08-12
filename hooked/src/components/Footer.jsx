import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <div className="footer-logo"><img src="./src/assets/logo-light.png" alt="Hooked Logo"/></div>
            <p className="blurb">Handmade crochet keychains, coasters, amigurumi & toys - plus custom orders made just for you.</p>
            <div className="foot-social">
              <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/></svg></a>
              <a href="#" aria-label="TikTok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 4v9.5a3.5 3.5 0 1 1-3-3.46"/><path d="M14 4c.5 2.2 2.2 3.8 4 4"/></svg></a>
              <a href="#" aria-label="Pinterest"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M9.5 19c1-3.5 1.5-6 1.5-6"/><path d="M12 12a2.5 2.5 0 1 0 2.5-4c-2 0-3 1.3-3 3 0 1 .5 2 .5 2"/></svg></a>
            </div>
          </div>
          <div className="foot-col">
            <h4>Shop</h4>
            <Link to="/shop/keychains">Keychains</Link>
            <Link to="/shop/coasters">Coasters</Link>
            <Link to="/shop/amigurumi">Amigurumi</Link>
            <Link to="/shop/toys">Toys & Softies</Link>
          </div>
          <div className="foot-col">
            <h4>Help</h4>
            <a href="#">FAQs</a>
            <a href="#">Shipping & Returns</a>
            <a href="#">Care Guide</a>
            <a href="#">Contact</a>
          </div>
          <div className="foot-col">
            <h4>Hooked</h4>
            <Link to="/about">About</Link>
            <Link to="/custom">Custom Orders</Link>
            <Link to="/shop">Shop All</Link>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 Hooked. All rights reserved.</span>
          <span>made with 🧶 and a lot of coffee</span>
        </div>
      </div>
    </footer>
  );
}
