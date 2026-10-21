import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, AreaChart as AreaIcon } from 'lucide-react';
import { cleanColumnLabel, formatNumber } from '../utils/formatters';

const DEFAULT_PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

export default function DynamicChart({ spec, rows }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
        No visualizable data points returned.
      </div>
    );
  }

  const initialType = spec?.type || 'bar';
  const [chartType, setChartType] = useState(initialType);

  const xKey = spec?.xKey || Object.keys(rows[0])[0];
  const yKey = spec?.yKey || Object.keys(rows[0]).find((k) => typeof rows[0][k] === 'number') || Object.keys(rows[0])[1];
  const unit = spec?.unit || '';
  const title = spec?.title || 'Visual Analysis';

  // KPI Card rendering
  if (chartType === 'kpi' || rows.length === 1) {
    const val = rows[0][yKey];
    return (
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center">
        <span className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-1">
          {cleanColumnLabel(yKey)}
        </span>
        <div className="text-5xl font-extrabold text-blue-400 my-2">
          {formatNumber(val)} {unit}
        </div>
        <p className="text-xs text-slate-400">{title}</p>
      </div>
    );
  }

  // Format dataset for Recharts
  const chartData = rows.map((r) => ({
    ...r,
    [xKey]: String(r[xKey] || 'Unknown').substring(0, 16)
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 border border-slate-700/80 p-3 rounded-lg shadow-xl text-xs">
          <p className="font-semibold text-slate-200 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="flex justify-between gap-4">
              <span>{cleanColumnLabel(entry.name)}:</span>
              <span className="font-mono font-medium">
                {formatNumber(entry.value)} {unit}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Plotting <span className="text-blue-400 font-mono">{cleanColumnLabel(yKey)}</span> against <span className="text-slate-300 font-mono">{cleanColumnLabel(xKey)}</span>
          </p>
        </div>

        {/* Chart Switcher */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setChartType('bar')}
            className={`p-1.5 rounded text-xs flex items-center gap-1 transition ${
              chartType === 'bar' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Bar Chart"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Bar</span>
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`p-1.5 rounded text-xs flex items-center gap-1 transition ${
              chartType === 'line' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Line Chart"
          >
            <LineIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Line</span>
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`p-1.5 rounded text-xs flex items-center gap-1 transition ${
              chartType === 'area' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Area Chart"
          >
            <AreaIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Area</span>
          </button>
          {rows.length <= 10 && (
            <button
              onClick={() => setChartType('pie')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition ${
                chartType === 'pie' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Pie Chart"
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Pie</span>
            </button>
          )}
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey={xKey} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-25} textAnchor="end" />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey={yKey} stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
            </LineChart>
          ) : chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey={xKey} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-25} textAnchor="end" />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey={yKey} stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          ) : chartType === 'pie' ? (
            <PieChart>
              <Pie data={chartData} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" outerRadius={105} innerRadius={50} paddingAngle={3} label>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={DEFAULT_PALETTE[index % DEFAULT_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(val) => <span className="text-xs text-slate-300">{val}</span>} />
            </PieChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey={xKey} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-25} textAnchor="end" />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={yKey} fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={45}>
                {chartData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={DEFAULT_PALETTE[index % DEFAULT_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
