import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.adminDashboard().then(setStats).catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>Dashboard</h1>
          <p>A quick snapshot of how the shop is doing.</p>
        </div>
      </div>

      {error && <p style={{ color: 'var(--cherry-dark)' }}>{error}</p>}

      {stats && (
        <div className="admin-cards">
          <div className="admin-card">
            <span className="label">Lifetime Revenue</span>
            <span className="value">${stats.lifetimeRevenue.toFixed(2)}</span>
          </div>
          <div className="admin-card">
            <span className="label">Total Orders</span>
            <span className="value">{stats.totalOrders}</span>
          </div>
          <div className="admin-card">
            <span className="label">Orders In Progress</span>
            <span className="value">{stats.activeOrders}</span>
          </div>
          <div className="admin-card">
            <span className="label">New Custom Requests</span>
            <span className="value">{stats.newCustomRequests}</span>
          </div>
        </div>
      )}
    </div>
  );
}
