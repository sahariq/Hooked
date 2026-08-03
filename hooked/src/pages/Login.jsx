import { useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { CrochetHookIcon } from '../components/CrochetMotifs';
import './Auth.css';

export default function Login() {
  const { login, isAuthed, checking } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!checking && isAuthed) return <Navigate to="/account" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.target);
    try {
      await login(form.get('email'), form.get('password'));
      navigate(location.state?.from || '/account');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="section auth-page">
      <div className="wrap">
        <div className="auth-card">
          <CrochetHookIcon size={30} color="var(--cherry)" />
          <h1>Welcome back</h1>
          <p className="auth-sub">Sign in to view your orders and saved details.</p>
          <form onSubmit={handleSubmit}>
            <input name="email" type="email" placeholder="Email address" required />
            <input name="password" type="password" placeholder="Password" required />
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="btn btn-solid btn-lg" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
          <p className="auth-switch">New here? <Link to="/signup">Create an account</Link></p>
        </div>
      </div>
    </section>
  );
}
