/**
 * LoginScreen.tsx
 *
 * Purpose:
 * Authentication screen that handles user login with email and password.
 * Features real-time email validation, inline error feedback, and optimized
 * form handling with Formik. Demonstrates best practices for authentication
 * flows in React Native applications.
 *
 * Key Features:
 * - Real-time email existence checking with debounced API calls
 * - Formik-based form management with Yup validation
 * - Inline error display (no alerts/modals)
 * - Optimistic UI updates with visual feedback
 * - Cross-platform keyboard handling
 * - Redux state management for authentication
 *
 * Learning Focus:
 * - React Navigation integration
 * - Redux Toolkit async actions (login thunk)
 * - Form validation patterns
 * - Debounced input handling
 * - Platform-specific keyboard behavior
 * - TypeScript with React Native
 */

import React, {useEffect, useState, useMemo} from 'react';

/**
 * React Native Core Components
 *
 * View: Container component for layout
 * Text: Display text content
 * TextInput: Input field for user data entry
 * TouchableOpacity: Pressable component with opacity feedback
 * StyleSheet: Optimized styling API
 * ActivityIndicator: Loading spinner
 * KeyboardAvoidingView: Adjusts view position when keyboard appears
 * Platform: Access platform-specific values (iOS vs Android)
 * ScrollView: Scrollable container
 * Alert: Native alert dialogs (minimal usage in this screen)
 */
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';

/**
 * Formik: Form management library
 * - Handles form state, validation, and submission
 * - Reduces boilerplate for form handling
 * - Integrates with Yup for schema validation
 */
import {Formik} from 'formik';

/**
 * Yup: Schema validation library
 * - Defines validation rules declaratively
 * - Works seamlessly with Formik
 * - Provides clear error messages
 */
import * as Yup from 'yup';

/**
 * Redux Typed Hooks
 *
 * useAppDispatch: Typed version of useDispatch for dispatching actions
 * useAppSelector: Typed version of useSelector for reading state
 *
 * These hooks provide TypeScript autocomplete and type checking
 */
import {useAppDispatch, useAppSelector} from '../redux/hooks';

/**
 * Redux Actions
 *
 * login: Async thunk action that authenticates user with backend
 * clearError: Action to clear authentication errors from state
 */
import {login, clearError} from '../redux/slices/authSlice';

/**
 * Custom Hooks
 *
 * useDebounce: Delays API calls until user stops typing
 * - Reduces unnecessary network requests
 * - Improves performance and UX
 */
import {useDebounce} from '../hooks/useDebounce';

/**
 * API Service
 *
 * apiService: Centralized API client
 * - Handles HTTP requests to backend
 * - Provides type-safe API methods
 */
import {apiService} from '../api/apiService';

/**
 * Validation Schema
 *
 * Defines validation rules for login form using Yup.
 * - Email must be valid format and required
 * - Password must be at least 6 characters and required
 *
 * Formik automatically applies these rules and shows errors
 */
const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

/**
 * Component Props Interface
 *
 * Defines the props that LoginScreen receives from React Navigation.
 * Navigation prop is typed as 'any' for simplicity, but could be strongly
 * typed using NavigationProp from @react-navigation/native
 */
interface LoginScreenProps {
  navigation: any;
}

/**
 * LoginScreen Component
 *
 * Main authentication screen for existing users to log in.
 *
 * State Management:
 * - Local state for form fields and UI feedback
 * - Redux state for authentication status (isLoading, error)
 * - Formik state for form validation
 *
 * Performance Optimizations:
 * - useMemo for expensive calculations (button disabled state)
 * - Debounced email checking to reduce API calls
 * - Optimistic UI updates with visual feedback
 *
 * Navigation:
 * - Receives navigation prop from React Navigation stack
 * - Navigates to Register screen when user wants to sign up
 * - Auto-redirects to Home after successful login (handled by navigation config)
 */
export const LoginScreen: React.FC<LoginScreenProps> = ({navigation}) => {
  /**
   * Redux Integration
   *
   * useAppDispatch: Get dispatch function to trigger Redux actions
   * - Used to dispatch login action and clearError action
   *
   * useAppSelector: Select data from Redux store
   * - isLoading: Shows when login request is in progress
   * - error: Contains error message from failed login attempts
   *
   * This pattern separates concerns: local state for UI, Redux for API state
   */
  const dispatch = useAppDispatch();
  const {isLoading, error} = useAppSelector(state => state.auth);

  /**
   * Local State Management
   *
   * email: Tracks email input for debounced API check
   * - Separate from Formik value to enable debouncing
   *
   * emailCheckMessage: Feedback message for email validation
   * - Shows if email exists in database
   * - Provides real-time feedback before form submission
   *
   * isCheckingEmail: Loading state for email check API call
   * - Shows spinner while checking email
   *
   * loginError: Field-specific errors from login attempt
   * - Displayed inline below respective input fields
   * - Better UX than alert modals
   *
   * debouncedEmail: Delayed email value for API calls
   * - Prevents API call on every keystroke
   * - Waits 800ms after user stops typing
   */
  const [email, setEmail] = useState('');
  const [emailCheckMessage, setEmailCheckMessage] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [loginError, setLoginError] = useState<{email?: string; password?: string}>({});
  const debouncedEmail = useDebounce(email, 800);

  /**
   * Email Existence Check Effect
   *
   * Purpose: Verify if email is registered before form submission
   *
   * Dependencies: [debouncedEmail]
   * - Runs when user stops typing for 800ms
   *
   * Flow:
   * 1. Validates email format (must contain @)
   * 2. Sets loading state
   * 3. Calls API to check if email exists
   * 4. Shows warning if email not found
   * 5. Clears message if email exists
   *
   * Error Handling:
   * - Silently fails (logs error, clears message)
   * - Doesn't block login attempt
   *
   * This provides early feedback without being intrusive
   */
  useEffect(() => {
    const checkEmailExists = async () => {
      if (!debouncedEmail || !debouncedEmail.includes('@')) {
        setEmailCheckMessage('');
        return;
      }

      setIsCheckingEmail(true);
      try {
        const result = await apiService.checkEmail(debouncedEmail);
        if (!result.exists) {
          setEmailCheckMessage('⚠️ Email not registered. Please sign up first.');
        } else {
          setEmailCheckMessage('');
        }
      } catch (error) {
        console.error('Email check failed:', error);
        setEmailCheckMessage('');
      } finally {
        setIsCheckingEmail(false);
      }
    };

    checkEmailExists();
  }, [debouncedEmail]);

  /**
   * Redux Error Handler Effect
   *
   * Purpose: Convert Redux errors to inline field errors
   *
   * Dependencies: [error, dispatch]
   * - Runs when error state changes in Redux
   *
   * Flow:
   * 1. Check if error exists
   * 2. Parse error message to determine which field failed
   * 3. Set appropriate inline error message
   * 4. Clear error from Redux state
   *
   * Error Classification:
   * - Email errors: "email", "not found"
   * - Password errors: "password", "incorrect"
   * - Default: Show as password error (security best practice)
   *
   * UX Note: Inline errors are better than alerts because:
   * - Users can see error while fixing it
   * - No modal dismissal required
   * - Clearer which field has the issue
   */
  React.useEffect(() => {
    if (error) {
      console.error('[LoginScreen] Auth error:', error);
      // Parse error and set inline error message
      const errorMessage = error.toLowerCase();
      if (errorMessage.includes('email') || errorMessage.includes('not found')) {
        setLoginError({ email: '❌ Email not found. Please check your email.' });
      } else if (errorMessage.includes('password') || errorMessage.includes('incorrect')) {
        setLoginError({ password: '❌ Incorrect password. Please try again.' });
      } else {
        // Default to password error for generic login failures
        setLoginError({ password: '❌ Invalid password. Please try again.' });
      }
      dispatch(clearError());
    }
  }, [error, dispatch]);

  /**
   * Login Handler
   *
   * Purpose: Process login form submission
   *
   * Parameters:
   * - values: Formik form values {email, password}
   *
   * Flow:
   * 1. Clear previous errors
   * 2. Dispatch login async thunk action
   * 3. Wait for response (unwrap throws on rejection)
   * 4. On success: Redux updates auth state, navigation redirects automatically
   * 5. On failure: Parse error and show inline message
   *
   * Error Parsing Strategy:
   * - Check error message for keywords
   * - Route to appropriate field error
   * - Default to password field (security: don't reveal if email exists)
   *
   * async/await Pattern:
   * - Easier to read than promise chains
   * - try/catch for error handling
   * - unwrap() converts rejected thunk to thrown error
   */
  const handleLogin = async (values: {email: string; password: string}) => {
    console.log('🔵 Login button pressed');
    console.log('📧 Email:', values.email);
    console.log('🌐 Will call API...');

    // Clear previous login errors
    setLoginError({});

    try {
      await dispatch(login(values)).unwrap();
    } catch (err: any) {
      console.error('❌ Login failed:', err);

      // Parse error message and set appropriate field errors
      const errorMessage = err?.message || err?.toString() || 'Login failed';

      // Check for specific error types
      if (errorMessage.toLowerCase().includes('email') ||
          errorMessage.toLowerCase().includes('not found') ||
          errorMessage.toLowerCase().includes('not registered') ||
          errorMessage.toLowerCase().includes('user not found')) {
        setLoginError({
          email: '❌ This email is not registered. Please sign up first.',
        });
      } else if (errorMessage.toLowerCase().includes('password') ||
                 errorMessage.toLowerCase().includes('incorrect') ||
                 errorMessage.toLowerCase().includes('invalid credentials') ||
                 errorMessage.toLowerCase().includes('authentication failed')) {
        setLoginError({
          password: '❌ Incorrect password. Please try again.',
        });
      } else if (errorMessage.toLowerCase().includes('credential')) {
        setLoginError({
          password: '❌ Invalid password. Please try again.',
        });
      } else {
        // Generic error - show as password error instead of modal
        setLoginError({
          password: '❌ Invalid password. Please try again.',
        });
      }
    }
  };

  /**
   * Render Method - Component Layout
   *
   * Layout Structure:
   * 1. KeyboardAvoidingView: Root container handling keyboard
   * 2. ScrollView: Scrollable content area
   * 3. Hero Section: App branding and logo
   * 4. Welcome Section: Screen title and description
   * 5. Formik Form: Email and password inputs with validation
   *
   * Keyboard Handling:
   * - iOS: Uses 'padding' behavior (adjusts padding when keyboard appears)
   * - Android: Uses 'height' behavior (adjusts height when keyboard appears)
   * - keyboardShouldPersistTaps="handled": Allows tapping outside to dismiss keyboard
   *
   * Platform-Specific Behavior:
   * - Platform.OS checks ensure proper keyboard behavior per platform
   * - iOS and Android handle keyboard differently
   */
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.gradientBackground}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Hero Section: App branding with logo and tagline */}
            <View style={styles.hero}>
              <View style={styles.logoContainer}>
                <View style={styles.logoGlow} />
                <Text style={styles.logo}>✓</Text>
              </View>
              <Text style={styles.appName}>TaskMaster</Text>
              <Text style={styles.tagline}>AI-Powered Task Management</Text>
            </View>

            {/* Welcome Section: Screen context for user */}
            <View style={styles.welcomeSection}>
              <Text style={styles.title}>Welcome Back!</Text>
              <Text style={styles.subtitle}>
                Sign in to manage your tasks with AI assistance
              </Text>
            </View>

            {/**
             * Formik Form Component
             *
             * Formik manages all form state automatically:
             * - values: Current form field values
             * - errors: Validation errors from Yup schema
             * - touched: Tracks which fields have been interacted with
             * - handleChange: Updates field values
             * - handleBlur: Marks field as touched
             * - handleSubmit: Triggers form submission
             *
             * initialValues: Starting state for form
             * validationSchema: Yup schema for validation
             * onSubmit: Handler called when form is valid and submitted
             *
             * Validation Strategy:
             * - Validates on blur (when user leaves field)
             * - Shows errors only after field is touched
             * - Prevents submission if validation fails
             */}
            <Formik
              initialValues={{email: '', password: ''}}
              validationSchema={loginSchema}
              onSubmit={handleLogin}>
              {({handleChange, handleBlur, handleSubmit, values, errors, touched, isValid}) => {
                /**
                 * Performance Optimization: useMemo
                 *
                 * Problem: Button disabled calculation is complex and runs on every render
                 * Solution: Memoize the calculation to only run when dependencies change
                 *
                 * Button Disabled Logic:
                 * - Disabled if loading
                 * - Disabled if any validation errors exist
                 * - Disabled if any API check errors exist
                 * - Disabled if form is empty
                 *
                 * Dependencies: All values used in calculation
                 * - If any dependency changes, recalculate
                 * - Otherwise, use cached value
                 */
                const isButtonDisabled = useMemo(() => {
                  const hasEmailError = Boolean((touched.email && errors.email) || loginError.email || emailCheckMessage);
                  const hasPasswordError = Boolean((touched.password && errors.password) || loginError.password);
                  const isFormEmpty = !values.email || !values.password;
                  return Boolean(isLoading || hasEmailError || hasPasswordError || isFormEmpty);
                }, [touched.email, errors.email, loginError.email, emailCheckMessage, touched.password, errors.password, loginError.password, values.email, values.password, isLoading]);

                // Helper variables for error state (used for styling)
                const hasEmailError = Boolean((touched.email && errors.email) || loginError.email || emailCheckMessage);
                const hasPasswordError = Boolean((touched.password && errors.password) || loginError.password);

                return (
                <View style={styles.form}>
                  {/**
                   * Email Input Field
                   *
                   * Features:
                   * - Real-time validation with visual feedback
                   * - Loading indicator during email check
                   * - Success checkmark when email is valid
                   * - Dynamic styling based on validation state
                   *
                   * Visual States:
                   * - Default: Gray border
                   * - Error: Red border (validation failed or login error)
                   * - Warning: Orange border (email not found)
                   * - Success: Green border with checkmark
                   *
                   * TextInput Props:
                   * - autoCapitalize="none": Prevent auto-capitalization for emails
                   * - keyboardType="email-address": Show email keyboard
                   * - editable: Disable during loading to prevent changes
                   *
                   * onChangeText Logic:
                   * 1. Update Formik value (for validation)
                   * 2. Update local state (for debounced check)
                   * 3. Clear previous errors (fresh validation)
                   *
                   * Error Display Priority:
                   * 1. Formik validation errors (format issues)
                   * 2. Email check warnings (not registered)
                   * 3. Login errors (authentication failed)
                   */}
                  <View style={styles.inputContainer}>
                    <View style={styles.labelRow}>
                      <Text style={styles.inputLabel}>Email</Text>
                      {/* Show loading spinner while checking email */}
                      {isCheckingEmail && (
                        <ActivityIndicator size="small" color="#6C63FF" />
                      )}
                      {/* Show success checkmark when email is valid */}
                      {!isCheckingEmail && values.email && !errors.email && !emailCheckMessage && !loginError.email && values.email.includes('@') && (
                        <Text style={styles.successIndicator}>✓</Text>
                      )}
                    </View>
                    <TextInput
                      style={[
                        styles.input,
                        touched.email && errors.email && styles.inputError,
                        emailCheckMessage && styles.inputWarning,
                        loginError.email && styles.inputError,
                        !isCheckingEmail && values.email && !errors.email && !emailCheckMessage && !loginError.email && values.email.includes('@') && styles.inputSuccess,
                      ]}
                      placeholder="Enter your email"
                      placeholderTextColor="#95A5A6"
                      value={values.email}
                      onChangeText={(text) => {
                        handleChange('email')(text);
                        setEmail(text);
                        // Clear login error when user starts typing
                        if (loginError.email) {
                          setLoginError(prev => ({...prev, email: undefined}));
                        }
                      }}
                      onBlur={handleBlur('email')}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!isLoading}
                    />
                    {/* Conditional error/warning message display */}
                    {touched.email && errors.email && (
                      <Text style={styles.errorText}>{errors.email}</Text>
                    )}
                    {emailCheckMessage && !errors.email && !loginError.email && (
                      <Text style={styles.warningText}>{emailCheckMessage}</Text>
                    )}
                    {loginError.email && (
                      <Text style={styles.errorText}>{loginError.email}</Text>
                    )}
                  </View>

                  {/**
                   * Password Input Field
                   *
                   * Features:
                   * - Secure text entry (hides characters)
                   * - Success indicator when meets minimum length
                   * - Dynamic border color based on state
                   *
                   * TextInput Props:
                   * - secureTextEntry: Hides password characters
                   * - editable: Disabled during login request
                   *
                   * Validation:
                   * - Minimum 6 characters (enforced by Yup schema)
                   * - Shows error only after field is touched
                   *
                   * Error Clearing:
                   * - Clears previous login errors when user types
                   * - Provides fresh start for each attempt
                   */}
                  <View style={styles.inputContainer}>
                    <View style={styles.labelRow}>
                      <Text style={styles.inputLabel}>Password</Text>
                      {/* Success indicator when password meets requirements */}
                      {values.password && !errors.password && !loginError.password && values.password.length >= 6 && (
                        <Text style={styles.successIndicator}>✓</Text>
                      )}
                    </View>
                    <TextInput
                      style={[
                        styles.input,
                        touched.password && errors.password && styles.inputError,
                        loginError.password && styles.inputError,
                        values.password && !errors.password && !loginError.password && values.password.length >= 6 && styles.inputSuccess,
                      ]}
                      placeholder="Enter your password"
                      placeholderTextColor="#95A5A6"
                      value={values.password}
                      onChangeText={(text) => {
                        handleChange('password')(text);
                        // Clear login error when user starts typing
                        if (loginError.password) {
                          setLoginError(prev => ({...prev, password: undefined}));
                        }
                      }}
                      onBlur={handleBlur('password')}
                      secureTextEntry
                      editable={!isLoading}
                    />
                    {/* Conditional error message display */}
                    {touched.password && errors.password && (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    )}
                    {loginError.password && (
                      <Text style={styles.errorText}>{loginError.password}</Text>
                    )}
                  </View>

                  {/**
                   * Submit Button
                   *
                   * Button States:
                   * - Enabled: Form is valid and not loading
                   * - Disabled: Has errors, loading, or form incomplete
                   * - Loading: Shows spinner during API call
                   *
                   * TouchableOpacity Props:
                   * - disabled: Prevents interaction when button is disabled
                   * - activeOpacity: Controls opacity on press (1 = no change when disabled)
                   * - onPress: Guard check ensures no action when disabled
                   *
                   * Visual Feedback:
                   * - Opacity reduces when disabled
                   * - Spinner replaces text during loading
                   * - Arrow icon for visual direction
                   *
                   * Accessibility:
                   * - Disabled state prevents accidental submissions
                   * - Loading state indicates progress
                   */}
                  <TouchableOpacity
                    style={[
                      styles.button,
                      isButtonDisabled && styles.buttonDisabled
                    ]}
                    onPress={() => !isButtonDisabled && handleSubmit()}
                    disabled={isButtonDisabled}
                    activeOpacity={isButtonDisabled ? 1 : 0.7}>
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <View style={styles.buttonContent}>
                        <Text style={styles.buttonText}>Sign In</Text>
                        <Text style={styles.buttonIcon}>→</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/**
                   * Navigation Link to Register Screen
                   *
                   * React Navigation Usage:
                   * - navigation.navigate('Register'): Pushes Register screen onto stack
                   * - Route name must match the name defined in navigation stack
                   *
                   * Disabled During Loading:
                   * - Prevents navigation while login is in progress
                   * - Ensures user completes current action first
                   *
                   * This demonstrates basic React Navigation stack navigation pattern
                   */}
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => navigation.navigate('Register')}
                    disabled={isLoading}>
                    <Text style={styles.linkText}>
                      Don't have an account? <Text style={styles.linkTextBold}>Sign up</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
                );
              }}
            </Formik>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

/**
 * StyleSheet
 *
 * React Native's optimized way to define styles.
 * - Styles are converted to native code for better performance
 * - Type checking in TypeScript
 * - Autocomplete support in IDE
 *
 * Layout Patterns:
 * - container: flex: 1 fills available space
 * - ScrollView contentContainerStyle: Controls scroll area styling
 * - KeyboardAvoidingView: Adjusts for keyboard automatically
 *
 * Styling Techniques:
 * - Shadow props: iOS uses shadowColor/shadowOffset/etc
 * - elevation: Android uses elevation for shadows
 * - borderRadius: Rounded corners for modern UI
 * - Dynamic styles: Applied based on state (inputError, inputSuccess)
 *
 * Color Palette:
 * - Primary: #6C63FF (purple/blue brand color)
 * - Error: #F44336 (red for errors)
 * - Warning: #FF9800 (orange for warnings)
 * - Success: #4CAF50 (green for validation success)
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  gradientBackground: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  content: {
    padding: 24,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    shadowColor: '#6C63FF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  logoGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: '#6C63FF',
    opacity: 0.2,
    transform: [{scale: 1.3}],
  },
  logo: {
    fontSize: 52,
    color: '#FFF',
    fontWeight: 'bold',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    color: '#7F8C8D',
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  welcomeSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    lineHeight: 24,
    textAlign: 'left',
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    color: '#2C3E50',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: '#F44336',
    borderWidth: 1.5,
  },
  inputWarning: {
    borderColor: '#FF9800',
    borderWidth: 1.5,
  },
  inputSuccess: {
    borderColor: '#4CAF50',
    borderWidth: 1.5,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successIndicator: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#F44336',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  warningText: {
    color: '#FF9800',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#6C63FF',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  linkButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  linkText: {
    color: '#7F8C8D',
    fontSize: 15,
    fontWeight: '500',
  },
  linkTextBold: {
    color: '#6C63FF',
    fontWeight: '700',
  },
});
