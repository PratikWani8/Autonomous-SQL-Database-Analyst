import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Database,
  Play,
  Copy,
  Check,
  Download,
  BookmarkPlus,
  RefreshCw,
  AlertTriangle,
  Info,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Loader2,
  Table as TableIcon,
  HelpCircle,
  FileText
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { datasetService } from '../services/datasetService';
import DynamicChart from '../charts/DynamicChart';
import SaveInsightModal from '../components/SaveInsightModal';
import { StatusBadge } from '../components/StatusBadge';
import { exportToCSV, exportToJSON } from '../utils/exportUtils';
import { cleanColumnLabel, formatNumber } from '../utils/formatters';

const PIPELINE_STAGES = [
  'Intent Analysis',
  'Schema Discovery',
  'SQL Generation',
  'AST Safety Verification',
  'Read-Only DB Execution',
  'Pandas Result Validation',
  'Visual & Grounded Insights'
];

export default function WorkspacePage() {
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const initialTable = searchParams.get('table') || '';

  const [question, setQuestion] = useState(initialQ);
  const [selectedTable, setSelectedTable] = useState(initialTable);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeStage, setActiveStage] = useState(-1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Load datasets on mount
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const res = await datasetService.getDatasets();
        setDatasets(res.data || []);
        if (!selectedTable && res.data && res.data.length > 0) {
          setSelectedTable(res.data[0].tableName);
        }
      } catch (err) {
        console.error('Failed to load dataset list:', err.message);
      }
    };
    fetchDatasets();
  }, []);

  // Pre-fill question from URL if present
  useEffect(() => {
    if (initialQ && selectedTable && !result && !loading) {
      handleRunQuery(initialQ);
    }
  }, [initialQ, selectedTable]);

  const handleRunQuery = async (queryText = question) => {
    const q = queryText.trim();
    if (!q || q.length < 3) {
      setError('Please enter a valid analytical question (minimum 3 characters).');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setActiveStage(0);

    // Simulate realistic stage progression visuals
    const stageInterval = setInterval(() => {
      setActiveStage((prev) => (prev < 5 ? prev + 1 : prev));
    }, 350);

    try {
      const res = await analyticsService.executeQuery(q, null, selectedTable || null);
      clearInterval(stageInterval);
      setActiveStage(6);
      setResult(res.data);
    } catch (err) {
      clearInterval(stageInterval);
      setError(err.response?.data?.error || err.message || 'An error occurred during query execution.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySQL = () => {
    if (!result?.generated_sql) return;
    navigator.clipboard.writeText(result.generated_sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentDatasetMeta = datasets.find((d) => d.tableName === selectedTable);

  // Filter and paginate table results
  const filteredRows = (result?.result_rows || []).filter((row) => {
    if (!searchTerm) return true;
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">AI Query Workspace</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Interactive
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Formulate policy questions in plain text — our autonomous agent handles the rest.
          </p>
        </div>

        {/* Dataset Selection Bar */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl w-full sm:w-auto">
          <Database className="w-4 h-4 text-blue-400 ml-2" />
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none pr-3 py-1 cursor-pointer"
          >
            {datasets.map((d) => (
              <option key={d.tableName} value={d.tableName} className="bg-slate-950 text-slate-200">
                {d.title} ({d.rowCount} rows)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Question Input Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunQuery();
          }}
          className="space-y-3"
        >
          <div className="relative">
            <textarea
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Which five districts experienced the largest increase in overall unemployment rate between 2021-22 and 2022-23?"
              className="w-full bg-slate-950/90 border border-slate-800 focus:border-blue-500/80 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition resize-none leading-relaxed"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            {/* Multilingual prompt shortcuts */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
              <span className="text-[11px] font-medium mr-1 text-slate-500">Language examples:</span>
              <button
                type="button"
                onClick={() => {
                  setQuestion('Which five districts experienced the largest increase in overall unemployment rate between 2021-22 and 2022-23?');
                  setSelectedTable('district_unemployment_stats');
                }}
                className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 hover:border-blue-500/40 text-[11px] text-slate-300 transition"
              >
                English (Unemployment change)
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuestion('किन पांच जिलों में बेरोजगारी दर में सबसे अधिक वृद्धि हुई?');
                  setSelectedTable('district_unemployment_stats');
                }}
                className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 hover:border-blue-500/40 text-[11px] text-slate-300 transition"
              >
                हिंदी (Unemployment Rise)
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuestion('2011 मध्ये सर्वाधिक लोकसंख्या असलेले 5 जिल्हे कोणते?');
                  setSelectedTable('district_demographics_stats');
                }}
                className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 hover:border-blue-500/40 text-[11px] text-slate-300 transition"
              >
                मराठी (Top Population)
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{loading ? 'Analyzing...' : 'Execute Analysis'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Suggestion Chips from current dataset */}
        {currentDatasetMeta?.sampleQuestions && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Dataset suggestions:</span>
            {currentDatasetMeta.sampleQuestions.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQuestion(sq);
                  handleRunQuery(sq);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950/70 hover:bg-slate-800/60 border border-slate-800 text-slate-300 hover:text-blue-300 transition text-left"
              >
                "{sq}"
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pipeline Progress Indicator */}
      {loading && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Orchestrating 7-Stage Analytical Pipeline</span>
            </span>
            <span className="text-xs text-slate-400">Step {activeStage + 1} of 7</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {PIPELINE_STAGES.map((st, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border text-[11px] transition-all duration-300 ${
                  idx < activeStage
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : idx === activeStage
                    ? 'bg-blue-600/20 border-blue-500 text-white font-medium animate-pulse'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {idx < activeStage ? (
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  ) : idx === activeStage ? (
                    <Loader2 className="w-3 h-3 animate-spin text-blue-400 shrink-0" />
                  ) : (
                    <span className="w-3 h-3 rounded-full border border-slate-700 flex items-center justify-center text-[8px]">
                      {idx + 1}
                    </span>
                  )}
                  <span className="truncate">{st}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Card */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-rose-200">Analysis Halted</h4>
            <p className="mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Successful or Complete Result Experience */}
      {result && (
        <div className="space-y-6">
          {/* Section 1: Question Interpretation & Status Header */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <StatusBadge status={result.execution_status} />
                <StatusBadge status={result.sql_validation?.risk_level} type="risk" />
                <span className="text-[11px] text-slate-400 font-mono">
                  {result.execution_duration_ms} ms
                </span>
              </div>
              <h2 className="text-base font-semibold text-white mt-1">
                {result.interpreted_question}
              </h2>
              <p className="text-xs text-slate-400">
                Target Table: <span className="text-slate-200 font-mono">{result.table_name}</span> | Rows Returned: <span className="text-blue-400 font-mono font-medium">{result.row_count}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-purple-400" />
                <span>Save Insight</span>
              </button>
              <button
                onClick={() => exportToCSV(result.result_rows, `${result.table_name}_analysis.csv`)}
                className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
                title="Export Safe CSV (Protected against Formula Injection)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Section 2: Plain Language Explanation & Grounded Findings Card */}
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Analytical Finding & Explanation</h3>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                Grounded in Database Rows
              </span>
            </div>

            {/* Direct Answer */}
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/15 text-sm text-blue-200 leading-relaxed font-medium">
              {result.explanation?.direct_answer}
            </div>

            {/* Key Findings List */}
            {result.explanation?.key_findings && result.explanation.key_findings.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Key Data Points</h4>
                <ul className="space-y-1.5">
                  {result.explanation.key_findings.map((kf, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      <span>{kf}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Methodology & Limitations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="font-semibold text-slate-300 block mb-1">Calculation Methodology</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {result.explanation?.calculation_methodology || 'Computed with standard SQL aggregation and sorting.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="font-semibold text-slate-300 block mb-1">Data Provenance & Source</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {result.provenance?.datasetTitle || 'Official Indian Public Dataset'} ({result.provenance?.license || 'OGDL-India'}).
                </p>
              </div>
            </div>

            {/* Data Quality Warnings if present */}
            {result.result_validation?.warnings && result.result_validation.warnings.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
                  Data Quality & Boundary Notes
                </span>
                {result.result_validation.warnings.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2"
                  >
                    <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <span className="font-semibold">[{w.code}]</span> {w.message}
                      {w.suggestion && <span className="block text-[11px] text-amber-400/80 mt-0.5">{w.suggestion}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Interactive Visual Chart */}
          {result.chart_spec && result.result_rows?.length > 0 && (
            <DynamicChart spec={result.chart_spec} rows={result.result_rows} />
          )}

          {/* Section 4: Generated SQL & Safety Inspection Panel */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  PostgreSQL Query & AST Verification
                </h3>
              </div>
              <button
                onClick={handleCopySQL}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy SQL'}</span>
              </button>
            </div>

            {/* Code Panel */}
            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-blue-300 overflow-x-auto leading-relaxed">
              <code>{result.generated_sql}</code>
            </pre>

            {/* AST Safety Summary */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
              <div className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Single Statement SELECT Enforced</span>
              </div>
              <span>•</span>
              <div>
                Tables Accessed: <span className="text-slate-200 font-mono">{result.sql_validation?.tables_accessed?.join(', ') || result.table_name}</span>
              </div>
              <span>•</span>
              <div>
                Row Limit Applied: <span className="text-slate-200 font-mono">{result.sql_validation?.row_limit_applied}</span>
              </div>
            </div>
          </div>

          {/* Section 5: Paginated Results Table */}
          {result.result_rows?.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-white">Tabular Records</h3>
                  <span className="text-xs text-slate-400 font-mono">({filteredRows.length} total)</span>
                </div>

                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search in table..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      {result.result_columns?.map((col) => (
                        <th key={col} className="px-4 py-3 font-semibold">
                          {cleanColumnLabel(col)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {paginatedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        {result.result_columns?.map((col) => {
                          const val = row[col];
                          const isNum = typeof val === 'number';
                          return (
                            <td key={col} className={`px-4 py-2.5 ${isNum ? 'text-blue-300' : 'text-slate-200'}`}>
                              {isNum ? formatNumber(val) : val !== null ? String(val) : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Save Insight Modal */}
      {isModalOpen && (
        <SaveInsightModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          analysisData={result}
          onSaved={() => alert('Insight successfully saved to your gallery!')}
        />
      )}
    </div>
  );
}
