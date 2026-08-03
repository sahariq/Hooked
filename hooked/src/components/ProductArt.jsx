const ICONS = {
  strawberry: (stroke) => (
    <>
      <path d="M9 3l1.5 3.5L14 8l-3.5 1.5L9 13l-1.5-3.5L4 8l3.5-1.5z" />
      <circle cx="17" cy="16" r="4" />
      <path d="M17 12v-2" />
    </>
  ),
  coaster: (stroke) => (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
    </>
  ),
  fox: (stroke) => (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="M8 14c-2 1-3 3-3 6h14c0-3-1-5-3-6" />
      <circle cx="10" cy="8.3" r="0.8" fill={stroke} />
      <circle cx="14" cy="8.3" r="0.8" fill={stroke} />
    </>
  ),
  bunny: (stroke) => (
    <>
      <path d="M12 4c-4 0-7 2-7 6 0 5 4 8 7 10 3-2 7-5 7-10 0-4-3-6-7-6z" />
      <circle cx="9.5" cy="10" r="1" fill={stroke} />
      <circle cx="14.5" cy="10" r="1" fill={stroke} />
    </>
  ),
  flower: (stroke) => (
    <>
      <path d="M12 20V9" />
      <path d="M12 9c0-3-2-4-2-4s0 2 2 4z" />
      <path d="M12 9c0-3 2-4 2-4s0 2-2 4z" />
      <circle cx="6" cy="6" r="1" fill={stroke} />
      <circle cx="18" cy="6" r="1" fill={stroke} />
    </>
  ),
  target: (stroke) => (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M8 12h8M12 8v8" strokeDasharray="1.5 2" />
    </>
  ),
  mushroom: (stroke) => (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M12 12v8" />
      <path d="M9 16h6" />
    </>
  ),
  star: (stroke) => (
    <>
      <path d="M12 4l2.5 5 5.5.8-4 4 1 5.5L12 16.7 6.9 19.3l1-5.5-4-4L9.5 9z" />
    </>
  ),
};

export default function ProductArt({ icon, stroke = 'var(--ink)', className, size = '62%' }) {
  const render = ICONS[icon] || ICONS.star;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ width: size, height: size }}
    >
      {render(stroke)}
    </svg>
  );
}
