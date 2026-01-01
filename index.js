/**
 * Application Entry Point (index.js)
 *
 * This is the very first file that runs when the React Native app starts.
 * It registers the root component (App) with React Native's AppRegistry.
 *
 * Key Concepts:
 * - AppRegistry: The JS entry point to running all React Native apps
 * - Gesture Handler: Must be imported before anything else for proper touch handling
 * - Component Registration: Links JavaScript code to native platform
 *
 * @format - Indicates this file should be formatted with Prettier
 */

/**
 * React Native Gesture Handler Import
 *
 * IMPORTANT: This MUST be the first import in the file!
 *
 * react-native-gesture-handler provides native-driven gesture management.
 * Importing it first ensures it can properly override React Native's default
 * gesture system. This is crucial for:
 * - React Navigation drawer and swipe gestures
 * - Better touch response and performance
 * - Proper gesture cancellation and event handling
 *
 * Without this at the top, you may experience:
 * - Gesture conflicts
 * - Navigation issues
 * - Touch handling bugs on Android
 */
import 'react-native-gesture-handler';

/**
 * AppRegistry Import
 *
 * AppRegistry is the JavaScript entry point to running React Native applications.
 * It's the bridge between the native platform (iOS/Android) and your JavaScript code.
 *
 * Key methods:
 * - registerComponent(): Registers the root component of the app
 * - runApplication(): Starts the app (called by native code)
 */
import { AppRegistry } from 'react-native';

/**
 * Root App Component Import
 *
 * This is our main application component defined in App.tsx.
 * It contains the Redux Provider, Navigation, and all screen logic.
 */
import App from './App';

/**
 * App Name Import
 *
 * Imports the app name from app.json configuration file.
 * This name must match the name registered in native code:
 * - iOS: In AppDelegate.m
 * - Android: In MainActivity.java
 *
 * The app.json file contains metadata like:
 * - name: Internal module name
 * - displayName: Name shown on device home screen
 */
import { name as appName } from './app.json';

/**
 * Register Root Component
 *
 * This is the most critical line - it tells React Native which component
 * to use as the root of the application.
 *
 * How it works:
 * 1. Native platform starts the app
 * 2. Native code calls AppRegistry.runApplication(appName)
 * 3. AppRegistry looks up the registered component by name
 * 4. React Native renders the App component
 * 5. App component renders all children (navigation, screens, etc.)
 *
 * @param {string} appName - Name of the application (from app.json)
 * @param {Function} componentProvider - Function that returns the root component
 *
 * Note: The second parameter is a function, not the component directly.
 * This allows for lazy initialization and better performance.
 *
 * Flow: Native Platform → AppRegistry → App Component → Redux → Navigation → Screens
 */
AppRegistry.registerComponent(appName, () => App);
