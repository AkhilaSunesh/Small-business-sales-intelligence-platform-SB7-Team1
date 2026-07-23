import { useCallback, useEffect, useState } from 'react';
import { getTotalRevenue, getSalesTrend, getTopProducts } from '../services/dashboardService';
import { useAppContext } from '../context/AppContext';

export default function useDashboardData() {
  const { demoMode } = useAppContext();
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
    if (demoMode === 'loading') {
      setLoading(true);
      setError(null);
      return;
    }
    if (demoMode === 'error') {
      setLoading(false);
      setError('Connection refused: Dashboard API backend is offline.');
      return;
    }
    if (demoMode === 'empty') {
      setLoading(false);
      setError(null);
      setSummary({ totalRevenue: '$0', totalOrders: '0', avgOrderValue: '$0', activeProducts: '0' });
      setTrend([]);
      setTopProducts([]);
      return;
    }

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
  }, [demoMode]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { loading, error, summary, trend, topProducts, refetch: fetchAll };
}
