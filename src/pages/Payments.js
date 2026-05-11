import React, { useState } from 'react';
import { format } from 'date-fns';
import { usePayments } from '../hooks/usePayments';
import { useDealers } from '../hooks/useDealers';

export default function Payments() {
  var { payments, loading: pLoading, recordPayment, buildUPILink, buildGPayLink, buildPhonePeLink } = usePayments();
  var { balances, loading: dLoading, totalPending, dealersWithDue } = useDealers();
  var [showPayModal, setShowPayModal] = useState(false);
  var [selectedDealer, setSelectedDealer] = useState(null);
  var [payForm, setPayForm] = useState({ amount: '', payment_method: 'UPI', transaction_ref: '', notes: '' });
  var [saving, setSaving] = useState(false);
  var [showHistory, setShowHistory] = useState(false);
  var [error, setError] = useState('');

  var loading = pLoading || dLoading;

  function openPayModal(dealer) {
    setSelectedDealer(dealer);
    setPayForm({ amount: dealer.balance_due > 0 ? String(dealer.balance_due) : '', payment_method: 'UPI', transaction_ref: '', notes: '' });
    setShowPayModal(true);
    setError('');
  }

  async function handleMarkPaid(e) {
    e.preventDefault();
    if (!payForm.amount || Number(payForm.amount) <= 0) { setError('Enter a valid amount'); return; }
    setSaving(true);
    setError('');
    var res = await recordPayment(selectedDealer.dealer_id, payForm.amount, payForm.payment_method, payForm.transaction_ref, payForm.notes);
    setSaving(false);
    if (res.error) { setError(res.error.message); return; }
    setShowPayModal(false);
  }

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1>💰 Payments</h1><p>Dealer payment tracking</p></div>
        <button className="btn btn-outline" onClick={function () { setShowHistory(!showHistory); }}>
          {showHistory ? '📊 Show Balances' : '📜 Payment History'}
        </button>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-icon red">⏳</div><div className="stat-info"><h3>₹{totalPending.toLocaleString('en-IN')}</h3><p>Total Pending</p></div></div>
        <div className="stat-card"><div className="stat-icon orange">🏭</div><div className="stat-info"><h3>{dealersWithDue}</h3><p>Dealers with Due</p></div></div>
        <div className="stat-card"><div className="stat-icon green">✅</div><div className="stat-info"><h3>{payments.length}</h3><p>Total Payments Made</p></div></div>
      </div>

      {!showHistory ? (
        <div className="card">
          <div className="section-title">🏭 Dealer Balances</div>
          {balances.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">💰</div><h3>No dealers found</h3></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Dealer</th><th>Phone</th><th>Total Purchased</th><th>Total Paid</th><th>Balance Due</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {balances.map(function (b) {
                    return (
                      <tr key={b.dealer_id}>
                        <td><strong>{b.dealer_name}</strong></td>
                        <td>{b.phone}</td>
                        <td>₹{Number(b.total_purchased).toLocaleString('en-IN')}</td>
                        <td style={{ color: 'var(--success)' }}>₹{Number(b.total_paid).toLocaleString('en-IN')}</td>
                        <td style={{ fontWeight: 800, color: Number(b.balance_due) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                          ₹{Number(b.balance_due).toLocaleString('en-IN')}
                        </td>
                        <td>{Number(b.balance_due) <= 0 ? <span className="badge badge-success">✅ Clear</span> : <span className="badge badge-danger">⚠️ Due</span>}</td>
                        <td>{Number(b.balance_due) > 0 && <button className="btn btn-primary btn-sm" onClick={function () { openPayModal(b); }}>💳 Pay</button>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="section-title">📜 Payment History</div>
          {payments.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">💸</div><h3>No payments recorded</h3></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Dealer</th><th>Amount</th><th>Method</th><th>Reference</th><th>Date</th></tr></thead>
                <tbody>
                  {payments.map(function (p) {
                    return (
                      <tr key={p.id}>
                        <td><strong>{p.dealers ? p.dealers.dealer_name : '—'}</strong></td>
                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{Number(p.amount_paid).toLocaleString('en-IN')}</td>
                        <td><span className="badge badge-orange">{p.payment_method}</span></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{p.transaction_ref || '—'}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{format(new Date(p.date), 'dd MMM yyyy')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showPayModal && selectedDealer && (
        <div className="modal-overlay" onClick={function () { setShowPayModal(false); }}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={function (e) { e.stopPropagation(); }}>
            <div className="modal-header">
              <h2>💳 Pay Dealer</h2>
              <button className="modal-close" onClick={function () { setShowPayModal(false); }}>✕</button>
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
              <p style={{ fontWeight: 700 }}>{selectedDealer.dealer_name}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Balance Due: <strong style={{ color: 'var(--danger)' }}>₹{Number(selectedDealer.balance_due).toLocaleString('en-IN')}</strong></p>
              {selectedDealer.upi_id && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>UPI: {selectedDealer.upi_id}</p>}
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleMarkPaid}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label>Amount to Pay (₹)</label>
                <input type="number" value={payForm.amount} onChange={function (e) { setPayForm(Object.assign({}, payForm, { amount: e.target.value })); }} required min="1" placeholder="Enter amount" />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label>Payment Method</label>
                <select value={payForm.payment_method} onChange={function (e) { setPayForm(Object.assign({}, payForm, { payment_method: e.target.value })); }}>
                  <option>UPI</option><option>Google Pay</option><option>PhonePe</option><option>Bank Transfer</option><option>Cash</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Transaction Reference</label>
                <input value={payForm.transaction_ref} onChange={function (e) { setPayForm(Object.assign({}, payForm, { transaction_ref: e.target.value })); }} placeholder="UTR / Reference number" />
              </div>
              {selectedDealer.upi_id && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' }}>Quick Pay via App</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={function () { window.open(buildUPILink(selectedDealer.upi_id, selectedDealer.dealer_name, payForm.amount), '_blank'); }} style={{ flex: 1, padding: 10, background: '#5a4fcf', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>📲 UPI</button>
                    <button type="button" onClick={function () { window.open(buildGPayLink(selectedDealer.upi_id, selectedDealer.dealer_name, payForm.amount), '_blank'); }} style={{ flex: 1, padding: 10, background: '#34a853', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>G GPay</button>
                    <button type="button" onClick={function () { window.open(buildPhonePeLink(selectedDealer.upi_id, selectedDealer.dealer_name, payForm.amount), '_blank'); }} style={{ flex: 1, padding: 10, background: '#5f259f', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>📱 PhonePe</button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>↑ Open payment app → complete payment → click Mark as Paid</p>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-success" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>{saving ? '⏳ Saving...' : '✅ Mark as Paid'}</button>
                <button type="button" className="btn btn-outline" onClick={function () { setShowPayModal(false); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
