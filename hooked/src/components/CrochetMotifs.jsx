// A small, consistent library of crochet-themed decorative motifs, reused sitewide
// instead of one-off icons, so the "handmade" feel stays cohesive.

export function ScissorsIcon({ size = 20, color = 'currentColor', className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="6" cy="18" r="2.4" />
      <path d="M8.2 7.4L20 18" />
      <path d="M8.2 16.6L20 6" />
    </svg>
  );
}

export function CrochetHookIcon({ size = 20, color = 'currentColor', className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 21c-1.6 0-3-1.2-3-3 0-2 2-2.6 2-4.6 0-1.2-1-1.6-1-2.8 0-1.4 1.2-2.4 2.6-2.4" />
      <path d="M6.6 8.2c0-2.6 2.2-4.6 4.8-4.6 3 0 5.2 1.6 6.6 3.6" />
      <path d="M15.4 4.2c1.4 0 2.6 1 2.6 2.4 0 1.6-1.4 2-2.6 3" />
    </svg>
  );
}

export function YarnBallIcon({ size = 20, color = 'currentColor', className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M6 8c2 2 3 3 3.5 6.5" />
      <path d="M17 7c-3 1-5 3-6 8" />
      <path d="M8 18c2-3 3-6 8-7" />
    </svg>
  );
}

// A single-stitch "V" mark — the basic crochet stitch symbol
export function StitchMark({ size = 16, color = 'currentColor', className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 3l4 10 4-10" />
    </svg>
  );
}

// A repeating row of stitch marks — used as a section divider instead of a plain line
export function StitchRow({ count = 24, color = 'var(--cherry)', className, style }) {
  return (
    <div
      className={className}
      style={{ display: 'flex', justifyContent: 'center', gap: 10, opacity: 0.55, ...style }}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <StitchMark key={i} size={11} color={color} />
      ))}
    </div>
  );
}

// A dashed "cut here" line with scissors at one end — used above footers / as a section cap
export function SnipDivider({ color = 'var(--cherry)', className }) {
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }} aria-hidden="true">
      <ScissorsIcon size={18} color={color} />
      <svg width="100%" height="2" style={{ flex: 1 }} preserveAspectRatio="none">
        <line x1="0" y1="1" x2="100%" y2="1" stroke={color} strokeWidth="1.5" strokeDasharray="6 7" strokeLinecap="round" />
      </svg>
    </div>
  );
}
