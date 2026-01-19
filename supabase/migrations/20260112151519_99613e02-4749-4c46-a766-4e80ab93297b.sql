-- Drop existing types if they exist
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.product_status CASCADE;
DROP TYPE IF EXISTS public.unit_type CASCADE;
DROP TYPE IF EXISTS public.payment_mode CASCADE;
DROP TYPE IF EXISTS public.transport_mode CASCADE;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.sale_items CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.purchase_items CASCADE;
DROP TABLE IF EXISTS public.purchases CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.buyers CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.company_settings CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

-- Create enum for product status
CREATE TYPE public.product_status AS ENUM ('active', 'inactive');

-- Create enum for unit types
CREATE TYPE public.unit_type AS ENUM ('PCS', 'BOX', 'KG', 'MTR', 'LTR', 'SET', 'PAIR');

-- Create enum for payment modes
CREATE TYPE public.payment_mode AS ENUM ('Cash', 'UPI', 'NEFT', 'Credit', 'Cheque');

-- Create enum for transport modes
CREATE TYPE public.transport_mode AS ENUM ('Road', 'Courier', 'Pickup', 'Rail', 'Air');

-- ===============================
-- PROFILES TABLE
-- ===============================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ===============================
-- USER ROLES TABLE (SECURITY)
-- ===============================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- ===============================
-- COMPANY SETTINGS TABLE
-- ===============================
CREATE TABLE public.company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL DEFAULT 'RK ENTERPRISES',
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    phone TEXT,
    email TEXT,
    gst_no TEXT,
    pan_no TEXT,
    bank_name TEXT,
    bank_account_no TEXT,
    bank_ifsc TEXT,
    bank_branch TEXT,
    logo_url TEXT,
    terms_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ===============================
-- SUPPLIERS TABLE
-- ===============================
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_code TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    contact_person TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    phone TEXT,
    email TEXT,
    gst_no TEXT,
    pan_no TEXT,
    bank_name TEXT,
    bank_account_no TEXT,
    bank_ifsc TEXT,
    bank_branch TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ===============================
-- BUYERS TABLE
-- ===============================
CREATE TABLE public.buyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_code TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    contact_person TEXT,
    billing_address TEXT,
    delivery_address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    phone TEXT,
    email TEXT,
    gst_no TEXT,
    payment_terms TEXT,
    credit_limit NUMERIC(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ===============================
-- CATEGORIES TABLE
-- ===============================
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ===============================
-- PRODUCTS TABLE
-- ===============================
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories(id),
    hsn_code TEXT,
    unit unit_type DEFAULT 'PCS',
    purchase_price NUMERIC(12,2) DEFAULT 0,
    selling_price NUMERIC(12,2) DEFAULT 0,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    tax_percent NUMERIC(5,2) DEFAULT 18,
    current_stock NUMERIC(12,2) DEFAULT 0,
    reorder_level NUMERIC(12,2) DEFAULT 10,
    default_supplier_id UUID REFERENCES public.suppliers(id),
    status product_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ===============================
-- STOCK IN (PURCHASES) TABLE
-- ===============================
CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_number TEXT UNIQUE NOT NULL,
    supplier_id UUID REFERENCES public.suppliers(id) NOT NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    invoice_number TEXT,
    invoice_date DATE,
    subtotal NUMERIC(12,2) DEFAULT 0,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) DEFAULT 0,
    notes TEXT,
    bill_image_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ===============================
-- PURCHASE ITEMS TABLE
-- ===============================
CREATE TABLE public.purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    quantity NUMERIC(12,2) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    tax_percent NUMERIC(5,2) DEFAULT 0,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ===============================
-- SALES (STOCK OUT) TABLE
-- ===============================
CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    buyer_id UUID REFERENCES public.buyers(id) NOT NULL,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    dispatch_date DATE,
    vehicle_no TEXT,
    lr_no TEXT,
    purchase_order_no TEXT,
    purchase_order_date DATE,
    transport_mode transport_mode DEFAULT 'Road',
    transport_charges NUMERIC(12,2) DEFAULT 0,
    payment_mode payment_mode DEFAULT 'Credit',
    subtotal NUMERIC(12,2) DEFAULT 0,
    cgst_amount NUMERIC(12,2) DEFAULT 0,
    sgst_amount NUMERIC(12,2) DEFAULT 0,
    igst_amount NUMERIC(12,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) DEFAULT 0,
    round_off NUMERIC(12,2) DEFAULT 0,
    grand_total NUMERIC(12,2) DEFAULT 0,
    notes TEXT,
    is_gst_invoice BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ===============================
-- SALE ITEMS TABLE
-- ===============================
CREATE TABLE public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    quantity NUMERIC(12,2) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    tax_percent NUMERIC(5,2) DEFAULT 0,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ===============================
-- AUDIT LOGS TABLE
-- ===============================
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ===============================
-- SEQUENCE FOR INVOICE NUMBERS
-- ===============================
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1001;
CREATE SEQUENCE IF NOT EXISTS purchase_seq START 1001;

-- ===============================
-- ENABLE RLS ON ALL TABLES
-- ===============================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ===============================
-- SECURITY DEFINER FUNCTION FOR ROLE CHECK
-- ===============================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Helper function to check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT auth.uid() IS NOT NULL
$$;

-- ===============================
-- RLS POLICIES
-- ===============================

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- User roles policies (only admins can manage)
CREATE POLICY "Authenticated users can view roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Company settings policies
CREATE POLICY "Authenticated users can view company settings"
ON public.company_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can update company settings"
ON public.company_settings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert company settings"
ON public.company_settings FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Suppliers policies
CREATE POLICY "Authenticated users can view suppliers"
ON public.suppliers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert suppliers"
ON public.suppliers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update suppliers"
ON public.suppliers FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete suppliers"
ON public.suppliers FOR DELETE
TO authenticated
USING (true);

-- Buyers policies
CREATE POLICY "Authenticated users can view buyers"
ON public.buyers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert buyers"
ON public.buyers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update buyers"
ON public.buyers FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete buyers"
ON public.buyers FOR DELETE
TO authenticated
USING (true);

-- Categories policies
CREATE POLICY "Authenticated users can view categories"
ON public.categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert categories"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
ON public.categories FOR DELETE
TO authenticated
USING (true);

-- Products policies
CREATE POLICY "Authenticated users can view products"
ON public.products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
ON public.products FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete products"
ON public.products FOR DELETE
TO authenticated
USING (true);

-- Purchases policies
CREATE POLICY "Authenticated users can view purchases"
ON public.purchases FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert purchases"
ON public.purchases FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update purchases"
ON public.purchases FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete purchases"
ON public.purchases FOR DELETE
TO authenticated
USING (true);

-- Purchase items policies
CREATE POLICY "Authenticated users can view purchase items"
ON public.purchase_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert purchase items"
ON public.purchase_items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update purchase items"
ON public.purchase_items FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete purchase items"
ON public.purchase_items FOR DELETE
TO authenticated
USING (true);

-- Sales policies
CREATE POLICY "Authenticated users can view sales"
ON public.sales FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert sales"
ON public.sales FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update sales"
ON public.sales FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete sales"
ON public.sales FOR DELETE
TO authenticated
USING (true);

-- Sale items policies
CREATE POLICY "Authenticated users can view sale items"
ON public.sale_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert sale items"
ON public.sale_items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update sale items"
ON public.sale_items FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete sale items"
ON public.sale_items FOR DELETE
TO authenticated
USING (true);

-- Audit logs policies
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- ===============================
-- TRIGGER FOR UPDATED_AT
-- ===============================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_buyers_updated_at
BEFORE UPDATE ON public.buyers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at
BEFORE UPDATE ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===============================
-- TRIGGER FOR AUTO PROFILE CREATION
-- ===============================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email
    );
    
    -- First user becomes admin
    IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'admin');
    ELSE
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'staff');
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===============================
-- FUNCTION TO UPDATE STOCK ON PURCHASE
-- ===============================
CREATE OR REPLACE FUNCTION public.update_stock_on_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.products
    SET current_stock = current_stock + NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER after_purchase_item_insert
AFTER INSERT ON public.purchase_items
FOR EACH ROW EXECUTE FUNCTION public.update_stock_on_purchase();

-- ===============================
-- FUNCTION TO UPDATE STOCK ON SALE
-- ===============================
CREATE OR REPLACE FUNCTION public.update_stock_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.products
    SET current_stock = current_stock - NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER after_sale_item_insert
AFTER INSERT ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION public.update_stock_on_sale();

-- ===============================
-- INSERT DEFAULT COMPANY SETTINGS
-- ===============================
INSERT INTO public.company_settings (
    company_name,
    address,
    city,
    state,
    pincode,
    phone,
    email,
    terms_conditions
) VALUES (
    'RK ENTERPRISES',
    'Industrial Area, Sector 5',
    'New Delhi',
    'Delhi',
    '110001',
    '+91 9876543210',
    'info@rkenterprises.com',
    '1. Goods once sold will not be taken back.\n2. All disputes subject to local jurisdiction.\n3. E. & O.E.'
);

-- ===============================
-- INSERT SAMPLE CATEGORIES
-- ===============================
INSERT INTO public.categories (name, description) VALUES
('Electronics', 'Electronic components and devices'),
('Hardware', 'Hardware tools and equipment'),
('Consumables', 'Daily use consumable items'),
('Accessories', 'Various accessories'),
('Packaging', 'Packaging materials');