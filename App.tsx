/**
 * Main Application Entry Point
 *
 * This is the root component of the React Native application.
 * It sets up the Redux store, navigation, and authentication flow.
 *
 * Key Concepts:
 * - React Native: Framework for building native mobile apps using React
 * - Redux: State management library for predictable state container
 * - React Navigation: Routing and navigation for React Native apps
 * - Redux Persist: Library to persist and rehydrate Redux store
 */

// React import - Core library for building UI components
import React, {useEffect} from 'react';

// React Navigation imports - For handling app navigation
import {NavigationContainer} from '@react-navigation/native'; // Container component that manages navigation tree
import {createNativeStackNavigator} from '@react-navigation/native-stack'; // Creates a stack-based navigation

// Redux imports - For global state management
import {Provider} from 'react-redux'; // Makes Redux store available to nested components
import {PersistGate} from 'redux-persist/integration/react'; // Delays rendering until persisted state is retrieved

// React Native core components
import {ActivityIndicator, View, StyleSheet} from 'react-native';
// ActivityIndicator: Loading spinner component
// View: Container component (like div in web)
// StyleSheet: API for creating optimized styles

// App-specific imports
import {store, persistor} from './src/redux/store'; // Redux store and persistor instance
import {useAppSelector} from './src/redux/hooks'; // Typed Redux selector hook
import {apiService} from './src/api/apiService'; // API service for HTTP requests
import {LoginScreen} from './src/screens/LoginScreen'; // Login screen component
import {RegisterScreen} from './src/screens/RegisterScreen'; // Registration screen component
import {OnboardingScreen} from './src/screens/OnboardingScreen'; // First-time user onboarding
import {HomeScreen} from './src/screens/HomeScreen'; // Main home screen after login

/**
 * Stack Navigator Instance
 *
 * Creates a stack navigator for managing screen transitions.
 * Stack navigation works like a browser's history - you can push and pop screens.
 */
const Stack = createNativeStackNavigator();

/**
 * Navigation Component
 *
 * Handles the navigation logic based on authentication state.
 * This component demonstrates conditional rendering of screens based on:
 * - Whether user has seen onboarding
 * - Whether user is authenticated
 *
 * @returns {JSX.Element} NavigationContainer with conditional screen stack
 */
const Navigation = () => {
  /**
   * Authentication state from Redux store
   *
   * useAppSelector is a typed version of useSelector from react-redux
   * It reads data from the Redux store and subscribes to updates
   *
   * @property {boolean} isAuthenticated - Whether user is logged in
   * @property {boolean} hasSeenOnboarding - Whether user has completed onboarding
   * @property {string|null} token - JWT token for API authentication
   */
  const {isAuthenticated, hasSeenOnboarding, token} = useAppSelector(state => state.auth);

  /**
   * Effect Hook: Set API Token
   *
   * useEffect runs side effects in functional components
   * This effect runs when 'token' changes and sets it in the API service
   *
   * Dependency array [token]: Effect runs only when token changes
   */
  useEffect(() => {
    if (token) {
      // Set authorization token for all API requests
      apiService.setToken(token);
    }
  }, [token]);

  return (
    /**
     * NavigationContainer
     *
     * Root component that manages the navigation tree and state.
     * All navigators must be wrapped in NavigationContainer.
     */
    <NavigationContainer>
      {/**
       * Stack Navigator
       *
       * screenOptions prop: Configuration applied to all screens
       * headerShown: false removes the default navigation header
       */}
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {/**
         * Conditional Navigation Flow
         *
         * This demonstrates React's conditional rendering:
         * 1. If hasn't seen onboarding -> Show Onboarding
         * 2. Else if authenticated -> Show Home
         * 3. Else -> Show Login/Register screens
         *
         * Each Stack.Screen represents a screen in the app
         */}
        {!hasSeenOnboarding ? (
          // First-time users see onboarding
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : isAuthenticated ? (
          // Authenticated users go directly to home
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          // Non-authenticated users see auth screens
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

/**
 * App Component
 *
 * Root component that wraps the app with necessary providers:
 * 1. Redux Provider - Makes store available to all components
 * 2. PersistGate - Delays rendering until persisted state is loaded
 *
 * @returns {JSX.Element} The complete app component tree
 */
const App = () => {
  return (
    /**
     * Redux Provider
     *
     * Makes the Redux store available to any nested components that need
     * to access the Redux store using useSelector or useDispatch.
     *
     * @prop {Store} store - The Redux store instance
     */
    <Provider store={store}>
      {/**
       * PersistGate
       *
       * Delays rendering of the app's UI until persisted state has been
       * retrieved and saved to Redux. This prevents flash of empty state.
       *
       * @prop {JSX.Element} loading - Component to show while loading persisted state
       * @prop {Persistor} persistor - Redux persist persistor instance
       */}
      <PersistGate
        loading={
          // Loading UI shown during state rehydration
          <View style={styles.loadingContainer}>
            {/**
             * ActivityIndicator
             *
             * Platform-specific loading spinner
             * @prop {string} size - "small" or "large"
             * @prop {string} color - Color of the spinner
             */}
            <ActivityIndicator size="large" color="#6C63FF" />
          </View>
        }
        persistor={persistor}>
        {/* Main navigation component */}
        <Navigation />
      </PersistGate>
    </Provider>
  );
};

/**
 * Styles
 *
 * StyleSheet.create() creates an optimized style object.
 * Benefits:
 * - Validates style properties
 * - Optimizes by sending styles through native bridge once
 * - Provides better performance than inline styles
 */
const styles = StyleSheet.create({
  /**
   * Loading Container Style
   *
   * Used for centering the loading spinner
   * @property {number} flex - Takes all available space (flexbox)
   * @property {string} justifyContent - Vertical centering
   * @property {string} alignItems - Horizontal centering
   * @property {string} backgroundColor - Background color
   */
  loadingContainer: {
    flex: 1, // Takes full height of parent
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
    backgroundColor: '#F8F9FA', // Light gray background
  },
});

// Export App as default export for use in index.js
export default App;
