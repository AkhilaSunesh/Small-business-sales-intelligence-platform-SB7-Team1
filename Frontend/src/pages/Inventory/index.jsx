import { useState, useEffect, useCallback } from 'react';
import { FiAlertTriangle, FiPackage, FiInbox, FiRefreshCw } from 'react-icons/fi';
import { usePageTitle } from '../../hooks/usePageTitle';
import SectionCard from '../../components/common/SectionCard';
import productService from '../../services/productService';
import Button from '../../components/ui/Button';

function statusClasses(status) {
  if (status === 'Critical') {
    return 'bg-rose-400/10 text-rose-200 ring-1 ring-rose-400/20';
  }

  if (status === 'Low stock') {
    return 'bg-amber-400/10 text-amber-200 ring-1 ring-amber-400/20';
  }

  return 'bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-400/20';
}

function getStockStatus(stock) {
  if (stock <= 10) return 'Critical';
  if (stock <= 50) return 'Low stock';
  return 'Healthy';
}

function InventoryPage() {
  usePageTitle('Inventory');

  const [inventoryRows, setInventoryRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productService.getProducts();
      if (res && res.success && Array.isArray(res.data)) {
        const mapped = res.data.map((prod) => ({
          sku: prod.sku || prod.id || 'N/A',
          product: prod.name || 'Unknown Product',
          category: prod.category || 'General',
          stock: prod.stock ?? prod.quantity ?? 0,
          status: getStockStatus(prod.stock ?? prod.quantity ?? 0),
        }));
        setInventoryRows(mapped);
      } else if (Array.isArray(res)) {
        const mapped = res.map((prod) => ({
          sku: prod.sku || prod.id || 'N/A',
          product: prod.name || 'Unknown Product',
          category: prod.category || 'General',
          stock: prod.stock ?? prod.quantity ?? 0,
          status: getStockStatus(prod.stock ?? prod.quantity ?? 0),
        }));
        setInventoryRows(mapped);
      } else {
        setInventoryRows([]);
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <SectionCard
      title="Inventory summary"
      subtitle="Live product records from the database."
    >
      {/* CORE DISPLAY ROUTING */}
      {error ? (
        /* Connection Error State */
        <div className="rounded-3xl border border-rose-500/10 bg-slate-950/80 p-8 backdrop-blur text-center space-y-4 max-w-md mx-auto my-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 mx-auto">
            <FiAlertTriangle className="text-2xl shrink-0" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white">Connection Error</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Unable to retrieve products catalog. Check database server connection status.
            </p>
          </div>
          <div className="pt-2">
            <Button
              onClick={fetchProducts}
              className="bg-rose-500 text-white hover:bg-rose-400 text-xs font-bold gap-2 py-2.5 px-6 rounded-xl w-full"
            >
              <FiRefreshCw className="text-sm" /> Retry Connection
            </Button>
          </div>
        </div>
      ) : loading ? (
        /* Loading Skeleton */
        <div className="overflow-hidden rounded-2xl border border-white/10 animate-pulse bg-slate-950/20">
          <div className="h-10 bg-white/5 border-b border-white/10" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 border-b border-white/5 bg-white/2" />
          ))}
        </div>
      ) : inventoryRows.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-12 text-center text-slate-400 backdrop-blur">
          <FiInbox className="text-5xl text-slate-650 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white">No products available in catalog.</h3>
          <p className="text-sm mt-1 text-slate-500">Add new product inventories in the create center.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-white/5 text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-slate-950/40">
                {inventoryRows.map((row) => (
                  <tr key={row.sku} className="transition hover:bg-white/5">
                    <td className="px-4 py-4 font-medium text-white">{row.sku}</td>
                    <td className="px-4 py-4 text-slate-300">{row.product}</td>
                    <td className="px-4 py-4 text-slate-400">{row.category}</td>
                    <td className="px-4 py-4 text-slate-300">{row.stock}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-400/15 bg-amber-400/10 p-4 text-sm text-amber-100/90">
            <FiAlertTriangle className="mt-0.5 shrink-0 text-lg" />
            <p>
              Critical items are highlighted so the future backend can flag replenishment priorities
              without changing the layout.
            </p>
          </div>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            <FiPackage className="text-cyan-300" />
            {inventoryRows.length} product records loaded from database
          </div>
        </>
      )}
    </SectionCard>
  );
}

export default InventoryPage;