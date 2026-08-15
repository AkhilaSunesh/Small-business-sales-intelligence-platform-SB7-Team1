import { useState } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import StatCard from '../../components/common/StatCard';
import SalesTrendChart from '../../components/ui/SalesTrendChart';
import TopProductsChart from '../../components/ui/TopProductsChart';
import useDashboardData from '../../hooks/useDashboardData';
import { FiAlertTriangle, FiRefreshCw, FiInbox } from 'react-icons/fi';
import Button from '../../components/ui/Button';

import DashboardFilters from '../../components/ui/DashboardFilters';
import DrillDownModal from '../../components/ui/DrillDownModal';

function DashboardPage() {
  usePageTitle('Dashboard');

  // Filter state
  const [filters, setFilters] = useState({
    dateRange: '1y',
    category: 'all',
    startDate: '',
    endDate: '',
  });

  // Drill-down Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState('general');
  const [modalId, setModalId] = useState('');

  const { loading, error, summary, trend, topProducts, refetch } = useDashboardData(filters);

  const stats = summary || {};
  const salesData = trend && trend.length > 0 ? trend : [];
  const products = topProducts && topProducts.length > 0 ? topProducts : [];

  const handleOpenDrillDown = (type, id, title) => {
    setModalType(type);
    setModalId(id);
    setModalTitle(title);
    setModalOpen(true);
  };

  const handleResetFilters = () => {
    setFilters({
      dateRange: '1y',
      category: 'all',
      startDate: '',
      endDate: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 md:p-8 backdrop-blur flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="mt-1.5 text-sm text-slate-400">Monitor sales performance and business insights in real time.</p>
        </div>
        {error && (
          <Button onClick={refetch} variant="secondary" className="gap-2 self-start py-2.5 px-5 rounded-xl text-xs font-bold">
            <FiRefreshCw /> Retry Connection
          </Button>
        )}
      </section>

      {/* Filters Toolbar */}
      <DashboardFilters
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* CORE DISPLAY ROUTING */}
      {error ? (
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
              <div
                onClick={() => handleOpenDrillDown('kpi', 'Total Revenue', 'Revenue Transactions')}
                className="cursor-pointer transition hover:scale-[1.01]"
              >
                <StatCard 
                  label="Total Revenue" 
                  value={stats.totalRevenue !== undefined ? `$${Number(stats.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'} 
                  helper="Aggregated store earnings" 
                  loading={loading} 
                />
              </div>
              <div
                onClick={() => handleOpenDrillDown('kpi', 'Total Orders', 'Order Logs')}
                className="cursor-pointer transition hover:scale-[1.01]"
              >
                <StatCard 
                  label="Total Orders" 
                  value={stats.totalOrders !== undefined ? Number(stats.totalOrders).toLocaleString() : '0'} 
                  helper="Orders volume processed" 
                  accent="emerald" 
                  loading={loading} 
                />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
              <h3 className="text-sm text-slate-350 font-medium mb-4">Sales Trend</h3>
              {loading ? (
                <div className="h-56 animate-pulse rounded-2xl bg-white/5" />
              ) : salesData.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-slate-500 bg-slate-900/20 rounded-2xl border border-dashed border-white/5 p-4">
                  <FiInbox className="text-3xl mb-2 text-slate-600" />
                  <p className="text-xs">No sales transaction records found.</p>
                </div>
              ) : (
                <SalesTrendChart
                  data={salesData}
                  loading={loading}
                  onElementClick={(dateVal) =>
                    handleOpenDrillDown('date', dateVal, `Daily Sales - ${dateVal}`)
                  }
                />
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="grid gap-4">
              <div
                onClick={() => handleOpenDrillDown('kpi', 'Average Order Value', 'Average Basket Value Logs')}
                className="cursor-pointer transition hover:scale-[1.01]"
              >
                <StatCard
                  label="Avg Order Value"
                  value={
                    stats.avgOrderValue !== undefined
                      ? `$${Number(stats.avgOrderValue).toFixed(2)}`
                      : '$0.00'
                  }
                  helper="Computed average transaction"
                  accent="amber"
                  loading={loading}
                />
              </div>
              <div
                onClick={() => handleOpenDrillDown('kpi', 'Active Products', 'Catalog Items List')}
                className="cursor-pointer transition hover:scale-[1.01]"
              >
                <StatCard label="Active Products" value={stats.activeProducts} helper="Products currently active" loading={loading} />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
              <h3 className="text-sm text-slate-350 font-medium mb-4">Top Products</h3>
              {loading ? (
                <div className="h-56 animate-pulse rounded-2xl bg-white/5" />
              ) : products.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-slate-500 bg-slate-900/20 rounded-2xl border border-dashed border-white/5 p-4">
                  <FiInbox className="text-3xl mb-2 text-slate-600" />
                  <p className="text-xs">No active product listings.</p>
                </div>
              ) : (
                <TopProductsChart
                  data={products}
                  loading={loading}
                  onElementClick={(productVal) =>
                    handleOpenDrillDown('product', productVal, `Product Sales details - ${productVal}`)
                  }
                />
              )}
            </div>
          </aside>
        </section>
      )}

      {/* Drill-down Modal */}
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

export default DashboardPage;