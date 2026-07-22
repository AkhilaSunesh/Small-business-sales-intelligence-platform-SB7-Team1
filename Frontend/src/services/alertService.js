import api from './api';

/**
 * Fetch anomaly alerts detected on historical transaction thresholds.
 * @returns {Promise<Object>} Object containing flagged anomalies list
 */
export async function getAnomalyAlerts() {
  const response = await api.get('/api/anomaly-detection');
  return response.data;
}

export default {
  getAnomalyAlerts,
};
