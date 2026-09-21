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
 * @param {string} [role]
 * @returns {{ accessToken: string, refreshToken: string, user: object }}
 * @throws Error with a human-readable message for the Login page to display
 */
export async function loginUser(email, password, role) {
  try {
    const { data } = await api.post('/api/auth/login', { email, password, role });
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

    // 403 Forbidden — role mismatch or deactivated / pending
    if (err.response.status === 403) {
      const backendMessage = err.response?.data?.message;
      throw new Error(backendMessage || 'Access denied. Please check your role and credentials.');
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

/**
 * Register a new user with the backend.
 *
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @param {number} roleId
 * @returns {object} The registered user details
 * @throws Error with a human-readable message for the Signup page to display
 */
export async function registerUser(name, email, password, roleId) {
  try {
    const { data } = await api.post('/api/auth/register', { name, email, password, roleId });
    return data;
  } catch (err) {
    if (!err.response) {
      throw new Error(
        'Unable to reach the authentication server. ' +
        'Please check your connection and try again.'
      );
    }
    const backendMessage = err.response?.data?.message;
    throw new Error(backendMessage || `Registration failed (HTTP ${err.response.status}).`);
  }
}
