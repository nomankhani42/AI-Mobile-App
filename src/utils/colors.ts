/**
 * colors.ts
 *
 * Centralized color palette and color utility functions for the application.
 * This file follows the design system pattern where all colors are defined in one place
 * for consistency, maintainability, and easy theme management.
 *
 * Benefits of Centralized Colors:
 * - Consistency: All components use the same color values
 * - Maintainability: Change colors in one place, updates everywhere
 * - Type Safety: TypeScript ensures valid color references
 * - Theme Support: Easy to add dark mode or alternate themes
 * - Accessibility: Central place to ensure WCAG color contrast compliance
 *
 * @module utils/colors
 */

/**
 * Application Color Palette
 * ------------------------
 * The main color constants used throughout the application.
 * All colors are in HEX format (#RRGGBB) for universal compatibility.
 *
 * Color Categories:
 * - Base colors: primary, secondary, accent
 * - Layout colors: background, card, border
 * - Text colors: text, textSecondary
 * - Semantic colors: success, warning, error, info
 * - Domain-specific: priority colors, status colors
 * - Effects: gradient colors
 *
 * Color Selection Guide:
 * - Primary: Main brand color, used for key actions and branding
 * - Secondary: Supporting color for less important actions
 * - Accent: Highlight color for special attention
 * - Success: Positive actions (green)
 * - Warning: Caution states (yellow/orange)
 * - Error: Error states and destructive actions (red)
 * - Info: Informational messages (blue)
 *
 * @example
 * // Using colors in StyleSheet
 * import { COLORS } from '../utils/colors';
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     backgroundColor: COLORS.background,
 *   },
 *   text: {
 *     color: COLORS.text,
 *   },
 *   button: {
 *     backgroundColor: COLORS.primary,
 *   },
 * });
 *
 * @example
 * // Using colors directly in components
 * <View style={{backgroundColor: COLORS.card}}>
 *   <Text style={{color: COLORS.textSecondary}}>Hello</Text>
 * </View>
 */
export const COLORS = {
  // Brand Colors
  primary: '#6C63FF',         // Purple - Main brand color for buttons, links, CTAs
  secondary: '#4CAF50',       // Green - Secondary actions, confirmations
  accent: '#FF6B6B',          // Coral - Highlights, special features

  // Layout Colors
  background: '#F8F9FA',      // Light gray - Main app background
  card: '#FFFFFF',            // White - Card/container backgrounds
  border: '#E0E0E0',          // Light gray - Borders, dividers

  // Text Colors
  text: '#2C3E50',            // Dark blue-gray - Primary text
  textSecondary: '#7F8C8D',   // Medium gray - Secondary text, labels

  // Semantic Status Colors
  success: '#4CAF50',         // Green - Success messages, completed states
  warning: '#FFC107',         // Amber - Warning messages, pending states
  error: '#F44336',           // Red - Error messages, destructive actions
  info: '#2196F3',            // Blue - Informational messages, tips

  // Task Priority Colors
  // These colors provide visual distinction for task importance
  priorityUrgent: '#F44336',  // Red - Highest priority, needs immediate attention
  priorityHigh: '#FF9800',    // Orange - High priority, important
  priorityMedium: '#FFC107',  // Amber - Medium priority, normal importance
  priorityLow: '#4CAF50',     // Green - Low priority, when time permits

  // Task Status Colors
  // These colors represent different stages of task completion
  statusPending: '#FFC107',     // Amber - Task created but not started
  statusInProgress: '#2196F3',  // Blue - Task actively being worked on
  statusCompleted: '#4CAF50',   // Green - Task finished

  // Gradient Colors
  // Used for gradient backgrounds and visual effects
  gradientStart: '#6C63FF',   // Light purple - Gradient start
  gradientEnd: '#4E47D9',     // Dark purple - Gradient end
};

/**
 * Type definition for priority levels
 * Ensures type safety when using priority colors
 */
export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low';

/**
 * Type definition for task statuses
 * Ensures type safety when using status colors
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

/**
 * Get Priority Color Helper Function
 * ---------------------------------
 * Maps a priority level string to its corresponding color.
 * This function encapsulates the priority-to-color mapping logic.
 *
 * Design Pattern: Mapper Function
 * ------------------------------
 * This is a pure function that takes input and returns a deterministic output.
 * Benefits:
 * - Single source of truth for priority colors
 * - Easy to test (pure function)
 * - Type-safe with proper TypeScript usage
 * - Handles invalid inputs gracefully
 *
 * @param {string} priority - The priority level (case-insensitive)
 * @returns {string} The hex color code for the priority
 *
 * @example
 * // Basic usage
 * const color = getPriorityColor('high');
 * // Returns: '#FF9800'
 *
 * @example
 * // Usage in component
 * function PriorityBadge({ priority }) {
 *   return (
 *     <View style={{
 *       backgroundColor: getPriorityColor(priority),
 *       padding: 8,
 *       borderRadius: 4
 *     }}>
 *       <Text style={{color: 'white'}}>{priority}</Text>
 *     </View>
 *   );
 * }
 *
 * @example
 * // Usage in dynamic styles
 * const taskStyle = {
 *   borderLeftWidth: 4,
 *   borderLeftColor: getPriorityColor(task.priority)
 * };
 *
 * @example
 * // Case-insensitive handling
 * getPriorityColor('URGENT');  // Works, returns '#F44336'
 * getPriorityColor('High');    // Works, returns '#FF9800'
 * getPriorityColor('invalid'); // Falls back to textSecondary
 */
export const getPriorityColor = (priority: string): string => {
  // Convert to lowercase for case-insensitive matching
  switch (priority.toLowerCase()) {
    case 'urgent':
      return COLORS.priorityUrgent;   // Red
    case 'high':
      return COLORS.priorityHigh;     // Orange
    case 'medium':
      return COLORS.priorityMedium;   // Amber
    case 'low':
      return COLORS.priorityLow;      // Green
    default:
      // Fallback for invalid priority values
      return COLORS.textSecondary;    // Gray
  }
};

/**
 * Get Status Color Helper Function
 * -------------------------------
 * Maps a task status string to its corresponding color.
 * Similar to getPriorityColor but for task completion status.
 *
 * Design Pattern: Mapper Function
 * ------------------------------
 * Provides a consistent interface for status-to-color mapping.
 *
 * @param {string} status - The task status
 * @returns {string} The hex color code for the status
 *
 * @example
 * // Basic usage
 * const color = getStatusColor('in_progress');
 * // Returns: '#2196F3'
 *
 * @example
 * // Usage in status indicator
 * function StatusIndicator({ status }) {
 *   return (
 *     <View style={{
 *       width: 12,
 *       height: 12,
 *       borderRadius: 6,
 *       backgroundColor: getStatusColor(status)
 *     }} />
 *   );
 * }
 *
 * @example
 * // Usage in task list
 * const taskCard = (
 *   <View style={{
 *     borderTopWidth: 3,
 *     borderTopColor: getStatusColor(task.status)
 *   }}>
 *     <Text>{task.title}</Text>
 *   </View>
 * );
 *
 * @example
 * // Conditional styling based on status
 * const textStyle = {
 *   color: task.status === 'completed'
 *     ? getStatusColor('completed')
 *     : COLORS.text
 * };
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return COLORS.statusPending;      // Amber
    case 'in_progress':
      return COLORS.statusInProgress;   // Blue
    case 'completed':
      return COLORS.statusCompleted;    // Green
    default:
      // Fallback for invalid status values
      return COLORS.textSecondary;      // Gray
  }
};
