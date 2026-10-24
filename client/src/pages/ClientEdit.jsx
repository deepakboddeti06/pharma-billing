import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save, Building, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post, put } from '../api/api.js';

export default function ClientEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    gstin: '',
    dl_20b: '',
    dl_21b: '',
    state: 'Andhra Pradesh',
    state_code: '37',
  });
  const [loading, setLoading] = useState(false);

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => get(`/clients/${id}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name || '',
        address: client.address || '',
        phone: client.phone || '',
        gstin: client.gstin || '',
        dl_20b: client.dl_20b || '',
        dl_21b: client.dl_21b || '',
        state: client.state || 'Andhra Pradesh',
        state_code: client.state_code || '37',
      });
    }
  }, [client]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Shop / Client name is required');
    setLoading(true);
    try {
      if (isEdit) {
        await put(`/clients/${id}`, form);
        toast.success('Client updated successfully');
        nav(`/clients/${id}`);
      } else {
        const created = await post('/clients', form);
        toast.success('Client registered successfully');
        nav(`/clients/${created.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save client');
    } finally {
      setLoading(false);
    }
  };

  if (isEdit && isLoading) {
    return <div className="p-8 text-center text-slate-400">Loading client data...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link
          to={isEdit ? `/clients/${id}` : '/'}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={16} /> Back
        </Link>
        <h1 className="text-xl font-bold text-slate-800">
          {isEdit ? 'Edit Shop / Client Details' : 'Register New Shop / Client'}
        </h1>
      </div>

      <div className="card shadow-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Store size={16} className="text-brand-600" /> Basic Information
            </h2>
          </div>

          <div>
            <label className="label">Shop / Trade Name *</label>
            <input
              type="text"
              required
              className="field"
              placeholder="e.g. SRI RAMA MEDICAL AGENCIES"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Postal Address</label>
            <textarea
              rows={3}
              className="field"
              placeholder="Door No, Street Name, Landmark, City/Town - Pincode"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Mobile / Phone Number</label>
              <input
                type="text"
                className="field"
                placeholder="e.g. 9491722324"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">GSTIN</label>
              <input
                type="text"
                className="field uppercase font-mono text-xs"
                placeholder="37AAAAA0000A1Z5"
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="border-b border-slate-100 pb-2 pt-2">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Building size={16} className="text-brand-600" /> Drug Licenses & Jurisdiction
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Drug License 20B (Wholesale)</label>
              <input
                type="text"
                className="field font-mono text-xs uppercase"
                placeholder="e.g. AP/05/01/2018-XXXX"
                value={form.dl_20b}
                onChange={(e) => setForm({ ...form, dl_20b: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className="label">Drug License 21B (Retail)</label>
              <input
                type="text"
                className="field font-mono text-xs uppercase"
                placeholder="e.g. AP/05/01/2018-YYYY"
                value={form.dl_21b}
                onChange={(e) => setForm({ ...form, dl_21b: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="field font-mono"
                value={form.state_code}
                onChange={(e) => setForm({ ...form, state_code: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => nav(isEdit ? `/clients/${id}` : '/')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Save size={16} />
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
