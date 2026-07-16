import { usePageTitle } from '../../hooks/usePageTitle';
import { FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import StatCard from '../../components/common/StatCard';

// Mock historical + future forecast sales data
const FORECAST_DATA = [
  { name: '07-10', Sales: 840, Projected: null },
  { name: '07-11', Sales: 920, Projected: null },
  { name: '07-12', Sales: 780, Projected: null },
  { name: '07-13', Sales: 1100, Projected: null },
  { name: '07-14', Sales: 1250, Projected: null },
  { name: '07-15', Sales: 1180, Projected: 1180 }, // Bleed point
  { name: '07-16 Forecast', Sales: null, Projected: 1300 },
  { name: '07-17 Forecast', Sales: null, Projected: 1420 },
  { name: '07-18 Forecast', Sales: null, Projected: 1390 },
  { name: '07-19 Forecast', Sales: null, Projected: 1510 },
  { name: '07-20 Forecast', Sales: null, Projected: 1650 },
];

const CATEGORY_FORECASTS = [
  { category: 'Electronics', growth: '+18.4%', trend: 'Strong Increase', recommendation: 'Increase stock levels by 20% to avoid holiday stockout.' },
  { category: 'Accessories', growth: '+2.1%', trend: 'Stable / Flat', recommendation: 'Maintain current inventory; seasonal discounts optional.' },
  { category: 'Tools', growth: '-5.8%', trend: 'Slight Decline', recommendation: 'Halt fresh procurement; execute promotional bundles.' },
  { category: 'Starter Packs', growth: '+11.2%', trend: 'Moderate Increase', recommendation: 'Pre-order 10% extra kits for weekend rushes.' },
];

function ForecastReportsPage() {
  usePageTitle('Forecast Reports');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 md:p-8 backdrop-blur">
        <h1 className="text-3xl font-bold tracking-tight text-white">Demand Forecast Reports</h1>
        <p className="mt-1.5 text-sm text-slate-400">Project future sales volumes, seasonal changes, and inventory demands using predictive ML modeling.</p>
      </section>

      {/* Warning Notice Block */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300 flex items-center gap-3">
        <FiAlertTriangle className="text-xl shrink-0" />
        <div>
          <span className="font-semibold">Waiting for backend integration:</span> Current predictions utilize historical standard regression formulas. Real neural network predictions will load after backend hooks are completed.
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Projected Next 30D Revenue" value="$42,850" helper="Expected +12% increase" icon="dashboard" />
        <StatCard label="Estimated Peak Sales Day" value="July 20, 2026" helper="Driven by seasonal trends" accent="emerald" />
        <StatCard label="Model Confidence Score (R²)" value="94.2%" helper="Based on past 12 months data" accent="amber" />
      </div>

      {/* Forecast Line Chart Card */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Sales & Demand Predictions</h3>
            <p className="text-xs text-slate-400 mt-1">Comparing past sales curves with future predicted performance.</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full"></span>
              <span>Historical Sales</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full"></span>
              <span>Projected Sales</span>
            </div>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={FORECAST_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f1724" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
              <YAxis tick={{ fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '1rem',
                }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="Sales" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" dot={{ r: 4 }} />
              <Area type="monotone" dataKey="Projected" stroke="#10b981" strokeDasharray="4 4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProjected)" dot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Level Forecasting Recommendations */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold text-base border-b border-white/5 pb-4">
          <FiTrendingUp className="text-cyan-400 text-lg" />
          <h3>Forecast Category Analytics</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-400">
                <th className="pb-3 pl-2 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Expected Growth (MoM)</th>
                <th className="pb-3 font-semibold text-center">Trend Label</th>
                <th className="pb-3 font-semibold pl-4">Suggested Strategy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-slate-300">
              {CATEGORY_FORECASTS.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 pl-2 font-bold text-white">{item.category}</td>
                  <td className="py-3.5 font-semibold text-emerald-400 font-mono">{item.growth}</td>
                  <td className="py-3.5 text-center">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      item.trend.includes('Increase')
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : item.trend.includes('Stable')
                        ? 'bg-cyan-500/10 text-cyan-300'
                        : 'bg-rose-500/10 text-rose-300'
                    }`}>
                      {item.trend}
                    </span>
                  </td>
                  <td className="py-3.5 pl-4 text-xs text-slate-400 leading-relaxed max-w-sm">
                    {item.recommendation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ForecastReportsPage;
