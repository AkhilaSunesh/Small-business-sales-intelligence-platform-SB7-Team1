import { useState, useEffect, useCallback, useRef } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import {
  FiTrendingUp,
  FiDollarSign,
  FiActivity,
  FiCheckCircle,
  FiDownload,
  FiFileText,
  FiRefreshCw,
  FiAlertTriangle,
  FiInfo,
  FiChevronDown,
  FiCheckSquare,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import { FILTER_OPTIONS } from '../../constants/forecastData';
import { getForecastReportsData } from '../../services/forecastService';
import { exportCSV, exportPDF } from '../../utils/exportUtils';
import StatCard from '../../components/common/StatCard';
import { useAppContext } from '../../context/AppContext';

function ForecastReportsPage() {
  usePageTitle('Forecast Reports');

  // Filter & State Management
  const [selectedRange, setSelectedRange] = useState('6m');
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tester control mode
  const { demoMode, setDemoMode } = useAppContext();

  // Dropdown & Export UI State
  const [exportOpen, setExportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const dropdownRef = useRef(null);

  // Fetch forecast data with loading/error handling
  const fetchForecastData = useCallback(async (range) => {
    if (demoMode !== 'loaded') return;
    setLoading(true);
    setError(null);
    try {
      const data = await getForecastReportsData(range);
      setForecastData(data);
    } catch (err) {
      console.error('Failed to load forecast data:', err);
      setError('Unable to load forecast data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [demoMode]);

  // Load appropriate datasets based on chosen demo controls
  useEffect(() => {
    if (demoMode === 'loaded') {
      fetchForecastData(selectedRange);
    } else if (demoMode === 'loading') {
      setForecastData(null);
      setLoading(true);
      setError(null);
    } else if (demoMode === 'error') {
      setForecastData(null);
      setLoading(false);
      setError('Unable to load forecast data. Please try again.');
    } else if (demoMode === 'empty') {
      setForecastData({
        summary: {
          predictedSales: '0 units',
          expectedRevenue: '$0',
          forecastGrowth: '0.0%',
          predictionAccuracy: '0.0%',
        },
        items: []
      });
      setLoading(false);
      setError(null);
    }
  }, [selectedRange, demoMode, fetchForecastData]);

  // Handle outside click for export dropdown menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show Toast notification helper
  const showToast = (message, type = 'success') => {
    setToastMessage({ text: message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Export handlers (Day 7)
  const handleExportCSV = () => {
    setExportOpen(false);
    if (!forecastData || !forecastData.items || forecastData.items.length === 0) {
      showToast('No forecast data available to export.', 'error');
      return;
    }
    const result = exportCSV(forecastData.items, `Forecast_Report_${selectedRange}.csv`);
    if (result.success) {
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleExportPDF = () => {
    setExportOpen(false);
    if (!forecastData || !forecastData.items || forecastData.items.length === 0) {
      showToast('No forecast data available to export.', 'error');
      return;
    }
    const result = exportPDF(
      forecastData.summary,
      forecastData.items,
      `Forecast_Report_${selectedRange}.pdf`
    );
    if (result.success) {
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  const summary = forecastData?.summary || {};
  const items = forecastData?.items || [];

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium shadow-2xl transition-all duration-300 ${
            toastMessage.type === 'error'
              ? 'bg-rose-600/90 text-white border border-rose-500/30'
              : 'bg-emerald-600/90 text-white border border-emerald-500/30'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <FiAlertTriangle className="text-lg shrink-0" />
          ) : (
            <FiCheckCircle className="text-lg shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header with Export Dropdown */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-950/80 p-6 md:p-8 backdrop-blur">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Forecast Reports</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            View predicted sales trends using forecasting analytics.
          </p>
        </div>

        {/* Export Button / Split Dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setExportOpen((prev) => !prev)}
            disabled={loading || !!error}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 text-sm font-medium transition-all shadow-lg shadow-cyan-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiDownload className="text-base" />
            <span>Export Report</span>
            <FiChevronDown
              className={`text-sm transition-transform duration-200 ${
                exportOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {exportOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-slate-900 shadow-2xl py-1.5 z-40 backdrop-blur-lg animate-fadeIn">
              <button
                onClick={handleExportCSV}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
              >
                <FiFileText className="text-cyan-400 text-base" />
                <div className="text-left">
                  <div className="font-semibold">Export CSV</div>
                  <div className="text-[10px] text-slate-400">Spreadsheet format</div>
                </div>
              </button>
              <button
                onClick={handleExportPDF}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-200 hover:bg-white/10 hover:text-white transition-colors border-t border-white/5"
              >
                <FiFileText className="text-rose-400 text-base" />
                <div className="text-left">
                  <div className="font-semibold">Export PDF</div>
                  <div className="text-[10px] text-slate-400">Printable document</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Forecast Filters Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3 backdrop-blur">
        <div className="flex items-center gap-2 overflow-x-auto py-1 text-xs sm:text-sm">
          <span className="text-slate-400 font-medium px-2 hidden sm:inline">Range:</span>
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedRange(filter.id)}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all ${
                selectedRange === filter.id
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium px-2">
            <FiRefreshCw className="animate-spin text-sm" />
            <span>Updating analytics...</span>
          </div>
        )}
      </div>

      {/* ERROR STATE */}
      {error ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <FiAlertTriangle className="text-2xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Unable to load forecast data.</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
              We encountered an issue connecting to the forecasting service. Please check your network or try again.
            </p>
          </div>
          <button
            onClick={() => fetchForecastData(selectedRange)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-all shadow-lg shadow-rose-600/20"
          >
            <FiRefreshCw className="text-sm" />
            <span>Retry</span>
          </button>
        </div>
      ) : (
        <>
          {/* SUMMARY CARDS (Loading vs Loaded) */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 space-y-3 animate-pulse"
                >
                  <div className="h-4 w-24 bg-white/10 rounded"></div>
                  <div className="h-8 w-32 bg-white/10 rounded"></div>
                  <div className="h-3 w-20 bg-white/5 rounded"></div>
                </div>
              ))
            ) : (
              <>
                <StatCard
                  label="Predicted Sales"
                  value={summary.predictedSales || 'N/A'}
                  helper="Estimated volume"
                  icon="dashboard"
                />
                <StatCard
                  label="Expected Revenue"
                  value={summary.expectedRevenue || 'N/A'}
                  helper="Projected earnings"
                  accent="emerald"
                />
                <StatCard
                  label="Forecast Growth"
                  value={summary.forecastGrowth || 'N/A'}
                  helper="Period-over-period"
                  accent="cyan"
                />
                <StatCard
                  label="Prediction Accuracy"
                  value={summary.predictionAccuracy || 'N/A'}
                  helper="Model confidence"
                  accent="amber"
                />
              </>
            )}
          </div>

          {/* LINE CHART SECTION (Loading vs Loaded vs Empty) */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Predicted Sales Trend</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Sales projections visual analytics model
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse"></span>
                <span>Predicted Sales (Units)</span>
              </div>
            </div>

            {loading ? (
              <div className="h-72 w-full flex items-center justify-center bg-white/2 rounded-2xl animate-pulse">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <FiRefreshCw className="animate-spin text-cyan-400" />
                  <span>Loading Line Chart...</span>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="h-72 flex flex-col items-center justify-center text-center p-6 space-y-2">
                <FiInfo className="text-3xl text-slate-500" />
                <p className="text-slate-400 text-sm font-medium">No forecast data available.</p>
              </div>
            ) : (
              <div className="h-72 sm:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={items}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#0f1724" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '1rem',
                      }}
                      itemStyle={{ color: '#38bdf8' }}
                      formatter={(val) => [`${val} units`, 'Predicted Sales']}
                      labelStyle={{ color: '#fff', fontWeight: '600' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="predictedSales"
                      name="Predicted Sales"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorSales)"
                      dot={{ r: 5, fill: '#06b6d4' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* FORECAST TABLE SECTION (Loading vs Loaded vs Empty) */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-base font-semibold text-white">Forecast Breakdown Table</h3>
              <span className="text-xs text-slate-400">
                Detailed forecast parameters & period projections
              </span>
            </div>

            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-10 bg-white/5 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <FiInfo className="text-3xl text-slate-500 mx-auto" />
                <p className="text-slate-400 text-sm font-medium">No forecast data available.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400 bg-white/2">
                      <th className="py-3 px-4 font-semibold">Month</th>
                      <th className="py-3 px-4 font-semibold">Predicted Sales</th>
                      <th className="py-3 px-4 font-semibold">Revenue</th>
                      <th className="py-3 px-4 font-semibold">Growth %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                    {items.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-white">{row.month}</td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-cyan-400">
                          {row.predictedSales.toLocaleString()} units
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                          ${row.revenue.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              row.growth.startsWith('+')
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : row.growth.startsWith('-')
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-slate-500/10 text-slate-300 border border-slate-500/20'
                            }`}
                          >
                            {row.growth}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ForecastReportsPage;
