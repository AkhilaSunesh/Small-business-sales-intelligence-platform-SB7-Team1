import api from './api';

/**
 * Fetch product recommendations list from the AI engine endpoint.
 * @returns {Promise<Object>} Object containing recommendation associations
 */
export async function getRecommendations() {
  const response = await api.get('/api/recommendations');
  return response.data;
}

export default {
  getRecommendations,
};
