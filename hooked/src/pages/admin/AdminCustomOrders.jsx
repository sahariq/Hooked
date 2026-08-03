import { useEffect, useState } from 'react';
import { api } from '../../api/client';

const STATUSES = ['new', 'quoted', 'approved', 'in_progress', 'shipped', 'closed'];

export default function AdminCustomOrders() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  function load() {
    setLoading(true);
    api.adminCustomOrders(filter || undefined).then(setRequests).finally(() => setLoading(false));
  }

  useEffect(load, [filter]);

  async function handleStatusChange(id, status) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await api.adminUpdateCustomOrderStatus(id, status);
    } catch {
      load();
    }
  }

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>Custom Requests</h1>
          <p>{requests.length} request{requests.length === 1 ? '' : 's'}{filter ? ` · ${filter}` : ''}</p>
        </div>
        <select className="status-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Message</th>
              <th>Received</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: '#7a7161' }}>Loading…</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: '#7a7161' }}>No custom requests yet.</td></tr>
            ) : requests.map((r) => (
              <tr key={r.id}>
                <td>{r.name}<br /><span style={{ color: '#7a7161', fontSize: 12 }}>{r.email}</span></td>
                <td style={{ textTransform: 'capitalize' }}>{r.category || '—'}</td>
                <td style={{ maxWidth: 320 }}>{r.message}</td>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                <td>
                  <select
                    className="status-select"
                    value={r.status}
                    onChange={(e) => handleStatusChange(r.id, e.target.value)}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
