/**
 * Authentication Redux Slice
 *
 * Manages all authentication-related state using Redux Toolkit.
 * This slice handles user login, registration, logout, and onboarding state.
 *
 * Redux Toolkit Concepts Used:
 * - createSlice: Simplifies reducer and action creation
 * - createAsyncThunk: Handles async operations (API calls)
 * - PayloadAction: Type-safe action with typed payload
 * - extraReducers: Handle actions created outside this slice (async thunks)
 */

// Redux Toolkit imports
import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
// createSlice: Creates reducer + action creators automatically
// createAsyncThunk: Creates async action creators (handles pending/fulfilled/rejected)
// PayloadAction: Generic type for actions with payload

// Type definitions for auth state and credentials
import {AuthState, LoginCredentials, RegisterCredentials, User} from '../../types';

// API service for making HTTP requests
import {apiService} from '../../api/apiService';

/**
 * Initial Authentication State
 *
 * Defines the default state when app first loads.
 * This will be overridden by persisted state if it exists.
 *
 * @property {User|null} user - Logged in user object or null
 * @property {string|null} token - JWT authentication token
 * @property {boolean} isAuthenticated - Whether user is logged in
 * @property {boolean} isLoading - Whether auth request is in progress
 * @property {string|null} error - Error message if auth fails
 * @property {boolean} hasSeenOnboarding - Whether user completed onboarding
 */
const initialState: AuthState = {
  user: null, // No user logged in initially
  token: null, // No auth token initially
  isAuthenticated: false, // User not authenticated
  isLoading: false, // No loading state
  error: null, // No errors
  hasSeenOnboarding: false, // User hasn't seen onboarding
};

/**
 * Login Async Thunk
 *
 * createAsyncThunk automatically creates three action types:
 * - 'auth/login/pending': When API call starts
 * - 'auth/login/fulfilled': When API call succeeds
 * - 'auth/login/rejected': When API call fails
 *
 * Benefits of async thunks:
 * - Automatic loading state management
 * - Type-safe error handling
 * - Standardized async flow
 *
 * @param {LoginCredentials} credentials - User's email and password
 * @param {ThunkAPI} thunkAPI - Provides rejectWithValue for error handling
 * @returns {Promise} Resolves with {user, token} or rejects with error message
 */
export const login = createAsyncThunk(
  'auth/login', // Action type prefix
  async (credentials: LoginCredentials, {rejectWithValue}) => {
    try {
      // Call API service to authenticate user
      const response = await apiService.login(credentials);
      // Response should contain { user: {...}, token: "..." }
      return response;
    } catch (error: any) {
      // rejectWithValue passes error to the rejected action payload
      // This allows us to set custom error messages in state
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  },
);

/**
 * Register Async Thunk
 *
 * Similar to login, handles user registration.
 * Creates new account and automatically logs user in.
 *
 * Async thunk lifecycle:
 * 1. Component dispatches: dispatch(register({ name, email, password }))
 * 2. Thunk triggers: 'register.pending' action
 * 3. API call is made
 * 4. On success: 'register.fulfilled' with response data
 *    On error: 'register.rejected' with error message
 *
 * @param {RegisterCredentials} credentials - Name, email, password
 * @param {ThunkAPI} thunkAPI - Thunk API with rejectWithValue
 * @returns {Promise} Resolves with {user, token} or rejects with error
 */
export const register = createAsyncThunk(
  'auth/register', // Action type prefix
  async (credentials: RegisterCredentials, {rejectWithValue}) => {
    try {
      // Create new user account via API
      const response = await apiService.register(credentials);
      return response;
    } catch (error: any) {
      // Handle registration errors (email exists, validation, etc.)
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed',
      );
    }
  },
);

/**
 * Authentication Slice
 *
 * createSlice automatically generates:
 * - Action creators for each reducer
 * - A reducer function that handles all actions
 * - Action types following the pattern: 'auth/actionName'
 *
 * This is much simpler than traditional Redux where you'd write
 * separate action types, action creators, and reducer functions.
 */
const authSlice = createSlice({
  name: 'auth', // Slice name - used as prefix for action types

  initialState, // Initial state defined above

  /**
   * Reducers
   *
   * These are synchronous actions that directly modify state.
   * Redux Toolkit uses Immer library, so we can "mutate" state directly.
   * Immer converts these mutations to immutable updates.
   *
   * Traditional Redux required: return { ...state, user: null }
   * With Redux Toolkit/Immer: state.user = null (looks like mutation)
   */
  reducers: {
    /**
     * Logout Action
     *
     * Clears all authentication data from state.
     * This is a synchronous action - no API call needed.
     *
     * Usage: dispatch(logout())
     *
     * @param {AuthState} state - Current auth state (Immer draft)
     */
    logout: state => {
      state.user = null; // Clear user data
      state.token = null; // Clear auth token
      state.isAuthenticated = false; // Mark as not authenticated
      state.error = null; // Clear any errors
      // Note: Token is also removed from API service in component
    },

    /**
     * Clear Error Action
     *
     * Removes error message from state.
     * Useful after showing error to user.
     *
     * Usage: dispatch(clearError())
     *
     * @param {AuthState} state - Current auth state
     */
    clearError: state => {
      state.error = null; // Reset error to null
    },

    /**
     * Complete Onboarding Action
     *
     * Marks onboarding as complete so user doesn't see it again.
     * This state is persisted so it survives app restarts.
     *
     * Usage: dispatch(completeOnboarding())
     *
     * @param {AuthState} state - Current auth state
     */
    completeOnboarding: state => {
      state.hasSeenOnboarding = true; // User has completed onboarding
    },
  },

  /**
   * Extra Reducers
   *
   * Handle actions created OUTSIDE this slice (async thunks).
   * Uses builder pattern for type-safe action handling.
   *
   * For each async thunk, we handle three cases:
   * - pending: Request started (show loading)
   * - fulfilled: Request succeeded (update data)
   * - rejected: Request failed (show error)
   */
  extraReducers: builder => {
    builder
      /**
       * Login Pending
       *
       * Triggered when login API call starts.
       * Set loading state and clear previous errors.
       */
      .addCase(login.pending, state => {
        state.isLoading = true; // Show loading indicator
        state.error = null; // Clear previous errors
      })

      /**
       * Login Fulfilled
       *
       * Triggered when login API call succeeds.
       * Store user data and token, mark as authenticated.
       *
       * @param {AuthState} state - Current state
       * @param {PayloadAction} action - Contains {user, token} payload
       */
      .addCase(
        login.fulfilled,
        (state, action: PayloadAction<{user: User; token: string}>) => {
          state.isLoading = false; // Hide loading indicator
          state.isAuthenticated = true; // User is now authenticated
          state.user = action.payload.user; // Store user data
          state.token = action.payload.token; // Store JWT token
          state.error = null; // Clear any errors
        },
      )

      /**
       * Login Rejected
       *
       * Triggered when login fails (wrong password, network error, etc.)
       * Store error message to show to user.
       *
       * @param {AuthState} state - Current state
       * @param {PayloadAction} action - Contains error message in payload
       */
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false; // Hide loading indicator
        state.error = action.payload as string; // Store error message
        // isAuthenticated stays false
      })

      /**
       * Register Pending
       *
       * Same as login.pending - show loading, clear errors
       */
      .addCase(register.pending, state => {
        state.isLoading = true;
        state.error = null;
      })

      /**
       * Register Fulfilled
       *
       * Same as login.fulfilled - registration also logs user in
       * No need for separate login after registration
       */
      .addCase(
        register.fulfilled,
        (state, action: PayloadAction<{user: User; token: string}>) => {
          state.isLoading = false;
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.error = null;
        },
      )

      /**
       * Register Rejected
       *
       * Handle registration errors (email already exists, etc.)
       */
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

/**
 * Export Action Creators
 *
 * These are automatically generated by createSlice.
 * Import and use them in components to dispatch actions.
 *
 * Example:
 * import { logout, clearError } from './authSlice';
 * dispatch(logout());
 */
export const {logout, clearError, completeOnboarding} = authSlice.actions;

/**
 * Export Reducer
 *
 * This is imported in store.ts and combined with other reducers.
 * The reducer function handles all auth actions and returns new state.
 */
export default authSlice.reducer;
