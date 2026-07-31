import { useState, useEffect } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import StatCard from '../../components/common/StatCard';
import SectionCard from '../../components/common/SectionCard';
import Button from '../../components/ui/Button';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { 
  FiTrendingUp, FiShoppingBag, FiUsers, FiBox, FiAlertTriangle, FiFileText, 
  FiZap, FiRefreshCw, FiGrid, FiActivity, FiClock, FiCheckCircle, FiInfo 
} from 'react-icons/fi';

// Dummy static metrics
const MOCK_METRICS = {
  totalRevenue: '$142,850.00',
  totalOrders: '3,842',
  totalCustomers: '1,280',
  totalProducts: '512',
  lowStockProducts: '18',
  pendingInvoices: '24',
  aiRecommendations: '7',
  activeAlerts: '4',
};

// Recharts: Monthly Revenue Trend
const REVENUE_TREND_DATA = [
  { month: 'Jan', revenue: 18500, orders: 490 },
  { month: 'Feb', revenue: 22000, orders: 580 },
  { month: 'Mar', revenue: 19800, orders: 510 },
  { month: 'Apr', revenue: 25400, orders: 670 },
  { month: 'May', revenue: 29000, orders: 780 },
  { month: 'Jun', revenue: 32400, orders: 890 },
  { month: 'Jul', revenue: 38420, orders: 922 },
];

// Recharts: Sales by Product Category
const CATEGORY_DATA = [
  { name: 'Organic Grocery', value: 42300 },
  { name: 'Snacks & Bakery', value: 31200 },
  { name: 'Beverages', value: 25400 },
  { name: 'Personal Care', value: 18900 },
  { name: 'Dairy & Eggs', value: 25050 },
];
const COLORS = ['#22d3ee', '#34d399', '#6366f1', '#fbbf24', '#f472b6'];

// Recharts: Customer Acquisition Distribution
const CUSTOMER_DIST_DATA = [
  { channel: 'In-Store Walk-in', count: 580 },
  { channel: 'Online Store', count: 420 },
  { channel: 'Local Delivery App', count: 180 },
  { channel: 'Catering B2B', count: 100 },
];

// Table: Top Products
const TOP_PRODUCTS = [
  { rank: 1, name: 'Premium Espresso Beans (1kg)', qty: 320, price: '$24.99', rev: '$7,996.80', margin: '68%', trend: '+15.2%' },
  { rank: 2, name: 'Cold Brew Coffee Concentrate', qty: 280, price: '$12.99', rev: '$3,637.20', margin: '74%', trend: '+8.4%' },
  { rank: 3, name: 'Gluten-Free Oats (1kg)', qty: 240, price: '$8.50', rev: '$2,040.00', margin: '52%', trend: '-2.1%' },
  { rank: 4, name: 'Almond Milk (Unsweetened, 1L)', qty: 210, price: '$4.29', rev: '$900.90', margin: '48%', trend: '+12.7%' },
  { rank: 5, name: 'Organic Honey Jars (500g)', qty: 180, price: '$15.99', rev: '$2,878.20', margin: '60%', trend: '+5.0%' },
];

// Panel: Critical Alerts
const RECENT_ALERTS = [
  { id: 1, text: 'Security: Multiple failed login attempts from IP 192.168.1.104', type: 'critical', time: '10m ago' },
  { id: 2, text: 'Stock: Organic Honey Jars is at 3 units (threshold: 10)', type: 'warning', time: '45m ago' },
  { id: 3, text: 'Billing: Overdue Invoice #INV-2026-089 past 5 days ($1,850.00)', type: 'warning', time: '2h ago' },
  { id: 4, text: 'System: Database replica replication lag exceeds nominal threshold (4.2s delay)', type: 'info', time: '3h ago' },
];

// Timeline: Recent Activity Logs
const RECENT_ACTIVITY = [
  { time: '10m ago', user: 'System Agent', desc: 'Triggered CPU usage warning (85% utilization threshold reached)' },
  { time: '45m ago', user: 'Store Manager', desc: 'Changed inventory level for Organic Honey Jars (reduced to 3)' },
  { time: '2h ago', user: 'Sales Executive', desc: 'Dispatched Invoice #INV-2026-102 to John Doe ($450.00)' },
  { time: '4h ago', user: 'System DB Scheduler', desc: 'Successfully synchronized daily sales ledger replication' },
  { time: 'Yesterday', user: 'Admin User', desc: 'Approved new Sales Executive account registration for Sarah Miller' },
];

// List: AI Recommendations
const AI_RECOMMENDATIONS = [
  { title: 'Cross-Sell Bundling', text: "Promotional Bundle suggestion: Combine 'Espresso Beans' and 'Organic Honey' to increase average transaction size by $4.50. Target: repeat customers.", priority: 'high' },
  { title: 'Dynamic Price Adjustment', text: 'Increase Almond Milk price from $4.29 to $4.49 during weekend peaks (Fri-Sun 3PM-6PM). Demand models indicate zero volume elasticity loss.', priority: 'medium' },
  { title: 'Automated Restocking', text: 'Trigger automated restock order of Gluten-Free Oats (reorder point hit). Suggested supplier: Organic Foods Inc.', priority: 'medium' },
];

// List: Quick Business Insights
const BUSINESS_INSIGHTS = [
  { label: 'Peak Store Hours', text: 'Saturdays between 11:00 AM and 2:00 PM account for 22% of weekly sales volume. Ensure staffing matches peak requirements.', accent: 'cyan' },
  { label: 'Customer Concentration', text: 'High-Value Customer cohort (top 5% spenders) accounts for 34% of total profit margin. Recommend launching a VIP loyalty trial.', accent: 'purple' },
  { label: 'Dead Stock Alert', text: 'Soy Protein Powders (SKU: SPP-990) shows 0 sales velocity over the past 45 days. Suggest running a 25% discount clearance.', accent: 'amber' },
];

export default function BusinessOverviewPage() {
  usePageTitle('Business Overview');

  // Interactive Demonstration States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  // Load telemetry simulation
  const fetchTelemetry = () => {
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const triggerErrorDemo = () => {
    setError('Gateway Timeout: Connection to AI Analytics Pipeline (Port 8443) refused by cluster load balancer.');
  };

  const handleRetry = () => {
    setError(null);
    fetchTelemetry();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 md:p-8 backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Business Overview</h1>
          <p className="mt-1.5 text-sm text-slate-400">Executive metrics, predictive analytics, and system alerts.</p>
        </div>
        
        <div className="flex items-center gap-2 self-start flex-wrap">
          {/* Refresh Button */}
          <Button onClick={handleRetry} variant="secondary" className="gap-2 py-2.5 px-4 rounded-xl text-xs font-bold">
            <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh Data
          </Button>

          {/* Interactive State Demo Menu */}
          <div className="relative">
            <button
              onClick={() => setIsDemoOpen(!isDemoOpen)}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-400/20 transition cursor-pointer"
            >
              <FiInfo /> Toggle Demo States
            </button>
            {isDemoOpen && (
              <div className="absolute right-0 mt-2 z-30 w-48 rounded-2xl border border-white/10 bg-slate-950 p-2.5 shadow-2xl backdrop-blur">
                <p className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 mb-2 px-2">Demo Controls</p>
                <div className="space-y-1">
                  <button
                    onClick={() => { setLoading(!loading); setIsDemoOpen(false); }}
                    className="w-full text-left text-xs font-medium text-slate-350 hover:bg-white/5 hover:text-white px-2 py-1.5 rounded-lg transition"
                  >
                    {loading ? 'Disable Loading' : 'Enable Loading'}
                  </button>
                  <button
                    onClick={() => { if (error) setError(null); else triggerErrorDemo(); setIsDemoOpen(false); }}
                    className="w-full text-left text-xs font-medium text-slate-350 hover:bg-white/5 hover:text-white px-2 py-1.5 rounded-lg transition"
                  >
                    {error ? 'Disable Error State' : 'Enable Error State'}
                  </button>
                  <button
                    onClick={() => { setIsEmpty(!isEmpty); setIsDemoOpen(false); }}
                    className="w-full text-left text-xs font-medium text-slate-350 hover:bg-white/5 hover:text-white px-2 py-1.5 rounded-lg transition"
                  >
                    {isEmpty ? 'Disable Empty State' : 'Enable Empty State'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CORE DISPLAY ROUTING */}
      {error ? (
        /* Connection Error UI Component */
        <div className="rounded-3xl border border-rose-500/10 bg-slate-950/80 p-8 backdrop-blur text-center space-y-4 max-w-md mx-auto my-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 mx-auto">
            <FiAlertTriangle className="text-2xl shrink-0" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white">Pipeline Offline</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
          </div>
          <div className="pt-2">
            <Button
              onClick={handleRetry}
              className="bg-rose-500 text-slate-950 hover:bg-rose-450 text-xs font-bold gap-2 py-2.5 px-6 rounded-xl w-full"
            >
              <FiRefreshCw className="text-sm" /> Re-initialize Gateway
            </Button>
          </div>
        </div>
      ) : isEmpty ? (
        /* Empty State Component */
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-16 text-center text-slate-400 backdrop-blur">
          <FiGrid className="text-5xl text-slate-600 mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-semibold text-white">Dashboard Telemetry Empty</h3>
          <p className="text-sm mt-1 text-slate-500">There is no telemetry or sales data reported on the intelligence stream for this period.</p>
          <button
            onClick={() => setIsEmpty(false)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-400 text-slate-950 px-4 py-2 text-xs font-semibold hover:bg-cyan-300 transition"
          >
            Insert Dummy Data
          </button>
        </div>
      ) : (
        /* Full Business Summary Telemetry Panel */
        <div className="space-y-6">
          
          {/* Summary Stat Cards Grid (8 stats in 2 rows on desktop) */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Revenue" value={loading ? '' : MOCK_METRICS.totalRevenue} helper="+12.4% vs last month" accent="cyan" loading={loading} />
            <StatCard label="Total Orders" value={loading ? '' : MOCK_METRICS.totalOrders} helper="+8.2% vs last month" accent="emerald" loading={loading} />
            <StatCard label="Total Customers" value={loading ? '' : MOCK_METRICS.totalCustomers} helper="+5.1% vs last month" accent="cyan" loading={loading} />
            <StatCard label="Total Products" value={loading ? '' : MOCK_METRICS.totalProducts} helper="42 new items added" accent="slate" loading={loading} />
            
            <StatCard label="Low Stock Products" value={loading ? '' : MOCK_METRICS.lowStockProducts} helper="6 items critically low" accent="amber" loading={loading} />
            <StatCard label="Pending Invoices" value={loading ? '' : MOCK_METRICS.pendingInvoices} helper="$8,420 outstanding balance" accent="amber" loading={loading} />
            <StatCard label="AI Recommendations" value={loading ? '' : MOCK_METRICS.aiRecommendations} helper="3 high impact tasks open" accent="purple" loading={loading} />
            <StatCard label="Active Alerts" value={loading ? '' : MOCK_METRICS.activeAlerts} helper="2 system security logs" accent="rose" loading={loading} />
          </section>

          {/* Section 1: Revenue Trend & Business Health Score */}
          <section className="grid gap-6 lg:grid-cols-3">
            {/* Revenue Trend Area Chart */}
            <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-950/80 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Monthly Sales Trend</h3>
                  <p className="text-[11px] text-slate-400">Total monthly revenue vs invoice billing totals</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                  <FiTrendingUp className="text-lg" />
                </div>
              </div>

              {loading ? (
                <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={REVENUE_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                      <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px' }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#22d3ee" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Business Health Summary Widget */}
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 flex flex-col justify-between">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Business Health</h3>
                    <p className="text-[11px] text-slate-400">Aggregate telemetry parameters score</p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                    <FiActivity className="text-lg" />
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-4 animate-pulse pt-4">
                    <div className="h-28 w-28 rounded-full border-4 border-white/10 mx-auto"></div>
                    <div className="h-4 bg-white/10 rounded w-1/2 mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-5 pt-2">
                    {/* Health Score Circle Indicator */}
                    <div className="relative flex items-center justify-center">
                      <svg className="w-28 h-28 transform -rotate-90">
                        <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
                        <circle cx="56" cy="56" r="48" stroke="#22d3ee" strokeWidth="7" fill="transparent"
                                strokeDasharray={301.6} strokeDashoffset={301.6 - (301.6 * 94) / 100} strokeLinecap="round" />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-bold text-white">94%</span>
                        <span className="text-[9px] uppercase font-bold text-emerald-400">Excellent</span>
                      </div>
                    </div>

                    {/* Progress bars of components */}
                    <div className="space-y-2.5">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400">Margin Health</span>
                          <span className="font-semibold text-white">96%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded-full" style={{ width: '96%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400">Stock Availability</span>
                          <span className="font-semibold text-white">91%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: '91%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400">Customer Retention</span>
                          <span className="font-semibold text-white">95%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: '95%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section 2: Product Categories & Customers Split */}
          <section className="grid gap-6 md:grid-cols-2">
            {/* Sales by Category Pie Chart */}
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Sales by Category</h3>
              
              {loading ? (
                <div className="h-56 animate-pulse rounded-2xl bg-white/5" />
              ) : (
                <div className="h-56 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="h-full w-full sm:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={CATEGORY_DATA}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {CATEGORY_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legend Labels */}
                  <div className="w-full sm:w-1/2 space-y-2">
                    {CATEGORY_DATA.map((item, idx) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                          <span className="text-slate-400">{item.name}</span>
                        </div>
                        <span className="font-bold text-white">${item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Customer Distribution Chart */}
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Customer Acquisition</h3>
              {loading ? (
                <div className="h-56 animate-pulse rounded-2xl bg-white/5" />
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={CUSTOMER_DIST_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                      <XAxis dataKey="channel" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px' }}
                      />
                      <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]}>
                        {CUSTOMER_DIST_DATA.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={idx % 2 === 0 ? '#06b6d4' : '#6366f1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Forecast Summary & Quick Insights */}
          <section className="grid gap-6 md:grid-cols-3">
            {/* Forecast Summary Card */}
            <article className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-indigo-650/5 p-6 backdrop-blur space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
                  AI Sales Forecast
                </span>
                <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  92% Confidence
                </span>
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide block">Next Month Forecast (Aug)</span>
                <span className="text-3xl font-bold text-white block">$42,500.00</span>
                <span className="text-xs font-semibold text-emerald-400 block">+10.6% projected surge</span>
              </div>

              <div className="border-t border-white/5 pt-3">
                <p className="text-xs text-slate-350 leading-relaxed italic bg-slate-950/40 p-3 rounded-xl border border-white/5">
                  "High restock priority suggested for Organic Teas and Seasonal Beverages by August 10 to capture rising demand predicted by seasonal weather variations."
                </p>
              </div>
            </article>

            {/* Quick Business Insights (2 cards) */}
            <div className="md:col-span-2 grid gap-4 sm:grid-cols-3">
              {BUSINESS_INSIGHTS.map((insight, idx) => (
                <div 
                  key={idx} 
                  className={`rounded-3xl border border-white/10 bg-slate-950/80 p-5 flex flex-col justify-between hover:border-${insight.accent}-400/20 transition-all duration-300`}
                >
                  <div>
                    <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border ${
                      insight.accent === 'cyan' ? 'bg-cyan-500/10 text-cyan-300 border-cyan-400/20' : 
                      insight.accent === 'purple' ? 'bg-purple-500/10 text-purple-300 border-purple-400/20' :
                      'bg-amber-500/10 text-amber-300 border-amber-400/20'
                    }`}>
                      {insight.label}
                    </span>
                    <p className="text-xs text-slate-350 mt-3.5 leading-relaxed">
                      {insight.text}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold mt-4 block ${
                    insight.accent === 'cyan' ? 'text-cyan-300' :
                    insight.accent === 'purple' ? 'text-purple-300' : 'text-amber-300'
                  }`}>
                    Action Recommended &rarr;
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Top Selling Products Table & Recent Alerts Panel */}
          <section className="grid gap-6 lg:grid-cols-3">
            {/* Top Products Table */}
            <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-950/80 p-6 overflow-hidden">
              <h3 className="text-sm font-semibold text-white mb-4">Top Selling Products</h3>
              {loading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-10 bg-white/10 rounded"></div>
                  <div className="h-8 bg-white/5 rounded"></div>
                  <div className="h-8 bg-white/5 rounded"></div>
                  <div className="h-8 bg-white/5 rounded"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/15 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-2.5">Item</th>
                        <th className="py-2.5 text-center">Qty Sold</th>
                        <th className="py-2.5 text-right">Revenue</th>
                        <th className="py-2.5 text-center">Margin</th>
                        <th className="py-2.5 text-right">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {TOP_PRODUCTS.map((prod) => (
                        <tr key={prod.rank} className="hover:bg-white/[0.02] transition">
                          <td className="py-3 font-semibold text-white">
                            <span className="text-slate-500 mr-2">#{prod.rank}</span>
                            {prod.name}
                          </td>
                          <td className="py-3 text-center text-slate-300 font-mono">{prod.qty}</td>
                          <td className="py-3 text-right font-semibold text-cyan-300 font-mono">{prod.rev}</td>
                          <td className="py-3 text-center text-slate-300 font-mono">{prod.margin}</td>
                          <td className={`py-3 text-right font-bold font-mono ${prod.trend.startsWith('+') ? 'text-emerald-450' : 'text-rose-400'}`}>
                            {prod.trend}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Alerts Panel */}
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white mb-4">Recent System Logs</h3>
                
                {loading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-10 bg-white/5 rounded"></div>
                    <div className="h-10 bg-white/5 rounded"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {RECENT_ALERTS.map((alert) => (
                      <div 
                        key={alert.id} 
                        className={`p-3 rounded-2xl border flex items-start gap-2.5 text-xs ${
                          alert.type === 'critical' ? 'bg-rose-500/5 border-rose-500/10' :
                          alert.type === 'warning' ? 'bg-amber-500/5 border-amber-500/10' :
                          'bg-cyan-500/5 border-cyan-400/10'
                        }`}
                      >
                        <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                          alert.type === 'critical' ? 'bg-rose-500 animate-ping' :
                          alert.type === 'warning' ? 'bg-amber-400' : 'bg-cyan-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                            {alert.text}
                          </p>
                          <span className="text-[9px] text-slate-500 mt-1 block font-semibold">{alert.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section 5: Latest AI Recommendations & Activity Timeline */}
          <section className="grid gap-6 md:grid-cols-2">
            {/* Recommendations List */}
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Latest AI Recommendations</h3>
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-14 bg-white/5 rounded-2xl"></div>
                  <div className="h-14 bg-white/5 rounded-2xl"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {AI_RECOMMENDATIONS.map((rec, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 rounded-2xl border border-white/5 bg-slate-900/30 hover:border-purple-400/20 hover:bg-purple-500/[0.01] transition-all duration-300"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <FiZap className="text-purple-400 text-sm" />
                        <h4 className="text-xs font-bold text-white">{rec.title}</h4>
                        <span className="text-[8px] font-extrabold uppercase bg-purple-500/10 border border-purple-500/20 text-purple-400 px-1.5 rounded tracking-wide ml-auto">
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-400">
                        {rec.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity Timeline */}
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Recent Activity Timeline</h3>
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-20 bg-white/5 rounded-2xl"></div>
                </div>
              ) : (
                <div className="relative pl-4 border-l border-white/10 space-y-5">
                  {RECENT_ACTIVITY.map((act, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[20px] top-1 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-cyan-400 shadow-sm" />
                      
                      <div className="text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-300">{act.user}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">{act.time}</span>
                        </div>
                        <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">
                          {act.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

        </div>
      )}
    </div>
  );
}
