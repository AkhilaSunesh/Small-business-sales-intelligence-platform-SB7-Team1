import PropTypes from 'prop-types';
import { FiFileText, FiCheckCircle, FiClock, FiAlertTriangle, FiDollarSign, FiCreditCard } from 'react-icons/fi';

function InvoiceSummaryCards({ invoices }) {
  // Calculations based on current invoices
  const totalCount = invoices.length;
  const paidInvoices = invoices.filter((i) => i.status === 'Paid');
  const partiallyPaidInvoices = invoices.filter((i) => i.status === 'Partially Paid');
  const unpaidInvoices = invoices.filter((i) => i.status === 'Unpaid');

  const paidCount = paidInvoices.length;
  const partiallyPaidCount = partiallyPaidInvoices.length;
  const unpaidCount = unpaidInvoices.length;

  // Total Revenue = Paid amounts + 50% of Partially Paid amounts as a realistic mock calculation
  const totalRevenue = invoices.reduce((acc, curr) => {
    if (curr.status === 'Paid') return acc + curr.amount;
    if (curr.status === 'Partially Paid') return acc + (curr.amount * 0.6); // Simulating 60% received
    return acc;
  }, 0);

  // Outstanding Amount = Unpaid amounts + 40% of Partially Paid amounts
  const outstandingAmount = invoices.reduce((acc, curr) => {
    if (curr.status === 'Unpaid') return acc + curr.amount;
    if (curr.status === 'Partially Paid') return acc + (curr.amount * 0.4); // Simulating 40% outstanding
    return acc;
  }, 0);

  const cards = [
    {
      label: 'Total Invoices',
      value: totalCount,
      helper: `${totalCount} records`,
      icon: FiFileText,
      accent: 'cyan',
      bgGrad: 'from-cyan-500/10 to-cyan-500/5',
      borderCol: 'border-cyan-500/20',
      iconCol: 'text-cyan-400'
    },
    {
      label: 'Paid Invoices',
      value: paidCount,
      helper: `${paidCount} completed`,
      icon: FiCheckCircle,
      accent: 'emerald',
      bgGrad: 'from-emerald-500/10 to-emerald-500/5',
      borderCol: 'border-emerald-500/20',
      iconCol: 'text-emerald-400'
    },
    {
      label: 'Partially Paid',
      value: partiallyPaidCount,
      helper: `${partiallyPaidCount} active`,
      icon: FiClock,
      accent: 'amber',
      bgGrad: 'from-amber-500/10 to-amber-500/5',
      borderCol: 'border-amber-500/20',
      iconCol: 'text-amber-400'
    },
    {
      label: 'Unpaid Invoices',
      value: unpaidCount,
      helper: `${unpaidCount} outstanding`,
      icon: FiAlertTriangle,
      accent: 'rose',
      bgGrad: 'from-rose-500/10 to-rose-500/5',
      borderCol: 'border-rose-500/20',
      iconCol: 'text-rose-400'
    },
    {
      label: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      helper: 'Estimated collections',
      icon: FiDollarSign,
      accent: 'emerald',
      bgGrad: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/30',
      borderCol: 'border-emerald-500/25',
      iconCol: 'text-emerald-400'
    },
    {
      label: 'Outstanding Amount',
      value: `$${outstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      helper: 'Remaining balance',
      icon: FiCreditCard,
      accent: 'rose',
      bgGrad: 'from-rose-500/10 to-rose-500/5 border-rose-500/30',
      borderCol: 'border-rose-500/25',
      iconCol: 'text-rose-400'
    }
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <article
            key={i}
            className={`rounded-2xl border ${card.borderCol} bg-gradient-to-br ${card.bgGrad} p-4 flex flex-col justify-between h-32 backdrop-blur-sm transition-all hover:scale-[1.02]`}
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.label}</span>
              <Icon className={`${card.iconCol} text-lg`} />
            </div>
            <div>
              <h4 className="text-xl md:text-2xl font-bold tracking-tight text-white line-clamp-1">{card.value}</h4>
              <p className="text-xs text-slate-400 mt-1">{card.helper}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

InvoiceSummaryCards.propTypes = {
  invoices: PropTypes.array.isRequired
};

export default InvoiceSummaryCards;
