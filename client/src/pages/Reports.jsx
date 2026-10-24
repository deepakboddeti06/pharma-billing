import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart2, Download, Calendar, Store, TrendingUp,
  FileSpreadsheet, Filter, DollarSign, Layers
} from 'lucide-react';
import { get } from '../api/api.js';

export default function Reports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [activeTab, setActiveTab] = useState('client'); // 'client' | 'month'
  const [year, setYear] = useState(() => new Date().getFullYear());

  const { data: clientReport = [], isLoading: clientLoading } = useQuery({
    queryKey: ['report-by-client', from, to],
    queryFn: () => get('/reports/by-client', { from: from || undefined, to: to || undefined }),
  });

  const { data: monthReport = [], isLoading: monthLoading } = useQuery({
    queryKey: ['report-by-month', year],
    queryFn: () => get('/reports/by-month', { year }),
  });

  const totalClientRevenue = clientReport.reduce((acc, c) => acc + (c.total_amount || 0), 0);
  const totalClientQty = clientReport.reduce((acc, c) => acc + (c.total_qty || 0), 0);
  const totalInvoices = clientReport.reduce((acc, c) => acc + (c.invoice_count || 0), 0);

  const handleExportExcel = () => {
    let url = '/api/reports/export';
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (params.toString()) url += `?${params.toString()}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Sales Reports & Analytics</h1>
          <p className="text-xs text-slate-500">Business performance metrics, client sales breakdown, and Excel exports</p>
        </div>
        <button
          onClick={handleExportExcel}
          className="btn btn-secondary text-emerald-700 hover:bg-emerald-50 border-emerald-300 font-semibold shadow-sm"
        >
          <FileSpreadsheet size={16} className="text-emerald-600" /> Export to Excel (.xlsx)
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 bg-white border border-slate-100 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Billed Revenue</span>
            <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
              ₹{totalClientRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="card p-5 bg-white border border-slate-100 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Tablet Units Sold</span>
            <p className="text-2xl font-black text-brand-600 mt-1">
              {totalClientQty.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand-600 flex items-center justify-center font-bold">
            <Layers size={24} />
          </div>
        </div>

        <div className="card p-5 bg-white border border-slate-100 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-400 font-medium">Top Client by Revenue</span>
            <p className="text-base font-bold text-slate-800 mt-1 truncate max-w-[200px]">
              {clientReport[0]?.client_name || '—'}
            </p>
            {clientReport[0] && (
              <span className="text-xs text-emerald-600 font-semibold font-mono">
                ₹{clientReport[0].total_amount.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* View Switcher & Date Filters */}
      <div className="card p-4 bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('client')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'client' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Store size={14} /> Sales by Client / Shop
          </button>
          <button
            onClick={() => setActiveTab('month')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar size={14} /> Monthly Trend
          </button>
        </div>

        {activeTab === 'client' ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Date Range:</span>
            <input
              type="date"
              className="field text-xs py-1.5 w-36"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              className="field text-xs py-1.5 w-36"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            {(from || to) && (
              <button
                onClick={() => { setFrom(''); setTo(''); }}
                className="text-xs text-brand-600 font-semibold hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Year:</span>
            <select
              className="field text-xs py-1.5 w-28 font-bold"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tables */}
      {activeTab === 'client' && (
        <div className="card p-0 shadow-sm overflow-hidden bg-white">
          <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider">Client Revenue Ranking</h2>
            <span className="text-xs text-slate-400">{clientReport.length} shops with orders</span>
          </div>

          {clientLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading client report...</div>
          ) : clientReport.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">No sales data for selected period.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="w-12">Rank</th>
                    <th>Client / Medical Store</th>
                    <th className="text-center">Total Invoices</th>
                    <th className="text-center">Total Units</th>
                    <th className="text-right">Total Revenue (₹)</th>
                    <th className="text-right">% of Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {clientReport.map((c, i) => {
                    const share = totalClientRevenue > 0 ? ((c.total_amount / totalClientRevenue) * 100).toFixed(1) : 0;
                    return (
                      <tr key={c.client_id}>
                        <td className="text-slate-400 font-mono text-xs">{i + 1}</td>
                        <td className="font-bold text-slate-800">{c.client_name}</td>
                        <td className="text-center text-xs font-semibold">{c.invoice_count}</td>
                        <td className="text-center text-xs font-mono">{c.total_qty}</td>
                        <td className="text-right font-mono font-bold text-slate-900 text-sm">
                          ₹{Number(c.total_amount).toFixed(2)}
                        </td>
                        <td className="text-right">
                          <div className="inline-flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-600">{share}%</span>
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-500 rounded-full" style={{ width: `${share}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'month' && (
        <div className="card p-0 shadow-sm overflow-hidden bg-white">
          <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider">Monthly Sales Breakdown ({year})</h2>
            <span className="text-xs text-slate-400">{monthReport.length} active months</span>
          </div>

          {monthLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading monthly report...</div>
          ) : monthReport.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">No sales found for year {year}.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Month (YYYY-MM)</th>
                    <th className="text-center">Bills Generated</th>
                    <th className="text-center">Quantity Sold</th>
                    <th className="text-right">Billed Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {monthReport.map((m) => (
                    <tr key={m.month}>
                      <td className="font-bold text-slate-800 font-mono text-xs">{m.month}</td>
                      <td className="text-center text-xs font-semibold">{m.invoice_count}</td>
                      <td className="text-center text-xs font-mono">{m.total_qty}</td>
                      <td className="text-right font-mono font-bold text-emerald-600 text-sm">
                        ₹{Number(m.total_amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
