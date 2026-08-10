import { useCallback, useEffect, useState } from 'react';
import { getTotalRevenue, getSalesTrend, getTopProducts } from '../services/dashboardService';
import { generateDashboardData } from '../utils/mockDataGenerator';

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
      setLoading(true);
      setError(null);
      const timer = setTimeout(() => {
        try {
          const mockRes = generateDashboardData(filters || { dateRange: '30d', category: 'all', startDate: '', endDate: '' });
          setSummary(mockRes.summary);
          setTrend(mockRes.trend);
          setTopProducts(mockRes.topProducts);
        } catch (err) {
          setError(err?.message || 'Failed to simulate dashboard metrics');
        } finally {
          setLoading(false);
        }
      }, 350);
      return () => clearTimeout(timer);
    }

    setLoading(true);
    setError(null);
    try {
      const [sumRes, trendRes, topRes] = await Promise.all([
        getDashboardSummary(filters),
        getSalesTrend(filters),
        getTopProducts(filters),
      ]);

      setSummary(sumRes?.data || sumRes || null);
      setTrend(trendRes?.data || trendRes || []);
      setTopProducts(topRes?.data || topRes || []);
    } catch (err) {
      // Fallback to mock data if API is unreachable
      console.warn('[Dashboard API] Server unreachable. Falling back to mock data.', err.message);
      try {
        const mockRes = generateDashboardData(filters || { dateRange: '30d', category: 'all', startDate: '', endDate: '' });
        setSummary(mockRes.summary);
        setTrend(mockRes.trend);
        setTopProducts(mockRes.topProducts);
      } catch (mockErr) {
        setError(err?.message || 'Failed to fetch dashboard data');
      }
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