import { useQuotation } from '@/hooks/useQuotations';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useEffect } from 'react';
import { format } from 'date-fns';

interface QuotationTemplateProps {
    quotationId: string;
}

export function QuotationTemplate({ quotationId }: QuotationTemplateProps) {
    const { data: quotation, isLoading } = useQuotation(quotationId);
    const { data: company } = useCompanySettings();

    useEffect(() => {
        if (quotation) {
            document.title = `Quotation ${quotation.quotation_number}`;
        }
        return () => {
            document.title = 'RK Inventory Hub';
        };
    }, [quotation]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!quotation) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-lg text-muted-foreground">Quotation not found</p>
            </div>
        );
    }

    const buyer = quotation.buyers;
    const items = quotation.quotation_items || [];

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
                {/* Header - Logo on Left, Quotation Details on Right */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* Left: Logo Section */}
                    <div className="border-2 border-blue-600 bg-blue-50 p-3 flex items-center gap-3">
                        <img
                            src="/rk-logo.svg"
                            alt="RK Enterprises Logo"
                            className="w-20 h-20 object-contain flex-shrink-0"
                        />
                        <div>
                            <h1 className="text-lg font-bold text-blue-700 leading-tight">
                                {company?.company_name || 'RK ENTERPRISES'}
                            </h1>
                            <p className="text-xs text-black">Inventory Management</p>
                        </div>
                    </div>
                    {/* Right: Quotation Reference */}
                    <div className="border-2 border-blue-600">
                        <div className="bg-blue-500 text-white px-3 py-1 text-sm font-bold text-center">
                            QUOTATION REF. NO: {quotation.quotation_number}
                        </div>
                        <div className="p-2 space-y-0.5 text-xs text-black">
                            <div className="grid grid-cols-2 gap-1">
                                <span className="font-semibold">DATE</span>
                                <span className="text-right">{format(new Date(quotation.quotation_date), 'dd-MMM-yy')}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                                <span className="font-semibold">REVISION NO.</span>
                                <span className="text-right">R1</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                                <span className="font-semibold">CUST ID</span>
                                <span className="text-right font-bold">{quotation.quotation_number}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                                <span className="font-semibold">END REF.</span>
                                <span className="text-right">
                                    {quotation.reference_no || `Valid till: ${format(new Date(quotation.valid_until), 'dd-MMM-yyyy')}`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Supplier and Customer Details */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* Supplier Details */}
                    <div className="border border-gray-400">
                        <div className="bg-green-600 text-white px-2 py-1 text-xs font-bold">
                            SUPPLIER DETAILS
                        </div>
                        <div className="p-2 text-xs text-black">
                            <p className="font-bold text-sm mb-1">{company?.company_name || 'RK ENTERPRISES'}</p>
                            <p className="text-[10px] leading-tight text-black mb-2">
                                {company?.address || 'Industrial Area, Sector 5'}<br />
                                {company?.city || 'New Delhi'}, {company?.state || 'Delhi'}<br />
                                India - {company?.pincode || '110001'}
                            </p>

                            <p className="font-semibold text-xs mt-2 mb-0.5">Supplier Contacts</p>
                            <p className="text-[10px] text-black">
                                {company?.phone || '+91 9876543210'}<br />
                                {company?.email || 'info@rkenterprises.com'}
                            </p>

                            {company?.gst_no && (
                                <p className="font-bold text-xs mt-2">
                                    GSTIN: <span className="font-normal">{company.gst_no}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Customer Details */}
                    <div className="border border-gray-400">
                        <div className="bg-green-600 text-white px-2 py-1 text-xs font-bold">
                            CUSTOMER DETAILS
                        </div>
                        <div className="p-2 text-xs text-black">
                            <p className="font-bold text-sm mb-1">{buyer?.company_name || 'N/A'}</p>
                            <p className="text-[10px] leading-tight text-black mb-2">
                                {buyer?.billing_address || buyer?.delivery_address || 'Address not available'}
                            </p>

                            <p className="font-semibold text-xs mt-2 mb-0.5">Customer Contacts</p>
                            <p className="text-[10px] text-black">
                                {buyer?.contact_person || 'Contact not available'}<br />
                                {buyer?.phone || 'Phone not available'}
                            </p>

                            {buyer?.gst_no && (
                                <p className="font-bold text-xs mt-2">
                                    GSTIN: <span className="font-normal">{buyer.gst_no}</span>
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
                            <th className="border border-gray-400 px-1 py-1.5 text-center w-12">SGST</th>
                            <th className="border border-gray-400 px-1 py-1.5 text-center w-12">CGST</th>
                            <th className="border border-gray-400 px-1 py-1.5 text-center w-12">MOQ</th>
                            <th className="border border-gray-400 px-1 py-1.5 text-center w-12">UOM</th>
                            <th className="border border-gray-400 px-1 py-1.5 text-right w-20">HSN/SAC RATE</th>
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
                                    <td className="border border-gray-400 px-1 py-1.5 text-center">{taxHalf}%</td>
                                    <td className="border border-gray-400 px-1 py-1.5 text-center">{taxHalf}%</td>
                                    <td className="border border-gray-400 px-1 py-1.5 text-center">{item.quantity}</td>
                                    <td className="border border-gray-400 px-1 py-1.5 text-center">{product?.unit || 'Kgs'}</td>
                                    <td className="border border-gray-400 px-1 py-1.5 text-right font-bold">
                                        {item.total_amount.toFixed(2)}
                                    </td>
                                </tr>
                            );
                        })}

                        {/* Empty rows to fill the table */}
                        {[...Array(Math.max(0, 8 - items.length))].map((_, i) => (
                            <tr key={`empty-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                                <td className="border border-gray-400 px-1 py-2.5">&nbsp;</td>
                                <td className="border border-gray-400 px-1 py-2.5">&nbsp;</td>
                                <td className="border border-gray-400 px-1 py-2.5">&nbsp;</td>
                                <td className="border border-gray-400 px-1 py-2.5">&nbsp;</td>
                                <td className="border border-gray-400 px-1 py-2.5">&nbsp;</td>
                                <td className="border border-gray-400 px-1 py-2.5">&nbsp;</td>
                                <td className="border border-gray-400 px-1 py-2.5">&nbsp;</td>
                                <td className="border border-gray-400 px-1 py-2.5">&nbsp;</td>
                                <td className="border border-gray-400 px-1 py-2.5">&nbsp;</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Terms & Conditions Footer */}
                <div className="relative">
                    <div className="bg-green-600 text-white px-2 py-1 text-xs font-bold mb-1">
                        TERMS & CONDITIONS
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-4">
                        {/* Left: Terms list */}
                        <div className="text-[9px] space-y-0.5 pl-2 text-black">
                            {quotation.terms_conditions ? (
                                quotation.terms_conditions.split('\n').map((line, i) => (
                                    <p key={i}>{i + 1}. {line}</p>
                                ))
                            ) : (
                                <>
                                    <p>1. Delivery within 5 days from purchase order</p>
                                    <p>2. Taxes extra as applicable</p>
                                    <p>3. Delivery charges - Extra if the order is less than the truck volume</p>
                                    <p>4. Die / Tooling Cost - Extra at actuals (applicable only for die cut box / packaging items)</p>
                                    <p>5. <strong>Payment within 30 days from date of invoice</strong></p>
                                    <p>6. Offer valid only for 30 days</p>
                                    <p>7. Price revision applicable whenever there is increase or decrease in the material's price</p>
                                </>
                            )}
                        </div>

                        {/* Right: Company name and signature */}
                        <div className="text-right pr-2 text-black">
                            <p className="text-[9px] font-semibold">
                                for {company?.company_name?.toUpperCase() || 'RK ENTERPRISES'}
                            </p>
                            <img
                                src="/sign.png"
                                alt="Authorized Signature"
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
