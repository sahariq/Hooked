import { useCart } from '../context/CartContext';

export default function Toast() {
  const { toast } = useCart();
  if (!toast) return null;
  return (
    <div className="cart-toast" role="status">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      {toast}
    </div>
  );
}
