import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useDashboard } from '../hooks/useDashboard';

export default function Dashboard() {
  var { stats, loading, refetch } = useDashboard();

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  return (
    <div>
      {stats.lowStockProducts.length > 0 && (
        <div className="alert alert-warning">
          ⚠️ <strong>Low Stock Alert!</strong>{' '}
          {stats.lowStockProducts.map(function (p) {
            return p.company_name + ' ' + p.model_name + ' (' + p.stock_quantity + ' left)';
          }).join(', ')}
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon orange">🚲</div>
          <div className="stat-info">
            <h3>{stats.totalStock}</h3>
            <p>Total Cycles in Stock</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🛒</div>
          <div className="stat-info">
            <h3>{stats.todaySalesCount}</h3>
            <p>Today's Sales</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">💰</div>
          <div className="stat-info">
            <h3>₹{stats.todayRevenue.toLocaleString('en-IN')}</h3>
            <p>Today's Revenue</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📈</div>
          <div className="stat-info">
            <h3>₹{stats.totalProfit.toLocaleString('en-IN')}</h3>
            <p>Total Profit</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">⏳</div>
          <div className="stat-info">
            <h3>₹{stats.pendingPayments.toLocaleString('en-IN')}</h3>
            <p>Dealer Pending Payments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">⚠️</div>
          <div className="stat-info">
            <h3>{stats.lowStockProducts.length}</h3>
            <p>Low Stock Items</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <div className="card">
          <div className="section-title">⚡ Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/sales/create" className="btn btn-primary">🧾 Create Invoice</Link>
            <Link to="/inventory/add" className="btn btn-outline">➕ Add Stock</Link>
            <Link to="/purchases" className="btn btn-outline">🏭 Record Purchase</Link>
            <Link to="/payments" className="btn btn-outline">💳 Pay Dealer</Link>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>📋 Recent Sales</div>
            <button className="btn btn-outline btn-sm" onClick={refetch}>🔄 Refresh</button>
          </div>
          {stats.recentSales.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div className="empty-icon">🛒</div>
              <p>No sales yet today</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentSales.map(function (sale) {
                    return (
                      <tr key={sale.id}>
                        <td>{sale.customer_name}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          ₹{Number(sale.total_amount).toLocaleString('en-IN')}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {format(new Date(sale.date), 'dd MMM')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
