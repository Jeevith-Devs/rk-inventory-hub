-- Enable Row Level Security (RLS) on all tables (if not already enabled)
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (optional, but cleaner)
DROP POLICY IF EXISTS "Allow public access" ON sales;
DROP POLICY IF EXISTS "Allow public access" ON sale_items;
DROP POLICY IF EXISTS "Allow public access" ON buyers;
DROP POLICY IF EXISTS "Allow public access" ON products;
DROP POLICY IF EXISTS "Allow public access" ON suppliers;
DROP POLICY IF EXISTS "Allow public access" ON purchases;
DROP POLICY IF EXISTS "Allow public access" ON purchase_items;
DROP POLICY IF EXISTS "Allow public access" ON quotations;
DROP POLICY IF EXISTS "Allow public access" ON quotation_items;
DROP POLICY IF EXISTS "Allow public access" ON company_settings;
DROP POLICY IF EXISTS "Allow public access" ON profiles;
DROP POLICY IF EXISTS "Allow public access" ON user_roles;
DROP POLICY IF EXISTS "Allow public access" ON audit_logs;
DROP POLICY IF EXISTS "Allow public access" ON categories;

-- Create policies to allow ALL operations (SELECT, INSERT, UPDATE, DELETE) for everyone (anon and authenticated)
CREATE POLICY "Allow public access" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON sale_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON buyers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON purchases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON purchase_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON quotations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON quotation_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON company_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON user_roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON categories FOR ALL USING (true) WITH CHECK (true);
