/**
 * DeleteConfirmModal Component
 *
 * A confirmation modal that appears before deleting a task. Features a centered
 * modal with scale animation and a semi-transparent backdrop. Follows the common
 * pattern of destructive action confirmations with clear visual hierarchy.
 *
 * This component demonstrates:
 * - Modal component usage for overlays
 * - TouchableWithoutFeedback for dismissing by tapping outside
 * - Parallel animations (scale and opacity)
 * - Dimensions API for responsive sizing
 * - Destructive action UI patterns (red coloring, clear warnings)
 */

import React, {useEffect, useRef} from 'react';
// Modal: Full-screen overlay component
// TouchableWithoutFeedback: Captures touches without visual feedback (for backdrop)
// Dimensions: Gets device screen dimensions for responsive sizing
// Animated: Animation library
// Easing: Predefined easing curves for smooth animations
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import {COLORS} from '../utils/colors';

/**
 * Get device screen width
 * Used to calculate modal width (85% of screen width)
 */
const {width: SCREEN_WIDTH} = Dimensions.get('window');

/**
 * Props interface for DeleteConfirmModal component
 *
 * @interface DeleteConfirmModalProps
 * @property {boolean} visible - Controls modal visibility
 * @property {string} taskTitle - The task title to display in confirmation message
 * @property {() => void} onConfirm - Callback when user confirms deletion
 * @property {() => void} onCancel - Callback when user cancels or dismisses modal
 */
interface DeleteConfirmModalProps {
  visible: boolean;
  taskTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * DeleteConfirmModal - Confirmation dialog for task deletion
 *
 * @component
 * @param {DeleteConfirmModalProps} props - Component props
 * @returns {JSX.Element} Animated confirmation modal
 *
 * @example
 * <DeleteConfirmModal
 *   visible={showDeleteModal}
 *   taskTitle="Buy groceries"
 *   onConfirm={() => handleDelete()}
 *   onCancel={() => setShowDeleteModal(false)}
 * />
 */
export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  visible,
  taskTitle,
  onConfirm,
  onCancel,
}) => {
  /**
   * Animation values for modal entrance/exit
   *
   * scale: Controls modal size (0 = invisible, 1 = full size)
   * opacity: Controls backdrop transparency
   */
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  /**
   * Animation effect triggered by visibility changes
   *
   * When visible becomes true: Modal scales up with spring, backdrop fades in
   * When visible becomes false: Modal and backdrop fade out with timing
   *
   * Why different animations for show/hide?
   * - Show: Spring animation feels bouncy and welcoming
   * - Hide: Timing animation feels quick and clean
   *
   * Dependencies: [visible] - runs whenever visible prop changes
   */
  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0,
          duration: 150,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  /**
   * Render the delete confirmation modal
   *
   * Modal component behavior:
   * - transparent={true}: Makes background transparent (allows custom backdrop)
   * - animationType="none": Disables default animation (using custom animations)
   * - onRequestClose: Called on Android back button press
   * - statusBarTranslucent: Allows modal to render under status bar
   *
   * Structure:
   * - Modal (root overlay)
   *   - View (overlay container)
   *     - Animated.View (backdrop - tap to dismiss)
   *     - Animated.View (modal content - centered card)
   *
   * TouchableWithoutFeedback vs TouchableOpacity:
   * - TouchableWithoutFeedback: No visual feedback, used for backdrop
   * - TouchableOpacity: Visual feedback, used for buttons
   */
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent>
      <View style={styles.overlay}>
        {/* Backdrop - tapping outside dismisses modal */}
        <TouchableWithoutFeedback onPress={onCancel}>
          <Animated.View style={[styles.backdrop, {opacity}]} />
        </TouchableWithoutFeedback>

        {/* Modal content card - centered and animated */}
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{scale}],
            },
          ]}>
          {/* Icon section */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>🗑️</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Delete Task?</Text>

          {/* Message with task name highlighted */}
          <Text style={styles.message}>
            Are you sure you want to delete{'\n'}
            <Text style={styles.taskName}>"{taskTitle}"</Text>?{'\n'}
            This action cannot be undone.
          </Text>

          {/* Action buttons */}
          <View style={styles.buttonContainer}>
            {/* Cancel button - safe action */}
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.8}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            {/* Delete button - destructive action (red) */}
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={onConfirm}
              activeOpacity={0.8}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

/**
 * Styles for DeleteConfirmModal component
 *
 * Demonstrates:
 * - Centered modal pattern
 * - StyleSheet.absoluteFillObject for full-screen backdrop
 * - Responsive sizing with Dimensions API
 * - Destructive action color coding (red for delete)
 */
const styles = StyleSheet.create({
  /**
   * Overlay container
   *
   * flex: 1 - Takes full screen
   * justifyContent/alignItems: 'center' - Centers modal card
   */
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /**
   * Backdrop
   *
   * StyleSheet.absoluteFillObject - Shorthand for:
   *   position: 'absolute',
   *   top: 0, left: 0, right: 0, bottom: 0
   *
   * Semi-transparent black (rgba) dims background content
   */
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },

  /**
   * Modal content container
   *
   * width: SCREEN_WIDTH * 0.85 - 85% of screen width (responsive)
   * Large borderRadius (24) creates modern, friendly appearance
   * Strong shadow for depth and emphasis
   */
  container: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },

  iconContainer: {
    marginBottom: 16,
  },

  /**
   * Icon circle background
   *
   * Light red background (#FFE5E5) hints at destructive action
   * Perfect circle (borderRadius = half of size)
   */
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  icon: {
    fontSize: 32,
  },

  /**
   * Title text
   *
   * Red color (#FF3B30) - iOS red for destructive actions
   * Large, bold font creates clear warning
   */
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 12,
  },

  /**
   * Message text
   *
   * textAlign: 'center' - Centers multi-line text
   * lineHeight: 22 - Improves readability
   */
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },

  /**
   * Task name styling within message
   * Bold and darker to emphasize what's being deleted
   */
  taskName: {
    fontWeight: '600',
    color: COLORS.text,
  },

  /**
   * Button container
   *
   * flexDirection: 'row' - Buttons side by side
   * gap: 12 - Space between buttons
   * width: '100%' - Buttons span full width
   */
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },

  /**
   * Button base styles
   *
   * flex: 1 - Each button takes equal width
   * Consistent padding and border radius
   */
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /**
   * Cancel button - neutral, safe action
   * Light gray background
   */
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },

  /**
   * Delete button - destructive action
   * iOS red (#FF3B30) clearly indicates danger
   */
  deleteButton: {
    backgroundColor: '#FF3B30',
  },

  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
