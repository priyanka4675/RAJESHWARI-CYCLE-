import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Trash2 } from 'lucide-react';

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [customer, setCustomer] = useState({ name: '', phone: '', payment_method: 'Cash' });
  const [items, setItems] = useState([{ product_id: '', quantity: 1, selling_price: 0, subtotal: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').gt('stock_quantity', 0).order('company_name');
    setProducts(data || []);
  };

  const addItem = () => setItems([...items, { product_id: '', quantity: 1, selling_price: 0, subtotal: 0 }]);

  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    if (field === 'product_id') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        updated[i].selling_price = prod.selling_price;
        updated[i].subtotal = prod.selling_price * updated[i].quantity;
      }
    }
    if (field === 'quantity' || field === 'selling_price') {
      updated[i].subtotal = Number(updated[i].selling_price) * Number(updated[i].quantity);
    }
    setItems(updated);
  };

  const subtotal = items.reduce((s, item) => s + Number(item.subtotal), 0);
  const total = subtotal - Number(discount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.some(item => !item.product_id)) { setError('Please select a product for all items.'); return; }
    setLoading(true);
    setError('');

    // Check stock availability
    for (const item of items) {
      const prod = products.find(p => p.id === item.product_id);
      if (prod && Number(item.quantity) > prod.stock_quantity) {
        setError(`Not enough stock for ${prod.company_name} ${prod.model_name}. Available: ${prod.stock_quantity}`);
        setLoading(false);
        return;
      }
    }

    const { data: saleData, error: saleError } = await supabase.from('sales').insert([{
      customer_name: customer.name,
      customer_phone: customer.phone,
      total_amount: total,
      discount: Number(discount),
      payment_method: customer.payment_method,
      date: new Date().toISOString().split('T')[0]
    }]).select().single();

    if (saleError) { setError(saleError.message); setLoading(false); return; }

    const saleItems = items.map(item => ({
      sale_id: saleData.id,
      product_id: item.product_id,
      quantity: Number(item.quantity),
      selling_price: Number(item.selling_price),
      subtotal: Number(item.subtotal)
    }));

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
    if (itemsError) { setError(itemsError.message); setLoading(false); return; }

    navigate('/sales');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>🧾 Create Invoice</h1>
          <p>New sale entry</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/sales')}>← Back</button>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-danger">{error}</div>}

        {/* Customer Info */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title">👤 Customer Details</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Customer Name *</label>
              <input value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} placeholder="Enter customer name" required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} placeholder="9876543210" />
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select value={customer.payment_method} onChange={e => setCustomer({ ...customer, payment_method: e.target.value })}>
                <option>Cash</option>
                <option>UPI</option>
                <option>Google Pay</option>
                <option>PhonePe</option>
                <option>Bank Transfer</option>
                <option>Credit</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>🚲 Cycle Items</div>
            <button type="button" className="btn btn-outline btn-sm" onClick={addItem}>
              <Plus size={14} /> Add Item
            </button>
          </div>

          {items.map((item, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
              gap: 12, marginBottom: 12, alignItems: 'end'
            }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Cycle Model</label>
                <select value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)} required>
                  <option value="">Select Cycle</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.company_name} {p.model_name} (Stock: {p.stock_quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Qty</label>
                <input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Price (₹)</label>
                <input type="number" value={item.selling_price} onChange={e => updateItem(i, 'selling_price', e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Subtotal</label>
                <input value={`₹${Number(item.subtotal).toLocaleString('en-IN')}`} readOnly style={{ background: '#f8f4f0' }} />
              </div>
              {items.length > 1 && (
                <button type="button" className="btn btn-danger btn-sm" style={{ marginBottom: 0 }} onClick={() => removeItem(i)}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}

          <hr className="divider" />

          {/* Totals */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
              <strong>₹{subtotal.toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <label style={{ color: 'var(--text-muted)' }}>Discount (₹):</label>
              <input
                type="number"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                style={{ width: 100, padding: '6px 10px', border: '2px solid var(--border)', borderRadius: 8, fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
              Total: ₹{total.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? '⏳ Saving...' : '✅ Create Invoice'}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/sales')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
