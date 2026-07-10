import { useState, useMemo } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { reportsSalesData, reportsStats } from '../../constants/mockData';

function ReportsPage() {
  usePageTitle('Reports');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const itemsPerPage = 5;

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let data = [...reportsSalesData];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.product.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filterType !== 'All') {
      if (filterType === 'Sales') {
        data = data.filter((item) => item.status === 'Completed');
      } else if (filterType === 'Revenue') {
        data = data.sort((a, b) => {
          const amountA = parseInt(a.amount.replace(/\D/g, ''));
          const amountB = parseInt(b.amount.replace(/\D/g, ''));
          return amountB - amountA;
        });
      } else if (filterType === 'Inventory') {
        data = data.sort((a, b) => b.quantity - a.quantity);
      }
    }

    // Date range filter
    if (startDate || endDate) {
      data = data.filter((item) => {
        const itemDate = new Date(item.date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        return true;
      });
    }

    return data;
  }, [searchQuery, filterType, startDate, endDate]);

  // Sort data
  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'amount') {
        aVal = parseInt(a.amount.replace(/\D/g, ''));
        bVal = parseInt(b.amount.replace(/\D/g, ''));
      } else if (sortField === 'date') {
        aVal = new Date(a.date);
        bVal = new Date(b.date);
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredData, sortField, sortOrder]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIdx, startIdx + itemsPerPage);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Invoice ID', 'Product Name', 'Category', 'Quantity', 'Amount', 'Date', 'Status'];
    const rows = sortedData.map((item) => [
      item.id,
      item.product,
      item.category,
      item.quantity,
      item.amount,
      item.date,
      item.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // Export to PDF (simple text-based)
  const handleExportPDF = () => {
    const content = `
SALES REPORT
Generated: ${new Date().toLocaleDateString()}

SUMMARY
Total Revenue: ${reportsStats.totalRevenue}
Total Sales: ${reportsStats.totalSales}
Total Orders: ${reportsStats.totalOrders}
Top Selling Product: ${reportsStats.topSellingProduct}

SALES DATA
${sortedData
  .map(
    (item) =>
      `${item.id} | ${item.product} | ${item.category} | Qty: ${item.quantity} | ${item.amount} | ${item.date} | ${item.status}`
  )
  .join('\n')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-8">
        <h1 className="text-3xl font-semibold text-white">Sales Reports</h1>
        <p className="mt-2 text-sm text-slate-400">
          Analyze your sales performance with detailed reports and insights.
        </p>
      </section>

      {/* Summary Stats */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={reportsStats.totalRevenue}
          helper="+12.5% vs last month"
          accent="cyan"
        />
        <StatCard
          label="Total Sales"
          value={reportsStats.totalSales}
          helper="Orders processed"
          accent="emerald"
        />
        <StatCard
          label="Total Orders"
          value={reportsStats.totalOrders}
          helper="In this period"
          accent="amber"
        />
        <StatCard
          label="Top Product"
          value={reportsStats.topSellingProduct}
          helper="By revenue"
          accent="purple"
        />
      </section>

      {/* Filters and Controls */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Filters & Search</h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          {/* Search Bar */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-slate-300 mb-2">Search</label>
            <input
              type="text"
              placeholder="Invoice, product, category..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-slate-300 mb-2">Filter Type</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
            >
              <option value="All" className="bg-slate-950 text-white">All</option>
              <option value="Sales" className="bg-slate-950 text-white">Sales</option>
              <option value="Revenue" className="bg-slate-950 text-white">Revenue</option>
              <option value="Inventory" className="bg-slate-950 text-white">Inventory</option>
            </select>
          </div>
        </div>
      </section>

      {/* Export Buttons */}
      <section className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={handleExportCSV}>
          📥 Export CSV
        </Button>
        <Button variant="secondary" onClick={handleExportPDF}>
          📄 Export PDF
        </Button>
        <Button variant="secondary" onClick={handlePrint}>
          🖨️ Print
        </Button>
      </section>

      {/* Sales Report Table */}
      {sortedData.length === 0 ? (
        <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 text-center">
          <p className="text-slate-400">
            {searchQuery || filterType !== 'All' || startDate || endDate
              ? 'No results match your filters. Try adjusting your search criteria.'
              : 'Waiting for backend integration...'}
          </p>
        </section>
      ) : (
        <>
          <section className="rounded-3xl border border-white/10 bg-slate-950/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/50 border-b border-white/10">
                  <tr>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-slate-300 cursor-pointer hover:text-slate-100"
                      onClick={() => {
                        setSortField('id');
                        setSortOrder(sortField === 'id' && sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Invoice ID {sortField === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-slate-300 cursor-pointer hover:text-slate-100"
                      onClick={() => {
                        setSortField('product');
                        setSortOrder(sortField === 'product' && sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Product {sortField === 'product' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300">
                      Category
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-slate-300 cursor-pointer hover:text-slate-100"
                      onClick={() => {
                        setSortField('quantity');
                        setSortOrder(sortField === 'quantity' && sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Qty {sortField === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-slate-300 cursor-pointer hover:text-slate-100"
                      onClick={() => {
                        setSortField('amount');
                        setSortOrder(sortField === 'amount' && sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Amount {sortField === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-slate-300 cursor-pointer hover:text-slate-100"
                      onClick={() => {
                        setSortField('date');
                        setSortOrder(sortField === 'date' && sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`border-b border-white/5 transition ${
                        index % 2 === 0 ? 'bg-white/2' : 'bg-transparent'
                      } hover:bg-white/5`}
                    >
                      <td className="px-6 py-4 text-slate-200">{item.id}</td>
                      <td className="px-6 py-4 text-slate-200 font-medium">{item.product}</td>
                      <td className="px-6 py-4 text-slate-400">{item.category}</td>
                      <td className="px-6 py-4 text-slate-200">{item.quantity}</td>
                      <td className="px-6 py-4 text-cyan-400 font-semibold">{item.amount}</td>
                      <td className="px-6 py-4 text-slate-400">{item.date}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            item.status === 'Completed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : item.status === 'Pending'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Pagination */}
          {totalPages > 1 && (
            <section className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  ← Previous
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? 'primary' : 'secondary'}
                    onClick={() => setCurrentPage(i + 1)}
                    className="min-w-10"
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  Next →
                </Button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default ReportsPage;
