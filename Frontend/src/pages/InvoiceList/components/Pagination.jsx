import PropTypes from 'prop-types';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

function Pagination({
  currentPage,
  totalPages,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange
}) {
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

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
      <div className="flex items-center gap-1.5 font-mono">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 disabled:cursor-not-allowed transition"
          title="Previous Page"
        >
          <FiChevronLeft className="text-sm" />
        </button>

        {/* Page numbers */}
        {pageNumbers.map((num) => (
          <button
            key={num}
            onClick={() => onPageChange(num)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-all ${
              currentPage === num
                ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {num}
          </button>
        ))}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 disabled:cursor-not-allowed transition"
          title="Next Page"
        >
          <FiChevronRight className="text-sm" />
        </button>
      </div>
    </div>
  );
}

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onRowsPerPageChange: PropTypes.func.isRequired
};

export default Pagination;
