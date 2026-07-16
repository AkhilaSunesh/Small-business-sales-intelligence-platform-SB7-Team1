import { useState } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { FiSearch, FiFilter, FiEye, FiDownload, FiAlertTriangle, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';

// Mock Existing Invoices Data
const MOCK_INVOICES = [
  { id: 'INV-2026-0001', customer: 'John Doe', date: '2026-07-15', amount: 320.50, method: 'UPI', status: 'Paid' },
  { id: 'INV-2026-0002', customer: 'Jane Smith', date: '2026-07-14', amount: 1500.00, method: 'Bank Transfer', status: 'Paid' },
  { id: 'INV-2026-0003', customer: 'ACME Corporation', date: '2026-07-12', amount: 2450.00, method: 'Bank Transfer', status: 'Partially Paid' },
  { id: 'INV-2026-0004', customer: 'Bob Johnson', date: '2026-07-10', amount: 85.00, method: 'Cash', status: 'Unpaid' },
  { id: 'INV-2026-0005', customer: 'Alice Cooper', date: '2026-07-09', amount: 980.00, method: 'Card', status: 'Paid' },
  { id: 'INV-2026-0006', customer: 'Charlie Brown', date: '2026-07-08', amount: 430.00, method: 'UPI', status: 'Unpaid' },
  { id: 'INV-2026-0007', customer: 'Diana Prince', date: '2026-07-07', amount: 1200.00, method: 'Card', status: 'Partially Paid' },
];

function InvoiceListPage() {
  usePageTitle('Invoice List');
  const navigate = useNavigate();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Filter logic
  const filteredInvoices = MOCK_INVOICES.filter((inv) => {
    const matchesSearch = inv.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner section */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 md:p-8 backdrop-blur flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Invoice List</h1>
          <p className="mt-1.5 text-sm text-slate-400">View, search, and manage issued customer sales invoices.</p>
        </div>
        <Button onClick={() => navigate('/create-invoice')} className="gap-2 text-slate-950 bg-cyan-400 font-bold hover:bg-cyan-300">
          <FiPlus /> Create Invoice
        </Button>
      </section>

      {/* Warning Notice Block */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300 flex items-center gap-3">
        <FiAlertTriangle className="text-xl shrink-0" />
        <div>
          <span className="font-semibold">Waiting for backend integration:</span> Current records are loaded from mock memory storage. Changes made locally will not persist.
        </div>
      </div>

      {/* Interactive Filters Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-4 top-3.5 text-slate-400 text-base" />
          <input
            type="text"
            placeholder="Search by client name or invoice ID..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 md:col-span-2">
          {['All', 'Paid', 'Partially Paid', 'Unpaid'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold border text-center transition-all ${
                statusFilter === status
                  ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-400">
                <th className="pb-3 pl-2 font-semibold">Invoice ID</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Issued Date</th>
                <th className="pb-3 font-semibold text-right">Amount ($)</th>
                <th className="pb-3 font-semibold text-center">Payment Method</th>
                <th className="pb-3 font-semibold text-center">Status</th>
                <th className="pb-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-slate-300">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-500">
                    No matching invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-4 pl-2 font-mono text-cyan-300 font-medium">{inv.id}</td>
                    <td className="py-4 font-semibold text-white">{inv.customer}</td>
                    <td className="py-4 text-slate-400">{inv.date}</td>
                    <td className="py-4 text-right font-mono font-semibold text-white">${inv.amount.toFixed(2)}</td>
                    <td className="py-4 text-center text-slate-300">{inv.method}</td>
                    <td className="py-4 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : inv.status === 'Partially Paid'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-xl transition-all"
                          title="Quick View"
                        >
                          <FiEye className="text-base" />
                        </button>
                        <button
                          onClick={() => alert('Download PDF invoice layout simulated successfully.')}
                          className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                          title="Download Invoice"
                        >
                          <FiDownload className="text-base" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK PREVIEW DRAWER MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-slate-900 p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-white mb-4">Invoice Quick Peek</h3>
            
            <div className="space-y-3.5 text-sm border-t border-b border-white/5 py-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice ID:</span>
                <span className="font-mono text-cyan-300">{selectedInvoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-semibold text-white">{selectedInvoice.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span>{selectedInvoice.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Billed:</span>
                <span className="font-mono text-white">${selectedInvoice.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment:</span>
                <span>{selectedInvoice.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  selectedInvoice.status === 'Paid'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : selectedInvoice.status === 'Partially Paid'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {selectedInvoice.status}
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setSelectedInvoice(null)} className="py-2.5">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoiceListPage;
