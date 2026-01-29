-- ===============================
-- ADD QUOTATION STATUS ENUM
-- ===============================
CREATE TYPE public.quotation_status AS ENUM ('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired');

-- ===============================
-- QUOTATIONS TABLE
-- ===============================
CREATE TABLE public.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_number TEXT UNIQUE NOT NULL,
    buyer_id UUID REFERENCES public.buyers(id) NOT NULL,
    quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL,
    reference_no TEXT,
    status quotation_status DEFAULT 'Draft',
    subtotal NUMERIC(12,2) DEFAULT 0,
    cgst_amount NUMERIC(12,2) DEFAULT 0,
    sgst_amount NUMERIC(12,2) DEFAULT 0,
    igst_amount NUMERIC(12,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) DEFAULT 0,
    round_off NUMERIC(12,2) DEFAULT 0,
    grand_total NUMERIC(12,2) DEFAULT 0,
    notes TEXT,
    terms_conditions TEXT,
    is_gst_quotation BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ===============================
-- QUOTATION ITEMS TABLE
-- ===============================
CREATE TABLE public.quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE NOT NULL,
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
-- Enable RLS on quotation tables
-- ===============================
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

-- ===============================
-- RLS POLICIES FOR QUOTATIONS
-- ===============================
CREATE POLICY "Authenticated users can view quotations"
ON public.quotations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert quotations"
ON public.quotations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update quotations"
ON public.quotations FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete quotations"
ON public.quotations FOR DELETE
TO authenticated
USING (true);

-- ===============================
-- RLS POLICIES FOR QUOTATION ITEMS
-- ===============================
CREATE POLICY "Authenticated users can view quotation items"
ON public.quotation_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert quotation items"
ON public.quotation_items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update quotation items"
ON public.quotation_items FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete quotation items"
ON public.quotation_items FOR DELETE
TO authenticated
USING (true);

-- ===============================
-- TRIGGER FOR UPDATED_AT ON QUOTATIONS
-- ===============================
CREATE TRIGGER update_quotations_updated_at
BEFORE UPDATE ON public.quotations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===============================
-- SEQUENCE FOR QUOTATION NUMBERS
-- ===============================
CREATE SEQUENCE IF NOT EXISTS quotation_seq START 1;
