import api from './api';

/**
 * Fetch customer segmentation metrics from the AI segmentation endpoint.
 * @returns {Promise<Object>} Object containing customer segmentation data
 */
export async function getCustomerSegments() {
  const response = await api.get('/api/customer-groups');
  return response.data;
}

/**
 * Fetch all customers list (used for lookup dropdowns).
 * @returns {Promise<Object>} List of customers
 */
export async function getCustomers() {
  const response = await api.get('/api/customers');
  return response.data;
}

export default {
  getCustomerSegments,
  getCustomers,
};
