import React, { useState } from 'react';
import { useReports } from '../hooks/useReports';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Reports() {
  var [range, setRange] = useState(30);
  var { salesChartData, productStats, summary, loading } = useReports(range);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1>📊 Reports</h1><p>Sales analytics and performance</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[7, 30, 90].map(function (r) {
            return <button key={r} className={'btn btn-sm ' + (range === r ? 'btn-primary' : 'btn-outline')} onClick={function () { setRange(r); }}>{r}d</button>;
          })}
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-icon blue">🧾</div><div className="stat-info"><h3>{summary.totalSales}</h3><p>Total Invoices</p></div></div>
        <div className="stat-card"><div className="stat-icon orange">🚲</div><div className="stat-info"><h3>{summary.totalUnits}</h3><p>Cycles Sold</p></div></div>
        <div className="stat-card"><div className="stat-icon blue">💰</div><div className="stat-info"><h3>₹{summary.totalRevenue.toLocaleString('en-IN')}</h3><p>Total Revenue</p></div></div>
        <div className="stat-card"><div className="stat-icon green">📈</div><div className="stat-info"><h3>₹{summary.totalProfit.toLocaleString('en-IN')}</h3><p>Total Profit</p></div></div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">📈 Revenue Over Time</div>
        {salesChartData.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 0' }}><p>No sales data for this period</p></div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={salesChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={function (v) { return '₹' + (v / 1000).toFixed(0) + 'k'; }} />
              <Tooltip formatter={function (v) { return ['₹' + Number(v).toLocaleString('en-IN'), 'Revenue']; }} />
              <Line type="monotone" dataKey="revenue" stroke="#e85d04" strokeWidth={2.5} dot={{ fill: '#e85d04', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <div className="card">
          <div className="section-title">🚲 Top Products by Revenue</div>
          {productStats.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}><p>No data</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={productStats.slice(0, 5)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={function (v) { return '₹' + (v / 1000).toFixed(0) + 'k'; }} />
                <Tooltip formatter={function (v) { return ['₹' + Number(v).toLocaleString('en-IN'), 'Revenue']; }} />
                <Bar dataKey="revenue" fill="#e85d04" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card">
          <div className="section-title">📋 Product Details</div>
          {productStats.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}><p>No sales yet</p></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Product</th><th>Units</th><th>Revenue</th><th>Profit</th></tr></thead>
                <tbody>
                  {productStats.map(function (p, i) {
                    return (
                      <tr key={i}>
                        <td style={{ fontSize: '0.85rem' }}>{p.name}</td>
                        <td>{p.units}</td>
                        <td>₹{p.revenue.toLocaleString('en-IN')}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 700 }}>₹{p.profit.toLocaleString('en-IN')}</td>
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
