import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';

export default function Reports() {
  const [salesData, setSalesData] = useState([]);
  const [productStats, setProductStats] = useState([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalProfit: 0, totalSales: 0, totalUnits: 0 });
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  useEffect(() => { fetchReports(); }, [range]);

  const fetchReports = async () => {
    setLoading(true);
    const fromDate = format(subDays(new Date(), range), 'yyyy-MM-dd');

    // Sales by date
    const { data: sales } = await supabase
      .from('sales')
      .select('date, total_amount')
      .gte('date', fromDate)
      .order('date');

    // Group by date
    const byDate = {};
    (sales || []).forEach(s => {
      byDate[s.date] = (byDate[s.date] || 0) + Number(s.total_amount);
    });
    const chartData = Object.entries(byDate).map(([date, amount]) => ({
      date: format(parseISO(date), 'dd MMM'),
      revenue: amount
    }));
    setSalesData(chartData);

    // Product-wise stats
    const { data: items } = await supabase
      .from('sale_items')
      .select('quantity, selling_price, subtotal, products(company_name, model_name, purchase_price)')
      .gte('created_at', new Date(fromDate).toISOString());

    const prodMap = {};
    (items || []).forEach(item => {
      const key = `${item.products?.company_name} ${item.products?.model_name}`;
      if (!prodMap[key]) prodMap[key] = { name: key, units: 0, revenue: 0, profit: 0 };
      prodMap[key].units += item.quantity;
      prodMap[key].revenue += Number(item.subtotal);
      prodMap[key].profit += (Number(item.selling_price) - Number(item.products?.purchase_price || 0)) * item.quantity;
    });
    const prodStats = Object.values(prodMap).sort((a, b) => b.revenue - a.revenue);
    setProductStats(prodStats);

    // Summary
    const totalRevenue = (sales || []).reduce((s, r) => s + Number(r.total_amount), 0);
    const totalProfit = prodStats.reduce((s, p) => s + p.profit, 0);
    const totalUnits = prodStats.reduce((s, p) => s + p.units, 0);
    setSummary({ totalRevenue, totalProfit, totalSales: sales?.length || 0, totalUnits });
    setLoading(false);
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1>📊 Reports</h1><p>Sales analytics & performance</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[7, 30, 90].map(r => (
            <button key={r} className={`btn btn-sm ${range === r ? 'btn-primary' : 'btn-outline'}`} onClick={() => setRange(r)}>
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon blue">🧾</div>
          <div className="stat-info"><h3>{summary.totalSales}</h3><p>Total Invoices</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">🚲</div>
          <div className="stat-info"><h3>{summary.totalUnits}</h3><p>Cycles Sold</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">💰</div>
          <div className="stat-info"><h3>₹{summary.totalRevenue.toLocaleString('en-IN')}</h3><p>Total Revenue</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📈</div>
          <div className="stat-info"><h3>₹{summary.totalProfit.toLocaleString('en-IN')}</h3><p>Total Profit</p></div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">📈 Revenue Over Time</div>
        {salesData.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 0' }}><p>No sales data for this period</p></div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={salesData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#e85d04" strokeWidth={2.5} dot={{ fill: '#e85d04', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Product Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <div className="card">
          <div className="section-title">🚲 Top Products by Revenue</div>
          {productStats.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}><p>No data</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={productStats.slice(0, 5)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
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
                <thead>
                  <tr><th>Product</th><th>Units</th><th>Revenue</th><th>Profit</th></tr>
                </thead>
                <tbody>
                  {productStats.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: '0.85rem' }}>{p.name}</td>
                      <td>{p.units}</td>
                      <td>₹{p.revenue.toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 700 }}>₹{p.profit.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
