import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/common/Toast';
import { 
  FiPlus, FiAlertTriangle, FiRefreshCw, FiEye, 
  FiDownload, FiPrinter, FiX, FiCheckSquare, FiInfo
} from 'react-icons/fi';
import Button from '../../components/ui/Button';

// Data and Components
import InvoiceSummaryCards from './components/InvoiceSummaryCards';
import InvoiceFilters from './components/InvoiceFilters';
import InvoiceTable from './components/InvoiceTable';
import Pagination from './components/Pagination';
import EmptyState from './components/EmptyState';
import LoadingState from './components/LoadingState';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import EditInvoiceModal from './components/EditInvoiceModal';

import invoiceService from '../../services/invoiceService';
import { jsPDF } from 'jspdf';

// Helper function to map backend invoice structures to what frontend tables expect
const mapBackendInvoice = (inv) => {
  const method = inv.payments && inv.payments.length > 0 ? inv.payments[0].method : 'UPI';
  const reference = inv.payments && inv.payments.length > 0 ? inv.payments[0].reference : '';
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
    reference,
    tax: inv.taxAmount || 0,
    discount: inv.discountAmount || 0,
    amount: inv.totalAmount || 0,
    status,
    lastUpdated,
    lineItems: inv.lineItems || []
  };
};

function InvoiceListPage() {
  const { t } = useTranslation();

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

  // Reset page number on search/filter update to avoid out-of-range pages
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, methodFilter, dateFilter]);

  // Fetch live invoices from backend API
  const fetchLiveInvoices = useCallback(async () => {
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

      if (res) {
        let rawList = [];
        if (Array.isArray(res.data)) {
          rawList = res.data;
        } else if (Array.isArray(res)) {
          rawList = res;
        } else if (res.invoices && Array.isArray(res.invoices)) {
          rawList = res.invoices;
        }
        const mapped = rawList.map(mapBackendInvoice);
        setInvoices(mapped);
        setPagination(res.pagination || { total: mapped.length, page: currentPage, pageSize: rowsPerPage, totalPages: Math.ceil(mapped.length / rowsPerPage) || 1 });
      } else {
        setInvoices([]);
        setPagination({ total: 0, page: 1, pageSize: 10, totalPages: 1 });
      }
    } catch (err) {
      console.error("Failed to retrieve invoice records:", err.message);
      setError(err?.message || 'Unable to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, searchTerm, statusFilter, sortConfig]);

  // Load invoices
  useEffect(() => {
    fetchLiveInvoices();
  }, [fetchLiveInvoices]);

  // Filter Logic: local filter (used for local mock/fallback data)
  const filteredInvoices = useMemo(() => {
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
  }, [invoices, searchTerm, statusFilter, methodFilter, dateFilter]);

  // Sorting Logic: local sort
  const sortedInvoices = useMemo(() => {
    const sorted = [...filteredInvoices];
    if (!sortConfig.key) return sorted;
    
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
  }, [filteredInvoices, sortConfig]);

  // Pagination Splitting: data already comes paginated from the server.
  // Do NOT re-slice here — just use what the API returned for this page.
  // Local filter/sort only runs over the current page's records (for method filter
  // which is not sent to the backend).
  const paginatedInvoices = sortedInvoices;

  // Always derive totalPages from the backend pagination object.
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

  const handleSaveEdit = async (updatedInvoice) => {
    try {
      let backendStatus = 'UNPAID';
      if (updatedInvoice.status === 'Paid') backendStatus = 'PAID';
      else if (updatedInvoice.status === 'Partially Paid') backendStatus = 'PARTIALLY_PAID';
      else if (updatedInvoice.status === 'Overdue') backendStatus = 'OVERDUE';
      else if (updatedInvoice.status === 'Cancelled') backendStatus = 'CANCELLED';

      await invoiceService.updateInvoiceStatus([updatedInvoice.dbId], backendStatus);
      
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv))
      );
      showToast(`Invoice ${updatedInvoice.id} successfully updated.`, 'success');
      setEditInvoice(null);
    } catch (err) {
      showToast(`Failed to update invoice: ${err.message}`, 'error');
    }
  };

  const handleDelete = (invoice) => {
    setDeleteInvoice(invoice);
  };

  const handleConfirmDelete = async (invoiceOrId) => {
    const target = deleteInvoice || (typeof invoiceOrId === 'object' ? invoiceOrId : invoices.find(i => i.id === invoiceOrId));
    const targetDbId = target?.dbId || (typeof invoiceOrId === 'string' ? invoiceOrId : target?.id);
    const displayId = target?.id || invoiceOrId;

    try {
      if (targetDbId) {
        await invoiceService.deleteInvoice(targetDbId);
      }
      setInvoices((prev) => prev.filter((inv) => inv.id !== displayId && inv.dbId !== targetDbId));
      showToast(`Invoice ${displayId} permanently deleted.`, 'success');
      setDeleteInvoice(null);
      fetchLiveInvoices();
    } catch (err) {
      showToast(`Failed to delete invoice: ${err.message}`, 'error');
    }
  };

  const handleDownload = (invoice) => {
    showToast(`Preparing invoice ${invoice.id} for download…`, 'info');
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 42, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', 14, 18);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`MarketMind AI`, 14, 28);
      
      doc.setFontSize(10);
      doc.setTextColor(203, 213, 225);
      doc.text(`ID: ${invoice.id}`, pageWidth - 14, 18, { align: 'right' });
      doc.text(`Date: ${invoice.date}`, pageWidth - 14, 28, { align: 'right' });

      let y = 52;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.text(`Billed To: ${invoice.customer}`, 14, y);
      doc.text(`Payment Method: ${invoice.method}`, pageWidth - 14, y, { align: 'right' });
      
      y += 7;
      doc.text(`Due Date: ${invoice.dueDate}`, 14, y);
      if (invoice.reference && invoice.reference !== 'MANUAL_DASHBOARD') {
        doc.text(`Ref/Txn ID: ${invoice.reference}`, pageWidth - 14, y, { align: 'right' });
      } else {
        doc.text(`Status: ${invoice.status}`, pageWidth - 14, y, { align: 'right' });
      }

      if (invoice.reference && invoice.reference !== 'MANUAL_DASHBOARD') {
        y += 7;
        doc.text(`Status: ${invoice.status}`, pageWidth - 14, y, { align: 'right' });
      }

      // Line Items Table if available
      const items = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];
      if (items.length > 0) {
        y += 12;
        doc.setFillColor(241, 245, 249);
        doc.rect(14, y, pageWidth - 28, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        doc.text('Item / Product', 18, y + 5.5);
        doc.text('Qty', 110, y + 5.5, { align: 'center' });
        doc.text('Unit Price', 145, y + 5.5, { align: 'right' });
        doc.text('Total', pageWidth - 18, y + 5.5, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);

        items.forEach((item, idx) => {
          y += 8;
          if (idx % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(14, y, pageWidth - 28, 8, 'F');
          }
          const name = item.productName || item.name || item.product?.name || `Item ${idx + 1}`;
          const qty = item.quantity || 1;
          const price = item.unitPrice !== undefined ? Number(item.unitPrice) : (item.price !== undefined ? Number(item.price) : 0);
          const total = item.lineTotal !== undefined ? Number(item.lineTotal) : (price * qty);

          doc.text(String(name).substring(0, 45), 18, y + 5.5);
          doc.text(String(qty), 110, y + 5.5, { align: 'center' });
          doc.text(`$${price.toFixed(2)}`, 145, y + 5.5, { align: 'right' });
          doc.text(`$${total.toFixed(2)}`, pageWidth - 18, y + 5.5, { align: 'right' });
        });
      }

      y += 14;
      doc.setLineWidth(0.5);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y, pageWidth - 14, y);

      y += 10;
      doc.setFontSize(10);
      doc.text(`Tax: $${Number(invoice.tax || 0).toFixed(2)}`, pageWidth - 14, y, { align: 'right' });
      y += 7;
      doc.text(`Discount: -$${Number(invoice.discount || 0).toFixed(2)}`, pageWidth - 14, y, { align: 'right' });
      y += 9;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`Total: $${Number(invoice.amount || 0).toFixed(2)}`, pageWidth - 14, y, { align: 'right' });

      doc.save(`invoice-${invoice.id}.pdf`);
      showToast(`Invoice ${invoice.id} downloaded successfully.`, 'success');
    } catch (err) {
      console.error('Download failed:', err);
      showToast(`Failed to download invoice ${invoice.id}. Please try again.`, 'error');
    }
  };

  const handlePrint = (invoice) => {
    const printWindow = window.open('', '_blank', 'height=750,width=850');
    if (!printWindow) {
      showToast('Popup blocked! Please allow popups to print invoices.', 'error');
      return;
    }

    const items = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];
    const itemsHtml = items.length > 0
      ? items.map((item, idx) => {
          const name = item.productName || item.name || item.product?.name || `Item ${idx + 1}`;
          const qty = item.quantity || 1;
          const price = item.unitPrice !== undefined ? Number(item.unitPrice) : (item.price !== undefined ? Number(item.price) : 0);
          const disc = item.discountPercent !== undefined ? Number(item.discountPercent) : 0;
          const tax = item.taxPercent !== undefined ? Number(item.taxPercent) : 0;
          const total = item.lineTotal !== undefined ? Number(item.lineTotal) : ((price * qty) * (1 - disc / 100) * (1 + tax / 100));
          return `
            <tr>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${name}</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${qty}</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${price.toFixed(2)}</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${disc > 0 ? `-${disc}%` : '0%'}</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${tax > 0 ? `+${tax}%` : '0%'}</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">$${total.toFixed(2)}</td>
            </tr>
          `;
        }).join('')
      : `
        <tr>
          <td colspan="6" style="padding: 14px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280;">Standard Invoice Items</td>
        </tr>
      `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice - ${invoice.id}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #0f172a; background: #ffffff; }
            .invoice-box { max-width: 800px; margin: auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px; }
            .logo-area { display: flex; align-items: center; gap: 10px; }
            .logo-icon { width: 38px; height: 38px; background: #0f172a; color: #38bdf8; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; }
            .brand-name { font-size: 20px; font-weight: 800; color: #0f172a; }
            .brand-sub { font-size: 11px; color: #64748b; }
            .invoice-title-block { text-align: right; }
            .invoice-title { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: 1px; }
            .invoice-id { font-size: 13px; font-family: monospace; color: #0284c7; font-weight: 700; margin-top: 4px; }
            .invoice-date { font-size: 12px; color: #64748b; margin-top: 2px; }
            
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; background: #f8fafc; padding: 16px 20px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 13px; }
            .meta-col { display: flex; flex-direction: column; gap: 6px; }
            .meta-row { display: flex; justify-content: space-between; }
            .meta-label { color: #64748b; font-weight: 500; }
            .meta-val { color: #0f172a; font-weight: 600; }
            
            .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
            .badge-paid { background: #dcfce7; color: #15803d; }
            .badge-unpaid { background: #fee2e2; color: #b91c1c; }
            .badge-partial { background: #fef3c7; color: #b45309; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
            th { background: #f1f5f9; padding: 10px 12px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #cbd5e1; }
            
            .summary-wrap { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 20px; }
            .notes { max-width: 380px; font-size: 12px; color: #64748b; line-height: 1.5; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border-left: 3px solid #0284c7; }
            .totals { min-width: 260px; font-size: 13px; }
            .totals-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; color: #475569; }
            .grand-total { display: flex; justify-content: space-between; padding: 10px 0 0; font-size: 18px; font-weight: 800; color: #0f172a; border-top: 2px solid #0f172a; margin-top: 6px; }
            
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
            
            @media print {
              body { padding: 0; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div class="logo-area">
                <div class="logo-icon">M</div>
                <div>
                  <div class="brand-name">MarketMind AI</div>
                  <div class="brand-sub">Intelligent Retail Platform</div>
                </div>
              </div>
              <div class="invoice-title-block">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-id">${invoice.id}</div>
                <div class="invoice-date">Issued: ${invoice.date || 'N/A'}</div>
              </div>
            </div>

            <div class="meta-grid">
              <div class="meta-col">
                <div class="meta-row">
                  <span class="meta-label">Billed To:</span>
                  <span class="meta-val">${invoice.customer || 'Unknown Client'}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Payment Method:</span>
                  <span class="meta-val">${invoice.method || 'UPI'}</span>
                </div>
                ${invoice.reference && invoice.reference !== 'MANUAL_DASHBOARD' ? `
                  <div class="meta-row">
                    <span class="meta-label">Ref/Txn ID:</span>
                    <span class="meta-val" style="font-family: monospace;">${invoice.reference}</span>
                  </div>
                ` : ''}
              </div>
              <div class="meta-col">
                <div class="meta-row">
                  <span class="meta-label">Due Date:</span>
                  <span class="meta-val">${invoice.dueDate || 'On Receipt'}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Payment Status:</span>
                  <span>
                    <span class="badge ${
                      invoice.status === 'Paid' ? 'badge-paid' : invoice.status === 'Partially Paid' ? 'badge-partial' : 'badge-unpaid'
                    }">${invoice.status || 'Unpaid'}</span>
                  </span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Last Database Sync:</span>
                  <span class="meta-val" style="font-size: 11px; font-family: monospace; color: #64748b;">${invoice.lastUpdated || 'N/A'}</span>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="text-align: left;">Product / Description</th>
                  <th style="text-align: center; width: 60px;">Qty</th>
                  <th style="text-align: right; width: 90px;">Unit Price</th>
                  <th style="text-align: right; width: 70px;">Disc</th>
                  <th style="text-align: right; width: 70px;">Tax</th>
                  <th style="text-align: right; width: 100px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="summary-wrap">
              <div class="notes">
                <strong>Notes & Terms:</strong>
                <p style="margin-top: 4px;">Thank you for your business. For any queries concerning this invoice, please contact support@marketmind.ai.</p>
              </div>
              <div class="totals">
                <div class="totals-row">
                  <span>Tax:</span>
                  <span>$${Number(invoice.tax || 0).toFixed(2)}</span>
                </div>
                <div class="totals-row">
                  <span>Discount:</span>
                  <span style="color: #dc2626;">-$${Number(invoice.discount || 0).toFixed(2)}</span>
                </div>
                <div class="grand-total">
                  <span>Grand Total:</span>
                  <span style="color: #0284c7;">$${Number(invoice.amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>MarketMind AI · 100 Innovation Parkway, Suite 500, Silicon Valley, CA 94025</p>
              <p style="margin-top: 2px;">This is a computer-generated sales invoice receipt.</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setMethodFilter('All');
    setDateFilter('');
    showToast('Filters cleared successfully.', 'info');
  };

  const handleRetryConnection = () => {
    fetchLiveInvoices();
  };

  // Render Logic
  return (
    <div className="space-y-6">

      {/* HEADER SECTION */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 md:p-8 backdrop-blur flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{t('invoice list')}</h1>
          <p className="mt-1.5 text-sm text-slate-400">{t('invoiceListDesc')}</p>
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
                  Showing {((currentPage - 1) * rowsPerPage + 1).toLocaleString()} –{' '}
                  {Math.min(currentPage * rowsPerPage, pagination?.total || sortedInvoices.length).toLocaleString()} of{' '}
                  {(pagination?.total || sortedInvoices.length).toLocaleString()} invoices
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
              {viewInvoice.reference && viewInvoice.reference !== 'MANUAL_DASHBOARD' && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Ref/Txn ID:</span>
                  <span className="font-mono text-cyan-300 font-bold">{viewInvoice.reference}</span>
                </div>
              )}
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