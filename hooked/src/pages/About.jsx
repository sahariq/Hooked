import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
import { CloudRain, Coffee, KeyRound, Rabbit, Store } from 'lucide-react';
import MakerSection from '../components/MakerSection';
import yarnIcon from '../assets/yarn.png';
import crochetIcon from '../assets/crochet.png';
import scissorsIcon from '../assets/scissors.png';
import packageIcon from '../assets/package.png';
import loveMessageIcon from '../assets/love-message.png';
import './About.css';

/* ✏️ EDIT ME ───────────────────────────────────────────────
   BEHIND: photos for the "behind the scenes" strip. While this list is empty the section is
   hidden on the live site (it shows placeholders only while you run `npm run dev`).
   Add WebP photos (~800px square, under 150 KB each) to public/images/behind/ and list them:
     { src: '/images/behind/yarn-stash.webp', caption: 'my yarn stash' }
   Use a descriptive caption: it doubles as the image's alt text for search engines.
   ─────────────────────────────────────────────────────────── */
const CONTACT_EMAIL = 'sahariqbalmalik05@gmail.com';
const BEHIND = [];
const BEHIND_DEV_PLACEHOLDERS = [
  { src: null, caption: 'add a photo' },
  { src: null, caption: 'add a photo' },
  { src: null, caption: 'add a photo' },
];

/* ✏️ SEO ───────────────────────────────────────────────────
   Title: keep under ~60 characters. Description: keep under ~155 characters.
   ABOUT_PATH must match the route for this page in your router.
   ─────────────────────────────────────────────────────────── */
const SEO = {
  title: 'About Hooked · Handmade Crochet from Islamabad',
  description:
    'Meet the maker behind Hooked: small-batch handmade crochet coasters, keychains and amigurumi, made to order in Islamabad and shipped worldwide.',
  siteName: 'Hooked',
};
const ABOUT_PATH = '/about';

// The story is taken straight from the maker bio: nothing here is invented.
const STORY = [
  { color: '#CFE3F5', marker: <CloudRain aria-hidden="true" />, label: '2021', title: 'A rainy week, a hook', text: 'I picked up a hook and never really put it down.' },
  { color: '#DCE8D6', marker: <Coffee aria-hidden="true" />, label: 'first makes', title: 'Coasters', text: 'The first things I made were coasters for my own kitchen.' },
  { color: '#F6D9E4', marker: <KeyRound aria-hidden="true" />, label: 'then', title: 'Keychains', text: 'Then came keychains for friends.' },
  { color: '#F7E2A8', marker: <Rabbit aria-hidden="true" />, label: 'then', title: 'Amigurumi', text: 'Then amigurumi for their kids.' },
  { color: '#E8829F', marker: <Store aria-hidden="true" />, label: 'now', title: 'This little shop', text: 'And now, Hooked: handmade to order, shipped worldwide from Islamabad.' },
];

const VALUES = [
  { color: '#F6D9E4', icon: yarnIcon, title: 'Small batch, always', text: 'I only make a handful of each piece at a time, so quality never gets rushed.' },
  { color: '#CFE3F5', icon: crochetIcon, title: 'Every stitch by hand', text: 'No machines, no factories — just a hook, good yarn, and a lot of patience.' },
  { color: '#F7E2A8', icon: packageIcon, title: 'Packaged with care', text: 'Every order is wrapped like a gift, because handmade things deserve that.' },
  { color: '#DCE8D6', icon: loveMessageIcon, title: 'Custom-friendly', text: 'Got an idea that’s not in the shop? That’s basically my favorite kind of order.' },
];

// `plain` is the text-only version of each answer, used for the FAQ structured data (JSON-LD).
const FAQ = [
  {
    q: 'Where do you ship from?',
    a: 'Everything is made in Islamabad, Pakistan, and I ship worldwide.',
    plain: 'Everything is made in Islamabad, Pakistan, and I ship worldwide.',
  },
  {
    q: 'How long does an order take?',
    a: 'Pieces are made to order, usually within 2–3 weeks, and carefully packaged before they head out.',
    plain: 'Pieces are made to order, usually within 2–3 weeks, and carefully packaged before they head out.',
  },
  {
    q: 'Can I ask for something custom?',
    a: (
      <>
        Yes, please do! Send me your idea on the <Link to="/custom">custom order page</Link>. I reply within 2 business
        days with a quote, and I always confirm pricing before I start your piece.
      </>
    ),
    plain:
      'Yes, please do! Send your idea through the custom order page. I reply within 2 business days with a quote, and I always confirm pricing before I start your piece.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };
const inView = { initial: 'hidden', whileInView: 'visible', viewport: { once: true, amount: 0.2 } };

/* ───────── head helpers: add or update a tag, and return a function that undoes it ───────── */
function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  const created = !el;
  const previous = el ? el.getAttribute('content') : null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
  return () => {
    if (created) el.remove();
    else el.setAttribute('content', previous ?? '');
  };
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  const created = !el;
  const previous = el ? el.getAttribute('href') : null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
  return () => {
    if (created) el.remove();
    else el.setAttribute('href', previous ?? '');
  };
}

function setJsonLd(id, data) {
  const el = document.createElement('script');
  el.type = 'application/ld+json';
  el.id = id;
  el.textContent = JSON.stringify(data);
  document.head.appendChild(el);
  return () => el.remove();
}

// Small decorative-heart eyebrow label: screen readers skip the hearts and read only the words.
function Eyebrow({ children }) {
  return (
    <span className="mono">
      <span aria-hidden="true">♡</span> {children} <span aria-hidden="true">♡</span>
    </span>
  );
}

export default function About() {
  useEffect(() => {
    const url = `${window.location.origin}${ABOUT_PATH}`;
    const previousTitle = document.title;
    document.title = SEO.title;

    const undo = [
      setMeta('name', 'description', SEO.description),
      setCanonical(url),
      // Open Graph + Twitter, so shared links get a proper preview
      setMeta('property', 'og:type', 'website'),
      setMeta('property', 'og:site_name', SEO.siteName),
      setMeta('property', 'og:title', SEO.title),
      setMeta('property', 'og:description', SEO.description),
      setMeta('property', 'og:url', url),
      setMeta('name', 'twitter:card', 'summary'),
      setMeta('name', 'twitter:title', SEO.title),
      setMeta('name', 'twitter:description', SEO.description),
      // Structured data: the About page, the business, and the FAQ
      setJsonLd('ld-about', {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'AboutPage',
            '@id': `${url}#page`,
            url,
            name: SEO.title,
            description: SEO.description,
            about: { '@id': `${window.location.origin}/#organization` },
          },
          {
            '@type': 'Organization',
            '@id': `${window.location.origin}/#organization`,
            name: SEO.siteName,
            url: window.location.origin,
            email: CONTACT_EMAIL,
            description: 'Handmade-to-order crochet: coasters, keychains and amigurumi.',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Islamabad',
              addressCountry: 'PK',
            },
            areaServed: 'Worldwide',
          },
          {
            '@type': 'FAQPage',
            '@id': `${url}#faq`,
            mainEntity: FAQ.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.plain },
            })),
          },
        ],
      }),
    ];

    return () => {
      document.title = previousTitle;
      undo.forEach((fn) => fn());
    };
  }, []);

  const behind = BEHIND.length ? BEHIND : (import.meta.env.DEV ? BEHIND_DEV_PLACEHOLDERS : []);

  return (
    <MotionConfig reducedMotion="user">
      <MakerSection variant="about" />

      {/* ───────── the story ───────── */}
      <section className="section ab-story" aria-labelledby="ab-story-title">
        <div className="wrap">
          <motion.div className="section-head" {...inView} variants={fadeUp}>
            <Eyebrow>the story so far</Eyebrow>
            <h2 id="ab-story-title">from one hook to a little shop</h2>
          </motion.div>

          <motion.ol className="ab-timeline" {...inView} variants={stagger}>
            {STORY.map((s) => (
              <motion.li key={s.title} className="ab-stop" variants={fadeUp}>
                <span className="ab-marker" style={{ background: s.color }}>{s.marker}</span>
                <div className="ab-stop-card">
                  <span className="mono">{s.label}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </section>

      {/* ───────── values ───────── */}
      <section className="section ab-values" aria-labelledby="ab-values-title">
        <div className="wrap">
          <motion.div className="section-head" {...inView} variants={fadeUp}>
            <Eyebrow>how hooked works</Eyebrow>
            <h2 id="ab-values-title">a few things I stand by</h2>
          </motion.div>

          <motion.ul className="ab-values-grid" {...inView} variants={stagger}>
            {VALUES.map((v) => (
              <motion.li key={v.title} className="ab-value" style={{ '--c': v.color }} variants={fadeUp}>
                <span className="ab-value-art">
                  <img src={v.icon} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                </span>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </section>

      {/* ───────── behind the scenes (hidden until you add photos) ───────── */}
      {behind.length > 0 && (
        <section className="section ab-behind" aria-labelledby="ab-behind-title">
          <div className="wrap">
            <motion.div className="section-head" {...inView} variants={fadeUp}>
              <Eyebrow>behind the scenes</Eyebrow>
              <h2 id="ab-behind-title">a peek at my workspace</h2>
            </motion.div>

            <motion.ul className="ab-polaroids" {...inView} variants={stagger}>
              {behind.map((b, i) => (
                <motion.li key={`${b.caption}-${i}`} className="ab-polaroid" variants={fadeUp}>
                  <span className="ab-polaroid-tape" aria-hidden="true" />
                  <div className="ab-polaroid-photo">
                    {b.src ? (
                      <img src={b.src} alt={b.caption} width="400" height="400" loading="lazy" decoding="async" />
                    ) : (
                      <img className="ab-polaroid-yarn" src={yarnIcon} alt="" aria-hidden="true" />
                    )}
                  </div>
                  <p>{b.caption}</p>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </section>
      )}

      {/* ───────── quick answers ───────── */}
      <section className="section ab-faq" aria-labelledby="ab-faq-title">
        <div className="wrap">
          <motion.div className="section-head" {...inView} variants={fadeUp}>
            <Eyebrow>quick answers</Eyebrow>
            <h2 id="ab-faq-title">things people often ask</h2>
          </motion.div>

          <motion.div className="ab-faq-list" {...inView} variants={stagger}>
            {FAQ.map((f) => (
              <motion.details key={f.q} className="ab-faq-item" variants={fadeUp}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </motion.details>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ───────── say hi ───────── */}
      <section className="section ab-contact-section" aria-labelledby="ab-contact-title">
        <div className="wrap">
          <motion.div className="ab-contact" {...inView} variants={fadeUp}>
            <img className="ab-contact-float c1" src={loveMessageIcon} alt="" aria-hidden="true" loading="lazy" decoding="async" />
            <img className="ab-contact-float c2" src={scissorsIcon} alt="" aria-hidden="true" loading="lazy" decoding="async" />
            <Eyebrow>say hi</Eyebrow>
            <h2 id="ab-contact-title">questions before you order?</h2>
            <p>Reach out any time &mdash; I read every message myself.</p>
            <div className="ab-contact-actions">
              <a href={`mailto:${CONTACT_EMAIL}`} className="btn btn-solid">Email Me!</a>
              <Link to="/custom" className="btn">Start a Custom Order</Link>
            </div>
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
}