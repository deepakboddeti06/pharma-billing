import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Plus, Search, Calendar, Eye, Edit, Trash2,
  Printer, ArrowUpDown, Filter, Store
} from 'lucide-react';
import toast from 'react-hot-toast';
import { get, del } from '../api/api.js';

export default function AllInvoices() {
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const qc = useQueryClient();
  const nav = useNavigate();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => get('/clients'),
  });

  const { data: rawInvoices = [], isLoading } = useQuery({
    queryKey: ['invoices', search, from, to, selectedClient],
    queryFn: () =>
      get('/invoices', {
        q: search || undefined,
        from: from || undefined,
        to: to || undefined,
        client: selectedClient || undefined,
      }),
  });
  const invoices = Array.isArray(rawInvoices) ? rawInvoices : (rawInvoices?.invoices || []);

  const delMut = useMutation({
    mutationFn: (id) => del(`/invoices/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['invoices']);
      toast.success('Invoice deleted');
    },
    onError: () => toast.error('Failed to delete invoice'),
  });

  const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.net_total) || 0), 0);
  const totalQty = invoices.reduce((sum, inv) => sum + (parseInt(inv.total_qty, 10) || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">All Bills of Supply</h1>
          <p className="text-xs text-slate-500">Track and manage every sales invoice generated</p>
        </div>
        <Link to="/invoices/new" className="btn btn-primary">
          <Plus size={16} /> Create New Invoice
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center justify-between bg-white border border-slate-100">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Invoices</span>
            <p className="text-2xl font-black text-slate-800 mt-1">{invoices.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center font-bold">
            <FileText size={20} />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between bg-white border border-slate-100">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Quantity Sold</span>
            <p className="text-2xl font-black text-slate-800 mt-1">{totalQty}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Store size={20} />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between bg-white border border-slate-100">
          <div>
            <span className="text-xs text-slate-400 font-medium">Billed Revenue (₹)</span>
            <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">
              ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            ₹
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="card p-4 bg-white border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="field pl-9 text-xs"
            placeholder="Search by invoice # or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-48">
          <select
            className="field text-xs"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
          >
            <option value="">All Clients / Shops</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">From:</span>
          <input
            type="date"
            className="field text-xs py-1.5"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">To:</span>
          <input
            type="date"
            className="field text-xs py-1.5"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        {(search || from || to || selectedClient) && (
          <button
            onClick={() => {
              setSearch('');
              setFrom('');
              setTo('');
              setSelectedClient('');
            }}
            className="text-xs text-brand-600 hover:text-brand-800 font-semibold px-2 py-1"
          >
            Reset
          </button>
        )}
      </div>

      {/* Invoices Table */}
      <div className="card p-0 shadow-sm overflow-hidden bg-white">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <FileText size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm">No invoices found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-12">#</th>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Billed Client</th>
                  <th className="text-center">Units</th>
                  <th className="text-right">Subtotal</th>
                  <th className="text-right">Round Off</th>
                  <th className="text-right">Net Amount</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, idx) => (
                  <tr key={inv.id} className="cursor-pointer" onClick={() => nav(`/invoices/${inv.id}`)}>
                    <td className="text-slate-400 text-xs font-mono">{idx + 1}</td>
                    <td>
                      <span className="font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded text-xs">
                        {inv.invoice_no}
                      </span>
                    </td>
                    <td className="text-xs text-slate-600 whitespace-nowrap">{inv.date}</td>
                    <td>
                      <span className="font-bold text-slate-800 block text-xs">{inv.client?.name || 'Unknown'}</span>
                      {inv.client?.phone && <span className="text-[11px] text-slate-400">{inv.client.phone}</span>}
                    </td>
                    <td className="text-center text-xs font-semibold">{inv.total_qty}</td>
                    <td className="text-right font-mono text-xs text-slate-600">₹{Number(inv.subtotal).toFixed(2)}</td>
                    <td className="text-right font-mono text-[11px] text-slate-400">
                      {inv.round_off >= 0 ? `+${Number(inv.round_off).toFixed(2)}` : Number(inv.round_off).toFixed(2)}
                    </td>
                    <td className="text-right font-mono font-bold text-sm text-slate-900">
                      ₹{Number(inv.net_total).toFixed(2)}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <Link to={`/invoices/${inv.id}`} className="btn btn-ghost btn-sm p-1.5" title="View & Print">
                          <Eye size={14} className="text-slate-600" />
                        </Link>
                        <Link to={`/invoices/${inv.id}/edit`} className="btn btn-ghost btn-sm p-1.5" title="Edit">
                          <Edit size={14} className="text-slate-600" />
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm(`Delete invoice ${inv.invoice_no}?`)) delMut.mutate(inv.id);
                          }}
                          className="btn btn-ghost btn-sm p-1.5 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
