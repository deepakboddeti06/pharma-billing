import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Printer, Edit, ArrowLeft, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { get, del } from '../api/api.js';

export default function InvoiceView() {
  const { id } = useParams();
  const nav = useNavigate();

  const { data: inv, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => get(`/invoices/${id}`),
  });

  const delMut = useMutation({
    mutationFn: () => del(`/invoices/${id}`),
    onSuccess: () => {
      toast.success('Invoice deleted');
      nav('/invoices');
    },
    onError: () => toast.error('Failed to delete invoice'),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400">Loading invoice...</div>;
  }

  if (!inv) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Invoice not found.</p>
        <Link to="/invoices" className="btn btn-primary mt-4">Back to Invoices</Link>
      </div>
    );
  }

  const s = inv.settings || {};
  const b = inv.client || {};
  const c = inv.shipTo || b;
  const items = inv.items || [];

  const handlePrint = () => {
    window.print();
  };

  const formatBillDate = (dStr) => {
    if (!dStr) return '';
    if (dStr.includes('/')) return dStr;
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const y = parts[0];
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      return `${d}/${m}/${y}`;
    }
    return dStr;
  };

  // Calibrated for standard Indian Half-Page A4 Bill of Supply
  const targetRows = 9;
  const blankHeight = Math.max(25, (targetRows - items.length) * 16);

  return (
    <div className="space-y-6 pb-16">
      {/* Action Bar (Hidden on Print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <Link to="/invoices" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800">
          <ArrowLeft size={16} /> Back to Invoices
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm(`Delete invoice ${inv.invoice_no}?`)) delMut.mutate();
            }}
            className="btn btn-secondary text-red-600 hover:bg-red-50 hover:border-red-200"
          >
            <Trash2 size={15} /> Delete
          </button>
          <Link to={`/invoices/${id}/edit`} className="btn btn-secondary">
            <Edit size={15} /> Edit Invoice
          </Link>
          <button onClick={handlePrint} className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 shadow-md">
            <Printer size={16} /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          EXACT REPRODUCTION OF BILL OF SUPPLY FORMAT
          Matches uploaded bill format 1-to-1
          ═══════════════════════════════════════════════════════ */}
      <div className="invoice-print-wrapper bg-slate-100 p-2 sm:p-6 rounded-xl overflow-x-auto">
        <div className="bill-of-supply bg-white text-black font-sans mx-auto w-full max-w-[1020px] p-2 sm:p-4 text-[10px] leading-tight select-text shadow-md">
          {/* Centered Document Title */}
          <div className="text-center font-bold text-xs sm:text-sm tracking-wide mb-1 uppercase">
            BILL OF SUPPLY
          </div>

          {/* Outer Bordered Container - Uniform 1px boundary */}
          <div className="bill-outer-box border border-black box-border w-full bg-white">
            {/* Header / Parties Section (Fixed table layout with dedicated State row) */}
            <table className="w-full table-fixed border-collapse text-[9.5px]">
              <colgroup>
                <col style={{ width: '37%' }} />
                <col style={{ width: '27%' }} />
                <col style={{ width: '36%' }} />
              </colgroup>
              <tbody>
                {/* Row 1: Header party details */}
                <tr>
                  {/* Column 1: Supplier (Seller) */}
                  <td className="border-r border-black p-0 align-top">
                    <div>
                      {/* Inner Box for Agency Name & Address */}
                      <div className="border border-black m-1 p-1 text-center">
                        <div className="font-bold text-[11px] uppercase tracking-wide">
                          {s.name || 'SATYA SAI MEDICAL AGENCIES'}
                        </div>
                        <div className="text-[9px] mt-0.5">
                          plot no 143, Road No 8, Mothevari Thota, Pathebad
                        </div>
                        <div className="text-[9px] underline">
                          , E L U R U - 5 3 4 0 0 2.
                        </div>
                      </div>

                      {/* Supplier License & Tax Numbers */}
                      <div className="px-2 pt-1 pb-1 space-y-0.5 text-[9.5px]">
                        <div>
                          <span className="font-bold">GSTIN NUMBER: </span>
                          <span className="font-bold">{s.gstin || '37CBNPB8185P1ZR'}</span>
                        </div>
                        <div>20 B: {s.dl_20b || 'AP/05/01/2014-120610'}</div>
                        <div>21 B: {s.dl_21b || 'AP/05/01/2014-120611'}</div>
                        <div className="text-right pr-6 font-semibold">
                          <span className="font-bold">CELL &nbsp;: </span>{s.phone || '9491722324'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Receiver (Billed To) */}
                  <td className="border-r border-black p-0 align-top">
                    <div>
                      {/* Top Invoice Number Header cell */}
                      <div className="grid grid-cols-2 border-b border-black divide-x divide-black text-center font-bold text-[9.5px]">
                        <div className="py-0.5 uppercase">INVOICE NUMBER</div>
                        <div className="py-0.5 text-[10px] uppercase">{inv.invoice_no}</div>
                      </div>

                      {/* Party Title Header */}
                      <div className="flex justify-between items-center px-1.5 py-0.5 border-b border-black text-[9px]">
                        <span>Detail of Receiver</span>
                        <span>Billed to :</span>
                      </div>

                      {/* Receiver Information */}
                      <div className="px-1.5 py-1 space-y-0.5 text-[9.5px]">
                        <div>
                          <span className="font-bold">NAME &nbsp;&nbsp;&nbsp;: &nbsp;</span>
                          <span className="font-bold uppercase">{b.name}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-bold shrink-0">ADDRESS : &nbsp;</span>
                          <div className="text-[9px] leading-tight break-words overflow-hidden">
                            <div>{b.address || '—'}</div>
                            {b.phone && (
                              <div className="mt-0.5 font-normal">
                                <span className="font-semibold">CELL NO:</span>{b.phone}.
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="font-bold">GSTIN/UIN: &nbsp;</span>
                          <span className="font-semibold">{b.gstin || '—'}</span>
                        </div>
                        <div>
                          <span className="font-bold">20 B : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                          <span>{b.dl_20b || '—'}</span>
                        </div>
                        <div>
                          <span className="font-bold">21 B: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                          <span>{b.dl_21b || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Column 3: Consignee (Shipped To) */}
                  <td className="p-0 align-top">
                    <div>
                      {/* Top Invoice Date Header cell */}
                      <div className="grid grid-cols-2 border-b border-black divide-x divide-black text-center font-bold text-[9.5px]">
                        <div className="py-0.5 uppercase">INVOICE DATE:</div>
                        <div className="py-0.5 text-[10px]">{formatBillDate(inv.date)}</div>
                      </div>

                      {/* Party Title Header */}
                      <div className="flex justify-between items-center px-1.5 py-0.5 border-b border-black text-[9px]">
                        <span>Details of Consignee</span>
                        <span>Shipped to :</span>
                      </div>

                      {/* Consignee Information */}
                      <div className="px-1.5 py-1 space-y-0.5 text-[9.5px]">
                        <div>
                          <span className="font-bold">NAME &nbsp;&nbsp;&nbsp;&nbsp;: &nbsp;</span>
                          <span className="font-bold uppercase">{c.name || b.name}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-bold shrink-0">ADDRESS : &nbsp;</span>
                          <div className="text-[9px] leading-tight break-words overflow-hidden">
                            <div>{c.address || b.address || '—'}</div>
                            {(c.phone || b.phone) && (
                              <div className="mt-0.5 font-normal">
                                <span className="font-semibold">CELL NO:</span>{c.phone || b.phone}.
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="font-bold">GSTIN/UIN: &nbsp;</span>
                          <span className="font-semibold">{c.gstin || b.gstin || '—'}</span>
                        </div>
                        <div>
                          <span className="font-bold">20 B : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                          <span>{c.dl_20b || b.dl_20b || '—'}</span>
                        </div>
                        <div>
                          <span className="font-bold">21 B: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                          <span>{c.dl_21b || b.dl_21b || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Row 2: Unified Flat State Row across all 3 columns */}
                <tr className="border-t border-b border-black text-[9.5px]">
                  <td className="border-r border-black p-0">
                    <div className="grid grid-cols-2 divide-x divide-black bg-white">
                      <div className="px-1.5 py-0.5 font-normal">STATE : &nbsp; {s.state || 'AP'}</div>
                      <div className="px-1.5 py-0.5 font-normal">STATE CODE {s.state_code || '37'}</div>
                    </div>
                  </td>
                  <td className="border-r border-black p-0">
                    <div className="grid grid-cols-2 divide-x divide-black bg-white">
                      <div className="px-1.5 py-0.5 font-normal">STATE : &nbsp; {b.state || 'AP'}</div>
                      <div className="px-1.5 py-0.5 font-normal">STATE CODE: &nbsp; {b.state_code || '37'}</div>
                    </div>
                  </td>
                  <td className="p-0">
                    <div className="grid grid-cols-2 divide-x divide-black bg-white">
                      <div className="px-1.5 py-0.5 font-normal">STATE : &nbsp; {c.state || b.state || 'AP'}</div>
                      <div className="px-1.5 py-0.5 font-normal">STATE CODE: &nbsp; {c.state_code || b.state_code || '37'}</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Items Table & Totals */}
            <table className="bill-table w-full table-fixed border-collapse text-[9.5px]">
              <colgroup>
                {/* Zone 1: 5.5% + 7.5% + 24% = 37% (Matches Supplier column exactly) */}
                <col style={{ width: '5.5%' }} />
                <col style={{ width: '7.5%' }} />
                <col style={{ width: '24%' }} />
                {/* Zone 2: 8.5% + 5% + 4.5% + 5% + 4% = 27% (Matches Receiver column exactly) */}
                <col style={{ width: '8.5%' }} />
                <col style={{ width: '5%' }} />
                <col style={{ width: '4.5%' }} />
                <col style={{ width: '5%' }} />
                <col style={{ width: '4%' }} />
                {/* Zone 3: 3.5% + 5.5% + 5% + 7% + 5% + 10% = 36% (Matches Consignee column exactly) */}
                <col style={{ width: '3.5%' }} />
                <col style={{ width: '5.5%' }} />
                <col style={{ width: '5%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '5%' }} />
                <col style={{ width: '10%' }} />
              </colgroup>

              <thead>
                <tr className="border-b border-black font-bold text-center text-[9px] leading-tight bg-white">
                  <th className="border-r border-black p-1 uppercase">MFR</th>
                  <th className="border-r border-black p-1">
                    HSN<br />Code
                  </th>
                  <th className="border-r border-black p-1 text-center uppercase">PRODUCT NAME</th>
                  <th className="border-r border-black p-1">Batch No</th>
                  <th className="border-r border-black p-1">Expiry</th>
                  <th className="border-r border-black p-1 uppercase">UOM</th>
                  <th className="border-r border-black p-1 uppercase">MRP</th>
                  <th className="border-r border-black p-1">Qty</th>
                  <th className="border-r border-black p-1">Free</th>
                  <th className="border-r border-black p-1 uppercase">RATE</th>
                  <th className="border-r border-black p-1 uppercase">PTR</th>
                  <th className="border-r border-black p-1 uppercase">AMOUNT</th>
                  <th className="border-r border-black p-1 uppercase">
                    DISCO<br />UNT<br />%
                  </th>
                  <th className="p-1 uppercase">TOTAL</th>
                </tr>
              </thead>

              <tbody>
                {items.map((it, idx) => (
                  <tr key={it.id || idx} className="text-[9px] leading-tight">
                    <td className="border-r border-black px-1 py-0.5 text-left uppercase break-words">
                      {it.product?.mfr || it.mfr || ''}
                    </td>
                    <td className="border-r border-black px-0.5 py-0.5 text-center font-mono text-[8.5px] whitespace-nowrap overflow-hidden">
                      {it.product?.hsn || it.hsn || ''}
                    </td>
                    <td className="border-r border-black px-1 py-0.5 text-left font-medium uppercase break-words">
                      {it.product?.name || it.name || ''}
                    </td>
                    <td className="border-r border-black px-0.5 py-0.5 text-left font-mono text-[8.5px] uppercase whitespace-nowrap overflow-hidden">
                      {it.batch_no || ''}
                    </td>
                    <td className="border-r border-black px-0.5 py-0.5 text-center text-[8.5px] whitespace-nowrap">
                      {it.expiry || ''}
                    </td>
                    <td className="border-r border-black px-0.5 py-0.5 text-center uppercase text-[8.5px] whitespace-nowrap">
                      {it.uom || ''}
                    </td>
                    <td className="border-r border-black px-0.5 py-0.5 text-right font-mono text-[8.5px] whitespace-nowrap">
                      {Number(it.mrp || 0) > 0 ? Number(it.mrp).toFixed(2) : ''}
                    </td>
                    <td className="border-r border-black px-0.5 py-0.5 text-center font-semibold text-[8.5px] whitespace-nowrap">
                      {it.qty || ''}
                    </td>
                    <td className="border-r border-black px-0.5 py-0.5 text-center text-[8.5px] whitespace-nowrap">
                      {Number(it.free || 0) > 0 ? it.free : ''}
                    </td>
                    <td className="border-r border-black px-0.5 py-0.5 text-right font-mono text-[8.5px] whitespace-nowrap">
                      {Number(it.rate || 0) > 0 ? Number(it.rate).toFixed(2) : ''}
                    </td>
                    <td className="border-r border-black px-0.5 py-0.5 text-right font-mono text-[8.5px] whitespace-nowrap">
                      {Number(it.ptr || 0) > 0 ? Number(it.ptr).toFixed(2) : ''}
                    </td>
                    <td className="border-r border-black px-1 py-0.5 text-right font-mono font-medium text-[8.5px] whitespace-nowrap">
                      {Number(it.amount || 0).toFixed(2)}
                    </td>
                    <td className="border-r border-black px-0.5 py-0.5 text-center font-mono text-[8.5px] whitespace-nowrap">
                      {Number(it.discount_pct || 0) > 0 ? `${it.discount_pct}` : ''}
                    </td>
                    <td className="px-1 py-0.5 text-right font-mono font-medium text-[8.5px] whitespace-nowrap">
                      {Number(it.total || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}

                {/* Vertical grid filler row that matches traditional billing stationary */}
                <tr style={{ height: `${blankHeight}px` }}>
                  <td className="border-r border-black">&nbsp;</td>
                  <td className="border-r border-black">&nbsp;</td>
                  <td className="border-r border-black">&nbsp;</td>
                  <td className="border-r border-black">&nbsp;</td>
                  <td className="border-r border-black">&nbsp;</td>
                  <td className="border-r border-black">&nbsp;</td>
                  <td className="border-r border-black">&nbsp;</td>
                  <td className="border-r border-black">&nbsp;</td>
                  <td className="border-r border-black">&nbsp;</td>
                  <td className="border-r border-black">&nbsp;</td>
                  <td className="border-r border-black">&nbsp;</td>
                  <td className="border-r border-black">&nbsp;</td>
                  <td className="border-r border-black">&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              </tbody>

              {/* Totals & Bottom Summary */}
              <tfoot>
                {/* Row 1: TOTAL QUNTITY & TOTAL */}
                <tr className="border-t border-b border-black font-bold">
                  <td colSpan={7} className="border-r border-black pr-2 text-right text-[10px]">
                    TOTAL QUNTITY
                  </td>
                  <td className="border-r border-black text-center text-[10px]">
                    {inv.total_qty}
                  </td>
                  <td colSpan={5} className="border-r border-black pr-2 text-right text-[10px]">
                    TOTAL
                  </td>
                  <td className="text-right pr-1 font-mono text-[10px]">
                    {Number(inv.subtotal).toFixed(2)}
                  </td>
                </tr>

                {/* Row 2: DISCOUNT */}
                <tr className="border-b border-black font-bold">
                  <td colSpan={8} className="border-r border-black h-4">&nbsp;</td>
                  <td colSpan={5} className="border-r border-black pr-2 text-right text-[10px]">
                    DISCOUNT
                  </td>
                  <td className="text-right pr-1 font-mono text-[10px]">
                    {Number(inv.discount || 0) === 0 ? '0' : Number(inv.discount).toFixed(2)}
                  </td>
                </tr>

                {/* Row 3: AMOUNT IN WORDS & ROUND OFF */}
                <tr className="border-b border-black">
                  <td colSpan={8} className="border-r border-black px-2 py-0.5 text-[9.5px]">
                    <span className="font-bold">TOTAL INVOICE VALUE IN WORDS:</span>
                    <span className="ml-4 font-semibold uppercase">{inv.amount_in_words || '—'}</span>
                  </td>
                  <td colSpan={5} className="border-r border-black pr-2 text-right font-bold text-[10px]">
                    ROUND OFF
                  </td>
                  <td className="text-right pr-1 font-mono font-bold text-[10px]">
                    {inv.round_off ? (inv.round_off > 0 ? `+${Number(inv.round_off).toFixed(2)}` : Number(inv.round_off).toFixed(2)) : '-0.00'}
                  </td>
                </tr>

                {/* Row 4: BANK DETAILS & NET TOTAL */}
                <tr className="border-b border-black">
                  <td colSpan={8} className="border-r border-black px-2 py-0.5 text-[9px] leading-tight">
                    <span className="font-bold">BANK NAME: </span>
                    <span className="font-semibold">{s.bank_name || 'State Bank of India R.R.Pet,Eluru. BR'}, </span>
                    <span className="font-bold">ACCOUNT NO: </span>
                    <span className="font-semibold">{s.account_no || '37047328014'}, </span>
                    <span className="font-bold">IFSC CODE: </span>
                    <span className="font-semibold">{s.ifsc_code || s.ifsc || 'SBIN0009771'}</span>
                  </td>
                  <td colSpan={5} className="border-r border-black pr-2 text-right font-bold text-[10.5px]">
                    NET TOTAL
                  </td>
                  <td className="text-right pr-1 font-mono font-bold text-[11px]">
                    {Number(inv.net_total).toFixed(2)}
                  </td>
                </tr>

                {/* Row 5: DECLARATION & SIGNATURE */}
                <tr className="border-b border-black">
                  <td colSpan={8} className="border-r border-black border-b border-black px-2 py-1 align-top text-[8.5px] leading-snug">
                    <div className="font-normal">Certifies that the particulars given above are true and correct.</div>
                    <div>1.Drugs Supplied under this invoice comply with the previous of section 18 of Drugs Cosmotio Act.1940</div>
                    <div>2.Goods are sold on an understaning that buyer is holding all requisite valid drug Municipal tax.</div>
                    <div>3. No climes for shortages, damages & breakages etc, will be enertained once the goods leaves our</div>
                    <div className="flex justify-between">
                      <span>4. Sold to as per company price list erms,</span>
                      <span className="pr-2">5.All disputes are Subjected to Eluru Jurisdiction Only.</span>
                    </div>
                    <div className="mt-0.5 font-normal">Composit dealer, not eligible to collect tax on supplies</div>
                  </td>
                  <td colSpan={6} className="border-b border-black px-3 py-1.5 align-top text-right text-[9.5px]">
                    <div className="font-bold text-[10px]">
                      For &nbsp;&nbsp; {s.name || 'SATYASAI MEDICAL AGENCIES,'}
                    </div>
                    <div className="h-7"></div>
                    <div className="text-center text-[9.5px] font-normal">
                      Authirised signetore
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
