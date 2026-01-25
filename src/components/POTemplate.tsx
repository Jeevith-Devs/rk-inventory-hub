import { usePurchaseOrder } from '@/hooks/usePurchaseOrders';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useEffect } from 'react';
import { format } from 'date-fns';

interface POTemplateProps {
    poId: string;
}

export function POTemplate({ poId }: POTemplateProps) {
    const { data: po, isLoading } = usePurchaseOrder(poId);
    const { data: company } = useCompanySettings();

    useEffect(() => {
        if (po) {
            document.title = `PO ${po.po_number}`;
        }
        return () => {
            document.title = 'RK Inventory Hub';
        };
    }, [po]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!po) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-lg text-muted-foreground">Purchase Order not found</p>
            </div>
        );
    }

    const vendor = po.suppliers;
    const items = po.purchase_order_items || [];

    return (
        <div className="bg-white min-h-screen">
            <style>{`
        @media print {
          @page {
            size: A4;
            margin: 8mm 10mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

            <div className="max-w-[210mm] mx-auto bg-white p-6 print:p-3">
                {/* Header - PURCHASE ORDER */}
                <div className="bg-green-600 text-white text-center py-1 text-sm font-bold mb-3">
                    PURCHASE ORDER
                </div>

                {/* Logo and PO Details */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* Left: Logo */}
                    <div className="border-2 border-blue-600 bg-blue-50 p-3 flex items-center gap-3">
                        <img
                            src="/rk-logo.svg"
                            alt="Company Logo"
                            className="w-20 h-20 object-contain flex-shrink-0"
                        />
                        <div>
                            <h1 className="text-lg font-bold text-blue-700 leading-tight">
                                {company?.company_name || 'SMR PACKAGING SOLUTIONS'}
                            </h1>
                            <p className="text-[10px] text-black">All consumables in One Solution</p>
                        </div>
                    </div>

                    {/* Right: PO Details */}
                    <div className="border-2 border-blue-600">
                        <div className="bg-cyan-500 text-white px-3 py-1 text-sm font-bold text-center">
                            Purchase Order NO: {po.po_number}
                        </div>
                        <div className="p-2 space-y-0.5 text-xs text-black">
                            <div className="grid grid-cols-2 gap-1">
                                <span className="font-semibold">DATE</span>
                                <span className="text-right">{format(new Date(po.po_date), 'dd-MM-yyyy')}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                                <span className="font-semibold">REVISION NO.</span>
                                <span className="text-right">{po.revision_no || 'R1'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                                <span className="font-semibold">QUOTATION REF.</span>
                                <span className="text-right">{po.quotation_ref || 'N/A'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                                <span className="font-semibold">Payment Term</span>
                                <span className="text-right">{po.payment_term || '30 Days'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                                <span className="font-semibold">Transportation</span>
                                <span className="text-right">{po.transportation || 'Own Scope'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                                <span className="font-semibold">Delivery Term</span>
                                <span className="text-right">{po.delivery_term || '3 Days'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer and Vendor Details */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* Customer (SMR) Details */}
                    <div className="border border-gray-400">
                        <div className="bg-green-600 text-white px-2 py-1 text-xs font-bold">
                            CUSTOMER (SMR) DETAILS
                        </div>
                        <div className="p-2 text-xs text-black">
                            <p className="font-bold text-sm mb-1">{company?.company_name || 'SMR PACKAGING SOLUTIONS'}</p>
                            <p className="text-[10px] leading-tight mb-2">
                                {company?.address || 'NO.23/2, Part, GreenAcres, 2ndLayout, Mathur'}<br />
                                {company?.city && `${company.city}, `}{company?.state || 'Sriperumbudur, Tamil Nadu'}<br />
                                {company?.pincode || '602105'}
                            </p>

                            <p className="font-semibold text-xs mt-2 mb-0.5">CUSTOMER Contacts</p>
                            <p className="text-[10px]">
                                {company?.phone || '+91 7904982523'}<br />
                                {company?.email || 'rk.enterprises.tn.2025@gmail.com'}
                            </p>

                            {company?.gst_no && (
                                <p className="font-bold text-xs mt-2">
                                    GSTIN: <span className="font-normal">{company.gst_no}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Vendor Details */}
                    <div className="border border-gray-400">
                        <div className="bg-green-600 text-white px-2 py-1 text-xs font-bold">
                            VENDOR DETAILS
                        </div>
                        <div className="p-2 text-xs text-black">
                            <p className="font-bold text-sm mb-1">{vendor?.company_name || 'N/A'}</p>
                            <p className="text-[10px] leading-tight mb-2">
                                {vendor?.address ? (
                                    <>
                                        {vendor.address}<br />
                                        {vendor.city && `${vendor.city}, `}{vendor.state && `${vendor.state} `}{vendor.pincode}
                                    </>
                                ) : 'Address not available'}
                            </p>

                            <p className="font-semibold text-xs mt-2 mb-0.5">VENDOR Contacts</p>
                            <p className="text-[10px]">
                                {vendor?.contact_person || 'Contact not available'}<br />
                                {vendor?.phone || 'Phone not available'}
                            </p>

                            {vendor?.gst_no && (
                                <p className="font-bold text-xs mt-2">
                                    GSTIN: <span className="font-normal">{vendor.gst_no}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                <table className="w-full border-collapse border border-gray-400 mb-3 text-[10px] text-black">
                    <thead>
                        <tr className="bg-blue-900 text-white">
                            <th className="border border-gray-400 px-1 py-1.5 text-left w-6">#</th>
                            <th className="border border-gray-400 px-1 py-1.5 text-left w-16">PART NO.</th>
                            <th className="border border-gray-400 px-1 py-1.5 text-left">PRODUCT DESCRIPTION</th>
                            <th className="border border-gray-400 px-1 py-1.5 text-center w-16">HSN CODE</th>
                            <th className="border border-gray-400 px-1 py-1.5 text-center w-12">ORDER QTY</th>
                            <th className="border border-gray-400 px-1 py-1.5 text-center w-12">UOM</th>
                            <th className="border border-gray-400 px-1 py-1.5 text-right w-16">UNIT RATE</th>
                            <th className="border border-gray-400 px-1 py-1.5 text-right w-16">TOTAL BASIC</th>
                            <th className="border border-gray-400 px-1 py-1.5 text-center w-10">SGST</th>
                            <th className="border border-gray-400 px-1 py-1.5 text-center w-10">CGST</th>
                            <th className="border border-gray-400 px-1 py-1.5 text-right w-16">SGST</th>
                            <th className="border border-gray-400 px-1 py-1.5 text-right w-16">CGST</th>
                            <th className="border border-gray-400 px-1 py-1.5 text-right w-20">ORDER VALUE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => {
                            const product = item.products;
                            const taxHalf = (item.tax_percent || 0) / 2;

                            return (
                                <tr key={item.id} className="bg-white">
                                    <td className="border border-gray-400 px-1 py-1.5 text-center font-semibold">{index + 1}</td>
                                    <td className="border border-gray-400 px-1 py-1.5">{product?.product_code || 'N/A'}</td>
                                    <td className="border border-gray-400 px-1 py-1.5">{product?.name || 'N/A'}</td>
                                    <td className="border border-gray-400 px-1 py-1.5 text-center">{product?.hsn_code || 'N/A'}</td>
                                    <td className="border border-gray-400 px-1 py-1.5 text-center">{item.order_quantity}</td>
                                    <td className="border border-gray-400 px-1 py-1.5 text-center">{product?.unit || 'Nos'}</td>
                                    <td className="border border-gray-400 px-1 py-1.5 text-right">{item.unit_rate.toFixed(2)}</td>
                                    <td className="border border-gray-400 px-1 py-1.5 text-right font-bold">{item.total_basic.toFixed(2)}</td>
                                    <td className="border border-gray-400 px-1 py-1.5 text-center">{taxHalf}%</td>
                                    <td className="border border-gray-400 px-1 py-1.5 text-center">{taxHalf}%</td>
                                    <td className="border border-gray-400 px-1 py-1.5 text-right">{(item.sgst_amount || 0).toFixed(2)}</td>
                                    <td className="border border-gray-400 px-1 py-1.5 text-right">{(item.cgst_amount || 0).toFixed(2)}</td>
                                    <td className="border border-gray-400 px-1 py-1.5 text-right font-bold">{item.order_value.toFixed(2)}</td>
                                </tr>
                            );
                        })}

                        {/* Empty rows */}
                        {[...Array(Math.max(0, 5 - items.length))].map((_, i) => (
                            <tr key={`empty-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                                <td className="border border-gray-400 px-1 py-2">&nbsp;</td>
                                <td className="border border-gray-400 px-1 py-2">&nbsp;</td>
                                <td className="border border-gray-400 px-1 py-2">&nbsp;</td>
                                <td className="border border-gray-400 px-1 py-2">&nbsp;</td>
                                <td className="border border-gray-400 px-1 py-2">&nbsp;</td>
                                <td className="border border-gray-400 px-1 py-2">&nbsp;</td>
                                <td className="border border-gray-400 px-1 py-2">&nbsp;</td>
                                <td className="border border-gray-400 px-1 py-2">&nbsp;</td>
                                <td className="border border-gray-400 px-1 py-2">&nbsp;</td>
                                <td className="border border-gray-400 px-1 py-2">&nbsp;</td>
                                <td className="border border-gray-400 px-1 py-2">&nbsp;</td>
                                <td className="border border-gray-400 px-1 py-2">&nbsp;</td>
                                <td className="border border-gray-400 px-1 py-2">&nbsp;</td>
                            </tr>
                        ))}

                        {/* Total Row */}
                        <tr className="bg-white font-bold text[11px]">
                            <td colSpan={4} className="border border-gray-400 px-1 py-1.5 text-right">
                                {items.reduce((sum, item) => sum + item.order_quantity, 0).toFixed(2)}
                            </td>
                            <td colSpan={3} className="border border-gray-400 px-1 py-1.5 text-right">TOTAL</td>
                            <td className="border border-gray-400 px-1 py-1.5 text-right">{po.subtotal?.toFixed(2) || '0.00'}</td>
                            <td colSpan={2} className="border border-gray-400 px-1 py-1.5"></td>
                            <td className="border border-gray-400 px-1 py-1.5 text-right">{po.sgst_amount?.toFixed(2) || '0.00'}</td>
                            <td className="border border-gray-400 px-1 py-1.5 text-right">{po.cgst_amount?.toFixed(2) || '0.00'}</td>
                            <td className="border border-gray-400 px-1 py-1.5 text-right">{po.grand_total?.toFixed(2) || '0.00'}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Terms & Conditions Footer */}
                <div className="relative">
                    <div className="grid grid-cols-[1fr_auto] gap-4">
                        {/* Left: Terms */}
                        <div>
                            <div className="bg-green-600 text-white px-2 py-1 text-xs font-bold mb-1">
                                TERMS & CONDITIONS
                            </div>
                            <div className="text-[9px] space-y-0.5 pl-2 text-black">
                                {po.terms_conditions ? (
                                    po.terms_conditions.split('\n').map((line, i) => (
                                        <p key={i}>{i + 1}. {line}</p>
                                    ))
                                ) : (
                                    <>
                                        <p>1. Delivery with in 3 to 5 days from purchase order</p>
                                        <p>2. <strong>Payment with in 30 days from date of invoice</strong></p>
                                        <p>3. Price revision applicable whenever there is increase or decrease in the raw materials price, The same to intimated in advance and mutually agreed</p>
                                        <p>4. Kindly Supply The Materials As Per Drawing</p>
                                        <p>5. Price revision applicable whenever there is increase or decrease in the raw materials price</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right: Signature */}
                        <div className="text-right pr-2 text-black">
                            <p className="text-[9px] font-semibold">
                                for {company?.company_name?.toUpperCase() || 'SMR PACKAGING SOLUTIONS'}
                            </p>
                            <img
                                src="/sign.png"
                                alt="Signature"
                                className="h-12 ml-auto"
                            />
                            <p className="text-xs font-bold">Authorised Signatory</p>
                        </div>
                    </div>
                </div>

                {/* Page Number */}
                <div className="mt-3 text-right">
                    <div className="bg-blue-900 text-white inline-block px-4 py-1 text-xs font-bold">
                        PAGE: 1 / 1
                    </div>
                </div>
            </div>
        </div>
    );
}
