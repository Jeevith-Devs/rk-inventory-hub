import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Gets the current financial year in India (April-March format)
 * Returns a string like "26-27" for FY 2026-2027
 */
export function getCurrentFinancialYear(): string {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12

  // In India, financial year runs from April (month 4) to March (month 3)
  if (currentMonth >= 4) {
    // April onwards = next financial year
    const fyStart = currentYear % 100; // Last 2 digits of current year
    const fyEnd = (currentYear + 1) % 100; // Last 2 digits of next year
    return `${String(fyStart).padStart(2, '0')}-${String(fyEnd).padStart(2, '0')}`;
  } else {
    // January-March = current financial year
    const fyStart = (currentYear - 1) % 100;
    const fyEnd = currentYear % 100;
    return `${String(fyStart).padStart(2, '0')}-${String(fyEnd).padStart(2, '0')}`;
  }
}

/**
 * Generates an invoice number in the format: RK\XXX\26-27
 * where XXX is a padded sequential number
 * @param sequenceNumber - The sequential number for the invoice
 * @returns Invoice number string
 */
export function generateInvoiceNumber(sequenceNumber: number): string {
  const fy = getCurrentFinancialYear();
  const paddedNumber = String(sequenceNumber).padStart(3, '0');
  return `RK\\${paddedNumber}\\${fy}`;
}

/**
 * Generates a purchase order number similar to invoice format
 * @param sequenceNumber - The sequential number for the purchase
 * @returns Purchase order number string
 */
export function generatePurchaseNumber(sequenceNumber: number): string {
  const fy = getCurrentFinancialYear();
  const paddedNumber = String(sequenceNumber).padStart(3, '0');
  return `PO\\${paddedNumber}\\${fy}`;
}

/**
 * Generates a supplier code in the format: RK/SU/001
 * @param sequenceNumber - The sequential number for the supplier
 * @returns Supplier code string
 */
export function generateSupplierCode(sequenceNumber: number): string {
  const paddedNumber = String(sequenceNumber).padStart(3, '0');
  return `RK/SU/${paddedNumber}`;
}

/**
 * Generates a buyer code in the format: RK/BU/001
 * @param sequenceNumber - The sequential number for the buyer
 * @returns Buyer code string
 */
export function generateBuyerCode(sequenceNumber: number): string {
  const paddedNumber = String(sequenceNumber).padStart(3, '0');
  return `RK/BU/${paddedNumber}`;
}

/**
 * Generates a product code in the format: RK-PD-001
 * @param sequenceNumber - The sequential number for the product
 * @returns Product code string
 */
export function generateProductCode(sequenceNumber: number): string {
  const paddedNumber = String(sequenceNumber).padStart(3, '0');
  return `RK-PD-${paddedNumber}`;
}

/**
 * Generates a quotation number in the format: QT\XXX\26-27
 * @param sequenceNumber - The sequential number for the quotation
 * @returns Quotation number string
 */
export function generateQuotationNumber(sequenceNumber: number): string {
  const fy = getCurrentFinancialYear();
  const paddedNumber = String(sequenceNumber).padStart(3, '0');
  return `QT\\${paddedNumber}\\${fy}`;
}