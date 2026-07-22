import api from './api';

/**
 * Fetch all available products list.
 * @returns {Promise<Object>} List of products
 */
export async function getProducts() {
  const response = await api.get('/api/products');
  return response.data;
}

export default {
  getProducts,
};
