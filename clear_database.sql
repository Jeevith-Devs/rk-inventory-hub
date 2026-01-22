-- =====================================================
-- Clear All Business Data (Keep Auth Data Intact)
-- =====================================================
-- This script will delete ALL business data from your database
-- but will preserve user authentication data.
-- 
-- IMPORTANT: This action CANNOT be undone!
-- Make sure you want to clear all data before running this.
-- =====================================================

-- Delete in order to respect foreign key constraints

-- Step 1: Delete sales and purchase related data (has foreign keys to other tables)
DELETE FROM public.sale_items;
DELETE FROM public.sales;
DELETE FROM public.purchase_items;
DELETE FROM public.purchases;

-- Step 2: Delete products (referenced by sale_items and purchase_items)
DELETE FROM public.products;

-- Step 3: Delete categories (referenced by products)
DELETE FROM public.categories;

-- Step 4: Delete buyers and suppliers
DELETE FROM public.buyers;
DELETE FROM public.suppliers;

-- Step 5: Delete any other business tables if they exist
-- (Add more DELETE statements here if you have other tables)

-- =====================================================
-- Verification: Count remaining records
-- =====================================================
SELECT 'products' as table_name, COUNT(*) as record_count FROM public.products
UNION ALL
SELECT 'categories', COUNT(*) FROM public.categories
UNION ALL
SELECT 'sales', COUNT(*) FROM public.sales
UNION ALL
SELECT 'sale_items', COUNT(*) FROM public.sale_items
UNION ALL
SELECT 'purchases', COUNT(*) FROM public.purchases
UNION ALL
SELECT 'purchase_items', COUNT(*) FROM public.purchase_items
UNION ALL
SELECT 'buyers', COUNT(*) FROM public.buyers
UNION ALL
SELECT 'suppliers', COUNT(*) FROM public.suppliers;

-- =====================================================
-- NOTE: User authentication data in auth.users is NOT affected
-- =====================================================
