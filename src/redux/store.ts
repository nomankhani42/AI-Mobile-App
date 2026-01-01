/**
 * Redux Store Configuration
 *
 * This file sets up the Redux store with Redux Toolkit and Redux Persist.
 *
 * Key Concepts:
 * - Redux Store: Single source of truth for application state
 * - Redux Toolkit: Modern, opinionated Redux toolset (reduces boilerplate)
 * - Redux Persist: Saves Redux state to AsyncStorage and rehydrates on app start
 * - Reducers: Pure functions that specify how state changes
 */

// Redux Toolkit imports
import {configureStore, combineReducers} from '@reduxjs/toolkit';
// configureStore: Simplified store setup with good defaults
// combineReducers: Combines multiple reducer functions into one

// Redux Persist imports
import {
  persistStore, // Creates a persistor object
  persistReducer, // Enhances reducer with persistence capabilities
  FLUSH, // Action type: Flush pending state to storage
  REHYDRATE, // Action type: Restore persisted state
  PAUSE, // Action type: Pause persistence
  PERSIST, // Action type: Start persistence
  PURGE, // Action type: Clear persisted state
  REGISTER, // Action type: Register reducer
} from 'redux-persist';

// AsyncStorage - React Native's persistent key-value storage system
// Similar to localStorage in web, but asynchronous
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import reducers from slices
// Each slice manages a specific domain of the app state
import authReducer from './slices/authSlice'; // Authentication state (user, token, etc.)
import chatReducer from './slices/chatSlice'; // Chat messages state
import tasksReducer from './slices/tasksSlice'; // Tasks/todos state

/**
 * Persist Configuration
 *
 * Defines how Redux state should be persisted to storage
 *
 * @property {string} key - Key for the persisted state in AsyncStorage
 * @property {Storage} storage - Storage engine (AsyncStorage for React Native)
 * @property {string[]} whitelist - Array of reducer keys to persist
 *                                  Only listed reducers will be saved
 */
const persistConfig = {
  key: 'root', // Root key in AsyncStorage
  storage: AsyncStorage, // Use React Native's AsyncStorage
  whitelist: ['auth', 'chat', 'tasks'], // Only persist these reducers
  // Note: blacklist could be used to exclude specific reducers
};

/**
 * Root Reducer
 *
 * Combines all slice reducers into a single root reducer.
 * Each key becomes a top-level key in the state object.
 *
 * State shape will be: { auth: {...}, chat: {...}, tasks: {...} }
 */
const rootReducer = combineReducers({
  auth: authReducer, // Handles: login, logout, token, user info
  chat: chatReducer, // Handles: messages, chat state
  tasks: tasksReducer, // Handles: task list, add/edit/delete tasks
});

/**
 * Persisted Reducer
 *
 * Wraps the root reducer with persistence functionality.
 * This enhanced reducer will automatically:
 * - Save state changes to AsyncStorage
 * - Load persisted state on app startup
 */
const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * Redux Store
 *
 * The store holds the complete state tree of the application.
 * The only way to change state is by dispatching actions.
 *
 * configureStore automatically includes:
 * - Redux DevTools extension support
 * - Redux Thunk middleware (for async actions)
 * - Development mode checks for common mistakes
 */
export const store = configureStore({
  reducer: persistedReducer, // Use the persistence-enhanced reducer

  /**
   * Middleware Configuration
   *
   * Middleware provides extension point between dispatching an action
   * and the moment it reaches the reducer.
   *
   * getDefaultMiddleware: Returns Redux Toolkit's default middleware
   */
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      /**
       * Serializable Check Configuration
       *
       * Redux requires state and actions to be serializable (can be converted to JSON).
       * Redux Persist actions contain non-serializable values, so we ignore them.
       *
       * ignoredActions: Array of action types to skip serialization check
       */
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        // These are internal redux-persist actions that use non-serializable values
      },
    }),
});

/**
 * Persistor
 *
 * Creates a persistor object that controls the persistence.
 * Used with PersistGate component to delay rendering until
 * rehydration is complete.
 */
export const persistor = persistStore(store);

/**
 * Type Definitions
 *
 * These types enable TypeScript support for Redux hooks
 */

/**
 * RootState Type
 *
 * Infers the complete state shape from the store.
 * Used with useSelector to provide type safety.
 *
 * Usage: const user = useSelector((state: RootState) => state.auth.user)
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * AppDispatch Type
 *
 * Infers the dispatch type from the store.
 * Used with useDispatch to support thunks and type safety.
 *
 * Usage: const dispatch: AppDispatch = useDispatch()
 */
export type AppDispatch = typeof store.dispatch;
