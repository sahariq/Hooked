import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { ScissorsIcon } from './CrochetMotifs';
import './Navbar.css';

export default function Navbar() {
  const { count } = useCart();
  const { currency, country, reopenPopup } = useCurrency();
  const { isAuthed, customer } = useCustomerAuth();

  return (
    <>
      <div className="topbar">
        <ScissorsIcon size={13} color="var(--cream)" /> handmade to order, shipped worldwide from Islamabad, Pakistan
      </div>
      <nav className="nav">
        <div className="wrap navwrap">
          <Link to="/" className="logo"><img src="./src/assets/logo.png" alt="Hooked Logo" /></Link>
          <div className="navlinks">
            <NavLink to="/shop" className={({isActive}) => isActive ? 'active' : ''}>Shop</NavLink>
            <NavLink to="/custom" className={({isActive}) => isActive ? 'active' : ''}>Custom Orders</NavLink>
            <NavLink to="/about" className={({isActive}) => isActive ? 'active' : ''}>About</NavLink>
          </div>
          <div className="navicons">
            {currency && (
              <button className="currency-pill" onClick={reopenPopup} title="Change shipping country / currency">
                {country?.code || 'PK'} · {currency.code}
              </button>
            )}
            <Link to={isAuthed ? '/account' : '/login'} aria-label="account" title={isAuthed ? customer.fullName : 'Sign in'}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            </Link>
            <Link to="/cart" aria-label="cart" className="cart-link">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h2l1.6 10.6A2 2 0 0 0 8.6 18h9.8a2 2 0 0 0 2-1.7L22 8H6"/><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></svg>
              {count > 0 && <span className="cart-badge">{count}</span>}
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
