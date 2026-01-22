# Invoice Number Generation Documentation

## Overview
The invoice and purchase number generation system has been updated to follow the RK ENTERPRISES standard format instead of simple timestamp-based numbers.

## Invoice Number Format

### Format Structure
```
RK\XXX\26-27
```

Where:
- **RK** = Company prefix (R.K ENTERPRISES)
- **XXX** = Sequential 3-digit number (padded with zeros, e.g., 001, 002, 003)
- **26-27** = Financial Year in India format (runs April - March)

### Examples
- First invoice of FY 2026-27: `RK\001\26-27`
- Second invoice of FY 2026-27: `RK\002\26-27`
- 100th invoice of FY 2026-27: `RK\100\26-27`
- First invoice of FY 2027-28: `RK\001\27-28`

## Financial Year Logic

India follows a financial year (FY) that runs from **April 1st to March 31st**.

- **April - December (months 4-12)** → Current FY is based on current year
  - Example: If today is July 2026, the FY is 26-27 (April 2026 - March 2027)
- **January - March (months 1-3)** → Current FY uses previous year start
  - Example: If today is February 2026, the FY is 25-26 (April 2025 - March 2026)

## Implementation Details

### Utility Functions (`src/lib/utils.ts`)

#### `getCurrentFinancialYear()`
Returns the current financial year as a string in the format `YY-YY`

```typescript
getCurrentFinancialYear() // Returns "26-27" for Apr 2026 - Mar 2027
```

#### `generateInvoiceNumber(sequenceNumber: number)`
Generates a properly formatted invoice number

```typescript
generateInvoiceNumber(1) // Returns "RK\001\26-27"
generateInvoiceNumber(42) // Returns "RK\042\26-27"
```

#### `generatePurchaseNumber(sequenceNumber: number)`
Similar to invoice but for purchase orders

```typescript
generatePurchaseNumber(1) // Returns "PO\001\26-27"
```

### Hook: `useNextInvoiceNumber()`
Located in `src/hooks/useInvoiceSequence.ts`

- Queries the database to count existing sales in the current financial year
- Calculates the next sequence number automatically
- Returns the formatted invoice number ready to use

```typescript
const { data: invoiceNumber } = useNextInvoiceNumber();
// Returns "RK\001\26-27", "RK\002\26-27", etc.
```

### Hook: `useNextPurchaseNumber()`
Similar to invoice but for purchases

```typescript
const { data: purchaseNumber } = useNextPurchaseNumber();
// Returns "PO\001\26-27", "PO\002\26-27", etc.
```

## Integration Points

### SaleForm Component (`src/components/forms/SaleForm.tsx`)
- Uses `useNextInvoiceNumber()` to get the next invoice number
- Automatically assigns it when creating a new sale
- No manual invoice number entry needed

### PurchaseForm Component (`src/components/forms/PurchaseForm.tsx`)
- Uses `useNextPurchaseNumber()` to get the next purchase number
- Automatically assigns it when creating a new purchase
- Supports optional supplier invoice number (separate field)

## Flow When Creating an Invoice

1. **User opens SaleForm** → Hook queries database for count of sales in current FY
2. **System calculates sequence** → Based on existing records
3. **Number is generated** → `RK\XXX\YY-YY` format
4. **User fills in details** → Customer, items, dates, etc.
5. **User clicks "Create Invoice"** → System uses the generated number
6. **Invoice saved** → Number is now locked to that invoice

## Database Considerations

The system counts existing sales/purchases in the current financial year:
- Starts counting from April 1st each year
- Resets sequence to 001 on April 1st
- Ensures unique invoice numbers within each financial year

## Future Financial Years

As time progresses:
- **FY 2027-28** → Numbers will be `RK\001\27-28`, `RK\002\27-28`, etc.
- **FY 2028-29** → Numbers will be `RK\001\28-29`, `RK\002\28-29`, etc.
- And so on...

This automatic progression ensures compliance with Indian financial year conventions.
