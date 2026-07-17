import PropTypes from 'prop-types';

function StatusBadge({ status }) {
  const styles = {
    'Paid': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    'Partially Paid': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    'Unpaid': 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
  };

  const currentStyle = styles[status] || 'bg-slate-500/10 text-slate-400 border border-slate-500/20';

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${currentStyle}`}>
      {status}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired
};

export default StatusBadge;
