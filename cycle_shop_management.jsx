import { useState, useEffect, useCallback } from "react";

// ─── SUPABASE CONFIG ───────────────────────────────────────────────────────────
// Replace these with your actual Supabase project URL and anon key
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";

// Minimal Supabase client (no SDK needed)
const supabase = {
  async query(table, options = {}) {
    const { method = "GET", body, filters = "", select = "*", order = "" } = options;
    let url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}${filters}${order}`;
    const res = await fetch(url, {
      method,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: method === "POST" ? "return=representation" : "",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(await res.text());
    return method === "DELETE" ? [] : res.json();
  },
  from(table) {
    return {
      select: (cols = "*") => ({
        order: (col, { ascending = true } = {}) => ({
          _run: () => supabase.query(table, { select: cols, order: `&order=${col}.${ascending ? "asc" : "desc"}` }),
          eq: (col2, val) => ({ _run: () => supabase.query(table, { select: cols, filters: `&${col2}=eq.${val}`, order: `&order=${col}.${ascending ? "asc" : "desc"}` }) }),
        }),
        eq: (col, val) => ({ _run: () => supabase.query(table, { select: cols, filters: `&${col}=eq.${val}` }) }),
        gte: (col, val) => ({ lte: (c2, v2) => ({ _run: () => supabase.query(table, { select: cols, filters: `&${col}=gte.${val}&${c2}=lte.${v2}` }) }) }),
        _run: () => supabase.query(table, { select: cols }),
      }),
      insert: (body) => ({ _run: () => supabase.query(table, { method: "POST", body }) }),
      update: (body) => ({ eq: (col, val) => ({ _run: () => supabase.query(table, { method: "PATCH", body, filters: `&${col}=eq.${val}` }) }) }),
      delete: () => ({ eq: (col, val) => ({ _run: () => supabase.query(table, { method: "DELETE", filters: `&${col}=eq.${val}` }) }) }),
      rpc: (fn, params) => fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }).then(r => r.json()),
    };
  },
};

// ─── SQL SETUP SCRIPT (run once in Supabase SQL editor) ──────────────────────
const SQL_SETUP = `
-- Run this in your Supabase SQL editor to set up all tables

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY, company_name TEXT NOT NULL, model_name TEXT NOT NULL,
  purchase_price NUMERIC NOT NULL, selling_price NUMERIC NOT NULL, stock_quantity INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS dealers (
  id SERIAL PRIMARY KEY, dealer_name TEXT NOT NULL, phone TEXT, upi_id TEXT, bank_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY, dealer_id INT REFERENCES dealers(id), product_id INT REFERENCES products(id),
  quantity INT NOT NULL, total_amount NUMERIC NOT NULL, date DATE DEFAULT CURRENT_DATE, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY, dealer_id INT REFERENCES dealers(id), amount_paid NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'UPI', date DATE DEFAULT CURRENT_DATE, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY, customer_name TEXT NOT NULL, phone TEXT, total_amount NUMERIC NOT NULL,
  date DATE DEFAULT CURRENT_DATE, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS sales_items (
  id SERIAL PRIMARY KEY, sale_id INT REFERENCES sales(id), product_id INT REFERENCES products(id),
  quantity INT NOT NULL, price NUMERIC NOT NULL
);
`;

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const colors = {
  bg: "#0f1117", card: "#1a1d27", border: "#2a2d3e", accent: "#6366f1",
  accentHover: "#818cf8", success: "#10b981", warning: "#f59e0b",
  danger: "#ef4444", text: "#e2e8f0", muted: "#94a3b8", surface: "#242736",
};

const style = {
  app: { fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif", background: colors.bg, minHeight: "100vh", color: colors.text, display: "flex" },
  sidebar: { width: 220, background: colors.card, borderRight: `1px solid ${colors.border}`, padding: "0", display: "flex", flexDirection: "column", flexShrink: 0 },
  sideHeader: { padding: "20px 20px 16px", borderBottom: `1px solid ${colors.border}` },
  sideTitle: { fontSize: 15, fontWeight: 700, color: colors.text, margin: 0, letterSpacing: "0.3px" },
  sideSub: { fontSize: 11, color: colors.muted, margin: "2px 0 0" },
  navItem: (active) => ({ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400, color: active ? colors.accentHover : colors.muted, background: active ? `${colors.accent}18` : "transparent", borderLeft: active ? `2px solid ${colors.accent}` : "2px solid transparent", transition: "all 0.15s", userSelect: "none" }),
  main: { flex: 1, overflow: "auto", padding: "24px 28px" },
  pageTitle: { fontSize: 20, fontWeight: 700, margin: "0 0 20px", color: colors.text },
  card: { background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "16px 20px", marginBottom: 16 },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 20 },
  metricCard: { background: colors.surface, borderRadius: 8, padding: "14px 16px", border: `1px solid ${colors.border}` },
  metricVal: { fontSize: 22, fontWeight: 700, margin: "4px 0 0" },
  metricLabel: { fontSize: 11, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.8px" },
  input: { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 6, padding: "8px 12px", color: colors.text, fontSize: 13, width: "100%", outline: "none", boxSizing: "border-box" },
  label: { fontSize: 12, color: colors.muted, marginBottom: 4, display: "block" },
  btn: (variant = "primary") => ({
    background: variant === "primary" ? colors.accent : variant === "success" ? colors.success : variant === "danger" ? colors.danger : colors.surface,
    border: `1px solid ${variant === "ghost" ? colors.border : "transparent"}`,
    color: "#fff", borderRadius: 6, padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
  }),
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "10px 12px", color: colors.muted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px", borderBottom: `1px solid ${colors.border}` },
  td: { padding: "10px 12px", borderBottom: `1px solid ${colors.border}18`, color: colors.text },
  badge: (color) => ({ background: `${color}22`, color, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, display: "inline-block" }),
  formRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: colors.text, margin: "0 0 12px" },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const today = () => new Date().toISOString().split("T")[0];

function Input({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div>
      {label && <label style={style.label}>{label}</label>}
      <input style={style.input} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      {label && <label style={style.label}>{label}</label>}
      <select style={style.input} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select...</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Alert({ msg, type = "success" }) {
  if (!msg) return null;
  const c = type === "success" ? colors.success : type === "warning" ? colors.warning : colors.danger;
  return <div style={{ background: `${c}18`, border: `1px solid ${c}44`, borderRadius: 6, padding: "10px 14px", color: c, fontSize: 13, marginBottom: 14 }}>{msg}</div>;
}

// ─── SUPABASE SETUP NOTICE ────────────────────────────────────────────────────
function SetupNotice({ onDismiss }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ ...style.card, borderColor: colors.warning + "44" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: colors.warning, margin: "0 0 6px" }}>⚡ First-Time Setup Required</p>
          <p style={{ fontSize: 13, color: colors.muted, margin: "0 0 10px" }}>
            1. Create a Supabase project at <a href="https://supabase.com" style={{ color: colors.accentHover }}>supabase.com</a><br />
            2. Run the SQL below in your Supabase SQL editor to create all tables<br />
            3. Replace <code style={{ color: colors.warning }}>SUPABASE_URL</code> and <code style={{ color: colors.warning }}>SUPABASE_ANON_KEY</code> at the top of this file
          </p>
          <div style={{ background: colors.bg, borderRadius: 6, padding: "10px 14px", fontFamily: "monospace", fontSize: 11, color: colors.muted, maxHeight: 120, overflow: "auto", whiteSpace: "pre", border: `1px solid ${colors.border}` }}>
            {SQL_SETUP}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button style={style.btn("primary")} onClick={() => { navigator.clipboard?.writeText(SQL_SETUP); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
              {copied ? "✓ Copied!" : "Copy SQL"}
            </button>
            <button style={style.btn("ghost")} onClick={onDismiss}>Dismiss (demo mode)</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MOCK DATA FOR DEMO MODE ──────────────────────────────────────────────────
const MOCK = {
  products: [
    { id: 1, company_name: "Hero", model_name: "Splendor Plus", purchase_price: 60000, selling_price: 72000, stock_quantity: 8 },
    { id: 2, company_name: "Avon", model_name: "E-Bike Pro", purchase_price: 35000, selling_price: 42000, stock_quantity: 3 },
    { id: 3, company_name: "Hero", model_name: "HF Deluxe", purchase_price: 58000, selling_price: 69000, stock_quantity: 0 },
    { id: 4, company_name: "BSA", model_name: "MTB Ranger", purchase_price: 12000, selling_price: 15500, stock_quantity: 12 },
  ],
  dealers: [
    { id: 1, dealer_name: "ABC Cycles Dist.", phone: "9876543210", upi_id: "abc@upi", bank_details: "SBI ****1234" },
    { id: 2, dealer_name: "Speed Traders", phone: "9123456780", upi_id: "speed@paytm", bank_details: "HDFC ****5678" },
  ],
  purchases: [
    { id: 1, dealer_id: 1, product_id: 1, quantity: 5, total_amount: 300000, date: "2025-05-01", dealers: { dealer_name: "ABC Cycles Dist." }, products: { model_name: "Splendor Plus" } },
    { id: 2, dealer_id: 2, product_id: 4, quantity: 12, total_amount: 144000, date: "2025-05-03", dealers: { dealer_name: "Speed Traders" }, products: { model_name: "MTB Ranger" } },
  ],
  payments: [
    { id: 1, dealer_id: 1, amount_paid: 150000, payment_method: "UPI", date: "2025-05-02" },
    { id: 2, dealer_id: 2, amount_paid: 100000, payment_method: "Bank Transfer", date: "2025-05-04" },
  ],
  sales: [
    { id: 1, customer_name: "Rajesh Kumar", phone: "9988776655", total_amount: 72000, date: "2025-05-05", sales_items: [{ quantity: 1, price: 72000, products: { model_name: "Splendor Plus" } }] },
    { id: 2, customer_name: "Priya Sharma", phone: "9765432100", total_amount: 31000, date: "2025-05-04", sales_items: [{ quantity: 2, price: 15500, products: { model_name: "MTB Ranger" } }] },
  ],
};

// ─── DEMO MODE HOOK ───────────────────────────────────────────────────────────
function useData(demoMode) {
  const [data, setData] = useState({ products: [], dealers: [], purchases: [], payments: [], sales: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (demoMode) { setData(MOCK); setLoading(false); return; }
    try {
      const [products, dealers, purchases, payments, sales] = await Promise.all([
        supabase.from("products").select("*")._run(),
        supabase.from("dealers").select("*")._run(),
        supabase.from("purchases").select("*,dealers(dealer_name),products(model_name)")._run(),
        supabase.from("payments").select("*")._run(),
        supabase.from("sales").select("*,sales_items(*,products(model_name))")._run(),
      ]);
      setData({ products, dealers, purchases, payments, sales });
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [demoMode]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, reload: load };
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ data }) {
  const totalStock = data.products.reduce((s, p) => s + p.stock_quantity, 0);
  const lowStock = data.products.filter((p) => p.stock_quantity <= 3 && p.stock_quantity > 0);
  const outOfStock = data.products.filter((p) => p.stock_quantity === 0);
  const todaySales = data.sales.filter((s) => s.date === today()).reduce((s, x) => s + x.total_amount, 0);
  const totalRevenue = data.sales.reduce((s, x) => s + x.total_amount, 0);
  const totalCost = data.products.reduce((s, p) => s + p.purchase_price * (data.purchases.filter(pu => pu.product_id === p.id).reduce((a, b) => a + b.quantity, 0)), 0);
  const totalProfit = totalRevenue - (data.sales.reduce((s, si) => {
    const items = si.sales_items || [];
    return s + items.reduce((a, item) => {
      const prod = data.products.find(p => p.id === item.product_id);
      return a + (prod ? item.quantity * prod.purchase_price : 0);
    }, 0);
  }, 0));

  // Dealer pending
  const dealerBalance = data.dealers.map((d) => {
    const totalPurchase = data.purchases.filter(p => p.dealer_id === d.id).reduce((s, p) => s + p.total_amount, 0);
    const totalPaid = data.payments.filter(p => p.dealer_id === d.id).reduce((s, p) => s + p.amount_paid, 0);
    return { ...d, totalPurchase, totalPaid, balance: totalPurchase - totalPaid };
  }).filter(d => d.balance > 0);

  const totalPending = dealerBalance.reduce((s, d) => s + d.balance, 0);

  const metrics = [
    { label: "Total Stock", value: `${totalStock} units`, color: colors.accent },
    { label: "Today's Sales", value: fmt(todaySales), color: colors.success },
    { label: "Total Profit", value: fmt(Math.max(0, totalProfit)), color: "#06b6d4" },
    { label: "Dealer Pending", value: fmt(totalPending), color: colors.warning },
  ];

  return (
    <div>
      <p style={style.pageTitle}>Dashboard</p>
      <div style={style.grid2}>
        {metrics.map((m) => (
          <div key={m.label} style={{ ...style.metricCard, borderLeft: `3px solid ${m.color}` }}>
            <div style={style.metricLabel}>{m.label}</div>
            <div style={{ ...style.metricVal, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div style={{ ...style.card, borderColor: colors.warning + "55" }}>
          <p style={{ ...style.sectionTitle, color: colors.warning }}>⚠ Stock Alerts</p>
          {outOfStock.map(p => <div key={p.id} style={{ fontSize: 13, color: colors.danger, marginBottom: 4 }}>❌ Out of stock: {p.company_name} {p.model_name}</div>)}
          {lowStock.map(p => <div key={p.id} style={{ fontSize: 13, color: colors.warning, marginBottom: 4 }}>⚡ Low stock ({p.stock_quantity} left): {p.company_name} {p.model_name}</div>)}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={style.card}>
          <p style={style.sectionTitle}>Recent Sales</p>
          {data.sales.slice(-5).reverse().map(s => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${colors.border}22`, fontSize: 13 }}>
              <span>{s.customer_name}</span>
              <span style={{ color: colors.success }}>{fmt(s.total_amount)}</span>
            </div>
          ))}
          {data.sales.length === 0 && <p style={{ fontSize: 13, color: colors.muted }}>No sales yet</p>}
        </div>

        <div style={style.card}>
          <p style={style.sectionTitle}>Dealer Balances</p>
          {dealerBalance.length === 0 && <p style={{ fontSize: 13, color: colors.muted }}>All dealers paid up!</p>}
          {dealerBalance.map(d => (
            <div key={d.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${colors.border}22`, fontSize: 13 }}>
              <span>{d.dealer_name}</span>
              <span style={{ color: colors.warning }}>{fmt(d.balance)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── INVENTORY ────────────────────────────────────────────────────────────────
function Inventory({ data, reload, demoMode }) {
  const [form, setForm] = useState({ company_name: "", model_name: "", purchase_price: "", selling_price: "", stock_quantity: "" });
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("");

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.company_name || !form.model_name || !form.selling_price) { setMsg("Fill all required fields"); return; }
    if (demoMode) { setMsg("Demo mode — connect Supabase to save"); return; }
    try {
      await supabase.from("products").insert({ ...form, purchase_price: +form.purchase_price, selling_price: +form.selling_price, stock_quantity: +form.stock_quantity })._run();
      setForm({ company_name: "", model_name: "", purchase_price: "", selling_price: "", stock_quantity: "" });
      setMsg("Product added!");
      reload();
      setTimeout(() => setMsg(""), 3000);
    } catch (e) { setMsg("Error: " + e.message); }
  };

  const filtered = data.products.filter(p =>
    !filter || p.company_name.toLowerCase().includes(filter.toLowerCase()) || p.model_name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <p style={style.pageTitle}>Inventory Management</p>
      <Alert msg={msg} type={msg.includes("Error") || msg.includes("Demo") ? "danger" : "success"} />

      <div style={style.card}>
        <p style={style.sectionTitle}>Add New Cycle</p>
        <div style={style.formRow}>
          <Input label="Company *" value={form.company_name} onChange={set("company_name")} placeholder="Hero, Avon, BSA..." />
          <Input label="Model Name *" value={form.model_name} onChange={set("model_name")} placeholder="Splendor Plus" />
          <Input label="Purchase Price ₹ *" type="number" value={form.purchase_price} onChange={set("purchase_price")} />
          <Input label="Selling Price ₹ *" type="number" value={form.selling_price} onChange={set("selling_price")} />
          <Input label="Initial Stock Qty" type="number" value={form.stock_quantity} onChange={set("stock_quantity")} />
        </div>
        <button style={style.btn("primary")} onClick={save}>+ Add Product</button>
      </div>

      <div style={style.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={{ ...style.sectionTitle, margin: 0 }}>Stock ({filtered.length})</p>
          <input style={{ ...style.input, width: 200 }} placeholder="Filter by company/model..." value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
        <table style={style.table}>
          <thead><tr>
            {["Company", "Model", "Purchase ₹", "Selling ₹", "Stock", "Margin", "Status"].map(h => <th key={h} style={style.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map(p => {
              const margin = ((p.selling_price - p.purchase_price) / p.purchase_price * 100).toFixed(1);
              const status = p.stock_quantity === 0 ? "Out" : p.stock_quantity <= 3 ? "Low" : "OK";
              const statusColor = status === "Out" ? colors.danger : status === "Low" ? colors.warning : colors.success;
              return (
                <tr key={p.id}>
                  <td style={style.td}>{p.company_name}</td>
                  <td style={style.td}>{p.model_name}</td>
                  <td style={style.td}>{fmt(p.purchase_price)}</td>
                  <td style={style.td}>{fmt(p.selling_price)}</td>
                  <td style={style.td}><strong style={{ color: p.stock_quantity <= 3 ? colors.warning : colors.text }}>{p.stock_quantity}</strong></td>
                  <td style={style.td}><span style={style.badge(colors.success)}>{margin}%</span></td>
                  <td style={style.td}><span style={style.badge(statusColor)}>{status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SALES / INVOICE ─────────────────────────────────────────────────────────
function Sales({ data, reload, demoMode }) {
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [items, setItems] = useState([{ product_id: "", qty: 1 }]);
  const [msg, setMsg] = useState("");
  const [invoice, setInvoice] = useState(null);

  const addItem = () => setItems(i => [...i, { product_id: "", qty: 1 }]);
  const updateItem = (i, k, v) => setItems(items => items.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  const total = items.reduce((s, it) => {
    const p = data.products.find(x => x.id === +it.product_id);
    return s + (p ? p.selling_price * it.qty : 0);
  }, 0);

  const createSale = async () => {
    if (!customer.name) { setMsg("Enter customer name"); return; }
    if (!items[0].product_id) { setMsg("Select at least one product"); return; }
    if (demoMode) { setMsg("Demo mode — connect Supabase to save"); return; }
    try {
      const [sale] = await supabase.from("sales").insert({ customer_name: customer.name, phone: customer.phone, total_amount: total, date: today() })._run();
      for (const it of items) {
        if (!it.product_id) continue;
        const p = data.products.find(x => x.id === +it.product_id);
        await supabase.from("sales_items").insert({ sale_id: sale.id, product_id: +it.product_id, quantity: it.qty, price: p.selling_price })._run();
        await supabase.from("products").update({ stock_quantity: p.stock_quantity - it.qty }).eq("id", p.id)._run();
      }
      setInvoice({ ...sale, customer_name: customer.name, phone: customer.phone, items });
      setCustomer({ name: "", phone: "" });
      setItems([{ product_id: "", qty: 1 }]);
      reload();
    } catch (e) { setMsg("Error: " + e.message); }
  };

  return (
    <div>
      <p style={style.pageTitle}>Sales & Invoice</p>
      <Alert msg={msg} type={msg.includes("Error") || msg.includes("Demo") ? "danger" : "success"} />

      {invoice && (
        <div style={{ ...style.card, borderColor: colors.success + "66" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ ...style.sectionTitle, color: colors.success, margin: 0 }}>✓ Invoice Created</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={style.btn("success")} onClick={() => window.print()}>🖨 Print</button>
              <button style={style.btn("ghost")} onClick={() => setInvoice(null)}>Close</button>
            </div>
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 12, color: colors.muted }}>
            <p style={{ color: colors.text, fontWeight: 600, margin: "0 0 6px" }}>INVOICE — {today()}</p>
            <p style={{ margin: "2px 0" }}>Customer: {invoice.customer_name} | Ph: {invoice.phone}</p>
            {invoice.items.map((it, i) => {
              const p = data.products.find(x => x.id === +it.product_id);
              return p ? <p key={i} style={{ margin: "2px 0" }}>  {p.model_name} × {it.qty} = {fmt(p.selling_price * it.qty)}</p> : null;
            })}
            <p style={{ fontWeight: 700, color: colors.text, marginTop: 8 }}>TOTAL: {fmt(total)}</p>
          </div>
        </div>
      )}

      <div style={style.card}>
        <p style={style.sectionTitle}>New Invoice</p>
        <div style={style.formRow}>
          <Input label="Customer Name *" value={customer.name} onChange={v => setCustomer(c => ({ ...c, name: v }))} />
          <Input label="Phone Number" value={customer.phone} onChange={v => setCustomer(c => ({ ...c, phone: v }))} />
        </div>
        <p style={{ ...style.label, marginBottom: 8 }}>Items</p>
        {items.map((it, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px auto", gap: 8, marginBottom: 8 }}>
            <Select value={it.product_id} onChange={v => updateItem(i, "product_id", v)}
              options={data.products.filter(p => p.stock_quantity > 0).map(p => ({ value: p.id, label: `${p.company_name} ${p.model_name} — ${fmt(p.selling_price)}` }))} />
            <input style={style.input} type="number" min="1" value={it.qty} onChange={e => updateItem(i, "qty", +e.target.value)} />
            <button style={{ ...style.btn("ghost"), padding: "8px 10px" }} onClick={() => setItems(items.filter((_, idx) => idx !== i))}>✕</button>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <button style={style.btn("ghost")} onClick={addItem}>+ Add Item</button>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <strong style={{ fontSize: 16 }}>Total: {fmt(total)}</strong>
            <button style={style.btn("primary")} onClick={createSale}>Create Invoice</button>
          </div>
        </div>
      </div>

      <div style={style.card}>
        <p style={style.sectionTitle}>Sales History</p>
        <table style={style.table}>
          <thead><tr>{["Date", "Customer", "Phone", "Amount"].map(h => <th key={h} style={style.th}>{h}</th>)}</tr></thead>
          <tbody>
            {data.sales.slice().reverse().map(s => (
              <tr key={s.id}>
                <td style={style.td}>{s.date}</td>
                <td style={style.td}>{s.customer_name}</td>
                <td style={style.td}>{s.phone || "—"}</td>
                <td style={style.td}><span style={{ color: colors.success, fontWeight: 600 }}>{fmt(s.total_amount)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── DEALERS ─────────────────────────────────────────────────────────────────
function Dealers({ data, reload, demoMode }) {
  const [form, setForm] = useState({ dealer_name: "", phone: "", upi_id: "", bank_details: "" });
  const [purchase, setPurchase] = useState({ dealer_id: "", product_id: "", quantity: "", total_amount: "" });
  const [msg, setMsg] = useState("");

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  const setP = (k) => (v) => {
    const next = { ...purchase, [k]: v };
    if (k === "product_id" || k === "quantity") {
      const p = data.products.find(x => x.id === +next.product_id);
      if (p && next.quantity) next.total_amount = p.purchase_price * next.quantity;
    }
    setPurchase(next);
  };

  const saveDealer = async () => {
    if (!form.dealer_name) { setMsg("Dealer name required"); return; }
    if (demoMode) { setMsg("Demo mode — connect Supabase to save"); return; }
    try {
      await supabase.from("dealers").insert(form)._run();
      setForm({ dealer_name: "", phone: "", upi_id: "", bank_details: "" });
      setMsg("Dealer added!"); reload(); setTimeout(() => setMsg(""), 3000);
    } catch (e) { setMsg("Error: " + e.message); }
  };

  const savePurchase = async () => {
    if (!purchase.dealer_id || !purchase.product_id || !purchase.quantity) { setMsg("Fill all purchase fields"); return; }
    if (demoMode) { setMsg("Demo mode — connect Supabase to save"); return; }
    try {
      const p = data.products.find(x => x.id === +purchase.product_id);
      await supabase.from("purchases").insert({ ...purchase, dealer_id: +purchase.dealer_id, product_id: +purchase.product_id, quantity: +purchase.quantity, total_amount: +purchase.total_amount, date: today() })._run();
      await supabase.from("products").update({ stock_quantity: p.stock_quantity + +purchase.quantity }).eq("id", p.id)._run();
      setPurchase({ dealer_id: "", product_id: "", quantity: "", total_amount: "" });
      setMsg("Purchase recorded & stock updated!"); reload(); setTimeout(() => setMsg(""), 3000);
    } catch (e) { setMsg("Error: " + e.message); }
  };

  return (
    <div>
      <p style={style.pageTitle}>Dealer Management</p>
      <Alert msg={msg} type={msg.includes("Error") || msg.includes("Demo") ? "danger" : "success"} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={style.card}>
          <p style={style.sectionTitle}>Add Dealer</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Input label="Dealer Name *" value={form.dealer_name} onChange={set("dealer_name")} />
            <Input label="Phone" value={form.phone} onChange={set("phone")} />
            <Input label="UPI ID" value={form.upi_id} onChange={set("upi_id")} placeholder="dealer@upi" />
            <Input label="Bank Details" value={form.bank_details} onChange={set("bank_details")} placeholder="Bank name, account..." />
          </div>
          <button style={{ ...style.btn("primary"), marginTop: 12 }} onClick={saveDealer}>Add Dealer</button>
        </div>

        <div style={style.card}>
          <p style={style.sectionTitle}>Record Purchase</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Select label="Dealer *" value={purchase.dealer_id} onChange={setP("dealer_id")} options={data.dealers.map(d => ({ value: d.id, label: d.dealer_name }))} />
            <Select label="Product *" value={purchase.product_id} onChange={setP("product_id")} options={data.products.map(p => ({ value: p.id, label: `${p.company_name} ${p.model_name}` }))} />
            <Input label="Quantity *" type="number" value={purchase.quantity} onChange={setP("quantity")} />
            <Input label="Total Amount ₹" type="number" value={purchase.total_amount} onChange={setP("total_amount")} />
          </div>
          <button style={{ ...style.btn("success"), marginTop: 12 }} onClick={savePurchase}>Record Purchase + Update Stock</button>
        </div>
      </div>

      <div style={style.card}>
        <p style={style.sectionTitle}>Dealer List</p>
        <table style={style.table}>
          <thead><tr>{["Dealer", "Phone", "UPI ID", "Bank", "Total Purchased"].map(h => <th key={h} style={style.th}>{h}</th>)}</tr></thead>
          <tbody>
            {data.dealers.map(d => {
              const total = data.purchases.filter(p => p.dealer_id === d.id).reduce((s, p) => s + p.total_amount, 0);
              return (
                <tr key={d.id}>
                  <td style={style.td}><strong>{d.dealer_name}</strong></td>
                  <td style={style.td}>{d.phone || "—"}</td>
                  <td style={style.td}><span style={{ color: colors.accent }}>{d.upi_id || "—"}</span></td>
                  <td style={style.td}>{d.bank_details || "—"}</td>
                  <td style={style.td}>{fmt(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
function Payments({ data, reload, demoMode }) {
  const [form, setForm] = useState({ dealer_id: "", amount: "", method: "UPI" });
  const [msg, setMsg] = useState("");

  const dealerBalances = data.dealers.map((d) => {
    const totalPurchase = data.purchases.filter(p => p.dealer_id === d.id).reduce((s, p) => s + p.total_amount, 0);
    const totalPaid = data.payments.filter(p => p.dealer_id === d.id).reduce((s, p) => s + p.amount_paid, 0);
    return { ...d, totalPurchase, totalPaid, balance: totalPurchase - totalPaid };
  });

  const openUPI = (dealer, amount) => {
    if (!dealer.upi_id) { alert("No UPI ID for this dealer"); return; }
    const amt = amount || prompt("Enter amount to pay:");
    if (!amt) return;
    const upiLink = `upi://pay?pa=${dealer.upi_id}&pn=${encodeURIComponent(dealer.dealer_name)}&am=${amt}&cu=INR&tn=CycleShopPayment`;
    window.open(upiLink, "_blank");
  };

  const markPaid = async () => {
    if (!form.dealer_id || !form.amount) { setMsg("Select dealer and enter amount"); return; }
    if (demoMode) { setMsg("Demo mode — connect Supabase to save"); return; }
    try {
      await supabase.from("payments").insert({ dealer_id: +form.dealer_id, amount_paid: +form.amount, payment_method: form.method, date: today() })._run();
      setForm({ dealer_id: "", amount: "", method: "UPI" });
      setMsg("Payment recorded!"); reload(); setTimeout(() => setMsg(""), 3000);
    } catch (e) { setMsg("Error: " + e.message); }
  };

  return (
    <div>
      <p style={style.pageTitle}>Payment & Balance Tracking</p>
      <Alert msg={msg} type={msg.includes("Error") || msg.includes("Demo") ? "danger" : "success"} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 14 }}>
        <div style={style.card}>
          <p style={style.sectionTitle}>Record Payment</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Select label="Dealer *" value={form.dealer_id} onChange={v => setForm(f => ({ ...f, dealer_id: v }))} options={data.dealers.map(d => ({ value: d.id, label: d.dealer_name }))} />
            <Input label="Amount ₹ *" type="number" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} />
            <Select label="Payment Method" value={form.method} onChange={v => setForm(f => ({ ...f, method: v }))}
              options={[{ value: "UPI", label: "UPI (Google Pay / PhonePe)" }, { value: "Bank Transfer", label: "Bank Transfer" }, { value: "Cash", label: "Cash" }]} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {form.dealer_id && (
              <button style={style.btn("ghost")} onClick={() => {
                const d = data.dealers.find(x => x.id === +form.dealer_id);
                if (d) openUPI(d, form.amount);
              }}>📲 Open UPI</button>
            )}
            <button style={style.btn("success")} onClick={markPaid}>✓ Mark as Paid</button>
          </div>
        </div>

        <div style={style.card}>
          <p style={style.sectionTitle}>Dealer Balance Summary</p>
          <table style={style.table}>
            <thead><tr>{["Dealer", "Total Due", "Paid", "Balance", "Pay"].map(h => <th key={h} style={style.th}>{h}</th>)}</tr></thead>
            <tbody>
              {dealerBalances.map(d => (
                <tr key={d.id}>
                  <td style={style.td}><strong>{d.dealer_name}</strong></td>
                  <td style={style.td}>{fmt(d.totalPurchase)}</td>
                  <td style={style.td}><span style={{ color: colors.success }}>{fmt(d.totalPaid)}</span></td>
                  <td style={style.td}>
                    <span style={{ color: d.balance > 0 ? colors.warning : colors.success, fontWeight: 700 }}>
                      {fmt(d.balance)}
                    </span>
                  </td>
                  <td style={style.td}>
                    {d.balance > 0 && (
                      <button style={{ ...style.btn("primary"), padding: "4px 10px", fontSize: 12 }} onClick={() => openUPI(d, d.balance)}>
                        📲 Pay
                      </button>
                    )}
                    {d.balance <= 0 && <span style={style.badge(colors.success)}>Paid</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={style.card}>
        <p style={style.sectionTitle}>Payment History</p>
        <table style={style.table}>
          <thead><tr>{["Date", "Dealer", "Amount", "Method"].map(h => <th key={h} style={style.th}>{h}</th>)}</tr></thead>
          <tbody>
            {data.payments.slice().reverse().map(p => {
              const dealer = data.dealers.find(d => d.id === p.dealer_id);
              return (
                <tr key={p.id}>
                  <td style={style.td}>{p.date}</td>
                  <td style={style.td}>{dealer?.dealer_name || "—"}</td>
                  <td style={style.td}><span style={{ color: colors.success, fontWeight: 600 }}>{fmt(p.amount_paid)}</span></td>
                  <td style={style.td}><span style={style.badge(colors.accent)}>{p.payment_method}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
function Reports({ data }) {
  const [range, setRange] = useState("month");

  const now = new Date();
  const filtered = data.sales.filter(s => {
    const d = new Date(s.date);
    if (range === "today") return s.date === today();
    if (range === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  });

  const totalSales = filtered.reduce((s, x) => s + x.total_amount, 0);
  const salesCount = filtered.length;

  const companyStats = {};
  data.products.forEach(p => {
    if (!companyStats[p.company_name]) companyStats[p.company_name] = { stock: 0, models: 0 };
    companyStats[p.company_name].stock += p.stock_quantity;
    companyStats[p.company_name].models += 1;
  });

  return (
    <div>
      <p style={style.pageTitle}>Reports</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["today", "month", "all"].map(r => (
          <button key={r} style={{ ...style.btn(range === r ? "primary" : "ghost") }} onClick={() => setRange(r)}>
            {r === "today" ? "Today" : r === "month" ? "This Month" : "All Time"}
          </button>
        ))}
      </div>

      <div style={style.grid3}>
        {[
          { label: "Sales Count", value: salesCount, color: colors.accent },
          { label: "Total Revenue", value: fmt(totalSales), color: colors.success },
          { label: "Total Stock Units", value: data.products.reduce((s, p) => s + p.stock_quantity, 0), color: "#06b6d4" },
          { label: "Products Listed", value: data.products.length, color: colors.muted },
        ].map(m => (
          <div key={m.label} style={{ ...style.metricCard, borderLeft: `3px solid ${m.color}` }}>
            <div style={style.metricLabel}>{m.label}</div>
            <div style={{ ...style.metricVal, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={style.card}>
          <p style={style.sectionTitle}>Stock by Company</p>
          <table style={style.table}>
            <thead><tr>{["Company", "Models", "Total Stock"].map(h => <th key={h} style={style.th}>{h}</th>)}</tr></thead>
            <tbody>
              {Object.entries(companyStats).map(([company, stats]) => (
                <tr key={company}>
                  <td style={style.td}><strong>{company}</strong></td>
                  <td style={style.td}>{stats.models}</td>
                  <td style={style.td}>{stats.stock} units</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={style.card}>
          <p style={style.sectionTitle}>Sales Detail ({range})</p>
          <table style={style.table}>
            <thead><tr>{["Date", "Customer", "Amount"].map(h => <th key={h} style={style.th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.slice().reverse().map(s => (
                <tr key={s.id}>
                  <td style={style.td}>{s.date}</td>
                  <td style={style.td}>{s.customer_name}</td>
                  <td style={style.td}><span style={{ color: colors.success }}>{fmt(s.total_amount)}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={3} style={{ ...style.td, color: colors.muted }}>No sales in this period</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "◈" },
  { id: "inventory", label: "Inventory", icon: "▦" },
  { id: "sales", label: "Sales & Invoice", icon: "◎" },
  { id: "dealers", label: "Dealers", icon: "◷" },
  { id: "payments", label: "Payments", icon: "₹" },
  { id: "reports", label: "Reports", icon: "◻" },
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [demoMode, setDemoMode] = useState(true);
  const [showSetup, setShowSetup] = useState(true);
  const { data, loading, reload } = useData(demoMode);

  return (
    <div style={style.app}>
      <nav style={style.sidebar}>
        <div style={style.sideHeader}>
          <div style={{ width: 32, height: 32, background: colors.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 10 }}>🚲</div>
          <p style={style.sideTitle}>CycleShop Pro</p>
          <p style={style.sideSub}>Management System</p>
        </div>
        <div style={{ padding: "10px 0", flex: 1 }}>
          {NAV.map(n => (
            <div key={n.id} style={style.navItem(page === n.id)} onClick={() => setPage(n.id)}>
              <span style={{ fontSize: 14 }}>{n.icon}</span>
              <span>{n.label}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${colors.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: colors.muted }}>Demo Mode</span>
            <div style={{ width: 32, height: 16, background: demoMode ? colors.accent : colors.border, borderRadius: 8, cursor: "pointer", position: "relative", transition: "background 0.2s" }}
              onClick={() => setDemoMode(d => !d)}>
              <div style={{ width: 12, height: 12, background: "#fff", borderRadius: "50%", position: "absolute", top: 2, left: demoMode ? 18 : 2, transition: "left 0.2s" }} />
            </div>
          </div>
          <p style={{ fontSize: 10, color: colors.muted, margin: "4px 0 0" }}>
            {demoMode ? "Using sample data" : "Live Supabase"}
          </p>
        </div>
      </nav>

      <main style={style.main}>
        {showSetup && demoMode && <SetupNotice onDismiss={() => setShowSetup(false)} />}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: colors.muted }}>Loading...</div>
        ) : (
          <>
            {page === "dashboard" && <Dashboard data={data} />}
            {page === "inventory" && <Inventory data={data} reload={reload} demoMode={demoMode} />}
            {page === "sales" && <Sales data={data} reload={reload} demoMode={demoMode} />}
            {page === "dealers" && <Dealers data={data} reload={reload} demoMode={demoMode} />}
            {page === "payments" && <Payments data={data} reload={reload} demoMode={demoMode} />}
            {page === "reports" && <Reports data={data} />}
          </>
        )}
      </main>
    </div>
  );
}
