import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { FiSearch, FiZap, FiShoppingBag, FiArrowRight, FiAlertTriangle, FiCheckSquare, FiRefreshCw } from 'react-icons/fi';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { mockRecommendations } from '../../constants/recommendationsData';
import recommendationService from '../../services/recommendationService';

function RecommendationsPage() {
  usePageTitle('Recommendations');

  // State Management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Tester control mode
  const [demoMode, setDemoMode] = useState('loaded'); // 'loaded' | 'loading' | 'error' | 'empty'

  // Fetch live recommendations from API
  const fetchRecommendations = useCallback(async () => {
    if (demoMode !== 'loaded') return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await recommendationService.getRecommendations();
      if (res && res.success) {
        setRecommendations(res.data);
      } else {
        throw new Error('Invalid recommendations response format.');
      }
    } catch (err) {
      console.warn("Failed to load live recommendations, displaying connection error:", err.message);
      setError("Unable to load recommendations. Connection with AI microservice failed.");
    } finally {
      setIsLoading(false);
    }
  }, [demoMode]);

  // Load appropriate datasets based on chosen demo controls
  useEffect(() => {
    if (demoMode === 'loaded') {
      fetchRecommendations();
    } else if (demoMode === 'loading') {
      setRecommendations([]);
      setIsLoading(true);
      setError(null);
    } else if (demoMode === 'error') {
      setRecommendations([]);
      setIsLoading(false);
      setError("Unable to load data. Please try again.");
    } else if (demoMode === 'empty') {
      setRecommendations([]);
      setIsLoading(false);
      setError(null);
    }
  }, [demoMode, fetchRecommendations]);

  // Filter recommendations by product name (purchased or recommended) or reason
  const filteredRecommendations = useMemo(() => {
    if (!searchTerm.trim()) return recommendations;
    const term = searchTerm.toLowerCase();
    return recommendations.filter(
      (item) =>
        item.productPurchased.toLowerCase().includes(term) ||
        item.recommendedProduct.toLowerCase().includes(term) ||
        item.reason.toLowerCase().includes(term)
    );
  }, [recommendations, searchTerm]);

  const handleRetryConnection = () => {
    if (demoMode === 'loaded') {
      fetchRecommendations();
    } else {
      setDemoMode('loading');
      setTimeout(() => {
        setDemoMode('loaded');
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      {/* DEVELOPER DEMO TOGGLE BAR */}
      <section className="rounded-2xl border border-dashed border-cyan-400/20 bg-slate-900/40 p-4 backdrop-blur flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-cyan-300 font-semibold">
          <FiCheckSquare className="text-sm shrink-0" />
          <span>Milestone 2 Tester Controls:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { mode: 'loaded', label: 'Loaded Dashboard', col: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' },
            { mode: 'loading', label: 'Loading Skeleton', col: 'bg-slate-500/10 text-slate-300 border-slate-500/20' },
            { mode: 'error', label: 'Error Screen', col: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
            { mode: 'empty', label: 'Empty Layout', col: 'bg-amber-500/10 text-amber-300 border-amber-500/20' }
          ].map((item) => (
            <button
              key={item.mode}
              onClick={() => setDemoMode(item.mode)}
              className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                demoMode === item.mode 
                  ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow-md font-bold' 
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* Header & Subtitle */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 md:p-8 backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Recommendations</h1>
          <p className="mt-1.5 text-sm text-slate-400">AI-powered product recommendations.</p>
        </div>

        {/* Search bar */}
        <div className="w-full md:w-72">
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>
        </div>
      </section>

      {/* Backend Integration Banner */}
      {demoMode !== 'loaded' && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300 flex items-center gap-3">
          <FiAlertTriangle className="text-xl shrink-0" />
          <div>
            <span className="font-semibold">Future Backend API:</span> Recommendation engine models (Association Rule Mining / Collaborative Filtering) will push real-time pairs to this endpoint.
          </div>
        </div>
      )}

      {/* CORE DISPLAY ROUTING */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-white/10 rounded"></div>
                <div className="h-4 w-12 bg-white/10 rounded"></div>
              </div>
              <div className="h-14 bg-white/5 rounded-2xl"></div>
              <div className="h-10 bg-white/10 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <div className="rounded-3xl border border-rose-500/10 bg-slate-950/80 p-8 backdrop-blur text-center space-y-4 max-w-md mx-auto my-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 mx-auto">
            <FiAlertTriangle className="text-2xl shrink-0" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white">Connection Error</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
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
      ) : filteredRecommendations.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-12 text-center text-slate-400 backdrop-blur">
          <FiZap className="text-5xl text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white">No recommendations available.</h3>
          <p className="text-sm mt-1 text-slate-500">
            {searchTerm ? `No product matching "${searchTerm}" was found.` : 'Check back later for new AI insights.'}
          </p>
        </div>
      ) : (
        /* Recommendation Cards Grid (Responsive Cards) */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecommendations.map((rec) => (
            <div
              key={rec.id}
              className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur flex flex-col justify-between hover:border-cyan-400/30 transition-all duration-300 group"
            >
              <div className="space-y-4">
                {/* Header Tag / Confidence */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-3 py-1 rounded-full">
                    {rec.category || 'AI Suggestion'}
                  </span>
                  {rec.confidence && (
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                      {rec.confidence} match
                    </span>
                  )}
                </div>

                {/* Product Purchased -> Recommended Product */}
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Product Purchased</span>
                    <span className="text-sm font-semibold text-white mt-0.5 block truncate">{rec.productPurchased}</span>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400">
                    <FiArrowRight />
                  </div>
                  <div className="flex-1 text-right">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Recommended Product</span>
                    <span className="text-sm font-semibold text-cyan-300 mt-0.5 block truncate">{rec.recommendedProduct}</span>
                  </div>
                </div>

                {/* Short Reason */}
                <div>
                  <span className="text-xs font-semibold text-slate-300 block mb-1">Reason:</span>
                  <p className="text-xs leading-relaxed text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-white/5 italic">
                    "{rec.reason}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecommendationsPage;
