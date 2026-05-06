import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStock: 0,
    lowStock: [],
    todaySales: 0,
    todayRevenue: 0,
    totalProfit: 0,
    pendingPayments: 0,
    recentSales: []
  });
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Total stock
      const { data: products } = await supabase.from('products').select('*');
      const totalStock = products?.reduce((s, p) => s + p.stock_quantity, 0) || 0;
      const lowStock = products?.filter(p => p.stock_quantity <= p.low_stock_alert) || [];

      // Today sales
      const { data: todaySalesData } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('date', today);
      const todaySales = todaySalesData?.length || 0;
      const todayRevenue = todaySalesData?.reduce((s, r) => s + Number(r.total_amount), 0) || 0;

      // Profit calculation
      const { data: saleItems } = await supabase
        .from('sale_items')
        .select('quantity, selling_price, product_id, products(purchase_price)');
      const totalProfit = saleItems?.reduce((s, item) => {
        const profit = (Number(item.selling_price) - Number(item.products?.purchase_price || 0)) * item.quantity;
        return s + profit;
      }, 0) || 0;

      // Dealer pending payments
      const { data: dealerBalances } = await supabase.from('dealer_balances').select('balance_due');
      const pendingPayments = dealerBalances?.reduce((s, d) => s + Number(d.balance_due), 0) || 0;

      // Recent sales
      const { data: recentSales } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({ totalStock, lowStock, todaySales, todayRevenue, totalProfit, pendingPayments, recentSales: recentSales || [] });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      {/* Low Stock Alerts */}
      {stats.lowStock.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          ⚠️ <strong>Low Stock Alert!</strong> {stats.lowStock.map(p => `${p.company_name} ${p.model_name} (${p.stock_quantity} left)`).join(', ')}
        </div>
      )}

      {/* Stats Grid */}
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
            <h3>{stats.todaySales}</h3>
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
            <h3>{stats.lowStock.length}</h3>
            <p>Low Stock Items</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div className="section-title">⚡ Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/sales/create" className="btn btn-primary">🧾 Create Invoice</Link>
            <Link to="/inventory/add" className="btn btn-outline">➕ Add Stock</Link>
            <Link to="/purchases" className="btn btn-outline">🏭 Record Purchase</Link>
            <Link to="/payments" className="btn btn-outline">💳 Pay Dealer</Link>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="card">
          <div className="section-title">📋 Recent Sales</div>
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
                  {stats.recentSales.map(sale => (
                    <tr key={sale.id}>
                      <td>{sale.customer_name}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{Number(sale.total_amount).toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{format(new Date(sale.date), 'dd MMM')}</td>
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
