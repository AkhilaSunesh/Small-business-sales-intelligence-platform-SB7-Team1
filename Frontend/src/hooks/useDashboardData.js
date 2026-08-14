import { useCallback, useEffect, useState } from 'react';
import { getDashboardSummary, getSalesTrend, getTopProducts } from '../services/dashboardService';

export default function useDashboardData(filters) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  const hasAuthToken = () => {
    try {
      return Boolean(localStorage.getItem('authToken'));
    } catch (err) {
      return false;
    }
  };

  const fetchAll = useCallback(async () => {
    // If no auth token, we can't fetch from API
    if (!hasAuthToken()) {
      setLoading(false);
      setError("Not authenticated");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Validate custom date range before sending request
      if (
        filters.dateRange === 'custom' &&
        filters.startDate &&
        filters.endDate &&
        filters.startDate > filters.endDate
      ) {
        setError("Invalid date range: The 'From' date cannot be later than the 'To' date.");
        setLoading(false);
        return;
      }

      const [sumRes, trendRes, topRes] = await Promise.all([
        getDashboardSummary(filters),
        getSalesTrend(filters),
        getTopProducts(filters),
      ]);

      setSummary(sumRes?.data || sumRes || null);
      setTrend(trendRes?.data || trendRes || []);
      setTopProducts(topRes?.data || topRes || []);
    } catch (err) {
      console.error('[Dashboard API] Error fetching data:', err.message);
      setError(err?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const cleanup = fetchAll();
    if (typeof cleanup === 'function') return cleanup;
  }, [fetchAll]);

  return { loading, error, summary, trend, topProducts, refetch: fetchAll };
}