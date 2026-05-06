import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export default function Payments() {
  const [balances, setBalances] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', payment_method: 'UPI', transaction_ref: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [{ data: b }, { data: p }] = await Promise.all([
      supabase.from('dealer_balances').select('*').order('balance_due', { ascending: false }),
      supabase.from('dealer_payments').select('*, dealers(dealer_name)').order('created_at', { ascending: false })
    ]);
    setBalances(b || []);
    setPayments(p || []);
    setLoading(false);
  };

  const openPayModal = (dealer) => {
    setSelectedDealer(dealer);
    setPayForm({ amount: dealer.balance_due > 0 ? dealer.balance_due : '', payment_method: 'UPI', transaction_ref: '', notes: '' });
    setShowPayModal(true);
    setError('');
  };

  const openUPI = () => {
    if (!selectedDealer?.upi_id) { alert('No UPI ID for this dealer!'); return; }
    const upiLink = `upi://pay?pa=${selectedDealer.upi_id}&pn=${encodeURIComponent(selectedDealer.dealer_name)}&am=${payForm.amount}&cu=INR&tn=${encodeURIComponent('Cycle payment')}`;
    window.open(upiLink, '_blank');
  };

  const openGPay = () => {
    if (!selectedDealer?.upi_id) { alert('No UPI ID!'); return; }
    const link = `gpay://upi/pay?pa=${selectedDealer.upi_id}&pn=${encodeURIComponent(selectedDealer.dealer_name)}&am=${payForm.amount}&cu=INR`;
    window.open(link, '_blank');
  };

  const openPhonePe = () => {
    if (!selectedDealer?.upi_id) { alert('No UPI ID!'); return; }
    const link = `phonepe://pay?pa=${selectedDealer.upi_id}&pn=${encodeURIComponent(selectedDealer.dealer_name)}&am=${payForm.amount}&cu=INR`;
    window.open(link, '_blank');
  };

  const handleMarkPaid = async (e) => {
    e.preventDefault();
    if (!payForm.amount || Number(payForm.amount) <= 0) { setError('Enter valid amount'); return; }
    setSaving(true);
    setError('');
    const { error } = await supabase.from('dealer_payments').insert([{
      dealer_id: selectedDealer.dealer_id,
      amount_paid: Number(payForm.amount),
      payment_method: payForm.payment_method,
      transaction_ref: payForm.transaction_ref,
      notes: payForm.notes,
      date: new Date().toISOString().split('T')[0]
    }]);
    setSaving(false);
    if (error) { setError(error.message); return; }
    setShowPayModal(false);
    fetchAll();
  };

  const totalPending = balances.reduce((s, b) => s + Math.max(0, Number(b.balance_due)), 0);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>💰 Payments</h1>
          <p>Dealer payment tracking</p>
        </div>
        <button className="btn btn-outline" onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? '📊 Show Balances' : '📜 Payment History'}
        </button>
      </div>

      {/* Summary */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon red">⏳</div>
          <div className="stat-info">
            <h3>₹{totalPending.toLocaleString('en-IN')}</h3>
            <p>Total Pending to Pay</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">🏭</div>
          <div className="stat-info">
            <h3>{balances.filter(b => Number(b.balance_due) > 0).length}</h3>
            <p>Dealers with Due Balance</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div className="stat-info">
            <h3>{payments.length}</h3>
            <p>Total Payments Made</p>
          </div>
        </div>
      </div>

      {!showHistory ? (
        /* Dealer Balances */
        <div className="card">
          <div className="section-title">🏭 Dealer Balances</div>
          {balances.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">💰</div><h3>No dealers found</h3></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Dealer</th>
                    <th>Phone</th>
                    <th>Total Purchased</th>
                    <th>Total Paid</th>
                    <th>Balance Due</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map(b => (
                    <tr key={b.dealer_id}>
                      <td><strong>{b.dealer_name}</strong></td>
                      <td>{b.phone}</td>
                      <td>₹{Number(b.total_purchased).toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--success)' }}>₹{Number(b.total_paid).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 800, color: Number(b.balance_due) > 0 ? 'var(--danger)' : 'var(--success)', fontSize: '1rem' }}>
                        ₹{Number(b.balance_due).toLocaleString('en-IN')}
                      </td>
                      <td>
                        {Number(b.balance_due) <= 0
                          ? <span className="badge badge-success">✅ Clear</span>
                          : <span className="badge badge-danger">⚠️ Due</span>
                        }
                      </td>
                      <td>
                        {Number(b.balance_due) > 0 && (
                          <button className="btn btn-primary btn-sm" onClick={() => openPayModal(b)}>
                            💳 Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Payment History */
        <div className="card">
          <div className="section-title">📜 Payment History</div>
          {payments.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">💸</div><h3>No payments recorded</h3></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Dealer</th><th>Amount</th><th>Method</th><th>Ref</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.dealers?.dealer_name}</strong></td>
                      <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{Number(p.amount_paid).toLocaleString('en-IN')}</td>
                      <td><span className="badge badge-orange">{p.payment_method}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{p.transaction_ref || '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{format(new Date(p.date), 'dd MMM yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && selectedDealer && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💳 Pay Dealer</h2>
              <button className="modal-close" onClick={() => setShowPayModal(false)}>✕</button>
            </div>

            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
              <p style={{ fontWeight: 700, fontSize: '1rem' }}>{selectedDealer.dealer_name}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Balance Due: <strong style={{ color: 'var(--danger)' }}>₹{Number(selectedDealer.balance_due).toLocaleString('en-IN')}</strong></p>
              {selectedDealer.upi_id && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>UPI: {selectedDealer.upi_id}</p>}
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleMarkPaid}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label>Amount to Pay (₹)</label>
                <input type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} required min="1" placeholder="Enter amount" />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label>Payment Method</label>
                <select value={payForm.payment_method} onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })}>
                  <option>UPI</option>
                  <option>Google Pay</option>
                  <option>PhonePe</option>
                  <option>Bank Transfer</option>
                  <option>Cash</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label>Transaction Reference</label>
                <input value={payForm.transaction_ref} onChange={e => setPayForm({ ...payForm, transaction_ref: e.target.value })} placeholder="UTR / Reference number" />
              </div>

              {/* UPI Quick Pay Buttons */}
              {selectedDealer.upi_id && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' }}>Quick Pay via App</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={openUPI} style={{ flex: 1, padding: '10px', background: '#5a4fcf', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
                      📲 UPI Pay
                    </button>
                    <button type="button" onClick={openGPay} style={{ flex: 1, padding: '10px', background: '#34a853', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
                      G Google Pay
                    </button>
                    <button type="button" onClick={openPhonePe} style={{ flex: 1, padding: '10px', background: '#5f259f', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
                      📱 PhonePe
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    ↑ Click to open payment app → After paying, click "Mark as Paid" below
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-success" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
                  {saving ? '⏳ Saving...' : '✅ Mark as Paid'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowPayModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
