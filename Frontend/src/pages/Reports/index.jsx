import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../hooks/usePageTitle';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAppContext } from '../../context/AppContext';
import { FiAlertTriangle, FiRefreshCw, FiInbox, FiFileText, FiX, FiDownload } from 'react-icons/fi';
import invoiceService from '../../services/invoiceService';
import { jsPDF } from 'jspdf';

function ReportsPage() {
  const { t } = useTranslation();

  usePageTitle('Reports');
  const { isAuthenticated } = useAppContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const itemsPerPage = 5;

  const [reportsData, setReportsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState('csv');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await invoiceService.getInvoices({ page: 1, pageSize: 100 });
      if (res && res.success && Array.isArray(res.data)) {
        const mapped = res.data.map((inv) => {
          const date = inv.createdAt ? inv.createdAt.split('T')[0] : '';
          const amount = inv.totalAmount || 0;
          let status = 'Pending';
          if (inv.status === 'PAID') status = 'Completed';
          else if (inv.status === 'UNPAID') status = 'Pending';
          else if (inv.status === 'CANCELLED') status = 'Cancelled';

          return {
            id: inv.invoiceNumber || inv.id,
            product: inv.lineItems?.[0]?.productName || 'N/A',
            category: inv.lineItems?.[0]?.productCategory || 'General',
            quantity: inv.lineItems?.reduce((sum, li) => sum + (li.quantity || 0), 0) || 0,
            amount: `$${amount.toFixed(2)}`,
            amountRaw: amount,
            date,
            status,
          };
        });
        setReportsData(mapped);
      } else {
        setReportsData([]);
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch reports data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Compute stats from data
  const stats = useMemo(() => {
    if (!reportsData.length) {
      return { totalRevenue: '$0', totalSales: '0', totalOrders: '0', topSellingProduct: 'None' };
    }
    const totalRevenue = reportsData.reduce((sum, item) => sum + (item.amountRaw || 0), 0);
    const totalOrders = reportsData.length;
    const totalSales = reportsData.reduce((sum, item) => sum + item.quantity, 0);
    const productCounts = {};
    reportsData.forEach((item) => {
      productCounts[item.product] = (productCounts[item.product] || 0) + item.quantity;
    });
    const topProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    return {
      totalRevenue: `$${totalRevenue.toLocaleString()}`,
      totalSales: totalSales.toString(),
      totalOrders: totalOrders.toString(),
      topSellingProduct: topProduct,
    };
  }, [reportsData]);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let data = [...reportsData];

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
        data = data.sort((a, b) => b.amountRaw - a.amountRaw);
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
  }, [searchQuery, filterType, startDate, endDate, reportsData]);

  // Sort data
  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'amount') {
        aVal = a.amountRaw;
        bVal = b.amountRaw;
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

  // Trigger Export Modal
  const handleOpenExportModal = (type) => {
    setExportType(type);
    setShowExportModal(true);
  };

  // Perform Export based on Modal Input
  const executeExport = () => {
    let dataToExport = reportsData;
    if (exportStartDate || exportEndDate) {
      dataToExport = reportsData.filter((item) => {
        const itemDate = new Date(item.date);
        const start = exportStartDate ? new Date(exportStartDate) : null;
        const end = exportEndDate ? new Date(exportEndDate) : null;
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        return true;
      });
    }

    if (exportType === 'csv') {
      const headers = ['Invoice ID', 'Product Name', 'Category', 'Quantity', 'Amount', 'Date', 'Status'];
      const rows = dataToExport.map((item) => [
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
    } else if (exportType === 'pdf') {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 42, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('MarketMind AI', 14, 18);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('Sales Report', 14, 28);
      
      const currentDate = new Date().toLocaleDateString();
      doc.setFontSize(10);
      doc.setTextColor(203, 213, 225);
      doc.text(`Generated: ${currentDate}`, pageWidth - 14, 28, { align: 'right' });

      let y = 54;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Sales Data Table', 14, y);

      y += 4;
      doc.setLineWidth(0.5);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y, pageWidth - 14, y);

      y += 8;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, pageWidth - 28, 10, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);

      const headers = ['ID', 'Product', 'Qty', 'Amount', 'Date', 'Status'];
      const colX = [16, 45, 95, 115, 145, 175];

      headers.forEach((h, i) => doc.text(h, colX[i], y + 6.5));
      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);

      dataToExport.forEach((item, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, y, pageWidth - 28, 9, 'F');
        }
        
        doc.text(String(item.id).substring(0, 10), colX[0], y + 6);
        doc.text(String(item.product).substring(0, 20), colX[1], y + 6);
        doc.text(String(item.quantity), colX[2], y + 6);
        doc.text(String(item.amount), colX[3], y + 6);
        doc.text(String(item.date), colX[4], y + 6);
        doc.text(String(item.status), colX[5], y + 6);

        y += 9;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
      
      doc.save(`sales-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    }

    setShowExportModal(false);
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">{t('reportsTitle')}</h1>
          <p className="mt-2 text-sm text-slate-400">
            Analyze your sales performance with detailed reports and insights.
          </p>
        </div>
        {error && (
          <Button
            onClick={fetchReports}
            variant="secondary"
            className="gap-2 py-2 px-4 rounded-xl text-xs font-bold"
          >
            <FiRefreshCw className="text-sm" /> Retry Connection
          </Button>
        )}
      </section>

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
              Unable to establish a connection to the reports reporting analytics microservice.
            </p>
          </div>
          <div className="pt-2">
            <Button
              onClick={fetchReports}
              className="bg-rose-500 text-white hover:bg-rose-400 text-xs font-bold gap-2 py-2.5 px-6 rounded-xl w-full"
            >
              <FiRefreshCw className="text-sm" /> Retry Connection
            </Button>
          </div>
        </div>
      ) : loading ? (
        /* Loading Skeletons */
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard loading={true} />
            <StatCard loading={true} />
            <StatCard loading={true} />
            <StatCard loading={true} />
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 space-y-4 animate-pulse">
            <div className="h-5 w-40 bg-white/10 rounded"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-white/5 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Revenue"
              value={stats.totalRevenue}
              helper="+12.5% vs last month"
              accent="cyan"
            />
            <StatCard
              label="Total Sales"
              value={stats.totalSales}
              helper="Orders processed"
              accent="emerald"
            />
            <StatCard
              label="Total Orders"
              value={stats.totalOrders}
              helper="In this period"
              accent="amber"
            />
            <StatCard
              label="Top Product"
              value={stats.topSellingProduct}
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
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
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
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                />
              </div>

              {/* Search Bar */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Search Invoice / Product</label>
                <Input
                  type="text"
                  placeholder="Search by ID, name, category..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="py-2"
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
            <Button variant="primary" onClick={() => handleOpenExportModal('csv')} disabled={sortedData.length === 0}>
              📥 Export CSV
            </Button>
            <Button variant="secondary" onClick={() => handleOpenExportModal('pdf')} disabled={sortedData.length === 0}>
              📄 Export PDF
            </Button>
            <Button variant="secondary" onClick={handlePrint} disabled={sortedData.length === 0}>
              🖨️ Print
            </Button>
          </section>

          {/* Sales Report Table */}
          {sortedData.length === 0 ? (
            <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-12 text-center backdrop-blur">
              <FiInbox className="text-5xl text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white">No sales reports available.</h3>
              <p className="text-sm mt-1 text-slate-500">
                {searchQuery || filterType !== 'All' || startDate || endDate
                  ? 'No results match your filters. Try adjusting your search criteria.'
                  : 'Check back later once retail transaction orders are synchronised.'}
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
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          }}
                        >
                          Invoice ID {sortField === 'id' && (sortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-semibold text-slate-300 cursor-pointer hover:text-slate-100"
                          onClick={() => {
                            setSortField('product');
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          }}
                        >
                          Product Name {sortField === 'product' && (sortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-semibold text-slate-300 cursor-pointer hover:text-slate-100"
                          onClick={() => {
                            setSortField('category');
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          }}
                        >
                          Category {sortField === 'category' && (sortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-300">Quantity</th>
                        <th
                          className="px-6 py-4 text-right text-xs font-semibold text-slate-300 cursor-pointer hover:text-slate-100"
                          onClick={() => {
                            setSortField('amount');
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          }}
                        >
                          Amount {sortField === 'amount' && (sortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th
                          className="px-6 py-4 text-right text-xs font-semibold text-slate-300 cursor-pointer hover:text-slate-100"
                          onClick={() => {
                            setSortField('date');
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          }}
                        >
                          Date {sortField === 'date' && (sortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-300">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-slate-950/40">
                      {paginatedData.map((item) => (
                        <tr key={item.id} className="transition hover:bg-white/5">
                          <td className="px-6 py-4 font-mono text-xs font-semibold text-cyan-300">
                            {item.id}
                          </td>
                          <td className="px-6 py-4 text-white font-medium">{item.product}</td>
                          <td className="px-6 py-4 text-slate-400 text-xs">{item.category}</td>
                          <td className="px-6 py-4 text-center font-mono text-slate-300">{item.quantity}</td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-white">
                            {item.amount}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-xs text-slate-400">
                            {item.date}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                item.status === 'Completed'
                                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
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
        </>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">Download Range</h3>
              <button 
                onClick={() => setShowExportModal(false)} 
                className="text-slate-400 hover:text-white transition"
              >
                <FiX className="text-lg" />
              </button>
            </div>
            
            <p className="text-xs text-slate-400 mb-4">
              Select the date range for your download. The end date can be up to one week from today.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Start Date</label>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">End Date (Max 1 week from today)</label>
                <input
                  type="date"
                  value={exportEndDate}
                  max={new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/50"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-white/5 pt-4">
              <Button onClick={() => setShowExportModal(false)} variant="secondary" className="py-2 text-xs rounded-xl">
                Cancel
              </Button>
              <button
                onClick={executeExport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition"
              >
                <FiDownload /> Download {exportType.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;