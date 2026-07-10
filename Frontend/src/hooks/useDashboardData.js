import { useCallback, useEffect, useState } from 'react';
import { getTotalRevenue, getSalesTrend, getTopProducts } from '../services/dashboardService';

export default function useDashboardData() {
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
    if (!hasAuthToken()) {
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [sumRes, trendRes, topRes] = await Promise.all([
        getTotalRevenue(),
        getSalesTrend('30d'),
        getTopProducts(),
      ]);

      setSummary(sumRes || null);
      setTrend(trendRes?.data || trendRes || []);
      setTopProducts(topRes?.data || topRes || []);
    } catch (err) {
      setError(err?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { loading, error, summary, trend, topProducts, refetch: fetchAll };
}
