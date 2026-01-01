/**
 * TaskCard Component
 *
 * A comprehensive card component that displays task information with interactive
 * elements including status toggle, delete button, and task details.
 *
 * This component demonstrates:
 * - Complex component composition with multiple interactive zones
 * - Nested TouchableOpacity components (card press, status toggle, delete)
 * - Dynamic styling based on task state (priority colors, completion status)
 * - Visual hierarchy using badges, colors, and typography
 * - Event bubbling control (child buttons don't trigger parent's onPress)
 */

import React from 'react';
// View: Container component (like div in web)
// Text: Component for displaying text
// TouchableOpacity: Touchable wrapper with opacity feedback
// StyleSheet: Optimized style creation API
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Task, TaskStatus} from '../types';
import {COLORS, getPriorityColor} from '../utils/colors';

/**
 * Props interface for TaskCard component
 *
 * @interface TaskCardProps
 * @property {Task} task - The task object containing all task data
 * @property {() => void} onPress - Callback when card body is pressed (opens detail view)
 * @property {() => void} onStatusToggle - Callback when status checkbox is pressed
 * @property {() => void} onDelete - Callback when delete button is pressed
 */
interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onStatusToggle: () => void;
  onDelete: () => void;
}

/**
 * Helper function to get status display configuration
 *
 * Maps TaskStatus enum to display properties (icon, color, label)
 * This pattern centralizes status configuration in one place
 *
 * @param {TaskStatus} status - The current task status
 * @returns {{icon: string, color: string, label: string}} Status configuration
 */
const getStatusConfig = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.PENDING:
      return {icon: '⏳', color: '#FF9500', label: 'Pending'};
    case TaskStatus.IN_PROGRESS:
      return {icon: '🚀', color: '#007AFF', label: 'In Progress'};
    case TaskStatus.COMPLETED:
      return {icon: '✅', color: '#34C759', label: 'Completed'};
    default:
      return {icon: '⏳', color: '#FF9500', label: 'Pending'};
  }
};

/**
 * TaskCard - Main component for displaying a task in a list
 *
 * @component
 * @param {TaskCardProps} props - Component props
 * @returns {JSX.Element} A card displaying task information
 *
 * @example
 * <TaskCard
 *   task={taskObject}
 *   onPress={() => navigateToDetail(task.id)}
 *   onStatusToggle={() => toggleStatus(task.id)}
 *   onDelete={() => deleteTask(task.id)}
 * />
 */
export const TaskCard: React.FC<TaskCardProps> = ({task, onPress, onStatusToggle, onDelete}) => {
  /**
   * Derived values computed from task props
   * These are recalculated on each render but are cheap operations
   */
  const priorityColor = getPriorityColor(task.priority);
  const statusConfig = getStatusConfig(task.status);

  /**
   * Render the task card
   *
   * Structure hierarchy:
   * - TouchableOpacity (card wrapper - tapping opens detail view)
   *   - View (priority bar - colored left border)
   *   - View (content container)
   *     - View (header with title and action buttons)
   *     - Text (optional description)
   *     - View (footer with priority and status badges)
   *
   * Interactive elements:
   * 1. Card itself (TouchableOpacity) - opens detail view
   * 2. Checkbox (nested TouchableOpacity) - toggles completion
   * 3. Delete button (nested TouchableOpacity) - triggers deletion
   *
   * Event propagation:
   * When checkbox or delete are pressed, their onPress fires but
   * event doesn't bubble to card's onPress (React Native doesn't
   * bubble touch events like web does)
   */
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Priority indicator - colored bar on left edge */}
      <View style={[styles.priorityBar, {backgroundColor: priorityColor}]} />

      {/* Main content area */}
      <View style={styles.content}>
        {/* Header: Title and action buttons */}
        <View style={styles.header}>
          {/* Task title - shows strikethrough when completed */}
          <Text style={[styles.title, task.status === 'completed' && styles.completedText]}>
            {task.title}
          </Text>

          {/* Action buttons container */}
          <View style={styles.actions}>
            {/* Status checkbox - custom design instead of native checkbox */}
            <TouchableOpacity onPress={onStatusToggle} style={styles.checkbox}>
              <View style={[styles.checkboxInner, task.status === 'completed' && styles.checkboxCompleted]}>
                {task.status === 'completed' && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>

            {/* Delete button */}
            <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Optional description - only renders if description exists */}
        {/* numberOfLines={2} truncates to 2 lines with ellipsis */}
        {task.description && (
          <Text style={styles.description} numberOfLines={2}>{task.description}</Text>
        )}

        {/* Footer: Priority and status badges */}
        <View style={styles.footer}>
          {/* Priority badge with dynamic background (color + opacity) */}
          <View style={[styles.badge, {backgroundColor: priorityColor + '20'}]}>
            <Text style={[styles.badgeText, {color: priorityColor}]}>{task.priority}</Text>
          </View>

          {/* Status badge with icon and label */}
          <View style={[styles.statusBadge, {backgroundColor: statusConfig.color + '15'}]}>
            <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
            <Text style={[styles.statusText, {color: statusConfig.color}]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Styles for TaskCard component
 *
 * Demonstrates advanced layout techniques:
 * - Flexbox for responsive layouts
 * - Dynamic styling with inline style merging
 * - Platform-specific shadows
 * - Row and column flex layouts
 */
const styles = StyleSheet.create({
  /**
   * Card container
   *
   * flexDirection: 'row' - Priority bar and content sit side by side
   * overflow: 'hidden' - Ensures borderRadius clips child elements
   *
   * This is the touchable wrapper, so shadow is applied here
   */
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
    flexDirection: 'row',
    overflow: 'hidden',
  },

  /**
   * Priority bar - thin colored stripe on left edge
   * No flex value, so it takes only its width (4px)
   * Background color set dynamically based on task priority
   */
  priorityBar: {
    width: 4,
  },

  /**
   * Content container
   *
   * flex: 1 - Takes remaining space after priority bar
   * This is the main content area with padding for inner spacing
   */
  content: {
    flex: 1,
    padding: 16,
  },

  /**
   * Header - Title and action buttons row
   *
   * flexDirection: 'row' - Horizontal layout
   * justifyContent: 'space-between' - Title on left, actions on right
   * alignItems: 'flex-start' - Align to top (important for multi-line titles)
   */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  /**
   * Title text
   *
   * flex: 1 - Takes available space, allows text to wrap
   * fontWeight: '600' - Semi-bold for emphasis
   * marginRight: 12 - Space between title and action buttons
   */
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 12,
  },

  /**
   * Actions container - Checkbox and delete button
   *
   * flexDirection: 'row' - Buttons side by side
   * gap: 8 - Space between buttons (React Native 0.71+)
   */
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  /**
   * Completed text styling
   * Applied conditionally when task is completed
   * textDecorationLine: 'line-through' - Strikethrough effect
   */
  completedText: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },

  /**
   * Description text
   *
   * lineHeight: 20 - Improves readability for multi-line text
   * Used with numberOfLines={2} prop to truncate long descriptions
   */
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },

  /**
   * Footer - Priority and status badges row
   *
   * justifyContent: 'space-between' - Badges at opposite ends
   */
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  /**
   * Priority badge
   * Background color applied dynamically with opacity (color + '20')
   * This creates a subtle tinted background
   */
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  /**
   * Priority badge text
   * textTransform: 'capitalize' - First letter uppercase
   */
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  /**
   * Status badge - Icon and label
   * flexDirection: 'row' - Icon and text side by side
   * gap: 4 - Small space between icon and text
   */
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },

  statusIcon: {
    fontSize: 12,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /**
   * Checkbox button - Outer touchable area
   * 24x24 provides good touch target size
   */
  checkbox: {
    width: 24,
    height: 24,
  },

  /**
   * Checkbox inner circle
   *
   * borderRadius: 12 (half of size) = perfect circle
   * borderWidth/borderColor: Creates hollow circle when unchecked
   * Flexbox centers the checkmark when checked
   */
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /**
   * Completed checkbox styling
   * Fills the circle with primary color when checked
   */
  checkboxCompleted: {
    backgroundColor: COLORS.primary,
  },

  /**
   * Checkmark symbol
   * White color contrasts with primary background
   */
  checkmark: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  /**
   * Delete button
   *
   * Larger touch target (32x32) than checkbox for easier tapping
   * Light red background hints at destructive action
   */
  deleteButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#FFE5E5',
  },

  deleteIcon: {
    fontSize: 16,
  },
});
