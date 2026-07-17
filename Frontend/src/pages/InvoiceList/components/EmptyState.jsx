import { FiInbox, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';

function EmptyState() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-slate-950/20 p-10 text-center space-y-4 my-8 backdrop-blur-sm">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-cyan-500/5 border border-cyan-400/20 text-cyan-400">
        <FiInbox className="text-3xl" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-base font-bold text-white">No Invoice Records</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Waiting for backend integration. No invoice records available.
        </p>
      </div>

      <Button
        onClick={() => navigate('/create-invoice')}
        className="gap-2 text-slate-950 bg-cyan-400 font-bold hover:bg-cyan-300 text-xs rounded-xl"
      >
        <FiPlus className="text-sm" />
        <span>Create Invoice</span>
      </Button>
    </div>
  );
}

export default EmptyState;
