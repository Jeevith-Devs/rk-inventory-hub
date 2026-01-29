-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT UNIQUE NOT NULL,
  vendor_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
  po_date DATE NOT NULL,
  revision_no TEXT DEFAULT 'R1',
  quotation_ref TEXT,
  payment_term TEXT,
  transportation TEXT,
  delivery_term TEXT,
  
  -- Financial fields
  subtotal DECIMAL(15, 2),
  cgst_amount DECIMAL(15, 2),
  sgst_amount DECIMAL(15, 2),
  igst_amount DECIMAL(15, 2),
  total_amount DECIMAL(15, 2),
  round_off DECIMAL(10, 2),
  grand_total DECIMAL(15, 2),
  
  -- Additional fields
  notes TEXT,
  terms_conditions TEXT,
  is_gst_po BOOLEAN DEFAULT true,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_order_items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  
  order_quantity DECIMAL(15, 3) NOT NULL,
  unit_rate DECIMAL(15, 2) NOT NULL,
  total_basic DECIMAL(15, 2) NOT NULL,
  
  tax_percent DECIMAL(5, 2),
  sgst_amount DECIMAL(15, 2),
  cgst_amount DECIMAL(15, 2),
  igst_amount DECIMAL(15, 2),
  
  order_value DECIMAL(15, 2) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(po_date);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po ON purchase_order_items(po_id);

-- Enable RLS
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON purchase_orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON purchase_orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON purchase_orders
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON purchase_orders
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON purchase_order_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON purchase_order_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON purchase_order_items
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON purchase_order_items
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_purchase_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_orders_updated_at();
