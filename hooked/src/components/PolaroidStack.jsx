import { useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import ProductArt from './ProductArt';
import yarnIcon from '../assets/yarn.png';
import './PolaroidStack.css';

/* ✏️ EDIT ME ─ add your product photos later:
   1. Put WebP images (~800px square, 50-150 KB each) in  public/images/hero/
   2. Set `src` below, e.g.  src: '/images/hero/fox.webp'
   Until `src` is set, a cute illustrated placeholder is shown instead. */
const SLIDES = [
  { id: 'fox',     caption: 'fox keychain',      bg: '#F6D9E4', icon: 'fox',     src: null },
  { id: 'bunny',   caption: 'bunny amigurumi',   bg: '#CFE3F5', icon: 'bunny',   src: null },
  { id: 'coaster', caption: 'granny coasters',   bg: '#FFF1D6', icon: 'coaster', src: null },
  { id: 'custom',  caption: 'made just for you', bg: '#E9DFF7', icon: null,      src: null },
];

const INTERVAL_MS = 3500;

// Where a card sits in the pile: 0 = front, 1 = peeking right, 2 = peeking left. Everything else hides.
const POSES = [
  { x: 0,   y: 0,  rotate: -2, scale: 1,    opacity: 1 },
  { x: 36,  y: 8,  rotate: 6,  scale: 0.96, opacity: 1 },
  { x: -34, y: 14, rotate: -7, scale: 0.92, opacity: 1 },
];
const HIDDEN = { x: 0, y: 24, rotate: 0, scale: 0.86, opacity: 0 };

export default function PolaroidStack() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = SLIDES.length;

  const go = useCallback((dir) => setActive((a) => (a + dir + n) % n), [n]);

  // Auto-advance. Pauses on hover/focus, and never autoplays for people who prefer reduced motion.
  // `active` is a dependency so a manual click restarts the timer instead of flipping again right away.
  useEffect(() => {
    if (reduceMotion || paused) return undefined;
    const t = setInterval(() => go(1), INTERVAL_MS);
    return () => clearInterval(t);
  }, [reduceMotion, paused, active, go]);

  return (
    <div
      className="polaroid-stack"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured handmade pieces"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="polaroid-stage">
        {SLIDES.map((s, i) => {
          const pos = (i - active + n) % n;
          const isFront = pos === 0;
          return (
            <motion.figure
              key={s.id}
              className={`polaroid${isFront ? ' is-front' : ''}`}
              style={{ zIndex: n - pos }}
              initial={false}
              animate={pos < 3 ? POSES[pos] : HIDDEN}
              transition={{ type: 'spring', stiffness: 110, damping: 16 }}
              aria-hidden={!isFront}
              // swipe the front card left/right on touch screens, or click it to flip to the next
              drag={isFront ? 'x' : false}
              dragSnapToOrigin
              dragElastic={0.4}
              onDragEnd={(e, info) => {
                if (Math.abs(info.offset.x) > 60) go(info.offset.x < 0 ? 1 : -1);
              }}
              onTap={isFront ? () => go(1) : undefined}
            >
              <div className="polaroid-photo" style={{ background: s.bg }}>
                {s.src ? (
                  <img
                    src={s.src}
                    alt={s.caption}
                    width="400"
                    height="400"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    draggable={false}
                  />
                ) : s.icon ? (
                  <ProductArt icon={s.icon} stroke="var(--ink)" size="60%" />
                ) : (
                  <img className="polaroid-yarn" src={yarnIcon} alt="" aria-hidden="true" draggable={false} />
                )}
              </div>
              <figcaption>{s.caption}</figcaption>
            </motion.figure>
          );
        })}
      </div>

      <div className="polaroid-dots">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={i === active ? 'is-active' : ''}
            aria-label={`Show ${s.caption}`}
            aria-current={i === active}
            onClick={() => setActive(i)}
          />
        ))}
      </div>
    </div>
  );
}
