/**
 * AddTaskModal Component
 *
 * A comprehensive bottom sheet modal for creating new tasks. Features form validation,
 * date picking, keyboard handling, and smooth animations. This is the most complex
 * modal in the app, demonstrating advanced React Native patterns.
 *
 * This component demonstrates:
 * - Bottom sheet modal pattern with slide-up animation
 * - Form handling with Formik (popular React form library)
 * - Form validation with Yup schema validation
 * - TextInput for user input (single-line and multi-line)
 * - KeyboardAvoidingView for iOS keyboard handling
 * - ScrollView for scrollable content
 * - Third-party date picker integration
 * - Redux dispatch for state management
 * - ActivityIndicator for loading states
 * - Responsive sizing with Dimensions API
 * - Platform-specific behavior (iOS vs Android)
 */

import React, {useRef, useEffect, useState} from 'react';
// View: Container component
// Text: Text display component
// TextInput: User input component (handles both single-line and multi-line)
// TouchableOpacity: Touchable button with opacity feedback
// Modal: Full-screen overlay component
// KeyboardAvoidingView: Adjusts position when keyboard appears (iOS)
// Platform: Detects iOS vs Android for platform-specific code
// Animated: Animation library
// TouchableWithoutFeedback: Captures touches without visual feedback
// Dimensions: Gets screen dimensions
// ScrollView: Scrollable container (like a div with overflow: scroll)
// ActivityIndicator: Loading spinner component
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
// Formik: Form management library (handles values, validation, submission)
import {Formik} from 'formik';
// Yup: Schema validation library (works with Formik)
import * as Yup from 'yup';
// Third-party date picker component
import DatePicker from 'react-native-date-picker';
// Redux hooks for dispatching actions
import {useAppDispatch} from '../redux/hooks';
import {createTask} from '../redux/slices/tasksSlice';
import {COLORS} from '../utils/colors';

/**
 * Calculate modal height based on screen size
 * 75% of screen height provides good UX - not too large, not too small
 */
const {height: SCREEN_HEIGHT} = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.75;

/**
 * Form validation schema using Yup
 *
 * Yup provides declarative validation:
 * - Chain validation rules (.trim(), .min(), .max(), .required())
 * - Automatic error messages
 * - Type safety with TypeScript
 *
 * This schema validates:
 * - Title: Required, 3-200 characters after trimming whitespace
 * - Description: Optional, max 1000 characters
 */
const taskSchema = Yup.object().shape({
  title: Yup.string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters')
    .required('Task title is required'),
  description: Yup.string()
    .trim()
    .max(1000, 'Description must be less than 1000 characters'),
});

/**
 * Props interface for AddTaskModal
 *
 * @interface AddTaskModalProps
 * @property {boolean} visible - Controls modal visibility
 * @property {() => void} onClose - Callback to close modal
 */
interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * AddTaskModal - Form modal for creating new tasks
 *
 * @component
 * @example
 * <AddTaskModal
 *   visible={showAddModal}
 *   onClose={() => setShowAddModal(false)}
 * />
 */
export const AddTaskModal: React.FC<AddTaskModalProps> = ({visible, onClose}) => {
  /**
   * Redux dispatch for creating tasks
   * dispatch(createTask(data)) sends action to Redux store
   */
  const dispatch = useAppDispatch();

  /**
   * State hooks for date picking
   *
   * useState<Date | undefined>:
   * - Generic type parameter for TypeScript type safety
   * - undefined when no date selected
   * - Date object when user picks a deadline
   */
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);

  /**
   * Animation values for bottom sheet
   *
   * slideAnim: Starts offscreen (MODAL_HEIGHT), animates to 0 (visible)
   * backdropOpacity: Fades from 0 (transparent) to 1 (semi-opaque)
   */
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: MODAL_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleSubmit = async (
    values: {title: string; description: string},
    {setSubmitting, resetForm}: any
  ) => {
    try {
      const taskData = {
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        deadline: selectedDate ? selectedDate.toISOString() : undefined,
      };

      console.log('[AddTask] Creating task:', taskData);
      await dispatch(createTask(taskData)).unwrap();
      console.log('[AddTask] Task created successfully');

      resetForm();
      setSelectedDate(undefined);
      onClose();
    } catch (error: any) {
      console.error('[AddTask] Failed to create task:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) return 'No deadline set';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{translateY: slideAnim}],
                },
              ]}>
              <View style={styles.dragIndicatorContainer}>
                <View style={styles.dragIndicator} />
              </View>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create New Task</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Formik
            initialValues={{title: '', description: ''}}
            validationSchema={taskSchema}
            onSubmit={handleSubmit}>
            {({
              handleChange,
              handleBlur,
              handleSubmit: formikSubmit,
              values,
              errors,
              touched,
              isSubmitting,
              resetForm,
            }) => (
              <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    Title <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      touched.title && errors.title && styles.inputError,
                    ]}
                    placeholder="Enter task title"
                    placeholderTextColor="#94A3B8"
                    value={values.title}
                    onChangeText={handleChange('title')}
                    onBlur={handleBlur('title')}
                    maxLength={200}
                    editable={!isSubmitting}
                  />
                  {touched.title && errors.title && (
                    <Text style={styles.errorText}>{errors.title}</Text>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      touched.description && errors.description && styles.inputError,
                    ]}
                    placeholder="Enter task description (optional)"
                    placeholderTextColor="#94A3B8"
                    value={values.description}
                    onChangeText={handleChange('description')}
                    onBlur={handleBlur('description')}
                    multiline
                    numberOfLines={4}
                    maxLength={1000}
                    editable={!isSubmitting}
                  />
                  {touched.description && errors.description && (
                    <Text style={styles.errorText}>{errors.description}</Text>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Deadline</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                    disabled={isSubmitting}>
                    <Text style={[
                      styles.datePickerButtonText,
                      !selectedDate && styles.datePickerPlaceholder
                    ]}>
                      {formatDate(selectedDate)}
                    </Text>
                    <Text style={styles.datePickerIcon}>📅</Text>
                  </TouchableOpacity>
                  {selectedDate && (
                    <TouchableOpacity
                      style={styles.clearDateButton}
                      onPress={() => setSelectedDate(undefined)}
                      disabled={isSubmitting}>
                      <Text style={styles.clearDateText}>Clear deadline</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={styles.hint}>
                    Tap to select a deadline date and time
                  </Text>
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => {
                      resetForm();
                      setSelectedDate(undefined);
                      onClose();
                    }}
                    disabled={isSubmitting}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.submitButton,
                      isSubmitting && styles.submitButtonDisabled,
                    ]}
                    onPress={() => formikSubmit()}
                    disabled={isSubmitting}>
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>Create Task</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </Formik>

          <DatePicker
            modal
            open={showDatePicker}
            date={selectedDate || new Date()}
            onConfirm={(date) => {
              setShowDatePicker(false);
              setSelectedDate(date);
            }}
            onCancel={() => {
              setShowDatePicker(false);
            }}
            minimumDate={new Date()}
            mode="datetime"
            title="Select Deadline"
          />
            </Animated.View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    height: MODAL_HEIGHT,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 16,
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    color: COLORS.text,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 6,
    fontWeight: '500',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  datePickerButton: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: COLORS.text,
  },
  datePickerPlaceholder: {
    color: COLORS.textSecondary,
  },
  datePickerIcon: {
    fontSize: 20,
  },
  clearDateButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearDateText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
