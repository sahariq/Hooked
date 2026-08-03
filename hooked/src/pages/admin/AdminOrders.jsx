import { useEffect, useState } from 'react';
import { api } from '../../api/client';

const STATUSES = ['pending', 'paid', 'in_progress', 'shipped', 'completed', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  function load() {
    setLoading(true);
    api.adminOrders(filter || undefined).then(setOrders).finally(() => setLoading(false));
  }

  useEffect(load, [filter]);

  async function handleStatusChange(id, status) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      await api.adminUpdateOrderStatus(id, status);
    } catch {
      load();
    }
  }

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>Orders</h1>
          <p>{orders.length} order{orders.length === 1 ? '' : 's'}{filter ? ` · ${filter}` : ''}</p>
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
              <th>Order #</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Placed</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: '#7a7161' }}>Loading…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: '#7a7161' }}>No orders yet.</td></tr>
            ) : orders.map((o) => (
              <tr key={o.id}>
                <td>{o.orderNumber}</td>
                <td>{o.customerName}<br /><span style={{ color: '#7a7161', fontSize: 12 }}>{o.customerEmail}</span></td>
                <td>{o.items?.length ?? '—'}</td>
                <td>${o.total.toFixed(2)}</td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                <td>
                  <select
                    className="status-select"
                    value={o.status}
                    onChange={(e) => handleStatusChange(o.id, e.target.value)}
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
