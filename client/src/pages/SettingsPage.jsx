import React, { useState } from 'react';
import {
  User,
  Globe,
  ShieldCheck,
  Check,
  Save,
  Lock,
  Database,
  BarChart2,
  Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || 'en');
  const [defaultChart, setDefaultChart] = useState('bar');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSavedSuccess(false);

    try {
      await updateProfile({ name, preferredLanguage });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update preferences');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white">Settings & Preferences</h1>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Account
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure profile details, prompt language preferences, and inspect security parameters.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>Profile preferences updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
          {error}
        </div>
      )}

      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <form onSubmit={handleSave} className="space-y-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
            Profile & Localization
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email (Read-only)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-slate-950/60 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Preferred Language</label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="en">English (Default)</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Optimizes intent understanding and prompt generation for selected Indian language.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Default Visualization</label>
              <select
                value={defaultChart}
                onChange={(e) => setDefaultChart(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="bar">Bar Chart (Ranking & Comparison)</option>
                <option value="line">Line Chart (Trend / Time-series)</option>
                <option value="area">Area Chart (Volume / Cumulative)</option>
                <option value="pie">Pie Chart (Composition)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>

        {/* Security Parameters Display */}
        <div className="border-t border-slate-800 pt-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Database Security Architecture Status</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">PostgreSQL Analytical Role</span>
              <span className="font-mono text-emerald-400 font-semibold">analyst_readonly</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Enforced by database catalog permissions with SELECT grants only. DDL & DML operations blocked.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">AST Parsing & Dialect Enforcement</span>
              <span className="font-mono text-blue-400 font-semibold">SQLGlot (Postgres AST)</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Rejects multiple statements, system catalogs (<code className="text-slate-400">pg_roles</code>), and hazardous administrative functions.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Execution Statement Budget</span>
              <span className="font-mono text-amber-400 font-semibold">5,000 ms</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Automated timeout prevents runaway recursive queries or excessive resource exhaustion.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Maximum Returned Records</span>
              <span className="font-mono text-purple-400 font-semibold">500 Rows</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Automated limit injection prevents out-of-memory overhead during analytical exploration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
