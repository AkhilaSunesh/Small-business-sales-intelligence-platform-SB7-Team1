import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FiX, FiSearch, FiDownload, FiInfo, FiLayers, FiAlertCircle, FiLoader } from 'react-icons/fi';
import salesService from '../../services/salesService';

export default function DrillDownModal({
  isOpen,
  onClose,
  title = 'Detailed Logs',
  drillDownType = 'general', // 'kpi' | 'product' | 'date'
  drillDownId = '', // e.g. "Total Orders" or "Widget A" or "2026-07-25"
  filters = { dateRange: '1y', category: 'all', startDate: '', endDate: '' },
}) {
  const [search, setSearch] = useState('');
  const [data, setData] = useState([]);
  const [exportSuccess, setExportSuccess] = useState(false);
  const modalRef = useRef(null);

  const [loading, setLoading] = useState(false);

  // Load drill-down details from actual dataset
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      salesService.getSalesTransactions(filters, 1, 100)
        .then(res => {
          if (res.success) {
            const records = res.data.map(t => ({
              id: t.invoiceNo,
              date: new Date(t.transactionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              product: t.product?.name || 'Unknown',
              category: t.product?.category || 'Unknown',
              quantity: t.quantity,
              amount: `$${Number(t.totalAmount).toLocaleString()}`,
              status: 'Completed',
              paymentMethod: 'Standard'
            }));
            setData(records);
          } else {
            setData([]);
          }
        })
        .catch(err => {
          console.error("Failed to fetch drill-down data:", err);
          setData([]);
        })
        .finally(() => {
          setLoading(false);
          setSearch('');
          setExportSuccess(false);
        });
    }
  }, [isOpen, drillDownType, drillDownId, filters]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter transactions by search keyword
  const filteredData = data.filter((row) => {
    const term = search.toLowerCase();
    return (
      row.id.toLowerCase().includes(term) ||
      row.product.toLowerCase().includes(term) ||
      row.category.toLowerCase().includes(term) ||
      row.date.includes(term) ||
      row.status.toLowerCase().includes(term) ||
      row.paymentMethod.toLowerCase().includes(term)
    );
  });

  // Simulated export functionality
  const handleExport = () => {
    if (filteredData.length === 0) return;
    const headers = ['Transaction ID', 'Date', 'Product', 'Category', 'Quantity', 'Amount', 'Status', 'Payment Method'];
    const csvRows = [
      headers.join(','),
      ...filteredData.map((row) =>
        [row.id, row.date, `"${row.product}"`, row.category, row.quantity, `"${row.amount}"`, row.status, row.paymentMethod].join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MarketMind_Drilldown_${drillDownId || 'export'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-fadeIn">
      {/* Backdrop click close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog container */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drilldown-title"
        className="glass-panel relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl overflow-hidden animate-slideUp"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-5 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
              <FiLayers className="text-lg" />
            </div>
            <div>
              <h2 id="drilldown-title" className="text-lg font-bold text-white">
                {title}
              </h2>
              <p className="text-xs text-slate-400">
                Drill-down insights for:{' '}
                <span className="font-semibold text-cyan-400">{drillDownId || 'Global Selection'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Close modal"
          >
            <FiX className="text-lg" />
          </button>
        </header>

        {/* Toolbar (Search & Export) */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 bg-slate-950/20 border-b border-white/5">
          <div className="relative flex-1 max-w-sm">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by transaction, product, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none transition focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={filteredData.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-4 py-2.5 text-xs font-semibold transition"
            >
              <FiDownload />
              <span>{exportSuccess ? 'Exported!' : 'Export CSV'}</span>
            </button>
          </div>
        </section>

        {/* Content (Table & Details) */}
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center text-center py-12 space-y-3">
              <FiLoader className="text-4xl text-cyan-400 animate-spin" />
              <p className="text-slate-400 text-sm font-semibold">Loading actual transactions...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 space-y-3">
              <FiAlertCircle className="text-4xl text-slate-500 animate-pulse" />
              <p className="text-slate-400 text-sm font-semibold">No records matches the current search term.</p>
              <p className="text-slate-500 text-xs">Try clearing the search or adjusting filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-950/40">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-400 bg-white/2">
                    <th className="py-3.5 px-4 font-semibold">Transaction ID</th>
                    <th className="py-3.5 px-4 font-semibold">Date</th>
                    <th className="py-3.5 px-4 font-semibold">Product</th>
                    <th className="py-3.5 px-4 font-semibold">Category</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Qty</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Amount</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Payment</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-slate-350">
                  {filteredData.map((row) => (
                    <tr key={row.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white">{row.id}</td>
                      <td className="py-3 px-4">{row.date}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{row.product}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-white/5">
                          {row.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold">{row.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-cyan-400">
                        {row.amount}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400">{row.paymentMethod}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            row.status === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : row.status === 'Pending'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 px-6 py-4 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <FiInfo className="text-cyan-400 text-xs shrink-0" />
            <span>Showing {filteredData.length} records. Filter context: {filters.dateRange} & {filters.category}.</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 px-4 py-2 text-xs font-semibold transition"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

DrillDownModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  drillDownType: PropTypes.oneOf(['general', 'kpi', 'product', 'date']),
  drillDownId: PropTypes.string,
  filters: PropTypes.shape({
    dateRange: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }),
};
