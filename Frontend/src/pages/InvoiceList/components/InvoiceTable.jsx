import PropTypes from 'prop-types';
import { 
  FiEye, FiEdit2, FiDownload, FiPrinter, FiTrash2, 
  FiArrowUp, FiArrowDown, FiChevronDown, FiCalendar, 
  FiDollarSign, FiCreditCard 
} from 'react-icons/fi';
import StatusBadge from './StatusBadge';

function InvoiceTable({
  invoices,
  sortConfig,
  onSort,
  onView,
  onEdit,
  onDownload,
  onPrint,
  onDelete
}) {
  const renderSortIndicator = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return (
        <FiChevronDown className="ml-1 inline text-slate-600 group-hover:text-slate-400 transition-colors opacity-40 group-hover:opacity-100" />
      );
    }
    return sortConfig.direction === 'asc' ? (
      <FiArrowUp className="ml-1 inline text-cyan-400 text-xs" />
    ) : (
      <FiArrowDown className="ml-1 inline text-cyan-400 text-xs" />
    );
  };

  const sortableHeaderClass = "pb-3 font-semibold select-none cursor-pointer group hover:text-white transition-colors";

  return (
    <div className="w-full">
      {/* DESKTOP & TABLET VIEW: Responsive Table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-slate-400 bg-white/2">
              <th className="pb-3 pt-4 pl-4 font-semibold w-[12%]">Invoice ID</th>
              <th 
                className={`${sortableHeaderClass} pb-3 pt-4 w-[16%]`}
                onClick={() => onSort('customer')}
              >
                Customer {renderSortIndicator('customer')}
              </th>
              <th 
                className={`${sortableHeaderClass} pb-3 pt-4 w-[11%]`}
                onClick={() => onSort('date')}
              >
                Invoice Date {renderSortIndicator('date')}
              </th>
              <th className="pb-3 pt-4 font-semibold w-[11%]">Due Date</th>
              <th className="pb-3 pt-4 font-semibold w-[10%] text-center">Method</th>
              <th className="pb-3 pt-4 font-semibold w-[8%] text-right">Tax</th>
              <th className="pb-3 pt-4 font-semibold w-[8%] text-right">Discount</th>
              <th 
                className={`${sortableHeaderClass} pb-3 pt-4 w-[10%] text-right`}
                onClick={() => onSort('amount')}
              >
                Total Amount {renderSortIndicator('amount')}
              </th>
              <th 
                className={`${sortableHeaderClass} pb-3 pt-4 w-[12%] text-center`}
                onClick={() => onSort('status')}
              >
                Status {renderSortIndicator('status')}
              </th>
              <th className="pb-3 pt-4 font-semibold w-[14%] text-center">Last Updated</th>
              <th className="pb-3 pt-4 text-center font-semibold w-[14%]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs text-slate-300">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-white/2 transition-colors">
                {/* ID */}
                <td className="py-3.5 pl-4 font-mono text-cyan-300 font-semibold">{inv.id}</td>
                {/* Customer */}
                <td className="py-3.5 font-semibold text-white truncate max-w-[150px]">{inv.customer}</td>
                {/* Invoice Date */}
                <td className="py-3.5 text-slate-400">{inv.date}</td>
                {/* Due Date */}
                <td className="py-3.5 text-slate-400">{inv.dueDate}</td>
                {/* Payment Method */}
                <td className="py-3.5 text-center text-slate-300">
                  <span className="bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                    {inv.method}
                  </span>
                </td>
                {/* Tax */}
                <td className="py-3.5 text-right font-mono text-slate-400">${inv.tax.toFixed(2)}</td>
                {/* Discount */}
                <td className="py-3.5 text-right font-mono text-slate-400">${inv.discount.toFixed(2)}</td>
                {/* Total Amount */}
                <td className="py-3.5 text-right font-mono font-bold text-white">${inv.amount.toFixed(2)}</td>
                {/* Status */}
                <td className="py-3.5 text-center">
                  <StatusBadge status={inv.status} />
                </td>
                {/* Last Updated */}
                <td className="py-3.5 text-center text-[10px] text-slate-500 font-mono">
                  {inv.lastUpdated}
                </td>
                {/* Actions */}
                <td className="py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onView(inv)}
                      className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-all"
                      title="View Details"
                    >
                      <FiEye className="text-[13px]" />
                    </button>
                    <button
                      onClick={() => onEdit(inv)}
                      className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-all"
                      title="Edit Invoice"
                    >
                      <FiEdit2 className="text-[13px]" />
                    </button>
                    <button
                      onClick={() => onDownload(inv)}
                      className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-all"
                      title="Download PDF"
                    >
                      <FiDownload className="text-[13px]" />
                    </button>
                    <button
                      onClick={() => onPrint(inv)}
                      className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-all"
                      title="Print Invoice"
                    >
                      <FiPrinter className="text-[13px]" />
                    </button>
                    <button
                      onClick={() => onDelete(inv)}
                      className="p-1.5 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                      title="Delete Invoice"
                    >
                      <FiTrash2 className="text-[13px]" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE VIEW: Cards Layout */}
      <div className="block md:hidden space-y-4">
        {invoices.map((inv) => (
          <div 
            key={inv.id}
            className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 space-y-3 backdrop-blur-sm"
          >
            {/* Top header row */}
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-cyan-300 font-bold text-xs">{inv.id}</span>
                <h4 className="text-sm font-bold text-white mt-1">{inv.customer}</h4>
              </div>
              <StatusBadge status={inv.status} />
            </div>

            {/* In-between info */}
            <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-white/5 py-2">
              <div className="flex items-center gap-1.5 text-slate-400">
                <FiCalendar className="text-cyan-400 text-xs shrink-0" />
                <span>Date: {inv.date}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 justify-end">
                <span>Due: {inv.dueDate}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <FiCreditCard className="text-cyan-400 text-xs shrink-0" />
                <span>Method: {inv.method}</span>
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-[10px] text-slate-500 font-mono">Upd: {inv.lastUpdated.split(' ')[0]}</span>
              </div>
            </div>

            {/* Calculations breakdown */}
            <div className="flex justify-between items-center bg-white/2 p-2 rounded-xl text-xs">
              <div className="text-slate-400 space-x-2">
                <span>Tax: <span className="font-mono">${inv.tax}</span></span>
                <span>Disc: <span className="font-mono">${inv.discount}</span></span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 mr-1 text-[10px]">Total:</span>
                <span className="font-bold text-white text-sm font-mono">${inv.amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions button row */}
            <div className="flex justify-end gap-1 pt-1">
              <button
                onClick={() => onView(inv)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
              >
                <FiEye className="text-xs" /> View
              </button>
              <button
                onClick={() => onEdit(inv)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
              >
                <FiEdit2 className="text-xs" /> Edit
              </button>
              <button
                onClick={() => onDownload(inv)}
                className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg border border-white/5"
                title="Download PDF"
              >
                <FiDownload className="text-xs" />
              </button>
              <button
                onClick={() => onPrint(inv)}
                className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg border border-white/5"
                title="Print Invoice"
              >
                <FiPrinter className="text-xs" />
              </button>
              <button
                onClick={() => onDelete(inv)}
                className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-lg border border-rose-500/20"
                title="Delete Invoice"
              >
                <FiTrash2 className="text-xs" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

InvoiceTable.propTypes = {
  invoices: PropTypes.array.isRequired,
  sortConfig: PropTypes.shape({
    key: PropTypes.string,
    direction: PropTypes.string
  }).isRequired,
  onSort: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired,
  onPrint: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default InvoiceTable;
