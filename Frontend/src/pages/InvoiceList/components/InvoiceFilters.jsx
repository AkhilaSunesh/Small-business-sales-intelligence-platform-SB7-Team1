import PropTypes from 'prop-types';
import { FiSearch, FiCalendar, FiXCircle, FiSliders } from 'react-icons/fi';

function InvoiceFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  methodFilter,
  setMethodFilter,
  dateFilter,
  setDateFilter,
  onClear
}) {
  const statusOptions = ['All', 'Paid', 'Partially Paid', 'Unpaid'];
  const methodOptions = ['All', 'UPI', 'Bank Transfer', 'Card', 'Cash'];

  // Check if any filters are active to conditionally show the "Clear Filters" button
  const hasActiveFilters = 
    searchTerm !== '' || 
    statusFilter !== 'All' || 
    methodFilter !== 'All' || 
    dateFilter !== '';

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 backdrop-blur-sm space-y-4">
      <div className="flex items-center gap-2 text-white font-semibold text-sm">
        <FiSliders className="text-cyan-400" />
        <span>Search & Filters</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Search Input */}
        <div className="relative lg:col-span-2">
          <FiSearch className="absolute left-3.5 top-3.5 text-slate-500 text-sm" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name or invoice ID..."
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter Status"
            className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300 outline-none transition focus:border-cyan-400/50 cursor-pointer"
          >
            <option value="" disabled className="bg-slate-900 text-slate-500">Payment Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status} className="bg-slate-950 text-slate-300">
                Status: {status}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method Filter */}
        <div className="relative">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            aria-label="Filter Method"
            className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300 outline-none transition focus:border-cyan-400/50 cursor-pointer"
          >
            <option value="" disabled className="bg-slate-900 text-slate-500">Payment Method</option>
            {methodOptions.map((method) => (
              <option key={method} value={method} className="bg-slate-950 text-slate-300">
                Method: {method}
              </option>
            ))}
          </select>
        </div>

        {/* Invoice Date Filter */}
        <div className="relative flex items-center">
          <FiCalendar className="absolute left-3.5 text-slate-500 text-sm pointer-events-none" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-xs text-slate-300 outline-none transition focus:border-cyan-400/50 [color-scheme:dark] cursor-pointer"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end pt-1">
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold transition"
          >
            <FiXCircle className="text-sm" />
            <span>Clear Active Filters</span>
          </button>
        </div>
      )}
    </div>
  );
}

InvoiceFilters.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  statusFilter: PropTypes.string.isRequired,
  setStatusFilter: PropTypes.func.isRequired,
  methodFilter: PropTypes.string.isRequired,
  setMethodFilter: PropTypes.func.isRequired,
  dateFilter: PropTypes.string.isRequired,
  setDateFilter: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired
};

export default InvoiceFilters;
