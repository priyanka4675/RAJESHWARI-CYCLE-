-- ============================================================
-- RAJESHWARI CYCLES - SUPABASE SQL SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================================

-- PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  model_name TEXT NOT NULL,
  purchase_price NUMERIC(10,2) NOT NULL,
  selling_price NUMERIC(10,2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_alert INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEALERS TABLE
CREATE TABLE IF NOT EXISTS dealers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  upi_id TEXT,
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PURCHASES TABLE (buying from dealers)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID REFERENCES dealers(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  purchase_price NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEALER PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS dealer_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  amount_paid NUMERIC(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'UPI',
  transaction_ref TEXT,
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SALES TABLE
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  total_amount NUMERIC(10,2) NOT NULL,
  discount NUMERIC(10,2) DEFAULT 0,
  payment_method TEXT DEFAULT 'Cash',
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SALE ITEMS TABLE
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  selling_price NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Function: reduce stock when sale item is inserted
CREATE OR REPLACE FUNCTION reduce_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reduce_stock_on_sale
AFTER INSERT ON sale_items
FOR EACH ROW EXECUTE FUNCTION reduce_stock_on_sale();

-- Function: increase stock when purchase is inserted
CREATE OR REPLACE FUNCTION increase_stock_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity + NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increase_stock_on_purchase
AFTER INSERT ON purchases
FOR EACH ROW EXECUTE FUNCTION increase_stock_on_purchase();

-- ============================================================
-- VIEWS
-- ============================================================

-- Dealer balance view
CREATE OR REPLACE VIEW dealer_balances AS
SELECT
  d.id AS dealer_id,
  d.dealer_name,
  d.phone,
  d.upi_id,
  COALESCE(SUM(p.total_amount), 0) AS total_purchased,
  COALESCE(SUM(dp.amount_paid), 0) AS total_paid,
  COALESCE(SUM(p.total_amount), 0) - COALESCE(SUM(dp.amount_paid), 0) AS balance_due
FROM dealers d
LEFT JOIN purchases p ON d.id = p.dealer_id
LEFT JOIN dealer_payments dp ON d.id = dp.dealer_id
GROUP BY d.id, d.dealer_name, d.phone, d.upi_id;

-- ============================================================
-- SAMPLE DATA (Optional - remove if not needed)
-- ============================================================

INSERT INTO dealers (dealer_name, phone, upi_id) VALUES
  ('ABC Cycles Wholesale', '9876543210', 'abccycles@upi'),
  ('Hero Distributors', '9876543211', 'herodist@upi'),
  ('Avon Motors', '9876543212', 'avonmotors@upi');

INSERT INTO products (company_name, model_name, purchase_price, selling_price, stock_quantity) VALUES
  ('Hero', 'Ranger', 3500, 4500, 10),
  ('Hero', 'Sprint', 4000, 5200, 8),
  ('Avon', 'Speedster', 3200, 4200, 5),
  ('Avon', 'Comfort', 2800, 3800, 12),
  ('BSA', 'Champ', 3600, 4800, 3);
