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

  if (num === 0) return 'Zero';

  function convertLessThanThousand(n: number): string {
    if (n === 0) return '';
    else if (n < 10) return ones[n];
    else if (n < 20) return teens[n - 10];
    else if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    else return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  }

  if (num < 1000) {
    return convertLessThanThousand(num) + ' Rupees Only';
  } else if (num < 100000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    return convertLessThanThousand(thousands) + ' Thousand' + (remainder > 0 ? ' ' + convertLessThanThousand(remainder) : '') + ' Rupees Only';
  } else if (num < 10000000) {
    const lakhs = Math.floor(num / 100000);
    const remainder = num % 100000;
    return convertLessThanThousand(lakhs) + ' Lakh' + (remainder > 0 ? ' ' + convertNumberToWords(remainder).replace(' Rupees Only', '') : '') + ' Rupees Only';
  } else {
    const crores = Math.floor(num / 10000000);
    const remainder = num % 10000000;
    return convertLessThanThousand(crores) + ' Crore' + (remainder > 0 ? ' ' + convertNumberToWords(remainder).replace(' Rupees Only', '') : '') + ' Rupees Only';
  }
}

export function InvoiceTemplate({ saleId }: InvoiceTemplateProps) {
  const { data: sales } = useSales();
  const { data: buyers } = useBuyers();
  const { data: products } = useProducts();

  const sale = sales?.find((s) => s.id === saleId);
  const buyer = buyers?.find((b) => b.id === sale?.buyer_id);

  useEffect(() => {
    window.print();
  }, []);

  if (!sale || !buyer) return <div className="p-8">Loading invoice...</div>;

  const totalTax = (sale.cgst_amount || 0) + (sale.sgst_amount || 0) + (sale.igst_amount || 0);
  const basicAmount = (sale.subtotal || 0) - (sale.discount_amount || 0);

  return (
    <div className="w-full bg-white text-black" style={{ maxWidth: '1000px', height: 'auto', margin: '0 auto', padding: '10px' }}>
      {/* Header Section */}
      <div className="border-4 border-black mb-0">
        {/* Top Company Info */}
        <div className="flex justify-between items-start p-2 border-b-2 border-black gap-2">
          <div className="flex-1">
            <img src="/rk-logo.svg" alt="RK Enterprises Logo" style={{ height: '100px', objectFit: 'contain' }} />
          </div>
          <div className="flex-1 text-center">
            <h2 className="text-sm font-bold">RK ENTERPRISES</h2>
            <p className="text-[10px]">No.23/2,Part,GreenAcres,2ndLayout,Mathur,Sriperumbidur Taluk,Kanchipruram Dist-602105</p>
            <p className="text-[10px]">rk.enterprises.tn.2025@gmail.com</p>
          </div>
          <div className="flex-1 text-right space-y-0">
            <p className="text-[10px] font-bold">ORIGINAL COPY</p>
            <p className="text-[10px]"><span className="font-bold">GSTIN NO :</span> 33BLQPP6954N1Z7</p>
            <p className="text-[10px]"><span className="font-bold">Phone :</span> +91 7904982523</p>
          </div>
        </div>

        {/* TAX INVOICE Header */}
        <div className="text-center border-b-2 border-black py-1">
          <h3 className="text-sm font-bold">TAX INVOICE</h3>
        </div>

        {/* Invoice Details Grid */}
        <div className="border-b-2 border-black">
          <div className="grid grid-cols-3 gap-0">
            {/* To Section */}
            <div className="border-r-2 border-black p-2">
              <p className="text-[10px] font-bold">To.</p>
              <p className="text-[10px] mt-1 font-semibold">{buyer.company_name}</p>
              {buyer.contact_person && <p className="text-[10px]">{buyer.contact_person}</p>}
              {buyer.billing_address && <p className="text-[10px]">{buyer.billing_address}</p>}
              {buyer.city && <p className="text-[10px]">{buyer.city}, {buyer.state} {buyer.pincode}</p>}
              {buyer.phone && <p className="text-[10px]">Phone: {buyer.phone}</p>}
            </div>

            {/* Invoice Info */}
            <div className="border-r-2 border-black p-2">
              <div className="grid grid-cols-2 gap-0 text-[10px]">
                <div className="border-b border-black pb-0.5">
                  <p className="font-bold">Invoice No</p>
                </div>
                <div className="border-b border-black pb-0.5">
                  <p className="text-right">{sale.invoice_number}</p>
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
                  <p className="text-right">{sale.purchase_order_no || '-'}</p>
                </div>
                <div className="border-b border-black pb-0.5">
                  <p className="font-bold">Purchase Order Date:</p>
                </div>
                <div className="border-b border-black pb-0.5">
                  <p className="text-right">{sale.purchase_order_date ? format(new Date(sale.purchase_order_date), 'dd/MM/yyyy') : '-'}</p>
                </div>
              </div>
            </div>

            {/* Party Info */}
            <div className="p-2">
              <div className="grid grid-cols-2 gap-0 text-[10px]">
                <div>
                  <p className="font-bold">Vehicle No:</p>
                </div>
                <div className="text-right">
                  {sale.vehicle_no || '-'}
                </div>
                <div>
                  <p className="font-bold">Contact Person:</p>
                </div>
                <div className="text-right">
                  {buyer.contact_person || '-'}
                </div>
                <div>
                  <p className="font-bold">Contact Number:</p>
                </div>
                <div className="text-right">
                  {buyer.phone || '-'}
                </div>
              </div>
            </div>
          </div>

          {/* Party GSTIN and Transport Mode */}
          <div className="grid grid-cols-2 gap-0 border-t-2 border-black">
            <div className="border-r-2 border-black p-2 text-[10px]">
              <p><span className="font-bold">Party's GSTIN No:</span> {buyer.gst_no || '-'}</p>
              <p><span className="font-bold">Transport Mode :</span> {sale.transport_mode || '-'}</p>
            </div>
            <div className="p-2"></div>
          </div>
        </div>

        {/* Items Table */}
        <div className="border-b-2 border-black">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="border-r-2 border-black p-1 text-[9px] font-bold text-left w-8">S.NO.</th>
                <th className="border-r-2 border-black p-1 text-[9px] font-bold text-left">DESCRIPTION</th>
                <th className="border-r-2 border-black p-1 text-[9px] font-bold text-center w-16">HSN Code</th>
                <th className="border-r-2 border-black p-1 text-[9px] font-bold text-center w-12">UOM</th>
                <th className="border-r-2 border-black p-1 text-[9px] font-bold text-center w-12">QTY</th>
                <th className="border-r-2 border-black p-1 text-[9px] font-bold text-right w-16">Rate</th>
                <th className="p-1 text-[9px] font-bold text-right w-16">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sale.sale_items && sale.sale_items.length > 0 ? (
                sale.sale_items.map((item, index) => {
                  const product = products?.find((p) => p.id === item.product_id);
                  return (
                    <tr key={item.id} className="border-b border-black">
                      <td className="border-r-2 border-black p-1 text-[9px] text-center">{index + 1}</td>
                      <td className="border-r-2 border-black p-1 text-[9px]">{product?.name || 'N/A'}</td>
                      <td className="border-r-2 border-black p-1 text-[9px] text-center">{product?.hsn_code || '-'}</td>
                      <td className="border-r-2 border-black p-1 text-[9px] text-center">{product?.unit || 'PCS'}</td>
                      <td className="border-r-2 border-black p-1 text-[9px] text-right">{item.quantity.toFixed(2)}</td>
                      <td className="border-r-2 border-black p-1 text-[9px] text-right">₹{item.unit_price.toFixed(2)}</td>
                      <td className="p-1 text-[9px] text-right">Rs. {Math.floor(item.total_amount)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr className="border-b border-black">
                  <td colSpan={7} className="p-2 text-center text-[9px] text-black">No items</td>
                </tr>
              )}
              {/* Empty rows */}
              {sale.sale_items && sale.sale_items.length < 2 && 
                Array(2 - (sale.sale_items?.length || 0)).fill(0).map((_, i) => (
                  <tr key={`empty-${i}`} className="border-b border-black">
                    <td colSpan={7} className="p-2.5"></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="border-b-2 border-black">
          <table className="w-full">
            <tbody>
              <tr className="border-b border-black">
                <td colSpan={7} className="p-1 text-[10px] font-bold text-right">BASIC AMOUNT</td>
                <td className="border-l-2 border-black p-1 text-[10px] text-right">₹{basicAmount.toFixed(2)}</td>
              </tr>
              {sale.sgst_amount ? (
                <>
                  <tr className="border-b border-black">
                    <td colSpan={7} className="p-1 text-[10px] font-bold text-right">SGST.</td>
                    <td className="border-l-2 border-black p-1 text-[10px] text-right">{((sale.sgst_amount / basicAmount) * 100).toFixed(2)}%</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td colSpan={7} className="p-1 text-[10px] font-bold text-right">CGST</td>
                    <td className="border-l-2 border-black p-1 text-[10px] text-right">{((sale.cgst_amount / basicAmount) * 100).toFixed(2)}%</td>
                  </tr>
                </>
              ) : (
                <tr className="border-b border-black">
                  <td colSpan={7} className="p-1 text-[10px] font-bold text-right">IGST.</td>
                  <td className="border-l-2 border-black p-1 text-[10px] text-right">{((sale.igst_amount / basicAmount) * 100).toFixed(2)}%</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="flex justify-end p-1 text-[10px] font-bold border-t border-black">
            <span className="mr-2">Round Off (-):</span>
            <span className="w-16 text-right">{(sale.round_off || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Grand Total */}
        <div className="border-b-2 border-black p-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold">Total In Words: <span className="font-normal">{convertNumberToWords(Math.floor(sale.grand_total || 0))}</span></span>
          </div>
          <div className="flex justify-between items-center">
            <span></span>
            <div className="text-right">
              <span className="mr-2 text-[10px] font-bold">GRAND TOTAL</span>
              <span className="text-xs font-bold">₹{(sale.grand_total || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Terms of Sales */}
        <div className="border-b-2 border-black p-2">
          <p className="text-[10px] font-bold mb-1">Terms of Sales :</p>
          <div className="text-[9px] space-y-0">
            <p>1&nbsp;&nbsp;&nbsp;&nbsp;Goods Once Sold Will Not be Taken Back</p>
            <p>2&nbsp;&nbsp;&nbsp;&nbsp;Credit Period : 30 Days Subject to </p>
            <p>3&nbsp;&nbsp;&nbsp;&nbsp;'TamilNadu'Jurisdiction Only</p>
          </div>
        </div>

        {/* Bank Details and Signature */}
        <div className="grid grid-cols-3 gap-0">
          <div className="border-r-2 border-black p-2">
            <p className="text-[10px] font-bold">Receiver's Signature</p>
            <div className="mt-4 h-15 border-b border-black"></div>
          </div>
          <div className="border-r-2 border-black p-2">
            <p className="text-[10px] font-bold mb-0.5">Bank Name</p>
            <p className="text-[10px] mb-1">FEDERAL BANK</p>
            <p className="text-[10px] font-bold mb-0.5">Ac.No</p>
            <p className="text-[10px] mb-1">181702000008879</p>
            <p className="text-[10px] font-bold mb-0.5">IFSC Code</p>
            <p className="text-[10px] mb-1">FDRL0001817</p>
            <p className="text-[10px] font-bold mb-0.5">Branch</p>
            <p className="text-[10px]">ORAGADAM</p>
          </div>
          <div className="p-2 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-right">for RK ENTERPRISES</p>
            </div>
            <div className="text-right mt-4 h-10 border-b border-black"></div>
            <p className="text-[10px] text-right font-bold">Authorized Signature</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .no-print {
            display: none;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
