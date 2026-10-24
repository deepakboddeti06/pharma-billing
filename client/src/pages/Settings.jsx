import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings as SettingsIcon, Building, CreditCard, Shield,
  Save, Database, Download, CheckCircle, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { get, put, post } from '../api/api.js';

export default function Settings() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    gstin: '',
    dl_20b: '',
    dl_21b: '',
    state: '',
    state_code: '',
    bank_name: '',
    account_no: '',
    ifsc_code: '',
    terms: '',
    invoice_prefix: 'A',
    next_seq: 35,
  });
  const [loading, setLoading] = useState(false);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => get('/settings'),
  });

  useEffect(() => {
    if (settings) {
      setForm({
        name: settings.name || '',
        address: settings.address || '',
        phone: settings.phone || '',
        gstin: settings.gstin || '',
        dl_20b: settings.dl_20b || '',
        dl_21b: settings.dl_21b || '',
        state: settings.state || 'AP',
        state_code: settings.state_code || '37',
        bank_name: settings.bank_name || '',
        account_no: settings.account_no || '',
        ifsc_code: settings.ifsc_code || '',
        terms: settings.terms || '',
        invoice_prefix: settings.invoice_prefix || 'A',
        next_seq: settings.next_seq ?? 35,
      });
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await put('/settings', {
        ...form,
        next_seq: parseInt(form.next_seq, 10) || 1,
      });
      qc.invalidateQueries(['settings']);
      toast.success('Business settings saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSnapshot = async () => {
    setSnapshotLoading(true);
    try {
      const res = await post('/backup/snapshot', {});
      toast.success(res.message || 'Snapshot created in server/backups/');
    } catch (err) {
      toast.error('Failed to create snapshot');
    } finally {
      setSnapshotLoading(false);
    }
  };

  const handleDownloadDb = () => {
    window.open('/api/backup/export-db', '_blank');
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Business & Agency Settings</h1>
        <p className="text-xs text-slate-500">
          Configure agency information, tax numbers, drug licenses, and bank account for all generated Bills of Supply.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Agency Identity */}
        <div className="card shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building size={18} className="text-brand-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Agency Identity (Supplier Block)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Agency / Business Name *</label>
              <input
                type="text"
                required
                className="field font-bold uppercase text-slate-900"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Premises Address *</label>
              <textarea
                rows={2}
                required
                className="field"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Primary Mobile / Cell</label>
              <input
                type="text"
                className="field"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="label">GSTIN (Goods & Service Tax)</label>
              <input
                type="text"
                className="field font-mono uppercase text-xs"
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
              />
            </div>
          </div>
        </div>

        {/* Drug Licenses & State */}
        <div className="card shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield size={18} className="text-brand-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Drug Licenses & Jurisdiction
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Drug License 20B (Wholesale)</label>
              <input
                type="text"
                className="field font-mono text-xs uppercase"
                value={form.dl_20b}
                onChange={(e) => setForm({ ...form, dl_20b: e.target.value.toUpperCase() })}
              />
            </div>

            <div>
              <label className="label">Drug License 21B (Retail)</label>
              <input
                type="text"
                className="field font-mono text-xs uppercase"
                value={form.dl_21b}
                onChange={(e) => setForm({ ...form, dl_21b: e.target.value.toUpperCase() })}
              />
            </div>

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
        </div>

        {/* Bank Account */}
        <div className="card shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <CreditCard size={18} className="text-brand-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Bank Details (Printed on Invoice Bottom)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="label">Bank Name & Branch</label>
              <input
                type="text"
                className="field"
                value={form.bank_name}
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Current / Cash Credit Account Number</label>
              <input
                type="text"
                className="field font-mono"
                value={form.account_no}
                onChange={(e) => setForm({ ...form, account_no: e.target.value })}
              />
            </div>

            <div>
              <label className="label">IFSC Code</label>
              <input
                type="text"
                className="field font-mono uppercase"
                value={form.ifsc_code}
                onChange={(e) => setForm({ ...form, ifsc_code: e.target.value.toUpperCase() })}
              />
            </div>
          </div>
        </div>

        {/* Numbering & Terms */}
        <div className="card shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <SettingsIcon size={18} className="text-brand-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Invoice Sequencing & Terms
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Invoice Prefix</label>
              <input
                type="text"
                className="field font-mono uppercase"
                value={form.invoice_prefix}
                onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value.toUpperCase() })}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">e.g. "A" produces A000034</span>
            </div>

            <div>
              <label className="label">Next Sequence Number</label>
              <input
                type="number"
                min="1"
                className="field font-mono"
                value={form.next_seq}
                onChange={(e) => setForm({ ...form, next_seq: e.target.value })}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Increments automatically upon billing</span>
            </div>

            <div className="md:col-span-2">
              <label className="label">Terms & Conditions (Printed on Invoice)</label>
              <textarea
                rows={3}
                className="field text-xs"
                value={form.terms}
                onChange={(e) => setForm({ ...form, terms: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="submit" disabled={loading} className="btn btn-primary px-8">
            <Save size={16} /> {loading ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </form>

      {/* ── Offline Database Backup & Maintenance ── */}
      <div className="card bg-slate-900 text-white p-6 shadow-xl border-0 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Database size={20} className="text-brand-400" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Database Backup & Safety</h2>
              <p className="text-xs text-slate-400">Offline SQLite database storage. Keep copies on a USB pen drive.</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Your medical agency billing records are kept in a local SQLite file (<code className="text-brand-300 font-mono">dev.db</code>).
          You can create a timestamped snapshot or download the raw database anytime.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={handleDownloadDb}
            className="btn btn-secondary bg-white text-slate-900 hover:bg-slate-100 font-bold"
          >
            <Download size={15} /> Download Live Database (.db)
          </button>

          <button
            type="button"
            onClick={handleSnapshot}
            disabled={snapshotLoading}
            className="btn btn-secondary bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
          >
            <RefreshCw size={15} className={snapshotLoading ? 'animate-spin' : ''} />
            {snapshotLoading ? 'Snapshotting...' : 'Create Local Snapshot'}
          </button>
        </div>
      </div>
    </div>
  );
}
