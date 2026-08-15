import PropTypes from 'prop-types';
import { FiCalendar, FiFilter, FiX, FiRefreshCw } from 'react-icons/fi';

const RANGE_LABELS = {
  today: 'Today',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '3m': 'Last 3 Months',
  '6m': 'Last 6 Months',
  '1y': 'Last Year',
  custom: 'Custom Range',
};

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Grocery', label: 'Grocery' },
  { value: 'Fashion', label: 'Fashion' },
  { value: 'Stationery', label: 'Stationery' },
  { value: 'Others', label: 'Others' },
];

export default function DashboardFilters({
  filters,
  onChange,
  onReset,
}) {
  const handleRangeChange = (e) => {
    onChange({ ...filters, dateRange: e.target.value });
  };

  const handleCategoryChange = (e) => {
    onChange({ ...filters, category: e.target.value });
  };

  const handleCustomDateChange = (name, value) => {
    onChange({ ...filters, [name]: value });
  };

  const removeCategoryFilter = () => {
    onChange({ ...filters, category: 'all' });
  };

  const removeRangeFilter = () => {
    onChange({ ...filters, dateRange: '1y', startDate: '', endDate: '' });
  };

  // Determine if filters deviate from defaults
  const isFiltered = filters.dateRange !== '1y' || filters.category !== 'all' || filters.startDate !== '' || filters.endDate !== '';

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/80 p-5 md:p-6 backdrop-blur">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
            <FiFilter className="text-lg" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Interactive Filters</h3>
            <p className="text-[11px] text-slate-400">Refine charts, cards, and logs in real-time</p>
          </div>
        </div>

        {/* Inputs */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Selector */}
          <div className="relative">
            <select
              id="filter-date-range"
              aria-label="Filter Date Range"
              value={filters.dateRange}
              onChange={handleRangeChange}
              className="appearance-none rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 pr-10 text-xs font-semibold text-slate-200 outline-none transition focus:border-cyan-400 focus:bg-slate-900 focus:ring-1 focus:ring-cyan-400/20"
            >
              {Object.entries(RANGE_LABELS).map(([val, label]) => (
                <option key={val} value={val} className="bg-slate-950">
                  {label}
                </option>
              ))}
            </select>
            <FiCalendar className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Product Category Selector */}
          <div>
            <select
              id="filter-category"
              aria-label="Filter Product Category"
              value={filters.category}
              onChange={handleCategoryChange}
              className="appearance-none rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 pr-10 text-xs font-semibold text-slate-200 outline-none transition focus:border-cyan-400 focus:bg-slate-900 focus:ring-1 focus:ring-cyan-400/20"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-slate-950">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters button */}
          {isFiltered && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-3.5 py-2.5 text-xs font-semibold transition"
            >
              <FiRefreshCw className="text-[10px]" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Custom range date-pickers */}
      {filters.dateRange === 'custom' && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white/3 p-4 border border-white/5 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Start:</span>
            <input
              type="date"
              value={filters.startDate}
              max={filters.endDate || new Date().toISOString().slice(0, 10)}
              onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">End:</span>
            <input
              type="date"
              value={filters.endDate}
              min={filters.startDate || undefined}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-400"
            />
          </div>
          {/* Date range validation message */}
          {filters.startDate && filters.endDate && filters.startDate > filters.endDate && (
            <p className="w-full text-xs text-rose-400 mt-1">
              Invalid date range: The &apos;From&apos; date cannot be later than the &apos;To&apos; date.
            </p>
          )}
        </div>
      )}

      {/* Active filter badges */}
      {isFiltered && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mr-1">Active:</span>

          {/* Date Range Badge */}
          {(filters.dateRange !== '1y' || filters.startDate || filters.endDate) && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 px-3 py-1 text-xs font-medium text-cyan-300">
              <span>
                Range:{' '}
                {filters.dateRange === 'custom'
                  ? `${filters.startDate || '?'} to ${filters.endDate || '?'}`
                  : RANGE_LABELS[filters.dateRange]}
              </span>
              <button
                onClick={removeRangeFilter}
                className="hover:bg-cyan-400/20 rounded-full p-0.5"
                title="Clear date filter"
              >
                <FiX className="text-xs" />
              </button>
            </div>
          )}

          {/* Category Badge */}
          {filters.category !== 'all' && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 px-3 py-1 text-xs font-medium text-cyan-300">
              <span>Category: {filters.category}</span>
              <button
                onClick={removeCategoryFilter}
                className="hover:bg-cyan-400/20 rounded-full p-0.5"
                title="Clear category filter"
              >
                <FiX className="text-xs" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

DashboardFilters.propTypes = {
  filters: PropTypes.shape({
    dateRange: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};
