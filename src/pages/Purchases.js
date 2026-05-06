import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ dealer_id: '', product_id: '', quantity: '', purchase_price: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [{ data: pu }, { data: d }, { data: pr }] = await Promise.all([
      supabase.from('purchases').select('*, dealers(dealer_name), products(company_name, model_name)').order('created_at', { ascending: false }),
      supabase.from('dealers').select('*').order('dealer_name'),
      supabase.from('products').select('*').order('company_name')
    ]);
    setPurchases(pu || []);
    setDealers(d || []);
    setProducts(pr || []);
    setLoading(false);
  };

  const handleProductChange = (product_id) => {
    const prod = products.find(p => p.id === product_id);
    setForm({ ...form, product_id, purchase_price: prod ? prod.purchase_price : '' });
  };

  const total = Number(form.quantity) * Number(form.purchase_price);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const { error } = await supabase.from('purchases').insert([{
      dealer_id: form.dealer_id,
      product_id: form.product_id,
      quantity: Number(form.quantity),
      purchase_price: Number(form.purchase_price),
      total_amount: total,
      notes: form.notes,
      date: new Date().toISOString().split('T')[0]
    }]);
    setSaving(false);
    if (error) { setError(error.message); return; }
    setShowModal(false);
    setForm({ dealer_id: '', product_id: '', quantity: '', purchase_price: '', notes: '' });
    fetchAll();
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1>🏭 Purchases</h1><p>{purchases.length} purchase records</p></div>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setError(''); }}>
          <Plus size={16} /> Record Purchase
        </button>
      </div>

      <div className="card">
        {purchases.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🏭</div><h3>No purchases yet</h3><p>Record your first stock purchase</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Dealer</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price/Unit</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.dealers?.dealer_name}</strong></td>
                    <td>{p.products?.company_name} {p.products?.model_name}</td>
                    <td>{p.quantity}</td>
                    <td>₹{Number(p.purchase_price).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{Number(p.total_amount).toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{format(new Date(p.date), 'dd MMM yyyy')}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🏭 Record Purchase</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Dealer *</label>
                  <select value={form.dealer_id} onChange={e => setForm({ ...form, dealer_id: e.target.value })} required>
                    <option value="">Select Dealer</option>
                    {dealers.map(d => <option key={d.id} value={d.id}>{d.dealer_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Product *</label>
                  <select value={form.product_id} onChange={e => handleProductChange(e.target.value)} required>
                    <option value="">Select Product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.company_name} {p.model_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity *</label>
                  <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required placeholder="10" />
                </div>
                <div className="form-group">
                  <label>Purchase Price per Unit (₹) *</label>
                  <input type="number" min="0" value={form.purchase_price} onChange={e => setForm({ ...form, purchase_price: e.target.value })} required placeholder="3500" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Notes</label>
                  <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." />
                </div>
              </div>

              {form.quantity && form.purchase_price && (
                <div style={{ background: 'rgba(232,93,4,0.08)', borderRadius: 10, padding: '12px 16px', margin: '16px 0', fontWeight: 700 }}>
                  Total Amount: <span style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>₹{total.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳ Saving...' : '💾 Save Purchase'}</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
