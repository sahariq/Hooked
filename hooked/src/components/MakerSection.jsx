import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import yarnIcon from '../assets/yarn.png';
import scissorsIcon from '../assets/scissors.png';
import crochetIcon from '../assets/crochet.png';
import './MakerSection.css';

/* ✏️ EDIT ME ─────────────────────────────────────────────
   1. Your photo: a portrait (4:5) WebP, about 800×1000px, ideally under 150 KB.
      Save it as  public/images/maker.webp  and set:  MAKER_PHOTO = '/images/maker.webp'
   2. MAKER_NAME is used for the signature under your bio.
   3. CURRENTLY is the text on the yellow sticky note.
   ──────────────────────────────────────────────────────── */
const MAKER_PHOTO = null;
const MAKER_NAME = 'Sahar';
const CURRENTLY = 'a very sleepy cat amigurumi';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function MakerSection() {
  return (
    <section className="section maker">
      <div className="wrap">
        <div className="maker-grid">
          {/* ───────── visual ───────── */}
          <motion.div
            className="maker-visual"
            initial={{ opacity: 0, x: -30, rotate: -2 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <span className="maker-blob" aria-hidden="true" />
            <span className="maker-stitch" aria-hidden="true" />

            <div className="maker-frame">
              {MAKER_PHOTO ? (
                <img
                  src={MAKER_PHOTO}
                  alt={`Portrait of ${MAKER_NAME}, the maker behind Hooked`}
                  width="600"
                  height="750"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="maker-placeholder">
                  <img src={yarnIcon} alt="" aria-hidden="true" />
                  {import.meta.env.DEV && <span>add your photo in MakerSection.jsx</span>}
                </div>
              )}
            </div>

            {/* floating crochet bits */}
            <img className="maker-float f1" src={yarnIcon} alt="" aria-hidden="true" />
            <img className="maker-float f2" src={crochetIcon} alt="" aria-hidden="true" />
            <img className="maker-float f3" src={scissorsIcon} alt="" aria-hidden="true" />

            {/* spinning text badge */}
            <div className="maker-badge" aria-hidden="true">
              <svg viewBox="0 0 120 120" className="maker-badge-ring">
                <defs>
                  <path id="maker-badge-path" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
                </defs>
                <text>
                  <textPath href="#maker-badge-path" textLength="272" lengthAdjust="spacing">
                    handmade with love • since 2021 • one stitch at a time •
                  </textPath>
                </text>
              </svg>
              <span className="maker-badge-heart">♡</span>
            </div>

            {/* sticky note */}
            <div className="maker-note">
              <span className="mono">currently on my hook</span>
              <p>{CURRENTLY}</p>
            </div>

            {/* quote card */}
            <motion.div className="maker-quote" whileHover={{ rotate: 0, scale: 1.04 }} transition={{ duration: 0.3 }}>
              <span className="mono">since 2021</span>
              <p>&ldquo;one stitch, one hook, one small business at a time.&rdquo;</p>
            </motion.div>
          </motion.div>

          {/* ───────── words ───────── */}
          <motion.div
            className="maker-copy"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={{ visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } } }}
          >
            <motion.span variants={fadeUp} className="mono" style={{ color: 'var(--cherry-dark)' }}>
              ♡ the maker ♡
            </motion.span>
            <motion.h2 variants={fadeUp}>
              hi, i&rsquo;m the hands<br />behind <span className="accent">hooked</span>
            </motion.h2>
            <motion.p variants={fadeUp}>
              I picked up a hook during a rainy week in 2021 and never really put it down. What started as coasters for
              my own kitchen turned into keychains for friends, then amigurumi for their kids — and now, this little shop.
            </motion.p>
            <motion.p variants={fadeUp}>
              Every order is made by hand, one loop at a time, in small batches so I can actually keep up with quality
              (and my sanity). Thanks for supporting something handmade.
            </motion.p>

            <motion.p variants={fadeUp} className="maker-sign">
              with love, {MAKER_NAME}
              <svg viewBox="0 0 120 12" aria-hidden="true">
                <path d="M2 7 C 14 1, 22 11, 34 6 S 54 2, 66 7 S 88 11, 100 5 S 114 4, 118 6" />
              </svg>
            </motion.p>

            <motion.div variants={fadeUp} className="maker-cta">
              <Link to="/about" className="btn btn-solid">More About Hooked →</Link>
              <Link to="/custom" className="btn">Start a Custom Order</Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}