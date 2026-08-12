import { NavLink, Navigate, Outlet, Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import './Admin.css';

export default function AdminLayout() {
  const { isAuthed, checking, email, logout } = useAdminAuth();

  if (checking) {
    return <div className="admin-loading">Checking session…</div>;
  }
  if (!isAuthed) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="logo"><img src="./src/assets/logo-light.png" alt="Hooked Logo" /></Link>
        <nav>
          <NavLink to="/admin" end>Dashboard</NavLink>
          <NavLink to="/admin/orders">Orders</NavLink>
          <NavLink to="/admin/custom-orders">Custom Requests</NavLink>
          <NavLink to="/admin/products">Products</NavLink>
        </nav>
        <div className="admin-sidebar-footer">
          <span className="admin-email">{email}</span>
          <button className="admin-logout" onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
