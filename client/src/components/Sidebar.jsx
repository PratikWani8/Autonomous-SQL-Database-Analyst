import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Database,
  History,
  BookmarkCheck,
  Settings,
  ShieldAlert
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/workspace', label: 'AI Query Workspace', icon: Sparkles, highlight: true },
  { to: '/datasets', label: 'Dataset Explorer', icon: Database },
  { to: '/history', label: 'Query History', icon: History },
  { to: '/saved', label: 'Saved Insights', icon: BookmarkCheck },
  { to: '/settings', label: 'Settings', icon: Settings }
];

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950/60 p-4 flex flex-col justify-between shrink-0 hidden md:flex">
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              <Icon className={`w-4 h-4 ${item.highlight ? 'text-blue-400' : ''}`} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Safety Notice Footer Card */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300">
          <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
          <span>AST Safety Engine</span>
        </div>
        <p className="leading-relaxed">
          Queries parsed with SQLGlot & executed via read-only transactions on PostgreSQL.
        </p>
      </div>
    </aside>
  );
}
