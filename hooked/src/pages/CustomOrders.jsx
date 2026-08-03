import { useState } from 'react';
import { api } from '../api/client';
import { CrochetHookIcon } from '../components/CrochetMotifs';
import './CustomOrders.css';

export default function CustomOrders() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.target);
    try {
      await api.submitCustomOrder({
        name: form.get('name'),
        email: form.get('email'),
        category: form.get('category'),
        message: form.get('message'),
      });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong sending your request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="section custom-hero">
        <div className="wrap">
          <div className="custom-hero-inner">
            <CrochetHookIcon size={32} color="var(--cherry)" />
            <span className="mono">♡ custom orders ♡</span>
            <h1>let's design something<br /><span className="accent">just for you.</span></h1>
            <p>From a keychain of your pet to a whole matching set for a wedding party — if you can describe it, there's a good chance it can be hooked.</p>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="custom-steps-grid">
            <div className="cstep">
              <div className="cstep-num">01</div>
              <h3>Tell me your idea</h3>
              <p>Share reference photos, your color palette, and roughly what size you're picturing.</p>
            </div>
            <div className="cstep">
              <div className="cstep-num">02</div>
              <h3>Get a quote &amp; timeline</h3>
              <p>I'll reply within 2 business days with pricing and an estimated ship date.</p>
            </div>
            <div className="cstep">
              <div className="cstep-num">03</div>
              <h3>Approve &amp; I get hooking</h3>
              <p>Once you approve the plan, your piece is made by hand, start to finish.</p>
            </div>
            <div className="cstep">
              <div className="cstep-num">04</div>
              <h3>It ships to your door</h3>
              <p>Carefully packaged and shipped, usually within 2–3 weeks of approval.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section custom-form-section">
        <div className="wrap">
          <div className="custom-form-layout">
            <div className="custom-form-side">
              <span className="mono" style={{ color: 'var(--cherry-dark)' }}>♡ request a quote ♡</span>
              <h2>start your order</h2>
              <p>Fill this out and I'll get back to you with a quote — no payment needed yet.</p>
              <ul className="custom-notes">
                <li>Most custom pieces run $20–$80 depending on size &amp; detail</li>
                <li>Rush orders may be available for an added fee</li>
                <li>I'll always confirm pricing before starting your piece</li>
              </ul>
            </div>

            <div className="custom-form-card">
              {sent ? (
                <div className="form-success">
                  <h3>Got it! 🧶</h3>
                  <p>Thanks for reaching out — I'll email you a quote within 2 business days.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <label>
                    <span>Your name</span>
                    <input type="text" name="name" required placeholder="Jamie Rivera" />
                  </label>
                  <label>
                    <span>Email</span>
                    <input type="email" name="email" required placeholder="you@email.com" />
                  </label>
                  <label>
                    <span>What are you picturing?</span>
                    <select name="category" required defaultValue="">
                      <option value="" disabled>Select a category</option>
                      <option value="keychains">Keychain</option>
                      <option value="coasters">Coaster set</option>
                      <option value="amigurumi">Amigurumi character</option>
                      <option value="toys">Toy / softie</option>
                      <option value="other">Something else</option>
                    </select>
                  </label>
                  <label>
                    <span>Tell me more</span>
                    <textarea name="message" rows="4" required placeholder="Colors, size, reference photos, deadline — anything helps!" />
                  </label>
                  {error && <p className="checkout-error">{error}</p>}
                  <button type="submit" className="btn btn-cherry btn-lg" disabled={submitting}>
                    {submitting ? 'Sending…' : 'Send Request →'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
