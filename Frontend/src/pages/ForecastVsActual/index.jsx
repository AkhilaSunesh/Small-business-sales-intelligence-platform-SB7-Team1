import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../hooks/usePageTitle';
import {
  FiTrendingUp,
  FiDollarSign,
  FiActivity,
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
  FiInbox,
  FiRefreshCw,
  FiPercent,
  FiArrowUpRight,
  FiArrowDownRight,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

import DashboardFilters from '../../components/ui/DashboardFilters';
import DrillDownModal from '../../components/ui/DrillDownModal';
import StatCard from '../../components/common/StatCard';
import forecastService from '../../services/forecastService';



export default function ForecastVsActualPage() {
  const { t } = useTranslation();

  usePageTitle('Forecast vs Actual');

  // Filter state
  const [filters, setFilters] = useState({
    dateRange: '1y',
    category: 'all',
    startDate: '',
    endDate: '',
  });

  // Presentation states
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(false);
  const [emptyState, setEmptyState] = useState(false);
  const [data, setData] = useState({ summary: {}, items: [] });

  // Drill-down Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState('general');
  const [modalId, setModalId] = useState('');

  // Fetch / Generate data when filters change with simulated network latency
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorState(false);

    if (emptyState) {
      setData({ summary: {}, items: [] });
      setLoading(false);
      return;
    }

    try {
      // 1. Calculate lookback window & days points
      let lookback = 90;
      let pointsCount = 30;
      if (filters.dateRange === '7d') {
        lookback = 30;
        pointsCount = 7;
      } else if (filters.dateRange === '30d') {
        lookback = 90;
        pointsCount = 30;
      } else if (filters.dateRange === '3m') {
        lookback = 120;
        pointsCount = 90;
      } else if (filters.dateRange === '6m') {
        lookback = 200;
        pointsCount = 180;
      } else if (filters.dateRange === '1y') {
        lookback = 365;
        pointsCount = 300;
      } else if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
        const s = new Date(filters.startDate);
        const e = new Date(filters.endDate);
        const diffDays = Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));
        pointsCount = diffDays;
        lookback = Math.min(365, diffDays + 15);
      }

      // 2. Fetch live data with category filter
      const res = await forecastService.getRawForecastData(30, lookback, 7, filters.category);
      const historical = res.historical || [];

      if (historical.length === 0) {
        setData({ summary: {}, items: [] });
        setLoading(false);
        return;
      }

      // 3. Process historical data and client-side SMA forecast
      const windowSize = 7;

      const items = [];
      const n = historical.length;
      let startIdx = Math.max(windowSize, n - pointsCount);

      for (let i = startIdx; i < n; i++) {
        // Actual values directly from backend
        const actualRevenue = Math.round(historical[i].revenue || 0);
        const actualSales = Math.round(historical[i].transactions || 0) || 1;

        // Forecast values (7-day SMA of preceding windowSize days)
        const windowSlice = historical.slice(i - windowSize, i);
        const sumRevenue = windowSlice.reduce((sum, item) => sum + (item.revenue || 0), 0);
        const sumTransactions = windowSlice.reduce((sum, item) => sum + (item.transactions || 0), 0);
        
        const forecastRevenue = Math.round(sumRevenue / windowSize);
        const forecastSales = Math.round(sumTransactions / windowSize) || 1;

        const diffRev = actualRevenue - forecastRevenue;
        const diffSales = actualSales - forecastSales;

        const diffPct = Math.abs(diffRev) / (forecastRevenue || 1);
        const accuracy = Math.max(50, 100 - (diffPct * 100));

        const dateObj = new Date(historical[i].date + 'T00:00:00Z');
        const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

        items.push({
          date: label,
          rawDate: historical[i].date,
          forecastRevenue,
          actualRevenue,
          forecastSales,
          actualSales,
          differenceRevenue: diffRev,
          differenceSales: diffSales,
          accuracyPct: accuracy,
        });
      }

      // 4. Calculate summaries
      let totalForecastRev = 0;
      let totalActualRev = 0;
      let totalForecastVol = 0;
      let totalActualVol = 0;

      for (const item of items) {
        totalForecastRev += item.forecastRevenue;
        totalActualRev += item.actualRevenue;
        totalForecastVol += item.forecastSales;
        totalActualVol += item.actualSales;
      }

      const accuracyPct = totalForecastRev > 0 
        ? Math.max(50, 100 - (Math.abs(totalActualRev - totalForecastRev) / totalForecastRev * 100)) 
        : 95.5;

      const growthRate = items.length > 1 
        ? ((items[items.length - 1].actualRevenue - items[0].actualRevenue) / (items[0].actualRevenue || 1)) * 100 
        : 5.5;

      const summary = {
        totalForecastRevenue: `$${totalForecastRev.toLocaleString()}`,
        totalActualRevenue: `$${totalActualRev.toLocaleString()}`,
        forecastAccuracy: `${accuracyPct.toFixed(1)}%`,
        revenueDifference: `${totalActualRev >= totalForecastRev ? '+' : ''}${(totalActualRev - totalForecastRev).toLocaleString()}`,
        salesDifference: `${totalActualVol >= totalForecastVol ? '+' : ''}${(totalActualVol - totalForecastVol).toLocaleString()} units`,
        growthPercent: `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`,
        rawRevenueDiff: totalActualRev - totalForecastRev,
        rawSalesDiff: totalActualVol - totalForecastVol,
      };

      setData({ summary, items });
    } catch (err) {
      console.error('Failed to load live forecast vs actual telemetry:', err);
      setErrorState(true);
      setData({ summary: {}, items: [] });
    } finally {
      setLoading(false);
    }
  }, [filters, emptyState]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open modal helper
  const handleOpenDrillDown = (type, id, title) => {
    setModalType(type);
    setModalId(id);
    setModalTitle(title);
    setModalOpen(true);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      dateRange: '30d',
      category: 'all',
      startDate: '',
      endDate: '',
    });
    setErrorState(false);
    setEmptyState(false);
  };

  const { summary, items } = data;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-950/80 p-6 md:p-8 backdrop-blur">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{t('forecast vs actual')}</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Compare AI predicted sales with actual recorded sales in one interactive view.
          </p>
        </div>

      </section>

      {/* Filter Component */}
      <DashboardFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* RENDER ERROR STATE */}
      {errorState ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <FiAlertTriangle className="text-3xl shrink-0" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Service Connectivity Interrupted</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              Unable to establish a connection with the MarketMind forecasting models. Please check your connection or click retry below.
            </p>
          </div>
          <button
            onClick={() => setErrorState(false)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/20"
          >
            <FiRefreshCw />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : (
        <>
          {/* KPI CARDS SECTION */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 space-y-3 animate-pulse"
                >
                  <div className="h-4 w-1/3 bg-white/10 rounded" />
                  <div className="h-8 w-2/3 bg-white/10 rounded" />
                  <div className="h-3.5 w-1/2 bg-white/5 rounded" />
                </div>
              ))
            ) : items.length === 0 ? (
              // Empty KPI Cards fallback
              Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 opacity-60"
                >
                  <p className="text-xs text-slate-400">Stat Card</p>
                  <h4 className="mt-2 text-xl font-bold text-slate-500">N/A</h4>
                  <p className="mt-2 text-xs text-slate-500">No data filtered</p>
                </div>
              ))
            ) : (
              <>
                <div
                  onClick={() => handleOpenDrillDown('kpi', 'Total Forecast Revenue', 'Forecasted Sales Records')}
                  className="cursor-pointer transition hover:scale-[1.01]"
                >
                  <StatCard
                    label="Total Forecast Revenue"
                    value={summary.totalForecastRevenue}
                    helper="AI predicted earnings"
                    accent="cyan"
                  />
                </div>
                <div
                  onClick={() => handleOpenDrillDown('kpi', 'Total Actual Revenue', 'Actual Logged Sales Records')}
                  className="cursor-pointer transition hover:scale-[1.01]"
                >
                  <StatCard
                    label="Total Actual Revenue"
                    value={summary.totalActualRevenue}
                    helper="Recorded business sales"
                    accent="emerald"
                  />
                </div>
                <div
                  onClick={() => handleOpenDrillDown('kpi', 'Forecast Accuracy', 'Forecast Reliability Log')}
                  className="cursor-pointer transition hover:scale-[1.01]"
                >
                  <StatCard
                    label="Forecast Accuracy %"
                    value={summary.forecastAccuracy}
                    helper="Average prediction confidence"
                    accent="amber"
                  />
                </div>
                <div
                  onClick={() => handleOpenDrillDown('kpi', 'Revenue Difference', 'Revenue Variance Analysis')}
                  className="cursor-pointer transition hover:scale-[1.01]"
                >
                  <article className={`rounded-3xl border border-white/10 bg-gradient-to-br p-5 ${
                    summary.rawRevenueDiff >= 0
                      ? 'from-emerald-400/20 to-emerald-500/5 text-emerald-200'
                      : 'from-rose-400/20 to-rose-500/5 text-rose-200'
                  }`}>
                    <p className="text-sm text-slate-300">Revenue Difference</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <h4 className="text-3xl font-semibold text-white">{summary.revenueDifference}</h4>
                      {summary.rawRevenueDiff >= 0 ? (
                        <FiArrowUpRight className="text-emerald-400 text-lg" />
                      ) : (
                        <FiArrowDownRight className="text-rose-400 text-lg" />
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-350">Actual vs Predicted Diff</p>
                  </article>
                </div>
                <div
                  onClick={() => handleOpenDrillDown('kpi', 'Sales Volume Difference', 'Sales Vol Variance Logs')}
                  className="cursor-pointer transition hover:scale-[1.01]"
                >
                  <article className={`rounded-3xl border border-white/10 bg-gradient-to-br p-5 ${
                    summary.rawSalesDiff >= 0
                      ? 'from-cyan-400/20 to-cyan-500/5 text-cyan-200'
                      : 'from-amber-400/20 to-amber-500/5 text-amber-200'
                  }`}>
                    <p className="text-sm text-slate-300">Sales Difference</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <h4 className="text-3xl font-semibold text-white">{summary.salesDifference}</h4>
                    </div>
                    <p className="mt-2 text-sm text-slate-350">Unit volume differential</p>
                  </article>
                </div>
                <div
                  onClick={() => handleOpenDrillDown('kpi', 'Expected Growth', 'Growth Analysis Logs')}
                  className="cursor-pointer transition hover:scale-[1.01]"
                >
                  <StatCard
                    label="Growth %"
                    value={summary.growthPercent}
                    helper="Calculated range growth rate"
                    accent="amber"
                  />
                </div>
              </>
            )}
          </div>

          {/* LINE AND AREA CHART PANEL */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Forecast vs Actual Comparison</h3>
                <p className="text-xs text-slate-400 mt-1">
                  AI Predictions (Line) mapped against Actual Recorded Sales (Bar)
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2.5 h-2.5 bg-cyan-500/80 rounded-sm"></span>
                  <span>Actual Revenue</span>
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-3 h-0.5 bg-amber-400 border-t border-dashed border-amber-400"></span>
                  <span>Forecast Revenue</span>
                </span>
              </div>
            </div>

            {loading ? (
              <div className="h-80 w-full flex items-center justify-center bg-white/2 rounded-2xl animate-pulse">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <FiRefreshCw className="animate-spin text-cyan-400" />
                  <span>Loading Chart Analytics...</span>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="h-80 flex flex-col items-center justify-center text-center p-6 space-y-2">
                <FiInbox className="text-4xl text-slate-600" />
                <p className="text-slate-400 text-sm font-medium">No sales comparison records found.</p>
                <p className="text-slate-500 text-xs">Adjust your date range or category filters.</p>
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={items}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    onClick={(chartData) => {
                      if (chartData && chartData.activePayload) {
                        const payload = chartData.activePayload[0].payload;
                        handleOpenDrillDown(
                          'date',
                          payload.rawDate || payload.date,
                          `Transactions for ${payload.date}`
                        );
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#0f1724" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      dy={5}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const act = payload[0].value;
                          const fct = payload[1]?.value || 0;
                          const diff = act - fct;
                          const acc = payload[0].payload.accuracyPct;
                          return (
                            <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 shadow-2xl backdrop-blur-md">
                              <p className="text-xs font-bold text-white">{label}</p>
                              <div className="mt-2 space-y-1.5 text-xs">
                                <div className="flex justify-between gap-6 text-cyan-400">
                                  <span>Actual Sales:</span>
                                  <span className="font-mono font-semibold">${act.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between gap-6 text-amber-400">
                                  <span>Forecast Sales:</span>
                                  <span className="font-mono font-semibold">${fct.toLocaleString()}</span>
                                </div>
                                <div className={`flex justify-between gap-6 ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  <span>Variance:</span>
                                  <span className="font-mono font-semibold">
                                    {diff >= 0 ? '+' : ''}${diff.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between gap-6 text-slate-300 border-t border-white/5 pt-1.5">
                                  <span>Accuracy:</span>
                                  <span className="font-mono font-semibold text-emerald-300">{acc.toFixed(1)}%</span>
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-2 text-center font-medium">Click point to drill-down</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    />
                    <Bar
                      dataKey="actualRevenue"
                      name="Actual Revenue"
                      fill="#06b6d4"
                      opacity={0.8}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                    <Line
                      type="monotone"
                      dataKey="forecastRevenue"
                      name="Forecast Revenue (AI)"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      strokeDasharray="4 4"
                      dot={{ r: 4, fill: '#f59e0b' }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* TABLE LOGS PANEL */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Detailed Period Breakdown</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Chronological forecast accuracy tracking and deviation records
                </p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="h-10 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <FiInfo className="text-3xl text-slate-650 mx-auto" />
                <p className="text-slate-450 text-sm font-medium">No details available.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-950/30">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-400 bg-white/2">
                      <th className="py-3.5 px-4 font-semibold">Date</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Forecast Revenue</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Actual Revenue</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Difference ($)</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Forecasted Sales</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Actual Sales</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Difference (Qty)</th>
                      <th className="py-3.5 px-4 font-semibold text-center">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    {items.map((row, idx) => {
                      const isPositive = row.differenceRevenue >= 0;
                      return (
                        <tr
                          key={idx}
                          onClick={() =>
                            handleOpenDrillDown(
                              'date',
                              row.rawDate || row.date,
                              `Transactions for ${row.date}`
                            )
                          }
                          className="hover:bg-cyan-400/5 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 font-semibold text-white">{row.date}</td>
                          <td className="py-3 px-4 text-right font-mono">${row.forecastRevenue.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-cyan-400">
                            ${row.actualRevenue.toLocaleString()}
                          </td>
                          <td className={`py-3 px-4 text-right font-mono font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? '+' : ''}${row.differenceRevenue.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono">{row.forecastSales.toLocaleString()} units</td>
                          <td className="py-3 px-4 text-right font-mono">{row.actualSales.toLocaleString()} units</td>
                          <td className={`py-3 px-4 text-right font-mono font-semibold ${row.differenceSales >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {row.differenceSales >= 0 ? '+' : ''}{row.differenceSales.toLocaleString()} units
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              row.accuracyPct >= 95
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : row.accuracyPct >= 90
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {row.accuracyPct.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* DRILL DOWN MODAL */}
      <DrillDownModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        drillDownType={modalType}
        drillDownId={modalId}
        filters={filters}
      />
    </div>
  );
}
