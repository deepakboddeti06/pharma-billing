import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Store, Phone, CreditCard, Shield, MapPin, Edit, Plus,
  FileText, Search, ShoppingCart, ArrowLeft, Calendar, ChevronRight, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { get } from '../api/api.js';

export default function ClientPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [search, setSearch] = useState('');
  // selectedCart: { [productId]: { qty: number, rate: string|number } }
  const [selectedCart, setSelectedCart] = useState({});

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => get(`/clients/${id}`),
  });

  const { data: rawProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => get('/products'),
  });
  const products = Array.isArray(rawProducts) ? rawProducts : (rawProducts?.products || []);

  const { data: rawInvoices = [] } = useQuery({
    queryKey: ['client-invoices', id],
    queryFn: () => get('/invoices', { client: id }),
  });
  const invoices = Array.isArray(rawInvoices) ? rawInvoices : (rawInvoices?.invoices || []);

  const updateQty = (prodId, delta) => {
    const prod = products.find((x) => x.id === prodId);
    const stock = prod?.stock_qty ?? 0;

    if (stock <= 0 && delta > 0) {
      toast.error(`Tablet "${prod?.name}" has no stock available`);
      return;
    }

    setSelectedCart((prev) => {
      const curItem = prev[prodId] || { qty: 0, rate: '' };
      const nextQty = Math.max(0, curItem.qty + delta);

      if (nextQty > stock) {
        toast.error(`Cannot add more than available stock (${stock} ${prod?.uom || 'units'})`);
        return prev;
      }

      if (nextQty === 0) {
        const copy = { ...prev };
        delete copy[prodId];
        return copy;
      }
      return { ...prev, [prodId]: { ...curItem, qty: nextQty } };
    });
  };

  const setDirectQty = (prodId, val) => {
    const prod = products.find((x) => x.id === prodId);
    const stock = prod?.stock_qty ?? 0;
    const qty = parseInt(val, 10);

    if (isNaN(qty) || qty <= 0) {
      setSelectedCart((prev) => {
        const copy = { ...prev };
        delete copy[prodId];
        return copy;
      });
      return;
    }

    if (stock <= 0) {
      toast.error(`Tablet "${prod?.name}" has no stock available`);
      return;
    }

    if (qty > stock) {
      toast.error(`Available stock is only ${stock} ${prod?.uom || 'units'}`);
      setSelectedCart((prev) => ({
        ...prev,
        [prodId]: { ...(prev[prodId] || { rate: '' }), qty: stock }
      }));
      return;
    }

    setSelectedCart((prev) => ({
      ...prev,
      [prodId]: { ...(prev[prodId] || { rate: '' }), qty }
    }));
  };

  const setManualRate = (prodId, val) => {
    setSelectedCart((prev) => {
      const cur = prev[prodId] || { qty: 1, rate: '' };
      return {
        ...prev,
        [prodId]: { ...cur, rate: val }
      };
    });
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.mfr && p.mfr.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedCount = Object.keys(selectedCart).length;
  const estimatedTotal = Object.entries(selectedCart).reduce((sum, [pid, item]) => {
    const rate = parseFloat(item?.rate) || 0;
    return sum + (rate * (item?.qty || 0));
  }, 0);

  const handleCreateInvoice = () => {
    const entries = Object.entries(selectedCart);
    for (const [pid, item] of entries) {
      const p = products.find((x) => x.id === parseInt(pid, 10));
      if (p) {
        if ((p.stock_qty ?? 0) <= 0) {
          return toast.error(`Tablet "${p.name}" has no stock available.`);
        }
        if (item.qty > p.stock_qty) {
          return toast.error(`Tablet "${p.name}" exceeds stock (${p.stock_qty} available).`);
        }
      }
    }

    const items = entries
      .map(([pid, item]) => {
        const p = products.find((x) => x.id === parseInt(pid, 10));
        if (!p) return null;
        const rate = parseFloat(item.rate) || 0;
        return {
          product_id: p.id,
          name: p.name,
          mfr: p.mfr || '',
          hsn: p.hsn || '',
          uom: p.uom || 'NOS',
          mrp: p.mrp || 0,
          ptr: p.ptr || 0,
          rate: rate,
          batch_no: p.batch_no || '',
          expiry: p.expiry || '',
          qty: item.qty,
          free: 0,
          discount_pct: 0,
          amount: Math.round(item.qty * rate * 100) / 100,
          total: Math.round(item.qty * rate * 100) / 100,
        };
      })
      .filter(Boolean);

    if (items.length > 0) {
      sessionStorage.setItem('prefill_invoice_items', JSON.stringify(items));
    }
    nav(`/invoices/new?client=${id}`);
  };

  if (clientLoading) {
    return <div className="p-8 text-center text-slate-400">Loading client details...</div>;
  }

  if (!client) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Client not found.</p>
        <Link to="/" className="btn btn-primary mt-4">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className="flex gap-2">
          <Link to={`/clients/${id}/edit`} className="btn btn-secondary">
            <Edit size={15} /> Edit Shop Info
          </Link>
          <Link to={`/invoices/new?client=${id}`} className="btn btn-primary">
            <Plus size={16} /> New Blank Invoice
          </Link>
        </div>
      </div>

      {/* Client Header Card */}
      <div className="card bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 text-white p-6 shadow-md border-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-brand-500/20 text-brand-300 border border-brand-400/30 text-xs font-semibold uppercase tracking-wider">
                Medical Store
              </span>
              <span className="text-slate-400 text-xs">ID #{client.id}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mb-2">{client.name}</h1>
            <p className="flex items-center gap-2 text-sm text-slate-300">
              <MapPin size={14} className="text-brand-400 shrink-0" />
              {client.address || 'No address registered'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-300 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
            <div>
              <span className="text-slate-400 block">Phone</span>
              <span className="font-semibold text-white">{client.phone || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">GSTIN</span>
              <span className="font-semibold text-white">{client.gstin || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">DL 20B</span>
              <span className="font-semibold text-white">{client.dl_20b || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">DL 21B</span>
              <span className="font-semibold text-white">{client.dl_21b || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Tablets Catalog + Previous Invoices */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tablets Grid (2 columns on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Select Tablets for Billing</h2>
            <div className="relative w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="field pl-9 py-1.5 text-xs"
                placeholder="Search tablet name / mfr..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const item = selectedCart[p.id] || { qty: 0, rate: '' };
              const qty = item.qty;
              const rate = item.rate;
              const stock = p.stock_qty ?? 0;
              const isOutOfStock = stock <= 0;

              return (
                <div
                  key={p.id}
                  className={`card p-4 transition-all border ${
                    isOutOfStock
                      ? 'border-slate-200 bg-slate-50/70 opacity-80'
                      : qty > 0
                      ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-400'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm leading-tight">{p.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{p.mfr || 'Generic'} • {p.uom}</p>
                    </div>
                    {isOutOfStock ? (
                      <span className="text-[11px] font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle size={12} /> No stock available
                      </span>
                    ) : (
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        stock <= 10
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        Stock: <strong className="font-bold">{stock}</strong> {p.uom}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                    <div>MRP: ₹{Number(p.mrp || 0).toFixed(2)}</div>
                    <div>PTR: ₹{Number(p.ptr || 0).toFixed(2)}</div>
                  </div>

                  {/* Manual Rate and Qty Controls */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-bold text-slate-700 shrink-0">Rate ₹:</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        disabled={isOutOfStock}
                        className="w-20 text-xs font-bold py-1 px-2 border border-slate-200 rounded-lg text-brand-700 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        value={rate}
                        onChange={(e) => setManualRate(p.id, e.target.value)}
                      />
                    </div>

                    {isOutOfStock ? (
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                        No Stock
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateQty(p.id, -1)}
                          disabled={qty === 0}
                          className="w-7 h-7 rounded-lg border border-slate-300 bg-white flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          max={stock}
                          className="w-12 text-center text-xs font-bold py-1 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                          value={qty || ''}
                          placeholder="0"
                          onChange={(e) => setDirectQty(p.id, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => updateQty(p.id, 1)}
                          disabled={qty >= stock}
                          className="w-7 h-7 rounded-lg border border-brand-500 bg-brand-600 text-white flex items-center justify-center font-bold hover:bg-brand-700 active:scale-95 transition-transform disabled:opacity-30 disabled:hover:bg-brand-600"
                          title={qty >= stock ? 'Maximum available stock reached' : 'Add 1'}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>

                  {qty > 0 && !isOutOfStock && (
                    <div className="mt-2 pt-1.5 flex justify-between items-center text-xs text-brand-700 font-bold bg-brand-50/80 px-2 py-1 rounded">
                      <span>Billed Total ({qty} {p.uom}):</span>
                      <span>₹{(qty * (parseFloat(rate) || 0)).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Client Invoice History (1 column on lg) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Shop Invoices</h2>
            <span className="text-xs text-slate-400">{invoices.length} bills</span>
          </div>

          <div className="card p-0 overflow-hidden divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
            {invoices.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No invoices recorded for this shop yet.
              </div>
            ) : (
              invoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => nav(`/invoices/${inv.id}`)}
                  className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{inv.invoice_no}</span>
                      <span className="badge-blue text-[10px] py-0">{inv.total_qty} units</span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <Calendar size={11} /> {inv.date}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">₹{Number(inv.net_total).toFixed(2)}</div>
                      <span className="text-[10px] text-emerald-600 font-medium">Billed</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Floating Checkout Bar if items selected */}
      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-700 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center font-bold text-white">
              <ShoppingCart size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Selected for Billing</p>
              <p className="text-sm font-bold text-white">
                {selectedCount} item{selectedCount > 1 ? 's' : ''} • Approx ₹{estimatedTotal.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCart({})}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5"
            >
              Clear
            </button>
            <button
              onClick={handleCreateInvoice}
              className="btn btn-primary bg-brand-500 hover:bg-brand-600 px-5 py-2 text-sm font-bold shadow-lg shadow-brand-500/25"
            >
              Generate Bill of Supply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
