import PropTypes from 'prop-types';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

/**
 * Compact pagination component.
 *
 * Never renders all page numbers simultaneously — shows a window of pages
 * around the current page, with ellipsis for gaps.
 *
 * Example for 100 total pages, current = 50:
 *   « Prev  1  …  48  49  [50]  51  52  …  100  Next »
 */
function Pagination({
  currentPage,
  totalPages,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}) {
  if (totalPages <= 0) return null;

  // Build the compact page-number list
  const WINDOW = 2; // pages to show on each side of current
  const pages = [];

  const addPage = (n) => {
    if (n >= 1 && n <= totalPages) pages.push(n);
  };

  addPage(1);
  if (currentPage - WINDOW > 2) pages.push('...');

  for (let i = currentPage - WINDOW; i <= currentPage + WINDOW; i++) {
    if (i > 1 && i < totalPages) addPage(i);
  }

  if (currentPage + WINDOW < totalPages - 1) pages.push('...');
  if (totalPages > 1) addPage(totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/40 border border-white/10 rounded-2xl p-4 mt-6">
      {/* Rows Per Page */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Rows per page:</span>
        <select
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 outline-none transition focus:border-cyan-400/50 cursor-pointer text-center"
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size} className="bg-slate-950 text-slate-300">
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center gap-1 font-mono flex-wrap justify-center">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Previous Page"
        >
          <FiChevronLeft className="text-sm" />
        </button>

        {/* Compact page list */}
        {pages.map((p, idx) =>
          p === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              className="w-8 h-8 flex items-center justify-center text-xs text-slate-500 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-all ${
                currentPage === p
                  ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Next Page"
        >
          <FiChevronRight className="text-sm" />
        </button>
      </div>

      {/* Page indicator */}
      <span className="text-xs text-slate-500 whitespace-nowrap">
        Page {currentPage} of {totalPages.toLocaleString()}
      </span>
    </div>
  );
}

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onRowsPerPageChange: PropTypes.func.isRequired,
};

export default Pagination;
