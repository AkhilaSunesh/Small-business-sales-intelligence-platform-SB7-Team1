import { useState } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { FiAlertTriangle, FiAlertCircle, FiTrendingDown, FiShield, FiX, FiCheck, FiMail } from 'react-icons/fi';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/ui/Button';

// Mock Anomalies Data
const INITIAL_ANOMALIES = [
  {
    id: 'ALR001',
    type: 'Security / Access',
    title: 'Suspicious Sales Login Activity',
    description: 'Multiple concurrent login sessions detected for Sales Executive role from distinct IP addresses within a 5-minute window.',
    severity: 'Critical',
    time: '3 hours ago',
    icon: FiShield,
  },
  {
    id: 'ALR002',
    type: 'Sales Operations',
    title: 'Suspicious Return Ratio Spike',
    description: 'Product "Premium Widget" refund requests reached 28% of total purchases over the past 48 hours, vs historical baseline of 3.4%.',
    severity: 'Warning',
    time: '5 hours ago',
    icon: FiAlertCircle,
  },
  {
    id: 'ALR003',
    type: 'Financial Margin',
    title: 'Sudden Margin Drop',
    description: 'Overall catalog margin fell by 14.2% today due to cumulative discount codes applied on bulk checkouts. Re-optimization needed.',
    severity: 'Warning',
    time: '1 day ago',
    icon: FiTrendingDown,
  },
  {
    id: 'ALR004',
    type: 'Inventory',
    title: 'Abnormal Stock Dip: Basic Kit',
    description: 'Inventory levels for "Basic Kit" dropped by 80 items in 1 hour without matching sales transactions. Possible stock take mismatch.',
    severity: 'Info',
    time: '2 days ago',
    icon: FiAlertTriangle,
  },
];

function AnomalyAlertsPage() {
  usePageTitle('Anomaly Alerts');
  const toast = useToast();
  const [anomalies, setAnomalies] = useState(INITIAL_ANOMALIES);

  const handleAcknowledge = (id, title) => {
    setAnomalies(anomalies.filter((a) => a.id !== id));
    toast.show(`Alert "${title}" acknowledged and cleared.`, 'success');
  };

  const handleEscalate = (title) => {
    toast.show(`Notification email sent to Owner regarding: ${title}`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 md:p-8 backdrop-blur">
        <h1 className="text-3xl font-bold tracking-tight text-white">Anomaly Alerts</h1>
        <p className="mt-1.5 text-sm text-slate-400">Monitor suspicious sales volume, margin leaks, inventory drops, or security concerns.</p>
      </section>

      {/* Integration Banner */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300 flex items-center gap-3">
        <FiAlertTriangle className="text-xl shrink-0" />
        <div>
          <span className="font-semibold">Waiting for backend integration:</span> Real-time telemetry monitoring and web socket alerts are in demo mode.
        </div>
      </div>

      {/* Anomalies List */}
      <div className="space-y-4">
        {anomalies.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-12 text-center text-slate-500 backdrop-blur">
            <FiCheck className="text-5xl text-emerald-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white">All Clear</h3>
            <p className="text-sm mt-1">No anomalies or warnings are active right now.</p>
          </div>
        ) : (
          anomalies.map((alr) => {
            const Icon = alr.icon;
            return (
              <div
                key={alr.id}
                className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:border-white/15 transition-colors"
              >
                {/* Info block */}
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    alr.severity === 'Critical'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : alr.severity === 'Warning'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  }`}>
                    <Icon className="text-xl" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">{alr.type}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        alr.severity === 'Critical'
                          ? 'bg-rose-500/20 text-rose-300'
                          : alr.severity === 'Warning'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-cyan-500/20 text-cyan-300'
                      }`}>
                        {alr.severity}
                      </span>
                      <span className="text-xs text-slate-500">• {alr.time}</span>
                    </div>
                    <h3 className="text-base font-semibold text-white">{alr.title}</h3>
                    <p className="text-sm text-slate-400 max-w-3xl leading-relaxed mt-1">{alr.description}</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 border-t border-white/5 pt-4 lg:border-t-0 lg:pt-0">
                  <button
                    onClick={() => handleAcknowledge(alr.id, alr.title)}
                    className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500/15 hover:text-emerald-300 hover:border-emerald-500/20 transition-all"
                  >
                    <FiCheck /> Resolve
                  </button>
                  <button
                    onClick={() => handleEscalate(alr.title)}
                    className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-cyan-500/15 hover:text-cyan-300 hover:border-cyan-500/20 transition-all"
                  >
                    <FiMail /> Escalate
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AnomalyAlertsPage;
