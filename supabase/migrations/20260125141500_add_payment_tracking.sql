-- Add payment tracking to sales and purchases
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE public.payment_status AS ENUM ('Unpaid', 'Partial', 'Paid', 'Overdue');
    END IF;
END $$;

-- Update sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS payment_status payment_status DEFAULT 'Unpaid',
ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- Update purchases table
ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS payment_status payment_status DEFAULT 'Unpaid',
ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- Update existing records to have a due date if missing (default 30 days)
UPDATE public.sales SET due_date = sale_date + INTERVAL '30 days' WHERE due_date IS NULL;
UPDATE public.purchases SET due_date = purchase_date + INTERVAL '30 days' WHERE due_date IS NULL;
