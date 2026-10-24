import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { post, put } from '../../api/api.js';

export default function ProductModal({ product, onClose, onSaved }) {
  const isEdit = !!product?.id;
  const [form, setForm] = useState({
    name: product?.name || '',
    mfr: product?.mfr || '',
    hsn: product?.hsn || '30049099',
    uom: product?.uom || 'NOS',
    stock_qty: product?.stock_qty ?? '',
    mrp: product?.mrp ?? '',
    ptr: product?.ptr ?? '',
    batch_no: product?.batch_no || '',
    expiry: product?.expiry || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Product / Tablet name is required');
    setLoading(true);
    try {
      const payload = {
        ...form,
        stock_qty: form.stock_qty === '' ? 0 : parseInt(form.stock_qty, 10),
        mrp: form.mrp === '' ? 0 : Number(form.mrp),
        ptr: form.ptr === '' ? 0 : Number(form.ptr),
        default_rate: 0,
      };
      if (isEdit) {
        await put(`/products/${product.id}`, payload);
        toast.success('Product updated');
      } else {
        await post('/products', payload);
        toast.success('Product created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">
            {isEdit ? 'Edit Tablet / Product' : 'Add New Tablet / Product'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-lg p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Tablet / Product Name *</label>
            <input
              type="text"
              required
              className="field uppercase"
              placeholder="e.g. PARACETAMOL 650MG"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Manufacturer (MFR)</label>
              <input
                type="text"
                className="field"
                placeholder="e.g. CIPLA, SUN"
                value={form.mfr}
                onChange={(e) => setForm({ ...form, mfr: e.target.value })}
              />
            </div>
            <div>
              <label className="label">HSN Code</label>
              <input
                type="text"
                className="field"
                placeholder="30049099"
                value={form.hsn}
                onChange={(e) => setForm({ ...form, hsn: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Total Quantity / Stock *</label>
              <input
                type="number"
                min="0"
                required
                className="field font-bold text-brand-700 bg-brand-50/50"
                placeholder="0"
                value={form.stock_qty}
                onChange={(e) => setForm({ ...form, stock_qty: e.target.value })}
              />
            </div>
            <div>
              <label className="label">MRP (₹)</label>
              <input
                type="number"
                step="0.01"
                className="field"
                placeholder="0.00"
                value={form.mrp}
                onChange={(e) => setForm({ ...form, mrp: e.target.value })}
              />
            </div>
            <div>
              <label className="label">PTR (₹)</label>
              <input
                type="number"
                step="0.01"
                className="field"
                placeholder="0.00"
                value={form.ptr}
                onChange={(e) => setForm({ ...form, ptr: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">UOM (Unit)</label>
              <input
                type="text"
                className="field"
                placeholder="NOS / STRIP"
                value={form.uom}
                onChange={(e) => setForm({ ...form, uom: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Batch No</label>
              <input
                type="text"
                className="field uppercase"
                placeholder="B2401"
                value={form.batch_no}
                onChange={(e) => setForm({ ...form, batch_no: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Expiry (MM/YY)</label>
              <input
                type="text"
                className="field"
                placeholder="12/26"
                value={form.expiry}
                onChange={(e) => setForm({ ...form, expiry: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : isEdit ? 'Update Tablet' : 'Create Tablet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
