import api from './api';

function buildQuery(filters = {}) {
  const params = new URLSearchParams();
  if (filters.dateRange) params.append('range', filters.dateRange);
  if (filters.category && filters.category !== 'all') params.append('category', filters.category);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  return params.toString();
}

export async function getDashboardSummary(filters) {
  const qs = buildQuery(filters);
  const res = await api.get(`/api/dashboard/summary?${qs}`);
  return res.data;
}

export async function getTotalRevenue() {
  const res = await api.get('/api/dashboard/total-revenue');
  return res.data;
}

export async function getSalesTrend(filters) {
  const qs = buildQuery(filters);
  const res = await api.get(`/api/dashboard/sales-trend?${qs}`);
  return res.data;
}

export async function getTopProducts(filters) {
  const qs = buildQuery(filters);
  const res = await api.get(`/api/dashboard/top-products?${qs}`);
  return res.data;
}

export async function getAuditSummary(limit = 5) {
  const res = await api.get(`/api/audit-summary?limit=${limit}`);
  return res.data;
}

export default { getDashboardSummary, getTotalRevenue, getSalesTrend, getTopProducts, getAuditSummary };


export async function getPaymentMethods() {
  const res = await api.get('/api/analytics/payment-methods');
  return res.data;
}

export async function getCategoryBreakdown() {
  const res = await api.get('/api/analytics/categories');
  return res.data;
}
