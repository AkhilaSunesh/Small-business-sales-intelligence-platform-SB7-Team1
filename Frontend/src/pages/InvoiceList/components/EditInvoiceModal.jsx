import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiX, FiCheck } from 'react-icons/fi';
import Button from '../../../components/ui/Button';

function EditInvoiceModal({ isOpen, invoice, onSave, onCancel }) {
  const [status, setStatus] = useState('Paid');
  const [customer, setCustomer] = useState('');
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (invoice) {
      setStatus(invoice.status);
      setCustomer(invoice.customer);
      setAmount(invoice.amount);
    }
  }, [invoice]);

  if (!isOpen || !invoice) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...invoice,
      customer,
      amount: Number(amount),
      status,
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
          <h3 className="text-base font-bold text-white">Edit Invoice Details</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition">
            <FiX className="text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-300">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Invoice ID</label>
            <input
              type="text"
              value={invoice.id}
              disabled
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-cyan-300 outline-none cursor-not-allowed opacity-60"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Customer Name</label>
            <input
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Total Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white font-mono outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="Paid" className="bg-slate-900 text-emerald-400">Paid</option>
                <option value="Partially Paid" className="bg-slate-900 text-amber-400">Partially Paid</option>
                <option value="Unpaid" className="bg-slate-900 text-rose-400">Unpaid</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-white/5 mt-6">
            <Button variant="ghost" type="button" onClick={onCancel} className="py-2.5 rounded-xl">
              Cancel
            </Button>
            <Button type="submit" className="gap-1.5 py-2.5 rounded-xl font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950">
              <FiCheck className="text-sm" /> Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

EditInvoiceModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  invoice: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default EditInvoiceModal;
