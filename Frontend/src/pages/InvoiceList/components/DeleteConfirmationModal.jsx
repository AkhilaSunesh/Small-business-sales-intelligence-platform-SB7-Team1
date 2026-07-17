import PropTypes from 'prop-types';
import { FiAlertTriangle } from 'react-icons/fi';
import Button from '../../../components/ui/Button';

function DeleteConfirmationModal({ isOpen, invoice, onConfirm, onCancel }) {
  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-rose-500/20 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 text-rose-400 mb-4">
          <FiAlertTriangle className="text-2xl shrink-0" />
          <h3 className="text-lg font-bold text-white">Delete Invoice</h3>
        </div>

        <div className="text-sm text-slate-300 space-y-3 mb-6">
          <p>
            Are you sure you want to delete invoice <span className="font-mono font-bold text-cyan-300">{invoice.id}</span>? 
            This action cannot be undone.
          </p>
          <div className="bg-white/5 border border-white/5 p-3 rounded-xl space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400 text-xs">Customer:</span>
              <span className="text-white font-semibold text-xs">{invoice.customer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 text-xs">Billed Amount:</span>
              <span className="font-mono text-white text-xs font-semibold">${invoice.amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2.5">
          <Button variant="ghost" onClick={onCancel} className="py-2 px-4 border border-white/5 text-xs text-slate-300 hover:text-white rounded-xl">
            Cancel
          </Button>
          <button
            onClick={() => onConfirm(invoice.id)}
            className="inline-flex items-center justify-center rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-4 py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/50"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
}

DeleteConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  invoice: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default DeleteConfirmationModal;
