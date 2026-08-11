import api from './api';

export async function getSalesTransactions(filters = {}, page = 1, limit = 50) {
  const params = new URLSearchParams({
    page,
    limit,
    sort: 'transactionDate',
    order: 'desc'
  });

  if (filters.category && filters.category !== 'all') {
    params.append('category', filters.category);
  }
  
  if (filters.startDate) {
    params.append('startDate', filters.startDate);
  }
  
  if (filters.endDate) {
    params.append('endDate', filters.endDate);
  }

  const res = await api.get(`/api/sales?${params.toString()}`);
  return res.data;
}

export default { getSalesTransactions };
