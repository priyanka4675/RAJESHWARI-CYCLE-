import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const emptyForm = { dealer_name: '', phone: '', upi_id: '', bank_name: '', account_number: '', ifsc_code: '' };

export default function Dealers() {
  const [dealers, setDealers] = useState([]);
  const [balances, setBalances] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [{ data: d }, { data: b }] = await Promise.all([
      supabase.from('dealers').select('*').order('dealer_name'),
      supabase.from('dealer_balances').select('*')
    ]);
    setDealers(d || []);
    setBalances(b || []);
    setLoading(false);
  };

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowModal(true); setError(''); };
  const openEdit = (d) => { setForm(d); setEditId(d.id); setShowModal(true); setError(''); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = { dealer_name: form.dealer_name, phone: form.phone, upi_id: form.upi_id, bank_name: form.bank_name, account_number: form.account_number, ifsc_code: form.ifsc_code };
    const { error } = editId
      ? await supabase.from('dealers').update(payload).eq('id', editId)
      : await supabase.from('dealers').insert([payload]);
    setSaving(false);
    if (error) { setError(error.message); return; }
    setShowModal(false);
    fetchAll();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this dealer?')) return;
    await supabase.from('dealers').delete().eq('id', id);
    fetchAll();
  };

  const getBalance = (id) => balances.find(b => b.dealer_id === id);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1>🏭 Dealers</h1><p>{dealers.length} dealers registered</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Dealer</button>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {dealers.length === 0 ? (
          <div className="card"><div className="empty-state"><div className="empty-icon">🏭</div><h3>No dealers yet</h3><p>Add your first dealer</p></div></div>
        ) : dealers.map(dealer => {
          const b = getBalance(dealer.id);
          return (
            <div className="card" key={dealer.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: 4 }}>{dealer.dealer_name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>📞 {dealer.phone}</p>
                  {dealer.upi_id && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>💳 UPI: {dealer.upi_id}</p>}
                  {dealer.bank_name && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>🏦 {dealer.bank_name} · A/C: {dealer.account_number}</p>}
                </div>

                {/* Balance Summary */}
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Purchased</p>
                    <p style={{ fontWeight: 800, fontSize: '1rem' }}>₹{Number(b?.total_purchased || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Paid</p>
                    <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--success)' }}>₹{Number(b?.total_paid || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Balance Due</p>
                    <p style={{ fontWeight: 800, fontSize: '1.2rem', color: Number(b?.balance_due || 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      ₹{Number(b?.balance_due || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(dealer)}><Edit2 size={13} /></button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(dealer.id)}><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? '✏️ Edit Dealer' : '➕ Add Dealer'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Dealer Name *</label>
                  <input value={form.dealer_name} onChange={e => setForm({ ...form, dealer_name: e.target.value })} required placeholder="ABC Cycles" />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required placeholder="9876543210" />
                </div>
                <div className="form-group">
                  <label>UPI ID</label>
                  <input value={form.upi_id} onChange={e => setForm({ ...form, upi_id: e.target.value })} placeholder="dealer@upi" />
                </div>
                <div className="form-group">
                  <label>Bank Name</label>
                  <input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} placeholder="SBI" />
                </div>
                <div className="form-group">
                  <label>Account Number</label>
                  <input value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} placeholder="123456789" />
                </div>
                <div className="form-group">
                  <label>IFSC Code</label>
                  <input value={form.ifsc_code} onChange={e => setForm({ ...form, ifsc_code: e.target.value })} placeholder="SBIN0001234" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳ Saving...' : '💾 Save Dealer'}</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
