import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductArt from './ProductArt';
import './Categorytiles.css';

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}; 
const item = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

// each tile rests at a slightly different angle, like tags pinned on a board
const TILTS = [-1.6, 1.2, -1, 1.6];

export default function Categorytiles({ categories, loading, error }) {
  if (error) {
    return (
      <p className="cat-tiles-msg" role="alert">
        We couldn&rsquo;t load the shop right now. Please refresh in a moment.
      </p>
    );
  }

  if (loading && categories.length === 0) {
    return (
      <ul className="cat-tiles" aria-busy="true" aria-label="Loading categories">
        {[0, 1, 2, 3].map((i) => (
          <li key={i}><div className="cat-tile-skeleton" /></li>
        ))}
      </ul>
    );
  }

  if (categories.length === 0) return null;

  return (
    <motion.ul
      className="cat-tiles"
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
    >
      {categories.map((c, i) => (
        <motion.li key={c.slug} variants={item}>
          <Link
            to={`/shop/${c.slug}`}
            className="cat-tile"
            style={{ '--c': c.bg, '--tilt': `${TILTS[i % TILTS.length]}deg` }}
          >
            <span className="cat-tile-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <span className="cat-tile-art">
              <ProductArt icon={c.icon} stroke="var(--ink)" size="58%" />
            </span>
            <h3>{c.name}</h3>
            <p>{c.blurb}</p>
            <span className="cat-tile-go" aria-hidden="true">
              shop now <span className="cat-tile-arrow">&rarr;</span>
            </span>
          </Link>
        </motion.li>
      ))}
    </motion.ul> 
  );
}