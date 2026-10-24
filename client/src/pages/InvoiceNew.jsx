import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Plus, Trash2, ArrowLeft, Save, Eye, Calculator,
  Store, Calendar, FileText, CheckSquare, Square
} from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post, put } from '../api/api.js';

export default function InvoiceNew() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const prefillClientId = sp.get('client');
  const isEdit = Boolean(id);
  const nav = useNavigate();

  const [invoiceNo, setInvoiceNo] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [clientId, setClientId] = useState(prefillClientId || '');
  const [shipSame, setShipSame] = useState(true);
  const [shipClientId, setShipClientId] = useState('');
  const [discountVal, setDiscountVal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState([
    {
      product_id: null,
      mfr: '',
      hsn: '',
      name: '',
      batch_no: '',
      expiry: '',
      uom: 'NOS',
      mrp: 0,
      qty: 1,
      free: 0,
      rate: 0,
      ptr: 0,
      amount: 0,
      discount_pct: 0,
      total: 0,
    },
  ]);

  // Fetch clients & products
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => get('/clients') });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => get('/products') });

  // If new invoice, fetch auto next invoice number
  const { data: nextNumData } = useQuery({
    queryKey: ['next-number'],
    queryFn: () => get('/invoices/next-number'),
    enabled: !isEdit,
  });

  useEffect(() => {
    if (!isEdit && nextNumData) {
      const num = nextNumData.next || nextNumData.invoice_no;
      if (num && !invoiceNo) {
        setInvoiceNo(num);
      }
    }
  }, [nextNumData, isEdit]);

  // Load prefilled items from shop page if any
  useEffect(() => {
    if (!isEdit) {
      const stored = sessionStorage.getItem('prefill_invoice_items');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setItems(parsed);
          }
        } catch (e) {
          console.error(e);
        }
        sessionStorage.removeItem('prefill_invoice_items');
      }
    }
  }, [isEdit]);

  // If edit mode, load existing invoice
  const { data: editInvoiceData } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => get(`/invoices/${id}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (editInvoiceData) {
      setInvoiceNo(editInvoiceData.invoice_no);
      setDate(editInvoiceData.date);
      setClientId(String(editInvoiceData.client_id));
      setShipSame(editInvoiceData.ship_same_as_billed);
      setShipClientId(editInvoiceData.ship_to_client_id ? String(editInvoiceData.ship_to_client_id) : '');
      setDiscountVal(editInvoiceData.discount || 0);
      if (editInvoiceData.items && editInvoiceData.items.length > 0) {
        setItems(
          editInvoiceData.items.map((it) => ({
            id: it.id,
            product_id: it.product_id,
            name: it.product?.name || it.name || '',
            mfr: it.product?.mfr || it.mfr || '',
            hsn: it.product?.hsn || it.hsn || '',
            batch_no: it.batch_no || '',
            expiry: it.expiry || '',
            uom: it.uom || 'NOS',
            mrp: it.mrp || 0,
            qty: it.qty || 1,
            free: it.free || 0,
            rate: it.rate || 0,
            ptr: it.ptr || 0,
            amount: it.amount || 0,
            discount_pct: it.discount_pct || 0,
            total: it.total || 0,
          }))
        );
      }
    }
  }, [editInvoiceData]);

  // Handle product selection in row
  const handleProductSelect = (index, prodId) => {
    const prod = products.find((p) => p.id === parseInt(prodId, 10));
    setItems((prev) => {
      const copy = [...prev];
      if (prod) {
        if ((prod.stock_qty ?? 0) <= 0) {
          toast.error(`Tablet "${prod.name}" has no stock available (Stock: 0)`);
        }
        const rate = copy[index].rate || 0;
        const qty = copy[index].qty || 1;
        const disc = copy[index].discount_pct || 0;
        const amount = qty * rate;
        const total = amount * (1 - disc / 100);
        copy[index] = {
          ...copy[index],
          product_id: prod.id,
          name: prod.name,
          mfr: prod.mfr || '',
          hsn: prod.hsn || '',
          uom: prod.uom || 'NOS',
          mrp: prod.mrp || 0,
          ptr: prod.ptr || 0,
          rate: rate,
          batch_no: prod.batch_no || '',
          expiry: prod.expiry || '',
          amount: Math.round(amount * 100) / 100,
          total: Math.round(total * 100) / 100,
        };
      }
      return copy;
    });
  };

  const updateItem = (index, field, val) => {
    setItems((prev) => {
      const copy = [...prev];
      const row = { ...copy[index], [field]: val };

      const qty = parseFloat(row.qty) || 0;
      const rate = parseFloat(row.rate) || 0;
      const disc = parseFloat(row.discount_pct) || 0;
      const amount = Math.round(qty * rate * 100) / 100;
      const total = Math.round(amount * (1 - disc / 100) * 100) / 100;

      row.amount = amount;
      row.total = total;
      copy[index] = row;
      return copy;
    });
  };

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      {
        product_id: null,
        mfr: '',
        hsn: '',
        name: '',
        batch_no: '',
        expiry: '',
        uom: 'NOS',
        mrp: 0,
        qty: 1,
        free: 0,
        rate: 0,
        ptr: 0,
        amount: 0,
        discount_pct: 0,
        total: 0,
      },
    ]);
  };

  const removeRow = (index) => {
    if (items.length <= 1) {
      toast.error('Invoice must have at least one line item');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const totalQty = items.reduce((sum, it) => sum + (parseInt(it.qty, 10) || 0), 0);
  const subtotal = Math.round(items.reduce((sum, it) => sum + (parseFloat(it.total) || 0), 0) * 100) / 100;
  const netBeforeRound = Math.max(0, subtotal - (parseFloat(discountVal) || 0));
  const roundedNet = Math.round(netBeforeRound);
  const roundOff = Math.round((roundedNet - netBeforeRound) * 100) / 100;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!invoiceNo.trim()) return toast.error('Invoice Number is required');
    if (!clientId) return toast.error('Please select a Billed To Client');
    if (items.some((it) => !it.name.trim())) return toast.error('All rows must have a product name');

    setLoading(true);
    try {
      const payload = {
        invoice_no: invoiceNo.trim(),
        date,
        client_id: parseInt(clientId, 10),
        ship_to_client_id: shipSame ? null : shipClientId ? parseInt(shipClientId, 10) : null,
        ship_same_as_billed: shipSame,
        total_qty: totalQty,
        subtotal,
        discount: parseFloat(discountVal) || 0,
        round_off: roundOff,
        net_total: roundedNet,
        items: items.map((it, idx) => ({
          product_id: it.product_id ? parseInt(it.product_id, 10) : null,
          name: it.name,
          mfr: it.mfr,
          hsn: it.hsn,
          batch_no: it.batch_no,
          expiry: it.expiry,
          uom: it.uom,
          mrp: parseFloat(it.mrp) || 0,
          qty: parseInt(it.qty, 10) || 0,
          free: parseInt(it.free, 10) || 0,
          rate: parseFloat(it.rate) || 0,
          ptr: parseFloat(it.ptr) || 0,
          amount: parseFloat(it.amount) || 0,
          discount_pct: parseFloat(it.discount_pct) || 0,
          total: parseFloat(it.total) || 0,
          sort_order: idx + 1,
        })),
      };

      if (isEdit) {
        await put(`/invoices/${id}`, payload);
        toast.success('Invoice updated successfully');
        nav(`/invoices/${id}`);
      } else {
        const created = await post('/invoices', payload);
        toast.success('Invoice generated successfully');
        nav(`/invoices/${created.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === parseInt(clientId, 10));

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link to="/invoices" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800">
          <ArrowLeft size={16} /> All Invoices
        </Link>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="btn btn-primary">
            <Save size={16} /> {loading ? 'Saving...' : isEdit ? 'Update Invoice' : 'Save & View Bill of Supply'}
          </button>
        </div>
      </div>

      {/* Invoice Meta Card */}
      <div className="card shadow-sm grid md:grid-cols-4 gap-4 bg-white">
        <div>
          <label className="label">Invoice No *</label>
          <input
            type="text"
            required
            className="field font-mono font-bold text-brand-700 uppercase"
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value.toUpperCase())}
            placeholder="A000034"
          />
        </div>
        <div>
          <label className="label">Invoice Date *</label>
          <input
            type="date"
            required
            className="field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="label">Billed To (Client / Shop) *</label>
          <select
            className="field font-semibold"
            value={clientId}
            required
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">-- Choose Medical Shop / Client --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Client Preview Details & Shipping */}
      {selectedClient && (
        <div className="card bg-slate-50 border border-slate-200 text-xs text-slate-600 p-4 grid md:grid-cols-3 gap-4">
          <div>
            <span className="font-bold text-slate-800 block text-sm">{selectedClient.name}</span>
            <p className="mt-1">{selectedClient.address || 'No address'}</p>
            <p className="mt-1">Phone: {selectedClient.phone || '—'}</p>
          </div>
          <div>
            <p><span className="font-semibold text-slate-700">GSTIN:</span> {selectedClient.gstin || 'None'}</p>
            <p className="mt-1"><span className="font-semibold text-slate-700">DL 20B:</span> {selectedClient.dl_20b || 'None'}</p>
            <p className="mt-1"><span className="font-semibold text-slate-700">DL 21B:</span> {selectedClient.dl_21b || 'None'}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 mb-2">
              <input
                type="checkbox"
                checked={shipSame}
                onChange={(e) => setShipSame(e.target.checked)}
                className="rounded text-brand-600 w-4 h-4"
              />
              Shipped to same address
            </label>
            {!shipSame && (
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">Select Consignee / Ship-To</label>
                <select
                  className="field-sm"
                  value={shipClientId}
                  onChange={(e) => setShipClientId(e.target.value)}
                >
                  <option value="">-- Select Consignee --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Line Items Table */}
      <div className="card p-0 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
          <h2 className="font-bold text-sm tracking-wide uppercase flex items-center gap-2">
            <FileText size={16} /> Bill of Supply Items ({items.length})
          </h2>
          <button type="button" onClick={addRow} className="btn btn-sm btn-primary bg-brand-500 hover:bg-brand-600">
            <Plus size={14} /> Add Row
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
              <tr>
                <th className="p-2 text-center w-8">#</th>
                <th className="p-2 w-48 min-w-[200px]">Product / Tablet Name</th>
                <th className="p-2 w-20">MFR</th>
                <th className="p-2 w-20">HSN</th>
                <th className="p-2 w-20">Batch</th>
                <th className="p-2 w-16">Expiry</th>
                <th className="p-2 w-14">UOM</th>
                <th className="p-2 w-16 text-right">MRP ₹</th>
                <th className="p-2 w-16 text-center">Qty</th>
                <th className="p-2 w-14 text-center">Free</th>
                <th className="p-2 w-20 text-right">Rate ₹</th>
                <th className="p-2 w-20 text-right">PTR ₹</th>
                <th className="p-2 w-20 text-right">Amount ₹</th>
                <th className="p-2 w-14 text-center">Disc %</th>
                <th className="p-2 w-24 text-right">Total ₹</th>
                <th className="p-2 text-center w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="p-2 text-center text-slate-400 font-semibold">{i + 1}</td>

                  {/* Product selector / text */}
                  <td className="p-1">
                    <div className="space-y-1">
                      <select
                        className="field-sm font-semibold text-slate-800"
                        value={row.product_id || ''}
                        onChange={(e) => handleProductSelect(i, e.target.value)}
                      >
                        <option value="">-- Choose Tablet / Custom --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.stock_qty <= 0 ? '(No Stock Available)' : `(Stock: ${p.stock_qty})`}
                          </option>
                        ))}
                      </select>
                      {row.product_id && (() => {
                        const selP = products.find((p) => p.id === parseInt(row.product_id, 10));
                        if (!selP) return null;
                        const isZero = (selP.stock_qty ?? 0) <= 0;
                        return (
                          <div className="flex items-center gap-1.5 text-[10px]">
                            {isZero ? (
                              <span className="text-red-700 font-bold bg-red-100 border border-red-200 px-1.5 py-0.5 rounded">
                                ⚠️ No stock available
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                Stock: {selP.stock_qty} {selP.uom}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                      <input
                        type="text"
                        required
                        className="field-sm uppercase"
                        placeholder="Product Name"
                        value={row.name}
                        onChange={(e) => updateItem(i, 'name', e.target.value)}
                      />
                    </div>
                  </td>

                  <td className="p-1">
                    <input
                      type="text"
                      className="field-sm uppercase text-slate-600"
                      placeholder="MFR"
                      value={row.mfr}
                      onChange={(e) => updateItem(i, 'mfr', e.target.value)}
                    />
                  </td>

                  <td className="p-1">
                    <input
                      type="text"
                      className="field-sm font-mono text-slate-600"
                      placeholder="HSN"
                      value={row.hsn}
                      onChange={(e) => updateItem(i, 'hsn', e.target.value)}
                    />
                  </td>

                  <td className="p-1">
                    <input
                      type="text"
                      className="field-sm font-mono uppercase text-slate-600"
                      placeholder="Batch"
                      value={row.batch_no}
                      onChange={(e) => updateItem(i, 'batch_no', e.target.value)}
                    />
                  </td>

                  <td className="p-1">
                    <input
                      type="text"
                      className="field-sm text-center text-slate-600"
                      placeholder="MM/YY"
                      value={row.expiry}
                      onChange={(e) => updateItem(i, 'expiry', e.target.value)}
                    />
                  </td>

                  <td className="p-1">
                    <input
                      type="text"
                      className="field-sm text-center text-slate-600"
                      placeholder="NOS"
                      value={row.uom}
                      onChange={(e) => updateItem(i, 'uom', e.target.value)}
                    />
                  </td>

                  <td className="p-1">
                    <input
                      type="number"
                      step="0.01"
                      className="field-sm text-right"
                      value={row.mrp || ''}
                      placeholder="0.00"
                      onChange={(e) => updateItem(i, 'mrp', e.target.value)}
                    />
                  </td>

                  <td className="p-1">
                    <input
                      type="number"
                      min="1"
                      required
                      className="field-sm text-center font-bold text-slate-900 bg-amber-50/50"
                      value={row.qty}
                      onChange={(e) => updateItem(i, 'qty', e.target.value)}
                    />
                  </td>

                  <td className="p-1">
                    <input
                      type="number"
                      min="0"
                      className="field-sm text-center text-slate-600"
                      value={row.free}
                      onChange={(e) => updateItem(i, 'free', e.target.value)}
                    />
                  </td>

                  <td className="p-1">
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="field-sm text-right font-semibold text-brand-700 bg-brand-50/50"
                      value={row.rate}
                      onChange={(e) => updateItem(i, 'rate', e.target.value)}
                    />
                  </td>

                  <td className="p-1">
                    <input
                      type="number"
                      step="0.01"
                      className="field-sm text-right text-slate-600"
                      value={row.ptr || ''}
                      placeholder="0.00"
                      onChange={(e) => updateItem(i, 'ptr', e.target.value)}
                    />
                  </td>

                  <td className="p-2 text-right font-mono text-slate-600">
                    {Number(row.amount).toFixed(2)}
                  </td>

                  <td className="p-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="field-sm text-center"
                      value={row.discount_pct || ''}
                      placeholder="0"
                      onChange={(e) => updateItem(i, 'discount_pct', e.target.value)}
                    />
                  </td>

                  <td className="p-2 text-right font-mono font-bold text-slate-900">
                    {Number(row.total).toFixed(2)}
                  </td>

                  <td className="p-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button type="button" onClick={addRow} className="btn btn-sm btn-secondary">
            <Plus size={14} /> Add Another Row
          </button>
          <span className="text-xs text-slate-500 font-medium">
            Total Items: {items.length} | Total Units: {totalQty}
          </span>
        </div>
      </div>

      {/* Totals Summary Card */}
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="card flex-1 p-5 bg-gradient-to-br from-brand-50 to-white border-brand-100">
          <h3 className="font-bold text-sm text-brand-900 mb-2">Billing Note</h3>
          <p className="text-xs text-brand-700 leading-relaxed">
            All rates, HSN codes, and batches are recorded on the Bill of Supply.
            Round off is automatically applied to calculate the final whole Rupee payable.
          </p>
        </div>

        <div className="card w-full md:w-96 p-5 space-y-3 bg-white shadow-md">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Total Quantity</span>
            <span className="font-semibold text-slate-900">{totalQty} units</span>
          </div>

          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal (₹)</span>
            <span className="font-semibold text-slate-900 font-mono">₹{subtotal.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Bill Discount (₹)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-24 px-2 py-1 border border-slate-200 rounded text-right text-xs font-mono"
              value={discountVal}
              onChange={(e) => setDiscountVal(e.target.value)}
            />
          </div>

          <div className="flex justify-between text-sm text-slate-600">
            <span>Round Off (₹)</span>
            <span className={`font-mono text-xs font-semibold ${roundOff < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              {roundOff >= 0 ? `+${roundOff.toFixed(2)}` : roundOff.toFixed(2)}
            </span>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
            <span className="text-base font-bold text-slate-900">Net Total</span>
            <span className="text-2xl font-black text-brand-700 font-mono">
              ₹{roundedNet.toFixed(2)}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full justify-center py-3 text-base shadow-lg shadow-brand-500/25 mt-4"
          >
            <Save size={18} /> {loading ? 'Saving...' : isEdit ? 'Update Invoice' : 'Generate Bill of Supply'}
          </button>
        </div>
      </div>
    </form>
  );
}
