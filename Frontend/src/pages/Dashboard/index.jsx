import { usePageTitle } from '../../hooks/usePageTitle';
import StatCard from '../../components/common/StatCard';
import SalesTrendChart from '../../components/ui/SalesTrendChart';
import TopProductsChart from '../../components/ui/TopProductsChart';
import { summaryStats as mockSummary, salesOver30Days as mockSales, topProducts as mockTop } from '../../constants/mockData';
import useDashboardData from '../../hooks/useDashboardData';
import { useAppContext } from '../../context/AppContext';
import { FiAlertTriangle, FiRefreshCw, FiInbox } from 'react-icons/fi';
import Button from '../../components/ui/Button';

function DashboardPage() {
  usePageTitle('Dashboard');
  const { demoMode } = useAppContext();
  const { loading, error, summary, trend, topProducts, refetch } = useDashboardData();

  const isDemoEmpty = demoMode === 'empty';
  const isDemoError = demoMode === 'error' || error;

  const stats = isDemoEmpty
    ? { totalRevenue: '$0', totalOrders: '0', avgOrderValue: '$0', activeProducts: '0' }
    : summary || mockSummary;

  const salesData = isDemoEmpty ? [] : (trend && trend.length > 0 ? trend : mockSales);
  const products = isDemoEmpty ? [] : (topProducts && topProducts.length > 0 ? topProducts : mockTop);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 md:p-8 backdrop-blur flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="mt-1.5 text-sm text-slate-400">Monitor sales performance and business insights in real time.</p>
        </div>
        {isDemoError && (
          <Button onClick={refetch} variant="secondary" className="gap-2 self-start py-2.5 px-5 rounded-xl text-xs font-bold">
            <FiRefreshCw /> Retry Connection
          </Button>
        )}
      </section>

      {/* CORE DISPLAY ROUTING */}
      {isDemoError ? (
        /* Connection Error State */
        <div className="rounded-3xl border border-rose-500/10 bg-slate-950/80 p-8 backdrop-blur text-center space-y-4 max-w-md mx-auto my-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 mx-auto">
            <FiAlertTriangle className="text-2xl shrink-0" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white">Connection Error</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {error || 'Unable to retrieve dashboard metrics from the intelligence API.'}
            </p>
          </div>
          <div className="pt-2">
            <Button
              onClick={refetch}
              className="bg-rose-500 text-white hover:bg-rose-400 text-xs font-bold gap-2 py-2.5 px-6 rounded-xl w-full"
            >
              <FiRefreshCw className="text-sm" /> Retry Connection
            </Button>
          </div>
        </div>
      ) : (
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <StatCard label="Total Revenue" value={stats.totalRevenue} helper="+6.2% vs last month" loading={loading} />
              <StatCard label="Total Orders" value={stats.totalOrders} helper="+2.1% vs last month" accent="emerald" loading={loading} />
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
              <h3 className="text-sm text-slate-350 font-medium mb-4">Daily Sales (last 30 days)</h3>
              {loading ? (
                <div className="h-56 animate-pulse rounded-2xl bg-white/5" />
              ) : isDemoEmpty || salesData.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-slate-500 bg-slate-900/20 rounded-2xl border border-dashed border-white/5 p-4">
                  <FiInbox className="text-3xl mb-2 text-slate-600" />
                  <p className="text-xs">No sales transaction records found.</p>
                </div>
              ) : (
                <SalesTrendChart data={salesData} loading={loading} />
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="grid gap-4">
              <StatCard label="Avg Order Value" value={stats.avgOrderValue} helper="Based on last 30 days" accent="amber" loading={loading} />
              <StatCard label="Active Products" value={stats.activeProducts} helper="Products in catalog" loading={loading} />
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
              <h3 className="text-sm text-slate-350 font-medium mb-4">Top Products</h3>
              {loading ? (
                <div className="h-56 animate-pulse rounded-2xl bg-white/5" />
              ) : isDemoEmpty || products.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-slate-500 bg-slate-900/20 rounded-2xl border border-dashed border-white/5 p-4">
                  <FiInbox className="text-3xl mb-2 text-slate-600" />
                  <p className="text-xs">No active product listings.</p>
                </div>
              ) : (
                <TopProductsChart data={products} loading={loading} />
              )}
            </div>
          </aside>
        </section>
      )}
    </div>
  );
}

export default DashboardPage;
