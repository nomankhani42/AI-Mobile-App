import React, {useEffect, useState, useMemo} from 'react';
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
import {Formik} from 'formik';
import * as Yup from 'yup';
import {useAppDispatch, useAppSelector} from '../redux/hooks';
import {login, clearError} from '../redux/slices/authSlice';
import {useDebounce} from '../hooks/useDebounce';
import {apiService} from '../api/apiService';

// Validation Schema
const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({navigation}) => {
  const dispatch = useAppDispatch();
  const {isLoading, error} = useAppSelector(state => state.auth);
  const [email, setEmail] = useState('');
  const [emailCheckMessage, setEmailCheckMessage] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [loginError, setLoginError] = useState<{email?: string; password?: string}>({});
  const debouncedEmail = useDebounce(email, 800);

  // Check if email exists when debounced email changes
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

  // Network test removed - app will connect directly to backend via API service
  // If connection fails, errors will be shown inline in the login form

  // Handle errors from Redux state - convert to inline errors instead of alerts
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
              <Text style={styles.title}>Welcome Back!</Text>
              <Text style={styles.subtitle}>
                Sign in to manage your tasks with AI assistance
              </Text>
            </View>

            {/* Form with Formik */}
            <Formik
              initialValues={{email: '', password: ''}}
              validationSchema={loginSchema}
              onSubmit={handleLogin}>
              {({handleChange, handleBlur, handleSubmit, values, errors, touched, isValid}) => {
                // Memoize error checks to prevent unnecessary re-renders
                const isButtonDisabled = useMemo(() => {
                  const hasEmailError = Boolean((touched.email && errors.email) || loginError.email || emailCheckMessage);
                  const hasPasswordError = Boolean((touched.password && errors.password) || loginError.password);
                  const isFormEmpty = !values.email || !values.password;
                  return Boolean(isLoading || hasEmailError || hasPasswordError || isFormEmpty);
                }, [touched.email, errors.email, loginError.email, emailCheckMessage, touched.password, errors.password, loginError.password, values.email, values.password, isLoading]);

                const hasEmailError = Boolean((touched.email && errors.email) || loginError.email || emailCheckMessage);
                const hasPasswordError = Boolean((touched.password && errors.password) || loginError.password);

                return (
                <View style={styles.form}>
                  <View style={styles.inputContainer}>
                    <View style={styles.labelRow}>
                      <Text style={styles.inputLabel}>Email</Text>
                      {isCheckingEmail && (
                        <ActivityIndicator size="small" color="#6C63FF" />
                      )}
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

                  <View style={styles.inputContainer}>
                    <View style={styles.labelRow}>
                      <Text style={styles.inputLabel}>Password</Text>
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
                    {touched.password && errors.password && (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    )}
                    {loginError.password && (
                      <Text style={styles.errorText}>{loginError.password}</Text>
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
                        <Text style={styles.buttonText}>Sign In</Text>
                        <Text style={styles.buttonIcon}>→</Text>
                      </View>
                    )}
                  </TouchableOpacity>

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
