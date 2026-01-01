/**
 * apiService.ts
 *
 * Centralized API service using the Singleton pattern for managing all HTTP requests.
 * This service provides a clean, type-safe interface for communicating with the backend API.
 *
 * Architecture Pattern: Singleton Service
 * --------------------------------------
 * This module implements the Singleton pattern where:
 * - Only one instance of ApiService exists throughout the app
 * - All components share the same HTTP client configuration
 * - Authentication state (token) is managed centrally
 * - Request/response interceptors are set up once
 *
 * Why Singleton?
 * -------------
 * - Shared authentication state across all requests
 * - Consistent error handling
 * - Single configuration point
 * - Prevents multiple axios instances with different configs
 * - Memory efficient (one instance vs many)
 *
 * Key Features:
 * ------------
 * - Automatic token injection via interceptors
 * - Centralized error handling
 * - Type-safe API methods with TypeScript
 * - Environment-aware configuration
 * - Detailed logging for debugging
 *
 * @module api/apiService
 */

// Axios: Promise-based HTTP client for making API requests
import axios, {AxiosInstance, AxiosError} from 'axios';

// Type definitions for authentication and user data
import {LoginCredentials, RegisterCredentials, User} from '../types';

// Environment configuration (from .env file)
import Config from 'react-native-config';

/**
 * API Base URL Configuration
 * --------------------------
 * Determines which backend server to connect to.
 *
 * Priority:
 * 1. Config.API_URL from .env file (if set)
 * 2. Fallback: Android emulator localhost (10.0.2.2:8000)
 *
 * Environment Variables (.env file):
 * ---------------------------------
 * API_URL=http://10.0.2.2:8000
 * API_TIMEOUT=30000
 *
 * Common URLs by Environment:
 * - Android Emulator: http://10.0.2.2:8000
 * - iOS Simulator: http://localhost:8000
 * - Production: https://your-api.vercel.app
 */
const API_BASE_URL = Config.API_URL || 'http://10.0.2.2:8000';

/**
 * ApiService Class
 * ---------------
 * Singleton service for managing all API communication.
 *
 * Design Pattern: Singleton
 * ------------------------
 * - Private instance created once at module load
 * - Exported as singleton instance at end of file
 * - All app code uses the same instance
 *
 * Responsibilities:
 * ----------------
 * - Configure HTTP client (axios)
 * - Manage authentication tokens
 * - Handle request/response interceptors
 * - Provide typed methods for all API endpoints
 * - Centralize error handling
 *
 * Class Structure:
 * ---------------
 * - Private properties: api client, auth token
 * - Constructor: Initialize axios with interceptors
 * - Public methods: API endpoint wrappers
 * - Private methods: Error handling utilities
 */
class ApiService {
  /**
   * Axios instance for making HTTP requests
   * Configured with base URL, headers, and timeout
   * @private
   */
  private api: AxiosInstance;

  /**
   * Authentication token for API requests
   * Set after successful login, cleared on logout/401
   * @private
   */
  private token: string | null = null;

  /**
   * Constructor - Initializes the API service
   * -----------------------------------------
   * Called once when the module loads (singleton pattern).
   *
   * Setup Steps:
   * 1. Log configuration for debugging
   * 2. Create axios instance with base configuration
   * 3. Set up request interceptor (adds auth token)
   * 4. Set up response interceptor (handles 401 errors)
   *
   * Axios Interceptors:
   * ------------------
   * Interceptors are middleware that run before/after requests:
   *
   * Request Interceptor:
   * - Runs before every request is sent
   * - Automatically adds Authorization header if token exists
   * - Eliminates need to manually add token to each request
   *
   * Response Interceptor:
   * - Runs after every response is received
   * - Checks for 401 (Unauthorized) status
   * - Automatically clears token on auth failure
   * - Prevents using expired/invalid tokens
   */
  constructor() {
    // Debug logging: helpful for troubleshooting connection issues
    console.log('[ApiService] Initializing with base URL:', API_BASE_URL);
    console.log('[ApiService] Config.API_URL:', Config.API_URL);
    console.log('[ApiService] Config.API_TIMEOUT:', Config.API_TIMEOUT);

    /**
     * Create configured axios instance
     * -------------------------------
     * baseURL: Prepended to all relative URLs in requests
     * headers: Default headers sent with every request
     * timeout: Max time to wait for response (prevents hanging)
     */
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',  // Tell server we're sending JSON
      },
      timeout: parseInt(Config.API_TIMEOUT || '30000', 10),  // 30 second default
    });

    /**
     * Request Interceptor
     * ------------------
     * Automatically adds authentication token to requests.
     *
     * Pattern: Automatic Token Injection
     * ----------------------------------
     * Before:
     *   axios.get('/tasks', {
     *     headers: { Authorization: `Bearer ${token}` }
     *   });
     *
     * After:
     *   axios.get('/tasks');  // Token added automatically!
     */
    this.api.interceptors.request.use(
      config => {
        // If we have a token, add it to the request headers
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;  // Continue with the request
      },
      error => Promise.reject(error),  // Pass through any errors
    );

    /**
     * Response Interceptor
     * -------------------
     * Handles authentication errors globally.
     *
     * Pattern: Automatic Token Cleanup
     * --------------------------------
     * If server returns 401 (Unauthorized):
     * - Token is invalid/expired
     * - Clear it from memory
     * - App can redirect to login
     *
     * Benefits:
     * - Prevents retrying with bad token
     * - Consistent auth error handling
     * - No need to check 401 in every component
     */
    this.api.interceptors.response.use(
      response => response,  // Pass through successful responses
      (error: AxiosError) => {
        // Check if error is 401 Unauthorized
        if (error.response?.status === 401) {
          // Clear the invalid token
          this.token = null;
          // Note: App should listen for this and redirect to login
        }
        return Promise.reject(error);  // Re-throw error for handling
      },
    );
  }

  /**
   * Set Authentication Token
   * -----------------------
   * Updates the token used for authenticated requests.
   *
   * @param {string | null} token - JWT token from login, or null to clear
   *
   * @example
   * // After successful login
   * apiService.setToken(loginResponse.access_token);
   *
   * @example
   * // On logout
   * apiService.setToken(null);
   */
  setToken(token: string | null): void {
    this.token = token;
  }

  /**
   * Login Method
   * -----------
   * Authenticates user with email and password.
   *
   * Authentication Flow:
   * ------------------
   * 1. Send credentials to /api/v1/auth/login
   * 2. Receive JWT access token
   * 3. Store token in memory
   * 4. Fetch user profile with token
   * 5. Return user data and token
   *
   * @param {LoginCredentials} credentials - Email and password
   * @returns {Promise<{user: User; token: string}>} User data and JWT token
   * @throws {Error} If login fails or server error occurs
   *
   * @example
   * // Basic login
   * try {
   *   const result = await apiService.login({
   *     email: 'user@example.com',
   *     password: 'securePassword123'
   *   });
   *   console.log('Logged in as:', result.user.email);
   *   console.log('Token:', result.token);
   * } catch (error) {
   *   console.error('Login failed:', error.message);
   * }
   *
   * @example
   * // Login with state management
   * const handleLogin = async () => {
   *   setLoading(true);
   *   try {
   *     const { user, token } = await apiService.login(credentials);
   *     setUser(user);
   *     await AsyncStorage.setItem('token', token);
   *     navigation.navigate('Home');
   *   } catch (error) {
   *     Alert.alert('Login Failed', error.message);
   *   } finally {
   *     setLoading(false);
   *   }
   * };
   */
  async login(
    credentials: LoginCredentials,
  ): Promise<{user: User; token: string}> {
    try {
      // Log request details for debugging
      console.log('🔵 Attempting login to:', `${API_BASE_URL}/api/v1/auth/login`);
      console.log('🔵 Credentials:', {email: credentials.email, password: '***'});

      // Step 1: Send login request
      const response = await this.api.post('/api/v1/auth/login', credentials);

      console.log('✅ Login response status:', response.status);
      console.log('✅ Login response data:', JSON.stringify(response.data, null, 2));

      // Step 2: Extract JWT token from response
      const {access_token} = response.data;

      if (!access_token) {
        console.error('❌ No access_token in response');
        throw new Error('No access token received from server');
      }

      // Step 3: Store token for future requests
      this.setToken(access_token);
      console.log('✅ Token set successfully');

      // Step 4: Fetch user profile using the new token
      console.log('🔵 Fetching user details...');
      const userResponse = await this.api.get('/api/v1/auth/me');
      console.log('✅ User details received:', JSON.stringify(userResponse.data, null, 2));

      // Step 5: Return user data and token
      return {
        user: userResponse.data,
        token: access_token,
      };
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Register Method
   * --------------
   * Creates a new user account.
   *
   * @param {RegisterCredentials} credentials - User registration data
   * @returns {Promise<{user: User; token: string}>} New user data and JWT token
   * @throws {Error} If registration fails (e.g., email already exists)
   *
   * @example
   * const result = await apiService.register({
   *   email: 'newuser@example.com',
   *   password: 'securePass123',
   *   name: 'John Doe'
   * });
   */
  async register(
    credentials: RegisterCredentials,
  ): Promise<{user: User; token: string}> {
    try {
      const response = await this.api.post('/api/v1/auth/register', credentials);
      const {user, access_token} = response.data;

      // Store token for authenticated requests
      this.setToken(access_token);

      return {
        user: user,
        token: access_token,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Current User Method
   * ----------------------
   * Fetches the currently authenticated user's profile.
   * Requires valid authentication token.
   *
   * @returns {Promise<User>} Current user's profile data
   * @throws {Error} If not authenticated or request fails
   *
   * @example
   * const user = await apiService.getCurrentUser();
   * console.log('Current user:', user.email);
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.api.get('/api/v1/auth/me');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout Method
   * ------------
   * Logs out the current user and clears authentication.
   *
   * @returns {Promise<void>}
   * @throws {Error} If logout request fails
   *
   * @example
   * await apiService.logout();
   * navigation.navigate('Login');
   */
  async logout(): Promise<void> {
    try {
      await this.api.post('/api/v1/auth/logout');
      // Clear token from memory
      this.setToken(null);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Send Chat Message Method
   * -----------------------
   * Sends a message to the AI chat agent.
   *
   * @param {string} message - The message to send to the AI
   * @returns {Promise<any>} AI response data
   * @throws {Error} If request fails
   *
   * @example
   * const response = await apiService.sendChatMessage('Create a task to buy groceries');
   * console.log('AI response:', response.message);
   */
  async sendChatMessage(message: string): Promise<any> {
    try {
      console.log('[ApiService] Sending chat message:', message);
      console.log('[ApiService] Request URL:', `${API_BASE_URL}/api/v1/agent/chat`);
      const response = await this.api.post('/api/v1/agent/chat', {message});
      console.log('[ApiService] Response status:', response.status);
      console.log('[ApiService] Response data:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('[ApiService] Chat message error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get Agent Capabilities Method
   * ----------------------------
   * Retrieves the AI agent's available capabilities.
   *
   * @returns {Promise<any>} List of agent capabilities
   * @throws {Error} If request fails
   *
   * @example
   * const capabilities = await apiService.getAgentCapabilities();
   * console.log('Agent can:', capabilities);
   */
  async getAgentCapabilities(): Promise<any> {
    try {
      const response = await this.api.get('/api/v1/agent/capabilities');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Tasks Method
   * ---------------
   * Retrieves all tasks for the current user.
   *
   * @returns {Promise<any[]>} Array of task objects
   * @throws {Error} If request fails
   *
   * @example
   * const tasks = await apiService.getTasks();
   * console.log(`You have ${tasks.length} tasks`);
   */
  async getTasks(): Promise<any[]> {
    try {
      const response = await this.api.get('/api/v1/tasks');
      // Server may return { items: [...] } or just [...]
      return response.data.items || [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create Task Method
   * -----------------
   * Creates a new task.
   *
   * @param {any} taskData - Task data (title, description, priority, etc.)
   * @returns {Promise<any>} Created task object
   * @throws {Error} If creation fails
   *
   * @example
   * const newTask = await apiService.createTask({
   *   title: 'Buy groceries',
   *   description: 'Milk, eggs, bread',
   *   priority: 'high',
   *   status: 'pending'
   * });
   */
  async createTask(taskData: any): Promise<any> {
    try {
      console.log('[API] Creating task:', JSON.stringify(taskData, null, 2));
      const response = await this.api.post('/api/v1/tasks', taskData);
      console.log('[API] Create task response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('[API] Create task failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update Task Method
   * -----------------
   * Updates an existing task.
   *
   * @param {string} id - Task ID to update
   * @param {any} taskData - Updated task data
   * @returns {Promise<any>} Updated task object
   * @throws {Error} If update fails or task not found
   *
   * @example
   * const updated = await apiService.updateTask('task-123', {
   *   status: 'completed'
   * });
   */
  async updateTask(id: string, taskData: any): Promise<any> {
    try {
      console.log('[API] Updating task:', id);
      console.log('[API] Update data:', JSON.stringify(taskData, null, 2));
      console.log('[API] Request URL:', `/api/v1/tasks/${id}`);
      console.log('[API] Request method: PUT');
      const response = await this.api.put(`/api/v1/tasks/${id}`, taskData);
      console.log('[API] Update response status:', response.status);
      console.log('[API] Update response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('[API] Update task failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete Task Method
   * -----------------
   * Deletes a task permanently.
   *
   * @param {string} id - Task ID to delete
   * @returns {Promise<void>}
   * @throws {Error} If deletion fails or task not found
   *
   * @example
   * await apiService.deleteTask('task-123');
   * console.log('Task deleted');
   */
  async deleteTask(id: string): Promise<void> {
    try {
      console.log('[API] Deleting task:', id);
      await this.api.delete(`/api/v1/tasks/${id}`);
      console.log('[API] Task deleted successfully');
    } catch (error) {
      console.error('[API] Delete task failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Check Email Method
   * -----------------
   * Checks if an email is already registered.
   * Useful for registration validation.
   *
   * @param {string} email - Email address to check
   * @returns {Promise<{exists: boolean; message: string}>} Email availability status
   * @throws {Error} If request fails
   *
   * @example
   * const result = await apiService.checkEmail('user@example.com');
   * if (result.exists) {
   *   console.log('Email already taken');
   * }
   */
  async checkEmail(email: string): Promise<{exists: boolean; message: string}> {
    try {
      // URL encode email to handle special characters
      const response = await this.api.get(`/api/v1/auth/check-email?email=${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Error Handler (Private Method)
   * -----------------------------
   * Centralizes error handling for all API requests.
   * Extracts user-friendly error messages from various error formats.
   *
   * Error Handling Pattern: Message Extraction
   * -----------------------------------------
   * Tries multiple sources to get the best error message:
   * 1. Server error detail (error.response.data.detail)
   * 2. Server error message (error.response.data.message)
   * 3. Axios error message (error.message)
   * 4. Generic fallback message
   *
   * Benefits:
   * - Consistent error format across app
   * - User-friendly error messages
   * - Detailed logging for debugging
   * - Handles both Axios and non-Axios errors
   *
   * @param {any} error - The error to handle
   * @returns {Error} Formatted Error object with user-friendly message
   *
   * @private
   *
   * Common Error Scenarios:
   * ----------------------
   * - 400: Bad request (validation error)
   * - 401: Unauthorized (token expired/invalid)
   * - 403: Forbidden (insufficient permissions)
   * - 404: Not found (resource doesn't exist)
   * - 500: Server error (backend issue)
   * - Network: Connection failed (offline/timeout)
   */
  private handleError(error: any): Error {
    // Check if this is an Axios error (has response/request properties)
    if (axios.isAxiosError(error)) {
      // Log detailed error information for debugging
      console.error('🔴 Axios Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
      });

      // Extract the most specific error message available
      const message =
        error.response?.data?.detail ||      // FastAPI/Django format
        error.response?.data?.message ||     // Express/generic format
        error.message ||                     // Axios error message
        'An error occurred';                 // Fallback

      return new Error(message);
    }

    // Non-Axios error (e.g., programming error)
    console.error('🔴 Unknown Error:', error);
    return error;
  }
}

/**
 * Singleton Instance Export
 * ------------------------
 * Export a single instance of ApiService for the entire app.
 *
 * Singleton Pattern Benefits:
 * - All app components share the same API client
 * - Single point of authentication state
 * - Consistent configuration across app
 * - Memory efficient (one instance vs many)
 *
 * Usage:
 * -----
 * Import and use directly:
 *   import { apiService } from './api/apiService';
 *   const tasks = await apiService.getTasks();
 *
 * Do NOT create new instances:
 *   ❌ const api = new ApiService();  // Wrong!
 *   ✅ import { apiService } from './api/apiService';  // Correct!
 */
export const apiService = new ApiService();
