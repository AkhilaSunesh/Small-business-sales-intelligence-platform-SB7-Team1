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

export default {
  getInvoices,
  getInvoiceById,
  createInvoice,
  recordPayment,
  getRevenueSummary,
  checkOverdue,
};
