/**
 * authService.js
 *
 * Handles authentication against the Security API Gateway.
 * Uses the existing `api` Axios instance so the Bearer token interceptor
 * and 401 handler remain in effect for all subsequent requests.
 *
 * Endpoint: POST /api/auth/login  (Security API Gateway — port 7000)
 */

import api from './api';

/**
 * Authenticate with the backend and return token + user details.
 *
 * @param {string} email
 * @param {string} password
 * @returns {{ accessToken: string, refreshToken: string, user: object }}
 * @throws Error with a human-readable message for the Login page to display
 */
export async function loginUser(email, password) {
  try {
    const { data } = await api.post('/api/auth/login', { email, password });
    return data; // { success, accessToken, refreshToken, user: { id, name, email, roleId } }
  } catch (err) {
    // Network / connection error — backend is unreachable
    if (!err.response) {
      throw new Error(
        'Unable to reach the authentication server. ' +
        'Please check your connection and try again.'
      );
    }

    // 401 Unauthorized — wrong credentials
    if (err.response.status === 401) {
      throw new Error('Invalid email or password. Please try again.');
    }

    // 429 Too Many Requests
    if (err.response.status === 429) {
      throw new Error('Too many login attempts. Please wait a moment and try again.');
    }

    // Any other HTTP error — surface the backend message
    const backendMessage = err.response?.data?.message;
    throw new Error(backendMessage || `Login failed (HTTP ${err.response.status}).`);
  }
}
