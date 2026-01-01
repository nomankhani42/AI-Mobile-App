/**
 * RegisterScreen.tsx
 *
 * Purpose:
 * User registration screen for creating new accounts with email and password.
 * Implements comprehensive form validation, real-time email availability checking,
 * and strong password requirements for security.
 *
 * Key Features:
 * - Three-field registration form (email, password, confirm password)
 * - Real-time email availability checking with debounced API calls
 * - Strong password validation (12+ chars, uppercase, lowercase, number)
 * - Password confirmation matching
 * - Inline error feedback with visual indicators
 * - Feature showcase section (AI Assistant, Smart Priority, Voice Input)
 * - Cross-platform keyboard handling
 *
 * Security Features:
 * - Password strength requirements enforced client and server-side
 * - Email uniqueness verification before submission
 * - No password hints shown (security best practice)
 *
 * Learning Focus:
 * - Advanced Formik usage with multiple fields
 * - Complex Yup validation schemas (regex, field matching)
 * - Debounced API calls for UX optimization
 * - Password strength validation patterns
 * - Multi-step form validation feedback
 */

import React, {useState, useEffect, useMemo} from 'react';

/**
 * React Native Core Components
 * Same as LoginScreen but without Alert (uses inline errors exclusively)
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
} from 'react-native';

/**
 * Form Management Libraries
 * Formik + Yup for declarative form handling and validation
 */
import {Formik} from 'formik';
import * as Yup from 'yup';

/**
 * Redux Typed Hooks
 * Type-safe Redux integration for TypeScript
 */
import {useAppDispatch, useAppSelector} from '../redux/hooks';

/**
 * Redux Actions
 * register: Async thunk for user registration API call
 * clearError: Clears errors from Redux state
 */
import {register, clearError} from '../redux/slices/authSlice';

/**
 * Custom Hooks
 * useDebounce: Delays execution until user stops typing (800ms delay)
 */
import {useDebounce} from '../hooks/useDebounce';

/**
 * API Service
 * Centralized API client for backend communication
 */
import {apiService} from '../api/apiService';

/**
 * Validation Schema
 *
 * Advanced Yup schema with multiple validation rules:
 *
 * Email:
 * - Must be valid email format
 * - Required field
 *
 * Password:
 * - Minimum 12 characters (stronger than login's 6)
 * - Regex pattern requires:
 *   - At least one lowercase letter (?=.*[a-z])
 *   - At least one uppercase letter (?=.*[A-Z])
 *   - At least one digit (?=.*\d)
 * - Required field
 *
 * Confirm Password:
 * - Must match password field (using Yup.ref)
 * - oneOf enforces exact match
 * - Required field
 *
 * Yup.ref Usage:
 * - Yup.ref('password') creates reference to password field value
 * - Automatically validates when either field changes
 */
const registerSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(12, 'Password must be at least 12 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

/**
 * Component Props Interface
 */
interface RegisterScreenProps {
  navigation: any;
}

/**
 * RegisterScreen Component
 *
 * New user registration flow with comprehensive validation.
 *
 * State Management Pattern:
 * - Local state: UI feedback, form inputs, email checking
 * - Redux state: Authentication status, API errors
 * - Formik state: Form values, validation errors, touched fields
 *
 * Email Availability Check:
 * - Debounced to prevent excessive API calls
 * - Shows warning if email is already registered
 * - Encourages user to login instead
 *
 * Password Requirements:
 * - Stricter than login (12 vs 6 characters)
 * - Requires character diversity for security
 * - Visual hint displayed below password field
 *
 * Navigation After Registration:
 * - Successful registration auto-logs user in
 * - Navigation stack automatically redirects to Home
 */
export const RegisterScreen: React.FC<RegisterScreenProps> = ({navigation}) => {
  /**
   * Redux Integration
   * Same pattern as LoginScreen
   */
  const dispatch = useAppDispatch();
  const {isLoading, error} = useAppSelector(state => state.auth);

  /**
   * Local State Management
   *
   * email: For debounced email availability check
   * emailCheckMessage: Shows if email is taken or available
   * isCheckingEmail: Loading state for email check
   * registerError: Field-specific registration errors
   * debouncedEmail: Triggers check 800ms after user stops typing
   */
  const [email, setEmail] = useState('');
  const [emailCheckMessage, setEmailCheckMessage] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [registerError, setRegisterError] = useState<{email?: string; password?: string}>({});
  const debouncedEmail = useDebounce(email, 800);

  /**
   * Email Uniqueness Check Effect
   *
   * Purpose: Verify email is not already registered
   *
   * Difference from LoginScreen:
   * - Opposite logic: warns if email EXISTS (not available)
   * - Shows success message if email is available
   * - Encourages switching to login if already registered
   */
  useEffect(() => {
    const checkEmailUnique = async () => {
      if (!debouncedEmail || !debouncedEmail.includes('@')) {
        setEmailCheckMessage('');
        return;
      }

      setIsCheckingEmail(true);
      try {
        const result = await apiService.checkEmail(debouncedEmail);
        if (result.exists) {
          setEmailCheckMessage('⚠️ Email already registered. Please login instead.');
        } else {
          setEmailCheckMessage('✓ Email available');
        }
      } catch (error) {
        console.error('Email check failed:', error);
        setEmailCheckMessage('');
      } finally {
        setIsCheckingEmail(false);
      }
    };

    checkEmailUnique();
  }, [debouncedEmail]);

  // Handle errors from Redux state - convert to inline errors instead of alerts
  React.useEffect(() => {
    if (error) {
      console.error('[RegisterScreen] Auth error:', error);
      // Parse error and set inline error message
      const errorMessage = error.toLowerCase();
      if (errorMessage.includes('email') ||
          errorMessage.includes('already exists') ||
          errorMessage.includes('already registered') ||
          errorMessage.includes('duplicate')) {
        setRegisterError({ email: '❌ Email already registered. Please login instead.' });
      } else if (errorMessage.includes('password') ||
                 errorMessage.includes('weak') ||
                 errorMessage.includes('strength') ||
                 errorMessage.includes('uppercase') ||
                 errorMessage.includes('lowercase') ||
                 errorMessage.includes('number') ||
                 errorMessage.includes('characters')) {
        setRegisterError({ password: '❌ Password does not meet requirements.' });
      } else {
        setRegisterError({ email: `❌ ${error}` });
      }
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleRegister = async (values: {
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    // Clear previous registration errors
    setRegisterError({});

    try {
      await dispatch(register({email: values.email, password: values.password})).unwrap();
    } catch (err: any) {
      console.error('Registration failed:', err);

      // Parse error message and set appropriate field errors
      const errorMessage = err?.message || err?.toString() || 'Registration failed';

      // Check for specific error types
      if (errorMessage.toLowerCase().includes('email') ||
          errorMessage.toLowerCase().includes('already exists') ||
          errorMessage.toLowerCase().includes('already registered') ||
          errorMessage.toLowerCase().includes('duplicate')) {
        setRegisterError({
          email: '❌ This email is already registered. Please login instead.',
        });
      } else if (errorMessage.toLowerCase().includes('password') ||
                 errorMessage.toLowerCase().includes('weak') ||
                 errorMessage.toLowerCase().includes('strength') ||
                 errorMessage.toLowerCase().includes('uppercase') ||
                 errorMessage.toLowerCase().includes('lowercase') ||
                 errorMessage.toLowerCase().includes('number') ||
                 errorMessage.toLowerCase().includes('characters')) {
        setRegisterError({
          password: '❌ Password does not meet security requirements.',
        });
      } else {
        // Generic error - show inline instead of modal
        setRegisterError({
          email: `❌ ${errorMessage}`,
        });
      }
    }
  };

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
            {/* Hero Section */}
            <View style={styles.hero}>
              <View style={styles.logoContainer}>
                <View style={styles.logoGlow} />
                <Text style={styles.logo}>✓</Text>
              </View>
              <Text style={styles.appName}>TaskMaster</Text>
              <Text style={styles.tagline}>AI-Powered Task Management</Text>
            </View>

            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join thousands of users managing tasks smarter with AI
              </Text>
            </View>

            {/* Features */}
            <View style={styles.features}>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>🤖</Text>
                <Text style={styles.featureText}>AI Assistant</Text>
              </View>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>📊</Text>
                <Text style={styles.featureText}>Smart Priority</Text>
              </View>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>⚡</Text>
                <Text style={styles.featureText}>Voice Input</Text>
              </View>
            </View>

            {/* Form with Formik */}
            <Formik
              initialValues={{email: '', password: '', confirmPassword: ''}}
              validationSchema={registerSchema}
              onSubmit={handleRegister}>
              {({handleChange, handleBlur, handleSubmit, values, errors, touched, isValid}) => {
                // Memoize error checks to prevent unnecessary re-renders
                const isButtonDisabled = useMemo(() => {
                  const hasEmailError = Boolean((touched.email && errors.email) || registerError.email || (emailCheckMessage && emailCheckMessage.includes('⚠️')));
                  const hasPasswordError = Boolean((touched.password && errors.password) || registerError.password);
                  const hasConfirmPasswordError = Boolean(touched.confirmPassword && errors.confirmPassword);
                  const isFormEmpty = !values.email || !values.password || !values.confirmPassword;
                  return Boolean(isLoading || hasEmailError || hasPasswordError || hasConfirmPasswordError || isFormEmpty);
                }, [touched.email, errors.email, registerError.email, emailCheckMessage, touched.password, errors.password, registerError.password, touched.confirmPassword, errors.confirmPassword, values.email, values.password, values.confirmPassword, isLoading]);

                const hasEmailError = Boolean((touched.email && errors.email) || registerError.email || (emailCheckMessage && emailCheckMessage.includes('⚠️')));
                const hasPasswordError = Boolean((touched.password && errors.password) || registerError.password);

                return (
                <View style={styles.form}>
                  <View style={styles.inputContainer}>
                    <View style={styles.labelRow}>
                      <Text style={styles.inputLabel}>Email</Text>
                      {isCheckingEmail && (
                        <ActivityIndicator size="small" color="#6C63FF" />
                      )}
                      {!isCheckingEmail && emailCheckMessage && emailCheckMessage.includes('✓') && (
                        <Text style={styles.successIndicator}>✓</Text>
                      )}
                    </View>
                    <TextInput
                      style={[
                        styles.input,
                        touched.email && errors.email && styles.inputError,
                        emailCheckMessage && emailCheckMessage.includes('⚠️') && styles.inputWarning,
                        emailCheckMessage && emailCheckMessage.includes('✓') && styles.inputSuccess,
                        registerError.email && styles.inputError,
                      ]}
                      placeholder="Enter your email"
                      placeholderTextColor="#95A5A6"
                      value={values.email}
                      onChangeText={(text) => {
                        handleChange('email')(text);
                        setEmail(text);
                        // Clear registration error when user starts typing
                        if (registerError.email) {
                          setRegisterError(prev => ({...prev, email: undefined}));
                        }
                      }}
                      onBlur={handleBlur('email')}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!isLoading}
                    />
                    {touched.email && errors.email && (
                      <Text style={styles.errorText}>{errors.email}</Text>
                    )}
                    {emailCheckMessage && !errors.email && !registerError.email && (
                      <Text style={[
                        emailCheckMessage.includes('⚠️') ? styles.warningText : styles.successText
                      ]}>
                        {emailCheckMessage}
                      </Text>
                    )}
                    {registerError.email && (
                      <Text style={styles.errorText}>{registerError.email}</Text>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <View style={styles.labelRow}>
                      <Text style={styles.inputLabel}>Password</Text>
                      {values.password && !errors.password && !registerError.password && values.password.length >= 12 && (
                        <Text style={styles.successIndicator}>✓</Text>
                      )}
                    </View>
                    <TextInput
                      style={[
                        styles.input,
                        touched.password && errors.password && styles.inputError,
                        registerError.password && styles.inputError,
                        values.password && !errors.password && !registerError.password && values.password.length >= 12 && styles.inputSuccess,
                      ]}
                      placeholder="Create a strong password"
                      placeholderTextColor="#95A5A6"
                      value={values.password}
                      onChangeText={(text) => {
                        handleChange('password')(text);
                        // Clear registration error when user starts typing
                        if (registerError.password) {
                          setRegisterError(prev => ({...prev, password: undefined}));
                        }
                      }}
                      onBlur={handleBlur('password')}
                      secureTextEntry
                      editable={!isLoading}
                    />
                    {touched.password && errors.password && (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    )}
                    {registerError.password && (
                      <Text style={styles.errorText}>{registerError.password}</Text>
                    )}
                    <Text style={styles.hint}>
                      Min 12 characters with uppercase, lowercase, and number
                    </Text>
                  </View>

                  <View style={styles.inputContainer}>
                    <View style={styles.labelRow}>
                      <Text style={styles.inputLabel}>Confirm Password</Text>
                      {values.confirmPassword && values.password === values.confirmPassword && !errors.confirmPassword && (
                        <Text style={styles.successIndicator}>✓</Text>
                      )}
                    </View>
                    <TextInput
                      style={[
                        styles.input,
                        touched.confirmPassword &&
                          errors.confirmPassword &&
                          styles.inputError,
                        values.confirmPassword && values.password === values.confirmPassword && !errors.confirmPassword && styles.inputSuccess,
                      ]}
                      placeholder="Re-enter your password"
                      placeholderTextColor="#95A5A6"
                      value={values.confirmPassword}
                      onChangeText={handleChange('confirmPassword')}
                      onBlur={handleBlur('confirmPassword')}
                      secureTextEntry
                      editable={!isLoading}
                    />
                    {touched.confirmPassword && errors.confirmPassword && (
                      <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                    )}
                  </View>

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
                        <Text style={styles.buttonText}>Create Account</Text>
                        <Text style={styles.buttonIcon}>→</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => navigation.navigate('Login')}
                    disabled={isLoading}>
                    <Text style={styles.linkText}>
                      Already have an account? <Text style={styles.linkTextBold}>Sign in</Text>
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
    marginBottom: 32,
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
    marginBottom: 24,
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
  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  feature: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  featureText: {
    fontSize: 11,
    color: '#7F8C8D',
    fontWeight: '600',
    textAlign: 'center',
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
  successText: {
    color: '#4CAF50',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  hint: {
    color: '#95A5A6',
    fontSize: 12,
    marginTop: 4,
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
