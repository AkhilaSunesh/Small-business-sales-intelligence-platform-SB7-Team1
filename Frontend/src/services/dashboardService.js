import api from './api';

export async function getTotalRevenue() {
  const res = await api.get('/api/dashboard/total-revenue');
  return res.data;
}

export async function getSalesTrend(range = '30d') {
  const res = await api.get(`/api/dashboard/sales-trend?range=${encodeURIComponent(range)}`);
  return res.data;
}

export async function getTopProducts() {
  const res = await api.get('/api/dashboard/top-products');
  return res.data;
}

export default { getTotalRevenue, getSalesTrend, getTopProducts };
