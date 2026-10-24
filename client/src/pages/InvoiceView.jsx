import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Printer, Edit, ArrowLeft, Trash2, Download } from 'lucide-react';
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
  const c = inv.ship_to_client || b;
  const items = inv.items || [];

  // Pad blank rows so the printed table has a consistent traditional bill height
  const minRows = 8;
  const padCount = Math.max(0, minRows - items.length);
  const blankRows = Array.from({ length: padCount });

  const handlePrint = () => {
    window.print();
  };

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
          A4 LANDSCAPE BILL OF SUPPLY CONTAINER
          Matches index.css print rules & on-screen preview
          ═══════════════════════════════════════════════════════ */}
      <div className="invoice-print-page bg-white p-6 md:p-8 rounded-xl shadow-lg border border-slate-300 max-w-[1100px] mx-auto text-black font-sans">
        {/* Title */}
        <h1 className="inv-title text-center text-xl md:text-2xl font-black uppercase tracking-widest border-b-2 border-black pb-1 mb-2">
          BILL OF SUPPLY
        </h1>

        {/* Top meta row */}
        <div className="inv-meta flex justify-between items-center text-xs font-bold mb-2">
          <div className="text-slate-700">GST INVOICE / CASH MEMO</div>
          <div className="flex gap-8">
            <div>
              <span>Invoice No: </span>
              <span className="font-black text-black text-sm">{inv.invoice_no}</span>
            </div>
            <div>
              <span>Date: </span>
              <span className="font-black text-black">{inv.date}</span>
            </div>
          </div>
        </div>

        {/* 3 Parties Block */}
        <div className="inv-parties grid grid-cols-1 md:grid-cols-3 border border-black mb-2 text-[11px] leading-tight divide-y md:divide-y-0 md:divide-x divide-black">
          {/* Seller */}
          <div className="inv-party-block p-2">
            <div className="inv-party-title font-bold uppercase border-b border-black pb-1 mb-1 text-[10px]">
              Details of Supplier (Seller)
            </div>
            <div className="inv-party-name font-black text-xs text-black">{s.name || 'SATYA SAI MEDICAL AGENCIES'}</div>
            <div>{s.address}</div>
            <div>Cell: {s.phone}</div>
            <div>GSTIN: <span className="font-semibold">{s.gstin}</span></div>
            <div>D.L.No: 20B: {s.dl_20b} | 21B: {s.dl_21b}</div>
            <div>State: {s.state} (Code: {s.state_code})</div>
          </div>

          {/* Billed To */}
          <div className="inv-party-block p-2">
            <div className="inv-party-title font-bold uppercase border-b border-black pb-1 mb-1 text-[10px]">
              Details of Receiver (Billed To)
            </div>
            <div className="inv-party-name font-black text-xs text-black">{b.name}</div>
            <div>{b.address || '—'}</div>
            <div>Phone: {b.phone || '—'}</div>
            <div>GSTIN: <span className="font-semibold">{b.gstin || '—'}</span></div>
            <div>D.L.No: 20B: {b.dl_20b || '—'} | 21B: {b.dl_21b || '—'}</div>
            <div>State: {b.state || 'Andhra Pradesh'} (Code: {b.state_code || '37'})</div>
          </div>

          {/* Shipped To */}
          <div className="inv-party-block p-2">
            <div className="inv-party-title font-bold uppercase border-b border-black pb-1 mb-1 text-[10px]">
              Details of Consignee (Shipped To)
            </div>
            <div className="inv-party-name font-black text-xs text-black">{c.name}</div>
            <div>{c.address || b.address || '—'}</div>
            <div>Phone: {c.phone || b.phone || '—'}</div>
            <div>GSTIN: <span className="font-semibold">{c.gstin || b.gstin || '—'}</span></div>
            <div>D.L.No: 20B: {c.dl_20b || b.dl_20b || '—'} | 21B: {c.dl_21b || b.dl_21b || '—'}</div>
            <div>State: {c.state || b.state || 'Andhra Pradesh'} (Code: {c.state_code || b.state_code || '37'})</div>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="inv-table w-full border-collapse border border-black text-[10px] text-center">
            <thead>
              <tr className="bg-black text-white font-bold text-[9px] uppercase">
                <th className="border border-black p-1">#</th>
                <th className="border border-black p-1 text-left min-w-[140px]">Product / Tablet</th>
                <th className="border border-black p-1">MFR</th>
                <th className="border border-black p-1">HSN</th>
                <th className="border border-black p-1">Batch</th>
                <th className="border border-black p-1">Exp</th>
                <th className="border border-black p-1">UOM</th>
                <th className="border border-black p-1 text-right">MRP ₹</th>
                <th className="border border-black p-1 text-center font-black">Qty</th>
                <th className="border border-black p-1 text-center">Free</th>
                <th className="border border-black p-1 text-right font-black">Rate ₹</th>
                <th className="border border-black p-1 text-right">PTR ₹</th>
                <th className="border border-black p-1 text-right">Amount ₹</th>
                <th className="border border-black p-1 text-center">Disc %</th>
                <th className="border border-black p-1 text-right font-black">Total ₹</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id || idx} className="border-b border-black">
                  <td className="border border-black p-1 text-center">{idx + 1}</td>
                  <td className="border border-black p-1 text-left font-bold">{it.product?.name || it.name}</td>
                  <td className="border border-black p-1 text-center">{it.product?.mfr || it.mfr || '—'}</td>
                  <td className="border border-black p-1 text-center font-mono">{it.product?.hsn || it.hsn || '—'}</td>
                  <td className="border border-black p-1 text-center font-mono">{it.batch_no || '—'}</td>
                  <td className="border border-black p-1 text-center">{it.expiry || '—'}</td>
                  <td className="border border-black p-1 text-center">{it.uom || 'NOS'}</td>
                  <td className="border border-black p-1 text-right">{Number(it.mrp || 0).toFixed(2)}</td>
                  <td className="border border-black p-1 text-center font-black text-xs">{it.qty}</td>
                  <td className="border border-black p-1 text-center">{it.free || 0}</td>
                  <td className="border border-black p-1 text-right font-bold">{Number(it.rate || 0).toFixed(2)}</td>
                  <td className="border border-black p-1 text-right">{Number(it.ptr || 0).toFixed(2)}</td>
                  <td className="border border-black p-1 text-right">{Number(it.amount || 0).toFixed(2)}</td>
                  <td className="border border-black p-1 text-center">{it.discount_pct || 0}%</td>
                  <td className="border border-black p-1 text-right font-black text-xs">{Number(it.total || 0).toFixed(2)}</td>
                </tr>
              ))}

              {/* Blank spacing rows */}
              {blankRows.map((_, i) => (
                <tr key={`blank-${i}`} className="blank-row border-b border-black">
                  <td className="border border-black p-1 text-transparent select-none">-</td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Box */}
        <table className="inv-totals w-full border border-black border-t-0 text-[10px]">
          <tbody>
            <tr>
              <td className="border border-black p-1 font-bold bg-slate-100 text-slate-800 text-left" colSpan={7}>
                Total Items: {items.length}
              </td>
              <td className="border border-black p-1 font-bold text-center">
                Total Qty: <span className="text-xs font-black">{inv.total_qty}</span>
              </td>
              <td className="border border-black p-1 font-bold text-right bg-slate-100">Subtotal:</td>
              <td className="border border-black p-1 font-black text-right w-24">₹{Number(inv.subtotal).toFixed(2)}</td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold text-right bg-slate-50" colSpan={8}>
                Bill Discount:
              </td>
              <td className="border border-black p-1 font-bold text-right" colSpan={2}>
                - ₹{Number(inv.discount || 0).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold text-right bg-slate-50" colSpan={8}>
                Round Off:
              </td>
              <td className="border border-black p-1 font-bold text-right" colSpan={2}>
                {inv.round_off >= 0 ? `+₹${Number(inv.round_off).toFixed(2)}` : `-₹${Math.abs(Number(inv.round_off)).toFixed(2)}`}
              </td>
            </tr>
            <tr className="bg-slate-200 text-black">
              <td className="border border-black p-2 font-black text-xs text-right uppercase" colSpan={8}>
                Net Amount Payable:
              </td>
              <td className="border border-black p-2 font-black text-base text-right font-mono" colSpan={2}>
                ₹{Number(inv.net_total).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Amount in words */}
        <div className="inv-words border border-black border-t-0 p-2 text-xs font-bold bg-slate-50">
          Amount in Words: <span className="font-extrabold uppercase text-black">{inv.amount_in_words || '—'}</span>
        </div>

        {/* Footer: Terms, Bank Details, Signature */}
        <div className="inv-footer border border-black border-t-0 grid grid-cols-1 md:grid-cols-2 text-[10px] divide-y md:divide-y-0 md:divide-x divide-black">
          {/* Bank & Terms */}
          <div className="inv-footer-left p-3 space-y-2">
            <div>
              <span className="font-black uppercase text-[10px] block mb-0.5">Bank Details:</span>
              <p>Bank: <span className="font-bold">{s.bank_name || 'HDFC Bank'}</span></p>
              <p>A/C No: <span className="font-bold font-mono">{s.account_no || '50200000000000'}</span></p>
              <p>IFSC: <span className="font-bold font-mono">{s.ifsc || 'HDFC0000000'}</span></p>
            </div>
            <div className="pt-2 border-t border-dotted border-black">
              <span className="font-bold uppercase text-[9px] block">Terms & Conditions:</span>
              <ul className="list-disc pl-3 text-[9px] text-slate-700 space-y-0.5">
                <li>Goods once sold will not be taken back or exchanged.</li>
                <li>Interest @ 24% p.a. will be charged if payment is not received within due date.</li>
                <li>Subject to Eluru jurisdiction only.</li>
              </ul>
            </div>
          </div>

          {/* Signatory */}
          <div className="inv-footer-right p-4 flex flex-col justify-between items-end text-right">
            <div>
              <p className="font-bold text-xs uppercase">For {s.name || 'SATYA SAI MEDICAL AGENCIES'}</p>
            </div>
            <div className="inv-footer-sig mt-12 pt-1 border-t border-black w-48 text-center text-[10px] font-bold">
              Authorised Signatory
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
