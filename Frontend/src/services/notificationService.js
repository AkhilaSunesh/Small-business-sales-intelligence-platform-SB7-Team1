import api from './api';

/**
 * Fetch combined paginated alerts (low stock & overdue invoices).
 * @param {Object} params - Query params (page, limit, type)
 * @returns {Promise<Object>} Notification list and summary metrics
 */
export async function getNotifications(params = {}) {
  const response = await api.get('/api/notifications', { params });
  return response.data;
}

/**
 * Fetch lightweight notification counts.
 * @returns {Promise<Object>} Counts (total, lowStock, overdueInvoices, critical)
 */
export async function getNotificationCounts() {
  const response = await api.get('/api/notifications/counts');
  return response.data;
}

/**
 * Fetch low stock alerts.
 * @param {Object} params - Query params (page, limit)
 * @returns {Promise<Object>} Low stock alerts list
 */
export async function getLowStockNotifications(params = {}) {
  const response = await api.get('/api/notifications/low-stock', { params });
  return response.data;
}

/**
 * Fetch overdue invoices.
 * @param {Object} params - Query params (page, limit)
 * @returns {Promise<Object>} Overdue invoice list
 */
export async function getOverdueInvoiceNotifications(params = {}) {
  const response = await api.get('/api/notifications/overdue-invoices', { params });
  return response.data;
}

export default {
  getNotifications,
  getNotificationCounts,
  getLowStockNotifications,
  getOverdueInvoiceNotifications,
};
