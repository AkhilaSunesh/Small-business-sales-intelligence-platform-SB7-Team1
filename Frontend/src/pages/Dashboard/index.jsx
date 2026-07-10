import { usePageTitle } from '../../hooks/usePageTitle';
import StatCard from '../../components/common/StatCard';
import ErrorMessage from '../../components/common/ErrorMessage';
import SalesTrendChart from '../../components/ui/SalesTrendChart';
import TopProductsChart from '../../components/ui/TopProductsChart';
import { summaryStats as mockSummary, salesOver30Days as mockSales, topProducts as mockTop } from '../../constants/mockData';
import useDashboardData from '../../hooks/useDashboardData';

function DashboardPage() {
  usePageTitle('Dashboard');

  const { loading, error, summary, trend, topProducts, refetch } = useDashboardData();

  const stats = summary || mockSummary;
  const salesData = (trend && trend.length > 0) ? trend : mockSales;
  const products = (topProducts && topProducts.length > 0) ? topProducts : mockTop;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-8">
        <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-400">Dashboard access is available after login.</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
            <StatCard label="Total Revenue" value={stats.totalRevenue} helper="+6.2% vs last month" loading={loading} />
            <StatCard label="Total Orders" value={stats.totalOrders} helper="+2.1% vs last month" accent="emerald" loading={loading} />
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-slate-300">Daily Sales (last 30 days)</h3>
              {error ? (
                <div>
                  <button onClick={refetch} className="text-xs text-cyan-300">Retry</button>
                </div>
              ) : null}
            </div>
            {error ? <ErrorMessage messages={[error]} /> : <SalesTrendChart data={salesData} loading={loading} />}
          </div>
        </div>

        <aside className="space-y-6">
            <div className="grid gap-4">
            <StatCard label="Avg Order Value" value={stats.avgOrderValue} helper="Based on last 30 days" accent="amber" />
            <StatCard label="Active Products" value={stats.activeProducts} helper="Products in catalog" />
          </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
            <h3 className="text-sm text-slate-300">Top Products</h3>
            {error ? <ErrorMessage messages={[error]} /> : <TopProductsChart data={products} loading={loading} />}
          </div>
        </aside>
      </section>
    </div>
  );
}

export default DashboardPage;
