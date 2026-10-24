import { useLocation, Link } from 'react-router-dom';
import { HardDrive, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const LABELS = {
  '/':          'Dashboard',
  '/invoices':  'All Invoices',
  '/invoices/new': 'New Invoice',
  '/reports':   'Reports',
  '/settings':  'Settings',
};

export default function Topbar() {
  const { pathname } = useLocation();
  const label = LABELS[pathname] ?? 'Pharma Billing';

  const backup = async () => {
    try {
      const r = await axios.post('/api/backup/snapshot');
      toast.success(`Saved: ${r.data.filename}`);
    } catch { toast.error('Backup failed'); }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
      <h1 className="text-lg font-bold text-slate-900 tracking-tight">{label}</h1>
      <div className="flex items-center gap-2">
        <button onClick={backup} title="Backup database"
          className="btn btn-ghost btn-sm hidden sm:flex">
          <HardDrive size={15} /> Backup DB
        </button>
        <Link to="/invoices/new" className="btn btn-primary btn-sm">
          <Plus size={15} /> New Invoice
        </Link>
      </div>
    </header>
  );
}
