import { useState, useEffect, useMemo } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { FiSearch, FiAlertTriangle, FiAlertCircle, FiInfo, FiCheckCircle } from 'react-icons/fi';
import { mockAnomalyAlerts } from '../../constants/anomalyAlertsData';

function AnomalyAlertsPage() {
  usePageTitle('Anomaly Alerts');

  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Simulate API fetch on component mount
  useEffect(() => {
    // TODO: API INTEGRATION POINT
    // Replace mock loading with real backend call using Axios:
    // axios.get('/api/v1/anomalies/alerts')
    //   .then(response => setAlerts(response.data))
    //   .catch(err => console.error(err))
    //   .finally(() => setIsLoading(false));

    const timer = setTimeout(() => {
      setAlerts(mockAnomalyAlerts);
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  // Filter alerts by search term (title or description)
  const filteredAlerts = useMemo(() => {
    if (!searchTerm.trim()) return alerts;
    const term = searchTerm.toLowerCase();
    return alerts.filter(
      (alert) =>
        alert.title.toLowerCase().includes(term) ||
        alert.description.toLowerCase().includes(term)
    );
  }, [alerts, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header & Subtitle */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 md:p-8 backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Anomaly Alerts</h1>
          <p className="mt-1.5 text-sm text-slate-400">Monitor unusual business activities.</p>
        </div>

        {/* Search alerts by title */}
        <div className="w-full md:w-72">
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search alerts by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>
        </div>
      </section>

      {/* Backend Integration Banner */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300 flex items-center gap-3">
        <FiAlertTriangle className="text-xl shrink-0" />
        <div>
          <span className="font-semibold">Future Backend API:</span> Real-time telemetry monitoring and web sockets will stream live alerts here.
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 space-y-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-5 w-48 bg-white/10 rounded"></div>
                <div className="h-5 w-20 bg-white/10 rounded-full"></div>
              </div>
              <div className="h-4 w-3/4 bg-white/5 rounded"></div>
              <div className="h-3 w-32 bg-white/5 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredAlerts.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-12 text-center text-slate-400 backdrop-blur">
          <FiCheckCircle className="text-5xl text-emerald-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white">No alerts available.</h3>
          <p className="text-sm mt-1 text-slate-500">
            {searchTerm ? `No alert found matching "${searchTerm}".` : 'All business metrics are operating normally.'}
          </p>
        </div>
      ) : (
        /* Warning Banner List / Alert Cards */
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-3xl border p-6 backdrop-blur transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                alert.severity === 'Critical'
                  ? 'border-rose-500/30 bg-rose-950/20 hover:border-rose-500/50'
                  : alert.severity === 'Warning'
                  ? 'border-amber-500/30 bg-amber-950/20 hover:border-amber-500/50'
                  : 'border-cyan-500/30 bg-cyan-950/20 hover:border-cyan-500/50'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Severity Icon */}
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                    alert.severity === 'Critical'
                      ? 'bg-rose-500/20 text-rose-300'
                      : alert.severity === 'Warning'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-cyan-500/20 text-cyan-300'
                  }`}
                >
                  {alert.severity === 'Critical' ? (
                    <FiAlertCircle className="text-xl" />
                  ) : alert.severity === 'Warning' ? (
                    <FiAlertTriangle className="text-xl" />
                  ) : (
                    <FiInfo className="text-xl" />
                  )}
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Alert Title */}
                    <h3 className="text-base font-semibold text-white">{alert.title}</h3>
                    {/* Severity Badge */}
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        alert.severity === 'Critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : alert.severity === 'Warning'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  {/* Short Description */}
                  <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">{alert.description}</p>
                </div>
              </div>

              {/* Date & Category */}
              <div className="flex md:flex-col items-center md:items-end justify-between border-t border-white/5 pt-3 md:border-t-0 md:pt-0 shrink-0 text-xs text-slate-400 font-mono">
                <span>{alert.date}</span>
                {alert.category && <span className="text-slate-500 font-sans">{alert.category}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AnomalyAlertsPage;
