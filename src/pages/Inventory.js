import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    let data = products;
    if (search) data = data.filter(p =>
      p.model_name.toLowerCase().includes(search.toLowerCase()) ||
      p.company_name.toLowerCase().includes(search.toLowerCase())
    );
    if (filterCompany) data = data.filter(p => p.company_name === filterCompany);
    setFiltered(data);
  }, [search, filterCompany, products]);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('company_name');
    setProducts(data || []);
    setFiltered(data || []);
    setLoading(false);
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  };

  const companies = [...new Set(products.map(p => p.company_name))];

  const handleEditSave = async () => {
    const { id, company_name, model_name, purchase_price, selling_price, stock_quantity, low_stock_alert } = editItem;
    await supabase.from('products').update({
      company_name, model_name,
      purchase_price: Number(purchase_price),
      selling_price: Number(selling_price),
      stock_quantity: Number(stock_quantity),
      low_stock_alert: Number(low_stock_alert)
    }).eq('id', id);
    setShowEdit(false);
    fetchProducts();
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>📦 Inventory</h1>
          <p>{products.length} products · {products.reduce((s, p) => s + p.stock_quantity, 0)} total units</p>
        </div>
        <Link to="/inventory/add" className="btn btn-primary">
          <Plus size={16} /> Add Stock
        </Link>
      </div>

      <div className="card">
        {/* Search & Filter */}
        <div className="search-bar">
          <div className="search-input-wrapper">
            <Search />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by model or company..."
            />
          </div>
          <select
            value={filterCompany}
            onChange={e => setFilterCompany(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 10, border: '2px solid var(--border)', fontFamily: 'inherit', fontSize: '0.88rem' }}
          >
            <option value="">All Companies</option>
            {companies.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No products found</h3>
            <p>Add your first cycle to get started</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Model</th>
                  <th>Purchase Price</th>
                  <th>Selling Price</th>
                  <th>Margin</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const margin = Number(p.selling_price) - Number(p.purchase_price);
                  const isLow = p.stock_quantity <= p.low_stock_alert;
                  return (
                    <tr key={p.id}>
                      <td><strong>{p.company_name}</strong></td>
                      <td>{p.model_name}</td>
                      <td>₹{Number(p.purchase_price).toLocaleString('en-IN')}</td>
                      <td>₹{Number(p.selling_price).toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 700 }}>+₹{margin.toLocaleString('en-IN')}</td>
                      <td><strong>{p.stock_quantity}</strong></td>
                      <td>
                        {p.stock_quantity === 0
                          ? <span className="badge badge-danger">Out of Stock</span>
                          : isLow
                            ? <span className="badge badge-warning">⚠️ Low</span>
                            : <span className="badge badge-success">In Stock</span>
                        }
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => { setEditItem({ ...p }); setShowEdit(true); }}>
                            <Edit2 size={13} />
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteProduct(p.id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEdit && editItem && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Edit Product</h2>
              <button className="modal-close" onClick={() => setShowEdit(false)}>✕</button>
            </div>
            <div className="form-grid">
              {['company_name', 'model_name', 'purchase_price', 'selling_price', 'stock_quantity', 'low_stock_alert'].map(field => (
                <div className="form-group" key={field}>
                  <label>{field.replace(/_/g, ' ')}</label>
                  <input
                    value={editItem[field]}
                    onChange={e => setEditItem({ ...editItem, [field]: e.target.value })}
                    type={['purchase_price', 'selling_price', 'stock_quantity', 'low_stock_alert'].includes(field) ? 'number' : 'text'}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-primary" onClick={handleEditSave}>💾 Save</button>
              <button className="btn btn-outline" onClick={() => setShowEdit(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
