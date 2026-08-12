import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import './Admin.css';

export default function AdminLogin() {
  const { login, isAuthed, checking } = useAdminAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!checking && isAuthed) return <Navigate to="/admin" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.target);
    try {
      await login(form.get('email'), form.get('password'));
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-login-shell">
      <div className="admin-login-card">
        <div className="logo"><img src="./src/assets/logo.png" alt="Hooked Logo" /></div>
        <p className="sub">Admin dashboard sign in</p>
        <form onSubmit={handleSubmit}>
          <input name="email" type="email" placeholder="admin@hookedcrochet.com" required />
          <input name="password" type="password" placeholder="Password" required />
          {error && <p className="admin-login-error">{error}</p>}
          <button type="submit" className="btn btn-solid" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>
      </div>
    </div>
  );
}
