import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Plus, Store, Package, Edit, Trash2,
  Phone, CreditCard, FileText, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { get, del } from '../api/api.js';
import ClientModal  from '../components/common/ClientModal.jsx';
import ProductModal from '../components/common/ProductModal.jsx';

export default function Dashboard() {
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') === 'tablets' ? 'tablets' : 'clients';
  const [search, setSearch] = useState('');
  const [clientModal,  setClientModal]  = useState(null); // null | 'new' | client obj
  const [productModal, setProductModal] = useState(null);
  const qc = useQueryClient();
  const nav = useNavigate();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', search],
    queryFn:  () => get('/clients', { search }),
    enabled:  tab === 'clients',
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', search],
    queryFn:  () => get('/products', { search }),
    enabled:  tab === 'tablets',
  });

  const delClientMut = useMutation({
    mutationFn: (id) => del(`/clients/${id}`),
    onSuccess:  () => { qc.invalidateQueries(['clients']); toast.success('Deleted'); },
    onError:    (e) => toast.error(e.response?.data?.error || 'Cannot delete'),
  });
  const delProductMut = useMutation({
    mutationFn: (id) => del(`/products/${id}`),
    onSuccess:  () => { qc.invalidateQueries(['products']); toast.success('Deleted'); },
    onError:    () => toast.error('Delete failed'),
  });

  const switchTab = (t) => { setSearch(''); setSp(t === 'tablets' ? { tab: 'tablets' } : {}); };

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-xl w-fit mb-6 shadow-sm">
        {[
          { key: 'clients', icon: Store,   label: 'Clients' },
          { key: 'tablets', icon: Package, label: 'Tablets' },
        ].map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => switchTab(key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input className="field pl-9" placeholder={`Search ${tab}…`}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {tab === 'clients'
          ? <button onClick={() => setClientModal('new')} className="btn btn-primary"><Plus size={16} /> Add Client</button>
          : <button onClick={() => setProductModal('new')} className="btn btn-primary"><Plus size={16} /> Add Tablet</button>
        }
      </div>

      {/* ── Clients Grid ── */}
      {tab === 'clients' && (
        clients.length === 0
          ? <Empty msg="No clients yet. Click 'Add Client' to get started." />
          : <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {clients.map(c => (
                <ClientCard key={c.id} client={c}
                  onOpen={() => nav(`/clients/${c.id}`)}
                  onEdit={e => { e.stopPropagation(); setClientModal(c); }}
                  onDelete={e => { e.stopPropagation(); if(confirm(`Delete ${c.name}?`)) delClientMut.mutate(c.id); }}
                  onInvoices={e => { e.stopPropagation(); nav(`/clients/${c.id}`); }}
                />
              ))}
            </div>
      )}

      {/* ── Products Table ── */}
      {tab === 'tablets' && (
        products.length === 0
          ? <Empty msg="No products yet. Click 'Add Tablet' to get started." />
          : <div className="card p-0 overflow-hidden">
              <table className="tbl">
                <thead>
                  <tr>
                    {['#','Name','MFR','HSN','UOM','Total Stock','MRP ₹','PTR ₹','Batch','Expiry','Actions'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={p.id}>
                      <td className="text-slate-400 text-xs">{i+1}</td>
                      <td className="font-medium">{p.name}</td>
                      <td className="text-slate-500">{p.mfr}</td>
                      <td className="font-mono text-xs text-slate-500">{p.hsn}</td>
                      <td className="text-slate-500">{p.uom}</td>
                      <td>
                        {p.stock_qty <= 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">
                            0 (No Stock)
                          </span>
                        ) : p.stock_qty <= 10 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                            {p.stock_qty} (Low)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                            {p.stock_qty}
                          </span>
                        )}
                      </td>
                      <td className="text-right">{fmt(p.mrp)}</td>
                      <td className="text-right">{fmt(p.ptr)}</td>
                      <td className="text-xs text-slate-500">{p.batch_no}</td>
                      <td className="text-xs text-slate-500">{p.expiry}</td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => setProductModal(p)} className="btn btn-ghost btn-sm p-1.5"><Edit size={13}/></button>
                          <button onClick={() => { if(confirm(`Delete ${p.name}?`)) delProductMut.mutate(p.id); }}
                            className="btn btn-ghost btn-sm p-1.5 hover:text-red-500"><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      )}

      {/* Modals */}
      {clientModal  !== null && (
        <ClientModal
          client={clientModal === 'new' ? null : clientModal}
          onClose={() => setClientModal(null)}
          onSaved={() => { qc.invalidateQueries(['clients']); setClientModal(null); }}
        />
      )}
      {productModal !== null && (
        <ProductModal
          product={productModal === 'new' ? null : productModal}
          onClose={() => setProductModal(null)}
          onSaved={() => { qc.invalidateQueries(['products']); setProductModal(null); }}
        />
      )}
    </div>
  );
}

const fmt = (v) => `₹${Number(v).toFixed(2)}`;

function ClientCard({ client: c, onOpen, onEdit, onDelete, onInvoices }) {
  return (
    <div onClick={onOpen}
      className="card cursor-pointer group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700
                        flex items-center justify-center text-white font-bold text-lg shadow-sm">
          {c.name[0]}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e=>e.stopPropagation()}>
          <button onClick={onEdit}   className="btn btn-ghost p-1.5 rounded-lg"><Edit   size={13}/></button>
          <button onClick={onDelete} className="btn btn-ghost p-1.5 rounded-lg hover:text-red-500"><Trash2 size={13}/></button>
        </div>
      </div>
      <h3 className="font-bold text-slate-900 text-sm leading-snug mb-2 line-clamp-2">{c.name}</h3>
      <div className="space-y-1">
        {c.phone  && <p className="flex items-center gap-1.5 text-xs text-slate-500"><Phone size={11}/>{c.phone}</p>}
        {c.gstin  && <p className="flex items-center gap-1.5 text-xs text-slate-500"><CreditCard size={11}/>{c.gstin}</p>}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span onClick={onInvoices}
          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-semibold">
          <FileText size={12}/> Invoices
        </span>
        <ChevronRight size={14} className="text-slate-300 group-hover:text-brand-400 transition-colors"/>
      </div>
    </div>
  );
}

function Empty({ msg }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
      <p className="text-base">{msg}</p>
    </div>
  );
}
