import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
import { api } from '../api/client';
import yarnIcon from '../assets/yarn.png';
import crochetIcon from '../assets/crochet.png';
import scissorsIcon from '../assets/scissors.png';
import './CustomOrders.css';

const MAX_MESSAGE = 4000; // backend accepts up to 5000 incl. the reference link we append

const STEPS = [
  { n: '01', title: 'Tell me your idea', text: 'Share your color palette, roughly what size you’re picturing, and a link to any reference photos.' },
  { n: '02', title: 'Get a quote & timeline', text: 'I’ll reply within 2 business days with pricing and an estimated ship date.' },
  { n: '03', title: 'Approve & I get hooking', text: 'Once you approve the plan, your piece is made by hand, start to finish.' },
  { n: '04', title: 'It ships to your door', text: 'Carefully packaged and shipped, usually within 2–3 weeks of approval.' },
];

// shown if the categories API is unreachable, so the form still works
const FALLBACK_CATEGORIES = [
  { slug: 'keychains', name: 'Keychain', bg: '#F6D9E4' },
  { slug: 'coasters', name: 'Coaster set', bg: '#DCE8D6' },
  { slug: 'amigurumi', name: 'Amigurumi character', bg: '#F7E2A8' },
  { slug: 'toys', name: 'Toy / softie', bg: '#CFE3F5' },
];
const OTHER = { slug: 'other', name: 'Something else', bg: '#EFE8DF' };

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

export default function CustomOrders() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);

  useEffect(() => {
    let cancelled = false;
    api.getCategories()
      .then((cats) => { if (!cancelled && cats.length) setCategories(cats); })
      .catch(() => { /* keep the fallback list */ });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const previous = document.title;
    document.title = 'Custom Orders · Hooked';
    return () => { document.title = previous; };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.target);

    // There's no file upload yet, so reference photos are shared as a link (Pinterest, Drive, Instagram…)
    // and added to the message the maker receives.
    const reference = String(form.get('reference') || '').trim();
    let body = String(form.get('message') || '').trim();
    if (reference) body += `\n\nReference link: ${reference}`;

    try {
      await api.submitCustomOrder({
        name: String(form.get('name') || '').trim(),
        email: String(form.get('email') || '').trim(),
        category: form.get('category'),
        message: body,
        website: form.get('website'), // honeypot: real visitors never see or fill this
      });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong sending your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    setSent(false);
    setMessage('');
    setError(null);
  }

  return (
    <MotionConfig reducedMotion="user">
      {/* ───────── hero banner ───────── */}
      <section className="section co-hero">
        <div className="wrap">
          <motion.div
            className="co-banner"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <img className="co-float f1" src={yarnIcon} alt="" aria-hidden="true" />
            <img className="co-float f2" src={crochetIcon} alt="" aria-hidden="true" />
            <img className="co-float f3" src={scissorsIcon} alt="" aria-hidden="true" />

            <div className="co-sticker" aria-hidden="true">
              <span>reply in</span>
              <strong>2</strong>
              <span>business days</span>
            </div>

            <span className="mono">♡ custom orders ♡</span>
            <h1>let&rsquo;s design something<br /><span className="accent">just for you.</span></h1>
            <p>
              From a keychain of your pet to a whole matching set for a wedding party &mdash; if you can describe it,
              there&rsquo;s a good chance it can be hooked.
            </p>
            <a href="#request" className="btn btn-solid">Start your request ↓</a>
          </motion.div>
        </div>
      </section>

      {/* ───────── how it works ───────── */}
      <section className="section co-steps-section">
        <div className="wrap">
          <motion.ol
            className="co-steps"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          >
            {STEPS.map((s) => (
              <motion.li key={s.n} className="co-step" variants={fadeUp}>
                <span className="co-step-num">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </section>

      {/* ───────── request form ───────── */}
      <section className="section co-form-section" id="request">
        <div className="wrap">
          <div className="co-layout">
            <motion.div
              className="co-side"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
            >
              <span className="mono" style={{ color: 'var(--cherry-dark)' }}>♡ request a quote ♡</span>
              <h2>start your order</h2>
              <p>Fill this out and I&rsquo;ll get back to you with a quote &mdash; no payment needed yet.</p>

              <div className="co-note">
                <span className="mono">good to know</span>
                <ul>
                  {/* ⚠ confirm these before launch: the site otherwise shows prices in Rs */}
                  <li>Most custom pieces run $20–$80 depending on size &amp; detail</li>
                  <li>Rush orders may be available for an added fee</li>
                  <li>I&rsquo;ll always confirm pricing before starting your piece</li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              className="co-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={fadeUp}
            >
              <span className="co-card-tape" aria-hidden="true" />

              {sent ? (
                <div className="co-success" role="status">
                  <span className="co-hearts" aria-hidden="true">
                    <i>♡</i><i>♡</i><i>♡</i><i>♡</i><i>♡</i>
                  </span>
                  <img className="co-success-yarn" src={yarnIcon} alt="" aria-hidden="true" />
                  <h3>Got it!</h3>
                  <p>Thanks for reaching out &mdash; I&rsquo;ll email you a quote within 2 business days.</p>
                  <p className="co-success-sub">Keep an eye on your inbox (and your spam folder, just in case).</p>
                  <div className="co-actions">
                    <Link to="/shop" className="btn btn-solid">Browse the shop</Link>
                    <button type="button" className="btn" onClick={startOver}>Send another request</button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="co-row">
                    <label>
                      <span>Your name</span>
                      <input type="text" name="name" required maxLength={100} autoComplete="name" placeholder="Jamie Rivera" />
                    </label>
                    <label>
                      <span>Email</span>
                      <input type="email" name="email" required maxLength={254} autoComplete="email" placeholder="you@email.com" />
                    </label>
                  </div>

                  <fieldset className="co-field">
                    <legend>What are you picturing?</legend>
                    <div className="co-tags">
                      {[...categories, OTHER].map((c) => (
                        <label key={c.slug} className="co-tag" style={{ '--c': c.bg }}>
                          <input type="radio" name="category" value={c.slug} required />
                          <span>{c.name}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <label>
                    <span>Tell me more</span>
                    <textarea
                      name="message"
                      rows="5"
                      required
                      maxLength={MAX_MESSAGE}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Colors, size, deadline, who it’s for — anything helps!"
                    />
                    <small className="co-count">{message.length} / {MAX_MESSAGE}</small>
                  </label>

                  <label>
                    <span>Reference link <em>(optional)</em></span>
                    <input type="url" name="reference" maxLength={300} placeholder="Pinterest, Instagram, Google Drive…" />
                    <small className="co-hint">Got photos? Share a link, or just reply to my quote email with them.</small>
                  </label>

                  {/* honeypot: hidden from people, irresistible to spam bots */}
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="co-hp" />

                  {error && <p className="checkout-error" role="alert">{error}</p>}

                  <button type="submit" className="btn btn-cherry btn-lg" disabled={submitting}>
                    {submitting ? 'Sending…' : 'Send Request →'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}