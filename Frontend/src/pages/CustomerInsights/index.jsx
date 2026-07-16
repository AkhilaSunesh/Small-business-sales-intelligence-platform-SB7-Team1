import { usePageTitle } from '../../hooks/usePageTitle';
import { FiUsers, FiTrendingUp, FiAlertTriangle, FiShoppingBag, FiSmile } from 'react-icons/fi';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import StatCard from '../../components/common/StatCard';

// Mock charts data
const CLV_DATA = [
  { segment: 'VIPs', value: 89000, color: '#22d3ee' },
  { segment: 'Loyals', value: 45000, color: '#34d399' },
  { segment: 'Occasional', value: 12000, color: '#f59e0b' },
  { segment: 'New Clients', value: 6500, color: '#f43f5e' },
];

const SEGMENT_BREAKDOWN = [
  { name: 'Direct Retail', value: 45, color: '#06b6d4' },
  { name: 'Online Store', value: 30, color: '#10b981' },
  { name: 'Ref Referral', value: 15, color: '#f59e0b' },
  { name: 'Campaign Leads', value: 10, color: '#ec4899' },
];

// Mock Top Customers Table Data
const MOCK_TOP_CUSTOMERS = [
  { id: 'CUST001', name: 'John Doe', clv: '$12,450', frequency: '24 orders', risk: 'Low', status: 'Loyal VIP' },
  { id: 'CUST002', name: 'Jane Smith', clv: '$8,200', frequency: '15 orders', risk: 'Low', status: 'Active VIP' },
  { id: 'CUST003', name: 'ACME Corp', clv: '$6,800', frequency: '8 orders', risk: 'Medium', status: 'At Risk' },
  { id: 'CUST004', name: 'Bob Johnson', clv: '$4,120', frequency: '11 orders', risk: 'Low', status: 'Active' },
  { id: 'CUST005', name: 'Alice Cooper', clv: '$3,890', frequency: '9 orders', risk: 'High', status: 'Churn Warning' },
];

function CustomerInsightsPage() {
  usePageTitle('Customer Insights');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 md:p-8 backdrop-blur">
        <h1 className="text-3xl font-bold tracking-tight text-white">Customer Insights</h1>
        <p className="mt-1.5 text-sm text-slate-400">Track user acquisition, retention, segments, and lifetime value analytics.</p>
      </section>

      {/* Backend Integration warning banner */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300 flex items-center gap-3">
        <FiAlertTriangle className="text-xl shrink-0" />
        <div>
          <span className="font-semibold">Waiting for backend integration:</span> Advanced cohort calculations and live client churn indicators are queued for future model integrations.
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Cohort Customers" value="8,410" helper="+4.1% vs last month" icon="users" />
        <StatCard label="Avg Lifetime Value" value="$420.50" helper="Customer base mean CLV" accent="emerald" />
        <StatCard label="Customer Churn Rate" value="1.84%" helper="-0.2% improvement" accent="amber" />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* CLV Segment Summary Bar Chart */}
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur space-y-4">
          <h3 className="text-base font-semibold text-white">Revenue by Segment Class ($)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CLV_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f1724" />
                <XAxis dataKey="segment" tick={{ fill: '#94a3b8' }} />
                <YAxis tick={{ fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '1rem',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" fill="#06b6d4" radius={[8, 8, 0, 0]}>
                  {CLV_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Acquisition Channel Breakdown Pie Chart */}
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur space-y-4">
          <h3 className="text-base font-semibold text-white">Acquisition Channel Breakdown (%)</h3>
          <div className="h-64 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={SEGMENT_BREAKDOWN}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {SEGMENT_BREAKDOWN.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '1rem',
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 shrink-0 w-full sm:w-44 text-xs text-slate-300">
              {SEGMENT_BREAKDOWN.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="truncate">{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Customers Segment Info Table */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold text-base border-b border-white/5 pb-4">
          <FiSmile className="text-cyan-400 text-lg" />
          <h3>High Value Segment Cohorts</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-400">
                <th className="pb-3 pl-2 font-semibold">Customer ID</th>
                <th className="pb-3 font-semibold">Name</th>
                <th className="pb-3 font-semibold">Spend (CLV)</th>
                <th className="pb-3 font-semibold">Frequency</th>
                <th className="pb-3 font-semibold text-center">Churn Risk</th>
                <th className="pb-3 font-semibold text-center">Label</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-slate-300">
              {MOCK_TOP_CUSTOMERS.map((cust) => (
                <tr key={cust.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3.5 pl-2 font-mono text-cyan-400">{cust.id}</td>
                  <td className="py-3.5 font-bold text-white">{cust.name}</td>
                  <td className="py-3.5 font-mono text-slate-100 font-semibold">{cust.clv}</td>
                  <td className="py-3.5 text-slate-400">{cust.frequency}</td>
                  <td className="py-3.5 text-center">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      cust.risk === 'Low'
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : cust.risk === 'Medium'
                        ? 'bg-amber-500/10 text-amber-300'
                        : 'bg-rose-500/10 text-rose-300'
                    }`}>
                      {cust.risk}
                    </span>
                  </td>
                  <td className="py-3.5 text-center text-slate-300">{cust.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CustomerInsightsPage;
