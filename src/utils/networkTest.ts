/**
 * networkTest.ts
 *
 * Network testing utility for discovering and validating backend API connectivity.
 * This module helps debug connection issues in React Native development by testing
 * multiple possible backend URLs and finding the one that works.
 *
 * Common React Native Networking Issues:
 * -------------------------------------
 * 1. Android Emulator: localhost doesn't work, use 10.0.2.2 instead
 * 2. iOS Simulator: localhost works fine
 * 3. Physical Devices: Need computer's local IP address
 * 4. Firewall: May block local development servers
 *
 * This utility helps identify which URL works in your environment.
 *
 * @module utils/networkTest
 */

// HTTP client for making test requests
import axios from 'axios';

/**
 * Test Backend Connection Function
 * --------------------------------
 * Attempts to connect to the backend API using multiple possible URLs.
 * Tests each URL in sequence until one succeeds, then returns the base URL.
 *
 * Testing Strategy:
 * ---------------
 * 1. Tests multiple URLs that might work in different environments
 * 2. Uses a health check endpoint (/health) to verify server is responsive
 * 3. Returns first working URL or null if all fail
 * 4. Provides detailed logging for debugging
 *
 * URL Testing Order:
 * -----------------
 * 1. 10.0.2.2: Android emulator's special IP for host machine
 * 2. localhost: Works for iOS simulator and web
 * 3. 127.0.0.1: Alternative to localhost, sometimes more reliable
 *
 * Network Architecture Pattern: Fallback Chain
 * -------------------------------------------
 * This function implements a fallback chain pattern:
 * - Try primary option first
 * - If fails, try secondary options
 * - Continue until success or all options exhausted
 *
 * Benefits:
 * - Works across different development environments
 * - Automatically finds working configuration
 * - Provides clear debugging information
 * - Handles network timeouts gracefully
 *
 * @returns {Promise<string | null>} The base URL of the working backend, or null if none work
 *
 * @example
 * // Basic usage - Find working backend URL
 * import { testBackendConnection } from '../utils/networkTest';
 *
 * async function initializeApp() {
 *   const backendUrl = await testBackendConnection();
 *   if (backendUrl) {
 *     console.log('Backend found at:', backendUrl);
 *     // Configure API client with this URL
 *     apiClient.setBaseUrl(backendUrl);
 *   } else {
 *     console.error('Could not connect to backend');
 *     Alert.alert('Connection Error', 'Cannot reach the server');
 *   }
 * }
 *
 * @example
 * // Usage in app initialization
 * useEffect(() => {
 *   const checkConnection = async () => {
 *     setIsLoading(true);
 *     const url = await testBackendConnection();
 *     if (url) {
 *       setBackendUrl(url);
 *       setConnectionStatus('connected');
 *     } else {
 *       setConnectionStatus('disconnected');
 *     }
 *     setIsLoading(false);
 *   };
 *   checkConnection();
 * }, []);
 *
 * @example
 * // Usage with retry logic
 * async function connectWithRetry(maxRetries = 3) {
 *   for (let i = 0; i < maxRetries; i++) {
 *     const url = await testBackendConnection();
 *     if (url) return url;
 *     console.log(`Retry ${i + 1}/${maxRetries}...`);
 *     await new Promise(resolve => setTimeout(resolve, 2000));
 *   }
 *   return null;
 * }
 *
 * Debugging Tips:
 * --------------
 * - Check console logs for detailed test results
 * - Verify backend is running (check terminal logs)
 * - Ensure no firewall blocking connections
 * - For Android emulator, 10.0.2.2 should work
 * - For iOS simulator, localhost should work
 * - For physical devices, use computer's local IP
 *
 * Error Handling:
 * --------------
 * - Each URL test is wrapped in try-catch
 * - Timeout prevents hanging on unavailable servers
 * - All errors logged for debugging
 * - Returns null if all tests fail (graceful failure)
 */
export const testBackendConnection = async (): Promise<string | null> => {
  /**
   * List of URLs to test in order of priority
   * Each includes the /health endpoint for validation
   */
  const urls = [
    'http://10.0.2.2:8000/health',      // Android emulator
    'http://localhost:8000/health',     // iOS simulator / web
    'http://127.0.0.1:8000/health',     // Alternative localhost
  ];

  console.log('🔍 Testing backend connections...');

  // Test each URL in sequence
  for (const url of urls) {
    try {
      console.log(`Testing: ${url}`);

      // Make HTTP GET request with 5-second timeout
      // Timeout prevents hanging on unreachable servers
      const response = await axios.get(url, {timeout: 5000});

      // Success! Log the response and return base URL
      console.log(`✅ SUCCESS: ${url}`, response.data);

      // Remove '/health' from URL to get base URL
      // e.g., 'http://10.0.2.2:8000/health' -> 'http://10.0.2.2:8000'
      return url.replace('/health', '');

    } catch (error: any) {
      // This URL failed, log and continue to next
      console.log(`❌ FAILED: ${url}`, error.message);
      // Continue loop to try next URL
    }
  }

  // All URLs failed
  console.log('❌ All connection attempts failed');
  return null;
};
