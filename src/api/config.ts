/**
 * config.ts
 *
 * API configuration module that manages environment-specific settings.
 * This file centralizes all API-related configuration like base URLs, timeouts,
 * and environment variables.
 *
 * Design Pattern: Environment Configuration
 * ----------------------------------------
 * This module implements environment-aware configuration:
 * - Different settings for development vs production
 * - Centralized configuration prevents scattered magic values
 * - Easy to update API endpoints without touching business logic
 *
 * Environment Variables:
 * ---------------------
 * React Native uses __DEV__ global variable to detect development mode:
 * - __DEV__ === true: Running in development (Metro bundler, debugging)
 * - __DEV__ === false: Running in production (release build)
 *
 * @module api/config
 */

/**
 * Production Backend URL
 * ---------------------
 * The URL of your deployed backend API (e.g., Vercel, AWS, Heroku).
 * Update this after deploying your backend to production.
 *
 * Important: No trailing slash!
 */
const VERCEL_API_URL = 'https://ai-powered-todo-five.vercel.app';

/**
 * API Configuration Object
 * -----------------------
 * Contains all configuration settings for API communication.
 *
 * Configuration Properties:
 * - BASE_URL: The root URL for all API requests
 * - TIMEOUT: Maximum time to wait for API response (milliseconds)
 *
 * Environment-Aware URL Selection:
 * -------------------------------
 * Development (__DEV__ = true):
 *   - Can use localhost or production URL for testing
 *   - Current setup uses production URL even in dev
 *   - Alternative: 'http://10.0.2.2:8000' for local backend
 *
 * Production (__DEV__ = false):
 *   - Always uses the production Vercel URL
 *   - Optimized for real users
 *
 * Timeout Configuration:
 * --------------------
 * 30000ms (30 seconds) timeout:
 * - Prevents infinite waiting on slow/dead connections
 * - Long enough for complex AI operations
 * - Short enough to provide good UX
 *
 * @example
 * // Accessing configuration
 * import { API_CONFIG } from './config';
 *
 * console.log('Base URL:', API_CONFIG.BASE_URL);
 * console.log('Timeout:', API_CONFIG.TIMEOUT);
 *
 * @example
 * // Using in axios configuration
 * import axios from 'axios';
 * import { API_CONFIG } from './config';
 *
 * const api = axios.create({
 *   baseURL: API_CONFIG.BASE_URL,
 *   timeout: API_CONFIG.TIMEOUT,
 * });
 */
export const API_CONFIG = {
  /**
   * Base URL for API requests
   * Automatically switches between development and production URLs
   *
   * Customization Options:
   * - For local backend in dev: 'http://10.0.2.2:8000' (Android emulator)
   * - For local backend in dev: 'http://localhost:8000' (iOS simulator)
   * - For always using production: Use VERCEL_API_URL for both
   */
  BASE_URL: __DEV__ ? 'https://ai-powered-todo-five.vercel.app' : VERCEL_API_URL,

  /**
   * Request timeout in milliseconds
   * Prevents hanging on slow or unresponsive servers
   *
   * Recommended values:
   * - Fast operations (auth, simple queries): 10000ms (10s)
   * - Standard operations (CRUD): 15000ms (15s)
   * - AI/Complex operations: 30000ms+ (30s+)
   */
  TIMEOUT: 30000,
};

/**
 * Get API Base URL Helper Function
 * --------------------------------
 * Returns the current API base URL.
 * This function provides a simple interface for accessing the configured URL.
 *
 * Why use a function instead of direct access?
 * - Future flexibility: Can add runtime URL switching
 * - Can add logging or analytics
 * - Can implement URL validation
 * - Provides consistent interface across app
 *
 * @returns {string} The configured API base URL
 *
 * @example
 * // Basic usage
 * import { getApiUrl } from './config';
 *
 * const apiUrl = getApiUrl();
 * console.log('Making request to:', apiUrl);
 *
 * @example
 * // Using in network status check
 * async function checkServerHealth() {
 *   const baseUrl = getApiUrl();
 *   const healthUrl = `${baseUrl}/health`;
 *   const response = await fetch(healthUrl);
 *   return response.ok;
 * }
 *
 * @example
 * // Dynamic URL construction
 * function buildEndpointUrl(path: string) {
 *   const base = getApiUrl();
 *   return `${base}${path}`;
 * }
 *
 * const tasksUrl = buildEndpointUrl('/api/v1/tasks');
 * // Result: 'https://ai-powered-todo-five.vercel.app/api/v1/tasks'
 */
export const getApiUrl = (): string => {
  return API_CONFIG.BASE_URL;
};
