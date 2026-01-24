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
