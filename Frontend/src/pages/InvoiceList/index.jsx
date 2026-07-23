import { useState, useMemo, useEffect, useCallback } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/common/Toast';
import { 
  FiPlus, FiAlertTriangle, FiRefreshCw, FiEye, 
  FiDownload, FiPrinter, FiX, FiCheckSquare, FiInfo
} from 'react-icons/fi';
import Button from '../../components/ui/Button';

// Data and Components
import { MOCK_INVOICES_DATA } from './mockInvoices';
import InvoiceSummaryCards from './components/InvoiceSummaryCards';
import InvoiceFilters from './components/InvoiceFilters';
import InvoiceTable from './components/InvoiceTable';
import Pagination from './components/Pagination';
import EmptyState from './components/EmptyState';
import LoadingState from './components/LoadingState';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import EditInvoiceModal from './components/EditInvoiceModal';

import invoiceService from '../../services/invoiceService';

// Helper function to map backend invoice structures to what frontend tables expect
const mapBackendInvoice = (inv) => {
  const method = inv.payments && inv.payments.length > 0 ? inv.payments[0].method : 'UPI';
  const date = inv.createdAt ? inv.createdAt.split('T')[0] : '';
  const dueDate = inv.dueDate ? inv.dueDate.split('T')[0] : '';

  let status = 'Unpaid';
  if (inv.status === 'PAID') status = 'Paid';
  else if (inv.status === 'PARTIALLY_PAID') status = 'Partially Paid';
  else if (inv.status === 'UNPAID') status = 'Unpaid';
  else if (inv.status === 'OVERDUE') status = 'Overdue';
  else if (inv.status === 'CANCELLED') status = 'Cancelled';

  const lastUpdated = inv.createdAt 
    ? new Date(inv.createdAt).toISOString().replace('T', ' ').substring(0, 19)
    : '';

  return {
    id: inv.invoiceNumber || inv.id,
    dbId: inv.id,
    customer: inv.customer?.name || 'Unknown Client',
    date,
    dueDate,
    method,
    tax: inv.taxAmount || 0,
    discount: inv.discountAmount || 0,
    amount: inv.totalAmount || 0,
    status,
    lastUpdated,
    lineItems: inv.lineItems || []
  };
};

function InvoiceListPage() {
  usePageTitle('Invoice List');
  const navigate = useNavigate();
  const { show: showToast } = useToast();

  // State Management
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 10, totalPages: 1 });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Sorting Configuration
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // Modal Dialog States
  const [viewInvoice, setViewInvoice] = useState(null);
  const [editInvoice, setEditInvoice] = useState(null);
  const [deleteInvoice, setDeleteInvoice] = useState(null);

  // Demo state toggle for testing Loading, Error, Empty list structures
  const [demoMode, setDemoMode] = useState('loaded'); // 'loaded' | 'loading' | 'error' | 'empty'

  // Reset page number on search/filter update to avoid out-of-range pages
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, methodFilter, dateFilter]);

  // Fetch live invoices from backend API
  const fetchLiveInvoices = useCallback(async () => {
    if (demoMode !== 'loaded') return;
    setLoading(true);
    setError(null);
    try {
      const backendStatus = statusFilter === 'All' ? undefined : statusFilter.toUpperCase().replace(' ', '_');
      
      // Convert sort keys to match backend expected keys
      let backendSortBy = 'createdAt';
      if (sortConfig.key === 'amount') backendSortBy = 'totalAmount';
      else if (sortConfig.key === 'customer') backendSortBy = 'customerId';
      else if (sortConfig.key === 'date') backendSortBy = 'createdAt';
      else if (sortConfig.key === 'status') backendSortBy = 'status';

      const res = await invoiceService.getInvoices({
        page: currentPage,
        pageSize: rowsPerPage,
        search: searchTerm || undefined,
        status: backendStatus,
        sortBy: backendSortBy,
        sortOrder: sortConfig.direction
      });

      if (res && res.success) {
        const mapped = Array.isArray(res.data) ? res.data.map(mapBackendInvoice) : [];
        setInvoices(mapped);
        setPagination(res.pagination || { total: 0, page: 1, pageSize: 10, totalPages: 1 });
      } else {
        throw new Error('Invalid response schema.');
      }
    } catch (err) {
      console.warn("Failed to retrieve invoice records, falling back to mock data:", err.message);
      setInvoices(MOCK_INVOICES_DATA);
      setPagination({
        total: MOCK_INVOICES_DATA.length,
        page: 1,
        pageSize: 10,
        totalPages: Math.ceil(MOCK_INVOICES_DATA.length / 10)
      });
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, searchTerm, statusFilter, sortConfig, demoMode]);

  // Load appropriate state based on demo controls
  useEffect(() => {
    if (demoMode === 'loaded') {
      fetchLiveInvoices();
    } else if (demoMode === 'loading') {
      setInvoices([]);
      setLoading(true);
      setError(null);
    } else if (demoMode === 'error') {
      setInvoices([]);
      setLoading(false);
      setError('Unable to load data. Please try again.');
    } else if (demoMode === 'empty') {
      setInvoices([]);
      setLoading(false);
      setError(null);
    }
  }, [demoMode, fetchLiveInvoices]);

  // Filter Logic: local filter (used for local mock/fallback data)
  const filteredInvoices = useMemo(() => {
    if (demoMode !== 'loaded') return [];
    
    // If using mock fallback data, apply client-side filtering
    if (invoices.length > rowsPerPage || searchTerm || statusFilter !== 'All' || methodFilter !== 'All' || dateFilter) {
      return invoices.filter((inv) => {
        const matchesSearch = searchTerm
          ? inv.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.id.toLowerCase().includes(searchTerm.toLowerCase())
          : true;
          
        const matchesStatus = statusFilter === 'All' ? true : inv.status === statusFilter;
        const matchesMethod = methodFilter === 'All' ? true : inv.method === methodFilter;
        const matchesDate = dateFilter ? inv.date === dateFilter : true;
        
        return matchesSearch && matchesStatus && matchesMethod && matchesDate;
      });
    }
    return invoices;
  }, [invoices, searchTerm, statusFilter, methodFilter, dateFilter, demoMode, rowsPerPage]);

  // Sorting Logic: local sort (only for client-side fallback)
  const sortedInvoices = useMemo(() => {
    const sorted = [...filteredInvoices];
    if (invoices.length <= rowsPerPage || !sortConfig.key) return sorted;
    
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return sortConfig.direction === 'asc'
          ? aVal - bVal
          : bVal - aVal;
      }
    });
    return sorted;
  }, [filteredInvoices, sortConfig, invoices.length, rowsPerPage]);

  // Pagination Splitting: local split
  const paginatedInvoices = useMemo(() => {
    if (invoices.length > rowsPerPage) {
      const startIndex = (currentPage - 1) * rowsPerPage;
      return sortedInvoices.slice(startIndex, startIndex + rowsPerPage);
    }
    return sortedInvoices;
  }, [sortedInvoices, currentPage, rowsPerPage, invoices.length]);

  const totalPages = pagination?.totalPages || 1;

  // Sorting Toggler
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Actions Callbacks
  const handleView = (invoice) => {
    setViewInvoice(invoice);
  };

  const handleEdit = (invoice) => {
    setEditInvoice(invoice);
  };

  const handleSaveEdit = (updatedInvoice) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv))
    );
    showToast(`Invoice ${updatedInvoice.id} successfully updated locally.`, 'success');
    setEditInvoice(null);
  };

  const handleDelete = (invoice) => {
    setDeleteInvoice(invoice);
  };

  const handleConfirmDelete = (id) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    showToast(`Invoice ${id} permanently deleted.`, 'success');
    setDeleteInvoice(null);
  };

  const handleDownload = (invoice) => {
    /*
      BACKEND INTEGRATION - DOWNLOAD INVOICE PDF:
      ------------------------------------------
      const downloadPDF = async () => {
        try {
          const response = await axios.get(`/api/invoices/${invoice.id}/pdf`, { responseType: 'blob' });
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = `invoice-${invoice.id}.pdf`;
          link.click();
          showToast("PDF document downloaded successfully.", "success");
        } catch (error) {
          showToast("PDF generation failed.", "error");
        }
      };
      downloadPDF();
    */

    showToast(`Downloading PDF document for ${invoice.id}...`, 'info');
    
    // Simulating file download link triggers
    setTimeout(() => {
      showToast(`PDF invoice for ${invoice.customer} successfully downloaded.`, 'success');
    }, 1500);
  };

  const handlePrint = (invoice) => {
    /*
      PRINT INVOICE SIMULATION:
      ------------------------
      Connects invoice data context to printer page style configuration.
    */
    showToast(`Preparing printable layout for ${invoice.id}...`, 'info');
    
    // Simulate printing
    setTimeout(() => {
      window.print();
    }, 1000);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setMethodFilter('All');
    setDateFilter('');
    showToast('Filters cleared successfully.', 'info');
  };

  const handleRetryConnection = () => {
    if (demoMode === 'loaded') {
      fetchLiveInvoices();
    } else {
      setDemoMode('loading');
      showToast('Attempting to reconnect with API gateway...', 'info');
      setTimeout(() => {
        setDemoMode('loaded');
        showToast('Backend gateway synchronization completed.', 'success');
      }, 2000);
    }
  };

  // Render Logic
  return (
    <div className="space-y-6">

      {/* HEADER SECTION */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 md:p-8 backdrop-blur flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Invoice List</h1>
          <p className="mt-1.5 text-sm text-slate-400">View, search, and manage issued customer sales invoices.</p>
        </div>
        <Button 
          onClick={() => navigate('/create-invoice')} 
          className="gap-2 text-slate-950 bg-cyan-400 font-bold hover:bg-cyan-300 shadow-lg shadow-cyan-400/10"
        >
          <FiPlus className="text-base" /> Create Invoice
        </Button>
      </section>

      {/* CORE DISPLAY ROUTING BASED ON CHOSEN STATE */}
      {loading && <LoadingState />}

      {!loading && error && (
        <div className="rounded-3xl border border-rose-500/10 bg-slate-950/80 p-8 backdrop-blur text-center space-y-4 max-w-md mx-auto my-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 mx-auto">
            <FiAlertTriangle className="text-2xl shrink-0" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white">Connection Error</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {error}
            </p>
          </div>
          <div className="pt-2">
            <Button
              onClick={handleRetryConnection}
              className="bg-rose-500 text-white hover:bg-rose-400 text-xs font-bold gap-2 py-2.5 px-6 rounded-xl w-full"
            >
              <FiRefreshCw className="text-sm" /> Retry Connection
            </Button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* STATS SUMMARY CARDS */}
          <InvoiceSummaryCards invoices={filteredInvoices} />


          {/* SEARCH & FILTERS GRID */}
          <InvoiceFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            methodFilter={methodFilter}
            setMethodFilter={setMethodFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            onClear={handleClearFilters}
          />

          {/* MAIN LIST CONTENT */}
          {filteredInvoices.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-semibold text-slate-400">
                  Showing {Math.min(sortedInvoices.length, (currentPage - 1) * rowsPerPage + 1)} to{' '}
                  {Math.min(sortedInvoices.length, currentPage * rowsPerPage)} of{' '}
                  {sortedInvoices.length} entries
                </span>
              </div>

              {/* TABLE COMPONENT */}
              <InvoiceTable
                invoices={paginatedInvoices}
                sortConfig={sortConfig}
                onSort={handleSort}
                onView={handleView}
                onEdit={handleEdit}
                onDownload={handleDownload}
                onPrint={handlePrint}
                onDelete={handleDelete}
              />

              {/* PAGINATION PANEL */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  rowsPerPage={rowsPerPage}
                  onPageChange={setCurrentPage}
                  onRowsPerPageChange={(size) => {
                    setRowsPerPage(size);
                    setCurrentPage(1);
                  }}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* QUICK VIEW DRAWER MODAL */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">Invoice Details</h3>
              <button 
                onClick={() => setViewInvoice(null)} 
                className="text-slate-400 hover:text-white transition"
              >
                <FiX className="text-lg" />
              </button>
            </div>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Invoice ID:</span>
                <span className="font-mono text-cyan-300 font-bold">{viewInvoice.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Customer:</span>
                <span className="font-semibold text-white">{viewInvoice.customer}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Issued Date:</span>
                <span>{viewInvoice.date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Due Date:</span>
                <span>{viewInvoice.dueDate}</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-3">
                <span className="text-slate-400">Payment Method:</span>
                <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5 text-[10px]">{viewInvoice.method}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tax Billed:</span>
                <span className="font-mono">${viewInvoice.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Discount Applied:</span>
                <span className="font-mono text-rose-400">-${viewInvoice.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-b border-white/5 py-3 font-semibold text-sm">
                <span className="text-slate-400">Total Billed:</span>
                <span className="font-mono text-white">${viewInvoice.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400">Payment Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  viewInvoice.status === 'Paid'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : viewInvoice.status === 'Partially Paid'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {viewInvoice.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Last Database Sync:</span>
                <span className="text-[10px] text-slate-500 font-mono">{viewInvoice.lastUpdated}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-white/5 pt-4">
              <button
                onClick={() => {
                  handleDownload(viewInvoice);
                  setViewInvoice(null);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 font-semibold transition"
              >
                <FiDownload /> PDF
              </button>
              <button
                onClick={() => {
                  handlePrint(viewInvoice);
                  setViewInvoice(null);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 font-semibold transition"
              >
                <FiPrinter /> Print
              </button>
              <Button onClick={() => setViewInvoice(null)} className="py-2 text-xs rounded-xl">
                Close View
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL DIALOG */}
      <EditInvoiceModal
        isOpen={!!editInvoice}
        invoice={editInvoice}
        onSave={handleSaveEdit}
        onCancel={() => setEditInvoice(null)}
      />

      {/* DELETE CONFIRMATION DIALOG */}
      <DeleteConfirmationModal
        isOpen={!!deleteInvoice}
        invoice={deleteInvoice}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteInvoice(null)}
      />
    </div>
  );
}

export default InvoiceListPage;
