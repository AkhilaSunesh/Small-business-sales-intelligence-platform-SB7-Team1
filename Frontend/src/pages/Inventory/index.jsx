import { FiAlertTriangle, FiPackage } from 'react-icons/fi';
import { usePageTitle } from '../../hooks/usePageTitle';
import SectionCard from '../../components/common/SectionCard';

const inventoryRows = [
  { sku: 'MM-1001', product: 'Smart Speaker', category: 'Electronics', stock: 148, status: 'Healthy' },
  { sku: 'MM-1002', product: 'Wireless Headset', category: 'Accessories', stock: 32, status: 'Low stock' },
  { sku: 'MM-1003', product: 'Office Chair', category: 'Furniture', stock: 76, status: 'Healthy' },
  { sku: 'MM-1004', product: 'USB-C Hub', category: 'Accessories', stock: 9, status: 'Critical' },
];

function statusClasses(status) {
  if (status === 'Critical') {
    return 'bg-rose-400/10 text-rose-200 ring-1 ring-rose-400/20';
  }

  if (status === 'Low stock') {
    return 'bg-amber-400/10 text-amber-200 ring-1 ring-amber-400/20';
  }

  return 'bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-400/20';
}

function InventoryPage() {
  usePageTitle('Inventory');

  return (
    <SectionCard
      title="Inventory summary"
      subtitle="Mock product records to demonstrate table layout and status states."
    >
      <div className="overflow-hidden rounded-2xl border border-white/10">
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
        4 sample inventory records loaded from mock data
      </div>
    </SectionCard>
  );
}

export default InventoryPage;