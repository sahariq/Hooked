import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { api } from '../api/client';

const CartContext = createContext(null);
const CART_ID_KEY = 'hooked_cart_id';

export function CartProvider({ children }) {
  const [cartId, setCartId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // bootstrap: reuse a saved cart id, or create a new cart
  useEffect(() => {
    (async () => {
      try {
        const savedId = localStorage.getItem(CART_ID_KEY);
        if (savedId) {
          try {
            const cart = await api.getCart(savedId);
            setCartId(cart.cartId);
            setItems(cart.items);
            setLoading(false);
            return;
          } catch {
            // saved cart no longer exists server-side; fall through and create a new one
          }
        }
        const cart = await api.createCart();
        localStorage.setItem(CART_ID_KEY, cart.cartId);
        setCartId(cart.cartId);
        setItems(cart.items);
      } catch (err) {
        console.error('Failed to initialize cart', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const showToast = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  const addItem = useCallback(async (product, color, qty = 1) => {
    if (!cartId) return;
    try {
      const cart = await api.addCartItem(cartId, { productId: product.id, color, qty });
      setItems(cart.items);
      showToast(`Added ${product.name} to cart`);
    } catch (err) {
      showToast(err.message || 'Could not add to cart');
    }
  }, [cartId, showToast]);

  const removeItem = useCallback(async (itemId) => {
    if (!cartId) return;
    const cart = await api.removeCartItem(cartId, itemId);
    setItems(cart.items);
  }, [cartId]);

  const updateQty = useCallback(async (itemId, qty) => {
    if (!cartId || qty < 1) return;
    const cart = await api.updateCartItem(cartId, itemId, qty);
    setItems(cart.items);
  }, [cartId]);

  const clearLocalCart = useCallback(() => {
    setItems([]);
  }, []);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);
  const subtotal = useMemo(() => Number(items.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2)), [items]);

  const value = { cartId, items, loading, addItem, removeItem, updateQty, clearLocalCart, count, subtotal, toast };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
