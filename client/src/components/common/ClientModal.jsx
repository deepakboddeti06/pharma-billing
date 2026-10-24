import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { post, put } from '../../api/api.js';

export default function ClientModal({ client, onClose, onSaved }) {
  const isEdit = !!client?.id;
  const [form, setForm] = useState({
    name: client?.name || '',
    address: client?.address || '',
    phone: client?.phone || '',
    gstin: client?.gstin || '',
    dl_20b: client?.dl_20b || '',
    dl_21b: client?.dl_21b || '',
    state: client?.state || 'Andhra Pradesh',
    state_code: client?.state_code || '37',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Client name is required');
    setLoading(true);
    try {
      if (isEdit) {
        await put(`/clients/${client.id}`, form);
        toast.success('Client updated');
      } else {
        await post('/clients', form);
        toast.success('Client created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">
            {isEdit ? 'Edit Client / Shop' : 'Add New Client / Shop'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-lg p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Shop / Client Name *</label>
            <input
              type="text"
              required
              className="field"
              placeholder="e.g. BALAJI MEDICAL AGENCIES"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Address</label>
            <textarea
              rows={2}
              className="field"
              placeholder="Shop address, street, town..."
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Phone / Mobile</label>
              <input
                type="text"
                className="field"
                placeholder="9876543210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">GSTIN</label>
              <input
                type="text"
                className="field uppercase"
                placeholder="37AAAAA0000A1Z5"
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Drug License 20B</label>
              <input
                type="text"
                className="field uppercase"
                placeholder="AP/05/..."
                value={form.dl_20b}
                onChange={(e) => setForm({ ...form, dl_20b: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Drug License 21B</label>
              <input
                type="text"
                className="field uppercase"
                placeholder="AP/05/..."
                value={form.dl_21b}
                onChange={(e) => setForm({ ...form, dl_21b: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">State</label>
              <input
                type="text"
                className="field"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
            <div>
              <label className="label">State Code</label>
              <input
                type="text"
                className="field"
                value={form.state_code}
                onChange={(e) => setForm({ ...form, state_code: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : isEdit ? 'Update Client' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
