# Quotation Feature Setup Guide

## ⚠️ Important: Database Migration Required

Before you can use the quotation feature, you need to run a SQL migration to create the necessary database tables.

## Steps to Apply Migration:

### Option 1: Via Supabase Dashboard (Recommended)

1. **Open your Supabase project** at https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the sidebar
3. Click **New Query**
4. **Copy the entire contents** of the file:
   ```
   supabase/migrations/20260125060000_add_quotations.sql
   ```
5. **Paste** it into the SQL editor
6. Click **Run** to execute the migration
7. **Refresh** your application

### Option 2: Using Supabase CLI (If installed)

If you have Supabase CLI installed locally:

```bash
# Navigate to project directory
cd "c:\Users\Admin\Desktop\R.K ENTERPRISES\rk-inventory-hub"

# Apply the migration
supabase db push
```

## What This Migration Does:

The migration creates:
- ✅ `quotations` table - Stores quotation headers
- ✅ `quotation_items` table - Stores quotation line items
- ✅ `quotation_status` enum - Status types (Draft, Sent, Accepted, Rejected, Expired)
- ✅ Row Level Security (RLS) policies
- ✅ Database triggers for auto-updating timestamps

## After Migration:

Once the migration is complete, you'll be able to:

1. **Create Quotations** - Generate new quotation documents
2. **Manage Status** - Track quotation lifecycle (Draft → Sent → Accepted/Rejected)
3. **View & Print** - Professional quotation templates
4. **Edit/Delete** - Full CRUD operations on quotations

## Troubleshooting:

**If you see errors:**
- Make sure you're logged into the correct Supabase project
- Check that you have admin permissions
- Ensure no syntax errors when copying the SQL

**Still having issues?**
- Check the Supabase logs for detailed error messages
- Verify your database connection is active

## Features Available After Migration:

✨ **Quotation Management**
- Create/Edit/Delete quotations
- Track customer quotations
- Manage quotation status workflow
- Professional quotation templates
- GST calculations
- Terms & conditions

📊 **Integration**
- Links with existing Buyers/Customers
- Links with Products
- Auto-number generation (QT\001\26-27 format)
