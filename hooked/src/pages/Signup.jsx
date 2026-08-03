import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { YarnBallIcon } from '../components/CrochetMotifs';
import './Auth.css';

export default function Signup() {
  const { signup, isAuthed, checking } = useCustomerAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!checking && isAuthed) return <Navigate to="/account" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.target);
    try {
      await signup({
        fullName: form.get('fullName'),
        email: form.get('email'),
        password: form.get('password'),
        phone: form.get('phone') || undefined,
      });
      navigate('/account');
    } catch (err) {
      setError(err.message || 'Could not create account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="section auth-page">
      <div className="wrap">
        <div className="auth-card">
          <YarnBallIcon size={30} color="var(--cherry)" />
          <h1>Create your account</h1>
          <p className="auth-sub">Save your details and track orders — no yarn needed.</p>
          <form onSubmit={handleSubmit}>
            <input name="fullName" placeholder="Full name" required />
            <input name="email" type="email" placeholder="Email address" required />
            <input name="phone" placeholder="Phone (optional)" />
            <input name="password" type="password" placeholder="Password (min. 8 characters)" minLength={8} required />
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="btn btn-solid btn-lg" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>
          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </section>
  );
}
