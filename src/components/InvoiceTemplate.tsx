import { useSales } from '@/hooks/useSales';
import { useBuyers } from '@/hooks/useBuyers';
import { useProducts } from '@/hooks/useProducts';
import { useEffect } from 'react';
import { format } from 'date-fns';

interface InvoiceTemplateProps {
  saleId: string;
}

// Function to convert numbers to words (Indian system)
function convertNumberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero Rupees Only';

  function convertLessThanThousand(n: number): string {
    if (n === 0) return '';
    else if (n < 10) return ones[n];
    else if (n < 20) return teens[n - 10];
    else if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    else return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  }

  // Separate rupees and paise
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = '';

  // Convert rupees part
  if (rupees === 0) {
    result = 'Zero Rupees';
  } else if (rupees < 1000) {
    result = convertLessThanThousand(rupees) + ' Rupees';
  } else if (rupees < 100000) {
    const thousands = Math.floor(rupees / 1000);
    const remainder = rupees % 1000;
    result = convertLessThanThousand(thousands) + ' Thousand' + (remainder > 0 ? ' ' + convertLessThanThousand(remainder) : '') + ' Rupees';
  } else if (rupees < 10000000) {
    const lakhs = Math.floor(rupees / 100000);
    const remainder = rupees % 100000;
    const remainderText = remainder > 0 ? ' ' + convertNumberToWords(remainder).replace(' Rupees', '').replace(' and ' + convertLessThanThousand(Math.round((remainder - Math.floor(remainder)) * 100)) + ' Paise', '').replace(' Only', '') : '';
    result = convertLessThanThousand(lakhs) + ' Lakh' + remainderText + ' Rupees';
  } else {
    const crores = Math.floor(rupees / 10000000);
    const remainder = rupees % 10000000;
    const remainderText = remainder > 0 ? ' ' + convertNumberToWords(remainder).replace(' Rupees', '').replace(' and ' + convertLessThanThousand(Math.round((remainder - Math.floor(remainder)) * 100)) + ' Paise', '').replace(' Only', '') : '';
    result = convertLessThanThousand(crores) + ' Crore' + remainderText + ' Rupees';
  }

  // Add paise if present
  if (paise > 0) {
    result += ' and ' + convertLessThanThousand(paise) + ' Paise';
  }

  return result + ' Only';
}

interface InvoiceCopyProps {
  saleId: string;
  copyType: 'original' | 'duplicate' | 'triplicate' | 'quadruplicate';
  sale: any;
  buyer: any;
  products: any;
  basicAmount: number;
  totalTax: number;
}

function InvoiceCopy({ saleId, copyType, sale, buyer, products, basicAmount, totalTax }: InvoiceCopyProps) {
  const copyLabels = {
    original: 'ORIGINAL COPY',
    duplicate: 'DUPLICATE COPY',
    triplicate: 'TRIPLICATE COPY',
    quadruplicate: 'QUADRUPLICATE COPY'
  };

  return (
    <div className="w-full bg-white text-black mx-auto print:scale-100 print:bg-white print:text-black page-break-after" style={{ maxWidth: '1000px', height: 'auto', padding: '10px' }}>
      {/* Header Section */}
      <div className="border-4 border-black mb-0 flex flex-col min-h-[290mm]">
        {/* Top Company Info */}
        <div className="flex flex-col sm:flex-row print:flex-row justify-between items-start print:items-start p-2 border-b-2 border-black gap-2 sm:gap-4 print:gap-2">
          <div className="flex-1 w-full sm:w-auto print:w-auto">
            <img src="/rk-logo.svg" alt="RK Enterprises Logo" className="h-16 sm:h-20 md:h-24 lg:h-28 print:h-[100px] object-contain mx-auto sm:mx-0 print:mx-0" />
          </div>
          <div className="flex-1 text-center sm:text-center print:text-center w-full sm:w-auto print:w-auto">
            <h2 className="text-xs sm:text-sm md:text-base print:text-sm font-bold">RK ENTERPRISES</h2>
            <p className="text-[9px] sm:text-[10px] print:text-[10px] break-words print:break-words">No.23/2,Part,GreenAcres,2ndLayout,Mathur,</p>
            <p className="text-[9px] sm:text-[10px] print:text-[10px] break-all print:break-all">sriperumbudur taluk, kanchipuram dist-602105</p>
            <p className="text-[9px] sm:text-[10px] print:text-[10px] break-all print:break-all">rk.enterprises.tn.2025@gmail.com</p>
          </div>
          <div className="flex-1 text-center sm:text-right print:text-right space-y-0 w-full sm:w-auto print:w-auto">
            <p className="text-[9px] sm:text-[10px] print:text-[10px] font-bold">{copyLabels[copyType]}</p>
            <p className="text-[9px] sm:text-[10px] print:text-[10px] break-words print:break-words"><span className="font-bold">GSTIN NO :</span> 33BLQPP6954N1Z7</p>
            <p className="text-[9px] sm:text-[10px] print:text-[10px]"><span className="font-bold">Phone :</span> +91 7904982523</p>
          </div>
        </div>

        {/* TAX INVOICE Header */}
        <div className="text-center border-b-2 border-black py-1">
          <h3 className="text-sm font-bold">TAX INVOICE</h3>
        </div>

        {/* Invoice Details Grid */}
        <div className="border-b-2 border-black">
          <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-0">
            {/* To Section */}
            <div className="border-b-2 md:border-b-0 print:border-b-0 md:border-r-2 print:border-r-2 border-black p-2">
              <p className="text-[9px] sm:text-[10px] print:text-[10px] font-bold">To.</p>
              <p className="text-[9px] sm:text-[10px] print:text-[10px] mt-1 font-semibold break-words print:break-words">{buyer.company_name}</p>
              {buyer.billing_address && <p className="text-[9px] sm:text-[10px] print:text-[10px] break-words print:break-words">{buyer.billing_address}</p>}
            </div>

            {/* Invoice Info */}
            <div className="border-b-2 md:border-b-0 print:border-b-0 md:border-r-2 print:border-r-2 border-black p-2">
              <div className="grid grid-cols-2 gap-0 text-[9px] sm:text-[10px] print:text-[10px]">
                <div className="border-b border-black pb-0.5">
                  <p className="font-bold">Invoice No</p>
                </div>
                <div className="border-b border-black pb-0.5">
                  <p className="text-right break-all print:break-all">{sale.invoice_number}</p>
                </div>
                <div className="border-b border-black pb-0.5">
                  <p className="font-bold">Invoice Date</p>
                </div>
                <div className="border-b border-black pb-0.5">
                  <p className="text-right">{format(new Date(sale.sale_date), 'dd/MM/yyyy')}</p>
                </div>
                <div className="border-b border-black pb-0.5">
                  <p className="font-bold">Purchase Order No.</p>
                </div>
                <div className="border-b border-black pb-0.5">
                  <p className="text-right break-all print:break-all">{sale.purchase_order_no || '-'}</p>
                </div>
                <div className="border-b border-black pb-0.5">
                  <p className="font-bold">Purchase Order Date:</p>
                </div>
                <div className="border-b border-black pb-0.5">
                  <p className="text-right">{sale.purchase_order_date ? format(new Date(sale.purchase_order_date), 'dd/MM/yyyy') : '-'}</p>
                </div>
                <div className="border-b border-black pb-0.5">
                  <p className="font-bold">Transport Mode :</p>
                </div>
                <div className="border-b border-black pb-0.5">
                  <p className="text-right">{sale.transport_mode || '-'}</p>
                </div>
              </div>
            </div>

            {/* Party Info */}
            <div className="p-2">
              <div className="grid grid-cols-2 gap-0 text-[9px] sm:text-[10px] print:text-[10px]">
                <div className="border-b border-black pb-0.5">
                  <p className="font-bold">Vehicle No:</p>
                </div>
                <div className="border-b border-black pb-0.5 text-right break-all print:break-all">
                  {sale.vehicle_no || '-'}
                </div>
                <div className="border-b border-black pb-0.5">
                  <p className="font-bold">Contact Person:</p>
                </div>
                <div className="border-b border-black pb-0.5 text-right break-words print:break-words">
                  {buyer.contact_person ? `Mr ${buyer.contact_person}` : '-'}
                </div>
                <div className="border-b border-black pb-0.5">
                  <p className="font-bold">Contact Number:</p>
                </div>
                <div className="border-b border-black pb-0.5 text-right">
                  {buyer.phone || '-'}
                </div>
              </div>
            </div>
          </div>

          {/* Party GSTIN and Transport Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-0 border-t-2 border-black">
            <div className="border-b-2 md:border-b-0 print:border-b-0 md:border-r-2 print:border-r-2 border-black p-2 text-[9px] sm:text-[10px] print:text-[10px]">
              <p><span className="font-bold">Party's GSTIN No:</span> <span className="break-all print:break-all">{buyer.gst_no || '-'}</span></p>
            </div>
            <div className="p-2"></div>
          </div>
        </div>

        {/* Items Table */}
        <div className="border-b-2 border-black overflow-x-auto print:overflow-visible flex-1">
          <table className="w-full border-collapse min-w-[600px] print:min-w-full h-full">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="border-r-2 border-black p-1 text-[8px] sm:text-[9px] print:text-[9px] font-bold text-left w-8 print:w-8">S.NO.</th>
                <th className="border-r-2 border-black p-1 text-[8px] sm:text-[9px] print:text-[9px] font-bold text-left">DESCRIPTION</th>
                <th className="border-r-2 border-black p-1 text-[8px] sm:text-[9px] print:text-[9px] font-bold text-center w-16 print:w-16">HSN Code</th>
                <th className="border-r-2 border-black p-1 text-[8px] sm:text-[9px] print:text-[9px] font-bold text-center w-12 print:w-12">UOM</th>
                <th className="border-r-2 border-black p-1 text-[8px] sm:text-[9px] print:text-[9px] font-bold text-center w-12 print:w-12">QTY</th>
                <th className="border-r-2 border-black p-1 text-[8px] sm:text-[9px] print:text-[9px] font-bold text-right w-16 print:w-16">Rate</th>
                <th className="p-1 text-[8px] sm:text-[9px] print:text-[9px] font-bold text-right w-16 print:w-16">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sale.sale_items && sale.sale_items.length > 0 ? (
                sale.sale_items.map((item, index) => {
                  const product = products?.find((p) => p.id === item.product_id);
                  return (
                    <tr key={item.id} className="border-b border-black h-fit">
                      <td className="border-r-2 border-black p-1 text-[8px] sm:text-[9px] print:text-[9px] text-center">{index + 1}</td>
                      <td className="border-r-2 border-black p-1 text-[8px] sm:text-[9px] print:text-[9px] break-words print:break-words">{product?.name || 'N/A'}</td>
                      <td className="border-r-2 border-black p-1 text-[8px] sm:text-[9px] print:text-[9px] text-center">{product?.hsn_code || '-'}</td>
                      <td className="border-r-2 border-black p-1 text-[8px] sm:text-[9px] print:text-[9px] text-center">{product?.unit || 'PCS'}</td>
                      <td className="border-r-2 border-black p-1 text-[8px] sm:text-[9px] print:text-[9px] text-right">{item.quantity.toFixed(2)}</td>
                      <td className="border-r-2 border-black p-1 text-[8px] sm:text-[9px] print:text-[9px] text-right">₹{item.unit_price.toFixed(2)}</td>
                      <td className="p-1 text-[8px] sm:text-[9px] print:text-[9px] text-right">Rs. {Math.floor(item.total_amount)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr className="border-b border-black">
                  <td colSpan={7} className="p-2 text-center text-[8px] sm:text-[9px] print:text-[9px] text-black">No items</td>
                </tr>
              )}
              {/* Empty rows to fill the table space */}
              {Array.from({ length: Math.max(0, 14 - (sale.sale_items?.length || 0)) }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-black">
                  <td className="border-r-2 border-black p-1 text-[8px] sm:text-[9px] print:text-[9px]">&nbsp;</td>
                  <td className="border-r-2 border-black p-1 text-[8px] sm:text-[9px] print:text-[9px]">&nbsp;</td>
                  <td className="border-r-2 border-black p-1 text-[8px] sm:text-[9px] print:text-[9px]">&nbsp;</td>
                  <td className="border-r-2 border-black p-1 text-[8px] sm:text-[9px] print:text-[9px]">&nbsp;</td>
                  <td className="border-r-2 border-black p-1 text-[8px] sm:text-[9px] print:text-[9px]">&nbsp;</td>
                  <td className="border-r-2 border-black p-1 text-[8px] sm:text-[9px] print:text-[9px]">&nbsp;</td>
                  <td className="p-1 text-[8px] sm:text-[9px] print:text-[9px]">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="border-b-2 border-black overflow-x-auto print:overflow-visible">
          <table className="w-full min-w-[400px] print:min-w-full">
            <tbody>
              <tr className="border-b border-black">
                <td colSpan={7} className="p-1 text-[9px] sm:text-[10px] print:text-[10px] font-bold text-right">BASIC AMOUNT</td>
                <td className="border-l-2 border-black p-1 text-[9px] sm:text-[10px] print:text-[10px] text-right">₹{basicAmount.toFixed(2)}</td>
              </tr>
              {sale.sgst_amount ? (
                <>
                  <tr className="border-b border-black">
                    <td colSpan={6} className="p-1 text-[9px] sm:text-[10px] print:text-[10px] font-bold text-right">SGST %</td>
                    <td className="border-l-2 border-black p-1 text-[9px] sm:text-[10px] print:text-[10px] text-right">{((sale.sgst_amount / basicAmount) * 100).toFixed(2)}%</td>
                    <td className="border-l-2 border-black p-1 text-[9px] sm:text-[10px] print:text-[10px] text-right font-bold">₹{sale.sgst_amount.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td colSpan={6} className="p-1 text-[9px] sm:text-[10px] print:text-[10px] font-bold text-right">CGST %</td>
                    <td className="border-l-2 border-black p-1 text-[9px] sm:text-[10px] print:text-[10px] text-right">{((sale.cgst_amount / basicAmount) * 100).toFixed(2)}%</td>
                    <td className="border-l-2 border-black p-1 text-[9px] sm:text-[10px] print:text-[10px] text-right font-bold">₹{sale.cgst_amount.toFixed(2)}</td>
                  </tr>
                </>
              ) : (
                <tr className="border-b border-black">
                  <td colSpan={6} className="p-1 text-[9px] sm:text-[10px] print:text-[10px] font-bold text-right">IGST %</td>
                  <td className="border-l-2 border-black p-1 text-[9px] sm:text-[10px] print:text-[10px] text-right">{((sale.igst_amount / basicAmount) * 100).toFixed(2)}%</td>
                  <td className="border-l-2 border-black p-1 text-[9px] sm:text-[10px] print:text-[10px] text-right font-bold">₹{sale.igst_amount.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Grand Total */}
        <div className="border-b-2 border-black p-2">
          <div className="flex flex-col sm:flex-row print:flex-row justify-between items-start sm:items-center print:items-center mb-1 gap-1 print:gap-0">
            <span className="text-[9px] sm:text-[10px] print:text-[10px] font-bold break-words print:break-words">Total In Words: <span className="font-normal">{convertNumberToWords(sale.grand_total || 0)}</span></span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span></span>
            <div className="text-right">
              <span className="mr-2 text-[9px] sm:text-[10px] print:text-[10px] font-bold">GRAND TOTAL</span>
              <span className="text-[10px] sm:text-xs print:text-xs font-bold">₹{(sale.grand_total || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Terms of Sales */}
        <div className="border-b-2 border-black p-2">
          <p className="text-[9px] sm:text-[10px] print:text-[10px] font-bold mb-1">Terms of Sales :</p>
          <div className="text-[8px] sm:text-[9px] print:text-[9px] space-y-0">
            <p>1&nbsp;&nbsp;&nbsp;&nbsp;Goods Once Sold Will Not be Taken Back</p>
            <p>2&nbsp;&nbsp;&nbsp;&nbsp;Credit Period : 30 Days  </p>
            <p>3&nbsp;&nbsp;&nbsp;&nbsp;Subject to TamilNadu Jurisdiction Only</p>
          </div>
        </div>

        {/* Bank Details and Signature */}
        <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-0">
          <div className="border-b-2 md:border-b-0 print:border-b-0 md:border-r-2 print:border-r-2 border-black p-2">
            <p className="text-[9px] sm:text-[10px] print:text-[10px] font-bold">Receiver's Signature</p>
            <div className="text-right mt-4 h-20 border-b border-black"></div>
          </div>
          <div className="border-b-2 md:border-b-0 print:border-b-0 md:border-r-2 print:border-r-2 border-black p-2">
            <p className="text-[9px] sm:text-[10px] print:text-[10px] font-bold mb-0.5">Bank Name</p>
            <p className="text-[9px] sm:text-[10px] print:text-[10px] mb-1 break-words print:break-words">FEDERAL BANK</p>
            <p className="text-[9px] sm:text-[10px] print:text-[10px] font-bold mb-0.5">Ac.No</p>
            <p className="text-[9px] sm:text-[10px] print:text-[10px] mb-1 break-all print:break-all">181702000008879</p>
            <p className="text-[9px] sm:text-[10px] print:text-[10px] font-bold mb-0.5">IFSC Code</p>
            <p className="text-[9px] sm:text-[10px] print:text-[10px] mb-1 break-all print:break-all">FDRL0001817</p>
            <p className="text-[9px] sm:text-[10px] print:text-[10px] font-bold mb-0.5">Branch</p>
            <p className="text-[9px] sm:text-[10px] print:text-[10px] break-words print:break-words">ORAGADAM</p>
          </div>
          <div className="p-2 flex flex-col justify-between">
            <div>
              <p className="text-[9px] sm:text-[10px] print:text-[10px] font-bold text-right">for RK ENTERPRISES</p>
            </div>
            <div className="text-right mt-4 h-20 border-b border-black"></div>
            <p className="text-[9px] sm:text-[10px] print:text-[10px] text-right font-bold">Authorized Signature</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @page {
          page-break-after: always;
        }
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
            color: black !important;
          }
          .page-break-after {
            page-break-after: always;
            break-after: page;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            font-size: 12pt !important;
            color: black !important;
          }
          body * {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 0;
            background: white;
          }
          .print\\:scale-100 {
            transform: scale(1) !important;
            width: 100% !important;
            max-width: 1000px !important;
          }
          .print\\:flex-row {
            flex-direction: row !important;
          }
          .print\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          .print\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .print\\:border-b-0 {
            border-bottom: 0 !important;
          }
          .print\\:border-r-2 {
            border-right-width: 2px !important;
          }
          .print\\:overflow-visible {
            overflow: visible !important;
          }
          .print\\:min-w-full {
            min-width: 100% !important;
          }
          .print\\:text-\\[10px\\] {
            font-size: 10px !important;
          }
          .print\\:text-\\[9px\\] {
            font-size: 9px !important;
          }
          .print\\:text-xs {
            font-size: 12px !important;
          }
          .print\\:items-center {
            align-items: center !important;
          }
          .print\\:items-start {
            align-items: flex-start !important;
          }
          .print\\:text-center {
            text-align: center !important;
          }
          .print\\:text-right {
            text-align: right !important;
          }
          .print\\:w-auto {
            width: auto !important;
          }
          .print\\:h-\\[100px\\] {
            height: 100px !important;
          }
          .print\\:mx-0 {
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          .print\\:break-words {
            word-break: break-word !important;
            overflow-wrap: break-word !important;
          }
          .print\\:break-all {
            word-break: break-all !important;
          }
          .print\\:gap-0 {
            gap: 0 !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:text-black {
            color: black !important;
          }
          /* Force white background on all invoice elements */
          div[style*="maxWidth"] {
            background: white !important;
          }
          /* Remove any dark mode styles when printing */
          .dark, [class*="dark"] {
            background: white !important;
            color: black !important;
          }
          /* Ensure table backgrounds are white */
          table, thead, tbody, tr, td, th {
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}

export function InvoiceTemplate({ saleId }: InvoiceTemplateProps) {
  const { data: sales } = useSales();
  const { data: buyers } = useBuyers();
  const { data: products } = useProducts();

  const sale = sales?.find((s) => s.id === saleId);
  const buyer = buyers?.find((b) => b.id === sale?.buyer_id);

  useEffect(() => {
    // Delay print to ensure all content is rendered
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (sale && buyer) {
      const invoiceTitle = `${sale.invoice_number} | ${buyer.company_name}`;
      document.title = invoiceTitle;
    }
    return () => {
      // Reset title when component unmounts
      document.title = 'RK Inventory Hub';
    };
  }, [sale, buyer]);

  if (!sale || !buyer) return <div className="p-8">Loading invoice...</div>;

  const totalTax = (sale.cgst_amount || 0) + (sale.sgst_amount || 0) + (sale.igst_amount || 0);
  const basicAmount = (sale.subtotal || 0) - (sale.discount_amount || 0);

  const copyTypes: Array<'original' | 'duplicate' | 'triplicate' | 'quadruplicate'> = ['original', 'duplicate', 'triplicate', 'quadruplicate'];

  return (
    <>
      {copyTypes.map((copyType) => (
        <InvoiceCopy
          key={copyType}
          saleId={saleId}
          copyType={copyType}
          sale={sale}
          buyer={buyer}
          products={products}
          basicAmount={basicAmount}
          totalTax={totalTax}
        />
      ))}
    </>
  );
}
