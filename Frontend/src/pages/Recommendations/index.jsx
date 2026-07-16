import { usePageTitle } from '../../hooks/usePageTitle';
import { FiZap, FiPackage, FiPercent, FiTrendingUp, FiAlertTriangle } from 'react-icons/fi';
import Button from '../../components/ui/Button';

// Mock AI recommendations list
const MOCK_RECOMMENDATIONS = [
  {
    id: 'REC001',
    title: 'Cross-Sell Bundle Proposal',
    description: 'Customers purchasing "Premium Widget" are 74% likely to also buy "Basic Kit". We recommend setting up an automated discount bundle on checkout.',
    category: 'Cross-Selling',
    impact: 'High Impact',
    impactColor: 'emerald',
    potentialGain: '+$1,450 / mo',
    icon: FiZap,
  },
  {
    id: 'REC002',
    title: 'Restock Alert: Deluxe Pro Tool',
    description: 'Demand forecasting indicates inventory levels for "Deluxe Pro Tool" will hit critical low within 6 days. Order 15 items to avoid out-of-stock losses.',
    category: 'Inventory Refill',
    impact: 'High Impact',
    impactColor: 'emerald',
    potentialGain: 'Prevent $2,100 deficit',
    icon: FiPackage,
  },
  {
    id: 'REC003',
    title: 'Promotional Campaign: Standard Gadget',
    description: '"Standard Gadget" has experienced a 12% sales drop in the last 14 days. Create a weekend flash promo (10% discount) to clear seasonal stock.',
    category: 'Discount Optimization',
    impact: 'Medium Impact',
    impactColor: 'amber',
    potentialGain: '+$680 revenue',
    icon: FiPercent,
  },
  {
    id: 'REC004',
    title: 'Upsell Option: Smart Device',
    description: 'Recommend "Industrial Grade" upgrade to customers viewing "Smart Device" items. High conversions seen when combined with bank transfer discount.',
    category: 'Upselling',
    impact: 'Low Impact',
    impactColor: 'cyan',
    potentialGain: '+8.4% average check',
    icon: FiTrendingUp,
  },
];

function RecommendationsPage() {
  usePageTitle('Recommendations');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 md:p-8 backdrop-blur">
        <h1 className="text-3xl font-bold tracking-tight text-white">AI / ML Recommendations</h1>
        <p className="mt-1.5 text-sm text-slate-400">Intelligent data suggestions for product bundles, markdown campaigns, and inventory stocks.</p>
      </section>

      {/* Integration Callout */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300 flex items-center gap-3">
        <FiAlertTriangle className="text-xl shrink-0" />
        <div>
          <span className="font-semibold">Waiting for backend integration:</span> Direct automated actions and model training updates will activate upon final AI/ML pipeline deployments.
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {MOCK_RECOMMENDATIONS.map((rec) => {
          const Icon = rec.icon;
          return (
            <div key={rec.id} className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur flex flex-col justify-between hover:border-cyan-400/20 transition-all duration-300">
              <div className="space-y-4">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full font-semibold">
                    {rec.category}
                  </span>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    rec.impactColor === 'emerald'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : rec.impactColor === 'amber'
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                  }`}>
                    {rec.impact}
                  </span>
                </div>

                {/* Title */}
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-cyan-400">
                    <Icon className="text-lg" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{rec.title}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{rec.description}</p>
                  </div>
                </div>
              </div>

              {/* Footer Calculations & Action */}
              <div className="mt-6 border-t border-white/5 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="text-xs">
                  <span className="text-slate-500 block">Est. Financial Value:</span>
                  <span className="font-semibold text-white font-mono text-sm">{rec.potentialGain}</span>
                </div>
                <Button variant="secondary" onClick={() => alert('Execution of advice will activate with backend integration.')} className="text-xs py-2 px-3">
                  Apply Action Plan
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RecommendationsPage;
