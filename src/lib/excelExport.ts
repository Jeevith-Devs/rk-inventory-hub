import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { SaleWithItems } from '@/hooks/useSales';
import type { PurchaseWithItems } from '@/hooks/usePurchases';

export const exportSalesToExcel = (sales: SaleWithItems[]) => {
    // Create worksheet data
    const worksheetData: any[] = [
        // Header row
        [
            'Invoice No',
            'Date',
            'Customer',
            'Payment Mode',
            'Transport Mode',
            'Vehicle No',
            'LR No',
            'PO No',
            'PO Date',
            'Product Code',
            'Product Name',
            'Quantity',
            'Unit Price',
            'Tax %',
            'Tax Amount',
            'Discount',
            'Total',
            'Subtotal',
            'CGST',
            'SGST',
            'IGST',
            'Transport Charges',
            'Grand Total',
            'Notes',
        ],
    ];

    // Add data rows
    sales.forEach((sale) => {
        const saleItems = sale.sale_items || [];

        if (saleItems.length === 0) {
            // If no items, add a single row with sale info
            worksheetData.push([
                sale.invoice_number,
                format(new Date(sale.sale_date), 'dd-MM-yyyy'),
                sale.buyers?.company_name || 'N/A',
                sale.payment_mode || '',
                sale.transport_mode || '',
                sale.vehicle_no || '',
                sale.lr_no || '',
                sale.purchase_order_no || '',
                sale.purchase_order_date ? format(new Date(sale.purchase_order_date), 'dd-MM-yyyy') : '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                sale.subtotal || 0,
                sale.cgst_amount || 0,
                sale.sgst_amount || 0,
                sale.igst_amount || 0,
                sale.transport_charges || 0,
                sale.grand_total || 0,
                sale.notes || '',
            ]);
        } else {
            // Add a row for each item
            saleItems.forEach((item, index) => {
                worksheetData.push([
                    index === 0 ? sale.invoice_number : '',
                    index === 0 ? format(new Date(sale.sale_date), 'dd-MM-yyyy') : '',
                    index === 0 ? sale.buyers?.company_name || 'N/A' : '',
                    index === 0 ? sale.payment_mode || '' : '',
                    index === 0 ? sale.transport_mode || '' : '',
                    index === 0 ? sale.vehicle_no || '' : '',
                    index === 0 ? sale.lr_no || '' : '',
                    index === 0 ? sale.purchase_order_no || '' : '',
                    index === 0 && sale.purchase_order_date ? format(new Date(sale.purchase_order_date), 'dd-MM-yyyy') : '',
                    item.products?.product_code || '',
                    item.products?.name || '',
                    item.quantity,
                    item.unit_price,
                    item.tax_percent || 0,
                    item.tax_amount || 0,
                    item.discount_amount || 0,
                    item.total_amount,
                    index === 0 ? sale.subtotal || 0 : '',
                    index === 0 ? sale.cgst_amount || 0 : '',
                    index === 0 ? sale.sgst_amount || 0 : '',
                    index === 0 ? sale.igst_amount || 0 : '',
                    index === 0 ? sale.transport_charges || 0 : '',
                    index === 0 ? sale.grand_total || 0 : '',
                    index === 0 ? sale.notes || '' : '',
                ]);
            });
        }
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales');

    // Set column widths
    const columnWidths = [
        { wch: 15 }, // Invoice No
        { wch: 12 }, // Date
        { wch: 25 }, // Customer
        { wch: 12 }, // Payment Mode
        { wch: 15 }, // Transport Mode
        { wch: 12 }, // Vehicle No
        { wch: 12 }, // LR No
        { wch: 12 }, // PO No
        { wch: 12 }, // PO Date
        { wch: 15 }, // Product Code
        { wch: 30 }, // Product Name
        { wch: 10 }, // Quantity
        { wch: 12 }, // Unit Price
        { wch: 8 },  // Tax %
        { wch: 12 }, // Tax Amount
        { wch: 12 }, // Discount
        { wch: 12 }, // Total
        { wch: 12 }, // Subtotal
        { wch: 10 }, // CGST
        { wch: 10 }, // SGST
        { wch: 10 }, // IGST
        { wch: 15 }, // Transport Charges
        { wch: 15 }, // Grand Total
        { wch: 30 }, // Notes
    ];
    worksheet['!cols'] = columnWidths;

    // Generate filename with current date
    const filename = `Sales_Report_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
};

export const exportPurchasesToExcel = (purchases: PurchaseWithItems[]) => {
    // Create worksheet data
    const worksheetData: any[] = [
        // Header row
        [
            'Purchase No',
            'Purchase Date',
            'Supplier',
            'Invoice No',
            'Invoice Date',
            'Product Code',
            'Product Name',
            'Quantity',
            'Unit Price',
            'Tax %',
            'Tax Amount',
            'Discount',
            'Total',
            'Subtotal',
            'Total Tax',
            'Total Discount',
            'Grand Total',
            'Notes',
        ],
    ];

    // Add data rows
    purchases.forEach((purchase) => {
        const purchaseItems = purchase.purchase_items || [];

        if (purchaseItems.length === 0) {
            // If no items, add a single row with purchase info
            worksheetData.push([
                purchase.purchase_number,
                format(new Date(purchase.purchase_date), 'dd-MM-yyyy'),
                purchase.suppliers?.company_name || 'N/A',
                purchase.invoice_number || '',
                purchase.invoice_date ? format(new Date(purchase.invoice_date), 'dd-MM-yyyy') : '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                purchase.subtotal || 0,
                purchase.tax_amount || 0,
                purchase.discount_amount || 0,
                purchase.total_amount || 0,
                purchase.notes || '',
            ]);
        } else {
            // Add a row for each item
            purchaseItems.forEach((item, index) => {
                worksheetData.push([
                    index === 0 ? purchase.purchase_number : '',
                    index === 0 ? format(new Date(purchase.purchase_date), 'dd-MM-yyyy') : '',
                    index === 0 ? purchase.suppliers?.company_name || 'N/A' : '',
                    index === 0 ? purchase.invoice_number || '' : '',
                    index === 0 && purchase.invoice_date ? format(new Date(purchase.invoice_date), 'dd-MM-yyyy') : '',
                    item.products?.product_code || '',
                    item.products?.name || '',
                    item.quantity,
                    item.unit_price,
                    item.tax_percent || 0,
                    item.tax_amount || 0,
                    item.discount_amount || 0,
                    item.total_amount,
                    index === 0 ? purchase.subtotal || 0 : '',
                    index === 0 ? purchase.tax_amount || 0 : '',
                    index === 0 ? purchase.discount_amount || 0 : '',
                    index === 0 ? purchase.total_amount || 0 : '',
                    index === 0 ? purchase.notes || '' : '',
                ]);
            });
        }
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchases');

    // Set column widths
    const columnWidths = [
        { wch: 15 }, // Purchase No
        { wch: 15 }, // Purchase Date
        { wch: 25 }, // Supplier
        { wch: 15 }, // Invoice No
        { wch: 15 }, // Invoice Date
        { wch: 15 }, // Product Code
        { wch: 30 }, // Product Name
        { wch: 10 }, // Quantity
        { wch: 12 }, // Unit Price
        { wch: 8 },  // Tax %
        { wch: 12 }, // Tax Amount
        { wch: 12 }, // Discount
        { wch: 12 }, // Total
        { wch: 12 }, // Subtotal
        { wch: 12 }, // Total Tax
        { wch: 15 }, // Total Discount
        { wch: 15 }, // Grand Total
        { wch: 30 }, // Notes
    ];
    worksheet['!cols'] = columnWidths;

    // Generate filename with current date
    const filename = `Purchase_Report_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
};

export interface OtherExpense {
    id: string;
    date: string;
    category: string;
    description: string;
    amount: number;
    paymentMode: string;
}

export const exportFinancialYearToExcel = (
    fyName: string,
    startDateStr: string,
    endDateStr: string,
    sales: SaleWithItems[],
    purchases: PurchaseWithItems[],
    otherExpenses: OtherExpense[]
) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    // Helper to check if a date is within range
    const isWithin = (dStr: string) => {
        const d = new Date(dStr);
        return d >= start && d <= end;
    };

    // Filter items
    const filteredSales = sales.filter(s => isWithin(s.sale_date));
    const filteredPurchases = purchases.filter(p => isWithin(p.purchase_date));
    const filteredOther = otherExpenses.filter(e => isWithin(e.date));

    // Calculations
    const totalSales = filteredSales.reduce((sum, s) => sum + (s.grand_total || 0), 0);
    const totalPurchases = filteredPurchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);
    const totalOther = filteredOther.reduce((sum, e) => sum + e.amount, 0);
    const netBalance = totalSales - totalPurchases - totalOther;

    // 1. Summary Worksheet Data
    const summaryData: any[] = [
        ['RK ENTERPRISES - FINANCIAL REPORT', ''],
        ['Financial Year', fyName],
        ['Period', `${format(start, 'dd-MM-yyyy')} to ${format(end, 'dd-MM-yyyy')}`],
        ['', ''],
        ['Summary Statement', ''],
        ['Category', 'Total Amount (₹)'],
        ['Total Revenue (Sales)', totalSales],
        ['Total Inventory Cost (Purchases)', totalPurchases],
        ['Total Other Operating Expenses', totalOther],
        ['Net Profit / Loss (P&L)', netBalance],
        ['Net Profit Margin (%)', totalSales > 0 ? `${((netBalance / totalSales) * 100).toFixed(1)}%` : '0%']
    ];

    // Sort ledger rows first before adding S.No
    const tempRows: any[] = [];
    
    // Sales Rows (Credit / Inflow)
    filteredSales.forEach(s => {
        tempRows.push({
            dateObj: new Date(s.sale_date),
            dateStr: format(new Date(s.sale_date), 'dd-MM-yyyy'),
            ref: s.invoice_number,
            description: `Sale to ${s.buyers?.company_name || 'Customer'}`,
            category: 'Inventory Sale',
            paymentMode: s.payment_mode || 'Credit',
            type: 'Credit',
            amount: s.grand_total || 0
        });
    });

    // Purchase Rows (Debit / Outflow)
    filteredPurchases.forEach(p => {
        tempRows.push({
            dateObj: new Date(p.purchase_date),
            dateStr: format(new Date(p.purchase_date), 'dd-MM-yyyy'),
            ref: p.purchase_number,
            description: `Purchase from ${p.suppliers?.company_name || 'Supplier'}`,
            category: 'Inventory Purchase',
            paymentMode: 'Credit',
            type: 'Debit',
            amount: p.total_amount || 0
        });
    });

    // Other Expense Rows (Debit / Outflow)
    filteredOther.forEach(e => {
        tempRows.push({
            dateObj: new Date(e.date),
            dateStr: format(new Date(e.date), 'dd-MM-yyyy'),
            ref: 'EXP-' + e.id.slice(0, 4).toUpperCase(),
            description: e.description,
            category: e.category,
            paymentMode: e.paymentMode,
            type: 'Debit',
            amount: e.amount
        });
    });

    // Sort by date chronological (oldest to newest)
    tempRows.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    // 2. Ledger Worksheet Data with S.No
    const ledgerHeader = [
        'S.No',
        'Date',
        'Reference No',
        'Description',
        'Category',
        'Payment Mode',
        'Debit or Credit',
        'Amount (₹)'
    ];

    const ledgerRows = tempRows.map((row, index) => [
        index + 1,
        row.dateStr,
        row.ref,
        row.description,
        row.category,
        row.paymentMode,
        row.type,
        row.amount
    ]);

    const ledgerData = [ledgerHeader, ...ledgerRows];

    // 3. Create Excel Book
    const workbook = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    const ledgerSheet = XLSX.utils.aoa_to_sheet(ledgerData);

    // Set widths
    summarySheet['!cols'] = [{ wch: 40 }, { wch: 30 }];
    ledgerSheet['!cols'] = [
        { wch: 8 },  // S.No
        { wch: 15 }, // Date
        { wch: 20 }, // Reference No
        { wch: 45 }, // Description
        { wch: 25 }, // Category
        { wch: 20 }, // Payment Mode
        { wch: 18 }, // Debit or Credit
        { wch: 18 }  // Amount
    ];

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Financial Summary');
    XLSX.utils.book_append_sheet(workbook, ledgerSheet, 'Ledger Transactions');

    const filename = `Financial_Report_${fyName.replace(/ /g, '_')}_Exported_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
    XLSX.writeFile(workbook, filename);
};
