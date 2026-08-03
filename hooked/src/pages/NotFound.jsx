import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="section" style={{ textAlign: 'center', padding: '120px 0' }}>
      <span className="mono" style={{ color: 'var(--cherry-dark)' }}>♡ 404 ♡</span>
      <h1 style={{ fontSize: 42, margin: '14px 0' }}>this stitch dropped.</h1>
      <p style={{ color: '#5b5344', marginBottom: 26 }}>We couldn't find the page you're looking for.</p>
      <Link to="/" className="btn btn-solid">Back to Home →</Link>
    </section>
  );
}
