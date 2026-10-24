import { NavLink } from 'react-router-dom';
import {
  Pill, LayoutDashboard, FileText, BarChart2,
  Settings, Users, Package
} from 'lucide-react';

const groups = [
  {
    label: 'Main',
    items: [
      { to: '/',        icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/invoices',icon: FileText,         label: 'Invoices' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { to: '/?tab=clients',  icon: Users,   label: 'Clients' },
      { to: '/?tab=tablets',  icon: Package, label: 'Tablets' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/reports',  icon: BarChart2, label: 'Reports' },
      { to: '/settings', icon: Settings,  label: 'Settings' },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 select-none">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/60">
        <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-900/40">
          <Pill size={20} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-white text-sm truncate">Pharma Billing</p>
          <p className="text-xs text-slate-500 truncate">SSMA · Eluru</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-5 px-3 space-y-5 overflow-y-auto">
        {groups.map(g => (
          <div key={g.label}>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 mb-1.5">{g.label}</p>
            <div className="space-y-0.5">
              {g.items.map(({ to, icon: Icon, label, end }) => (
                <NavLink key={label} to={to} end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`
                  }>
                  <Icon size={17} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-5 py-3 border-t border-slate-700/60 text-xs text-slate-600">
        v1.0 · Offline-first
      </div>
    </aside>
  );
}
