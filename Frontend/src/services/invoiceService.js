import api from './api';

/**
 * Fetch all invoices from backend with optional filters and sorting.
 * @param {Object} params - Query parameters (page, pageSize, status, search, dateFrom, dateTo, sortBy, sortOrder)
 * @returns {Promise<Object>} Object containing invoices list and pagination info
 */
export async function getInvoices(params = {}) {
  const response = await api.get('/api/invoices', { params });
  return response.data;
}

/**
 * Retrieve a single invoice by its database UUID.
 * @param {string} id - Invoice ID (UUID)
 * @returns {Promise<Object>} Invoice detailed data
 */
export async function getInvoiceById(id) {
  const response = await api.get(`/api/invoices/${id}`);
  return response.data;
}

/**
 * Create a new manual invoice.
 * @param {Object} invoiceData - Invoice payload (customerId, lineItems, discountRate, taxRate, dueDate)
 * @returns {Promise<Object>} Created invoice record
 */
export async function createInvoice(invoiceData) {
  const response = await api.post('/api/invoices', invoiceData);
  return response.data;
}

/**
 * Record a payment transaction against an invoice.
 * @param {string} id - Invoice ID (UUID)
 * @param {Object} paymentData - Payment details (amount, method, reference, note)
 * @returns {Promise<Object>} Created payment record
 */
export async function recordPayment(id, paymentData) {
  const response = await api.post(`/api/invoices/${id}/payments`, paymentData);
  return response.data;
}

/**
 * Retrieve the summary statistics of revenue from invoices.
 * @returns {Promise<Object>} Revenue statistics
 */
export async function getRevenueSummary() {
  const response = await api.get('/api/invoices/revenue/summary');
  return response.data;
}

/**
 * Run a check on overdue invoices to automatically update their status.
 * @returns {Promise<Object>} Check result stats
 */
export async function checkOverdue() {
  const response = await api.post('/api/invoices/overdue/check');
  return response.data;
}

/**
 * Update an invoice details (status, amount, customer name).
 * @param {string} id - Invoice ID (UUID)
 * @param {Object} data - Updated fields ({ status, amount, customer })
 * @returns {Promise<Object>} Updated invoice record
 */
export async function updateInvoice(id, data) {
  const response = await api.put(`/api/invoices/${id}`, data);
  return response.data;
}

/**
 * Update the status of one or more invoices.
 * @param {string[]} ids - Array of Invoice IDs (UUIDs)
 * @param {string} status - New status (e.g., "PAID", "UNPAID", "CANCELLED")
 * @returns {Promise<Object>} Update result
 */
export async function updateInvoiceStatus(ids, status) {
  const response = await api.patch('/api/invoices/bulk', { ids, status });
  return response.data;
}

/**
 * Delete an invoice by its database UUID.
 * @param {string} id - Invoice ID (UUID)
 * @returns {Promise<Object>} Delete result
 */
export async function deleteInvoice(id) {
  const response = await api.delete(`/api/invoices/${id}`);
  return response.data;
}

export default {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  recordPayment,
  getRevenueSummary,
  checkOverdue,
  updateInvoiceStatus,
  deleteInvoice,
};
