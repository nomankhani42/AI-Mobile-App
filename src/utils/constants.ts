/**
 * constants.ts
 *
 * Application-wide constants and configuration data.
 * This file centralizes all static data and configuration values used throughout the app.
 *
 * Design Pattern: Constants Module
 * --------------------------------
 * Benefits of centralizing constants:
 * - Single source of truth for static data
 * - Easy to update content across the entire app
 * - Type-safe access to configuration
 * - Easier localization/internationalization
 * - Prevents typos and inconsistencies
 *
 * Organization:
 * - Onboarding data: Content for user onboarding flow
 * - Filter options: Task filtering configurations
 * - Priority options: Task priority level definitions
 *
 * @module utils/constants
 */

/**
 * Onboarding Screen Data
 * ---------------------
 * Content for the app's onboarding/welcome screens.
 * Displayed in sequence when a user first opens the app.
 *
 * Structure:
 * Each screen has:
 * - id: Unique identifier for React keys
 * - title: Main heading
 * - description: Detailed explanation
 * - icon: Emoji or icon representing the feature
 *
 * Design Considerations:
 * - Keep descriptions concise but informative
 * - Use emojis for visual appeal and quick recognition
 * - Follow a logical flow (welcome -> features -> CTA)
 * - Last screen should have a call-to-action
 *
 * @example
 * // Usage in Onboarding component
 * import { ONBOARDING_DATA } from '../utils/constants';
 *
 * function Onboarding() {
 *   return (
 *     <FlatList
 *       data={ONBOARDING_DATA}
 *       keyExtractor={(item) => item.id}
 *       renderItem={({ item }) => (
 *         <OnboardingSlide
 *           title={item.title}
 *           description={item.description}
 *           icon={item.icon}
 *         />
 *       )}
 *     />
 *   );
 * }
 *
 * @type {Array<{id: string, title: string, description: string, icon: string}>}
 */
export const ONBOARDING_DATA = [
  {
    id: '1',
    title: 'Welcome to TaskMaster',
    description: 'Boost your productivity with AI-powered task management. Get things done smarter, faster, and with less effort.',
    icon: '✨',
  },
  {
    id: '2',
    title: 'Intelligent Organization',
    description: 'Our AI automatically prioritizes your tasks and suggests the best times to tackle them. Stay focused on what matters most.',
    icon: '🎯',
  },
  {
    id: '3',
    title: 'Voice & Chat Assistant',
    description: 'Simply speak or type to create tasks, set reminders, and get instant updates. Your personal productivity companion is always ready to help.',
    icon: '🗣️',
  },
  {
    id: '4',
    title: 'Ready to Get Started?',
    description: 'Join thousands of productive users who are achieving more every day with TaskMaster. Let\'s make today count!',
    icon: '🚀',
  },
];

/**
 * TypeScript type for onboarding data structure
 * Provides type safety when working with onboarding screens
 */
export type OnboardingSlide = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

/**
 * Task Filter Options
 * ------------------
 * Defines the available filter options for the task list.
 * Users can filter tasks by completion status.
 *
 * Structure:
 * - label: Display text shown to user
 * - value: Internal value used for filtering logic
 *
 * Filter Logic:
 * - 'all': Shows all tasks regardless of status
 * - 'pending': Tasks not yet started
 * - 'in_progress': Tasks currently being worked on
 * - 'completed': Finished tasks
 *
 * @example
 * // Usage in filter picker
 * import { TASK_FILTERS } from '../utils/constants';
 *
 * function TaskFilterPicker({ onSelect }) {
 *   return (
 *     <View>
 *       {TASK_FILTERS.map(filter => (
 *         <TouchableOpacity
 *           key={filter.value}
 *           onPress={() => onSelect(filter.value)}
 *         >
 *           <Text>{filter.label}</Text>
 *         </TouchableOpacity>
 *       ))}
 *     </View>
 *   );
 * }
 *
 * @example
 * // Usage in filtering logic
 * const filteredTasks = tasks.filter(task => {
 *   if (selectedFilter === 'all') return true;
 *   return task.status === selectedFilter;
 * });
 *
 * @type {Array<{label: string, value: string}>}
 */
export const TASK_FILTERS = [
  {label: 'All', value: 'all'},
  {label: 'Pending', value: 'pending'},
  {label: 'In Progress', value: 'in_progress'},
  {label: 'Completed', value: 'completed'},
];

/**
 * TypeScript type for task filter structure
 */
export type TaskFilter = {
  label: string;
  value: 'all' | 'pending' | 'in_progress' | 'completed';
};

/**
 * Task Priority Options
 * --------------------
 * Defines the available priority levels for tasks.
 * Each priority has a label, internal value, and associated color.
 *
 * Structure:
 * - label: Display text shown to user
 * - value: Internal value stored in database
 * - color: Visual color indicator (from COLORS palette)
 *
 * Priority Levels (ordered by urgency):
 * 1. Urgent: Immediate action required, highest priority
 * 2. High: Important, should be done soon
 * 3. Medium: Normal priority, standard tasks
 * 4. Low: Can be done later, lowest priority
 *
 * Color Coding:
 * - Red (Urgent): Signals immediate attention needed
 * - Orange (High): Important but not critical
 * - Yellow (Medium): Normal tasks
 * - Green (Low): Low pressure, when time permits
 *
 * @example
 * // Usage in priority selector
 * import { PRIORITY_OPTIONS } from '../utils/constants';
 *
 * function PrioritySelector({ onSelect }) {
 *   return (
 *     <View>
 *       {PRIORITY_OPTIONS.map(option => (
 *         <TouchableOpacity
 *           key={option.value}
 *           onPress={() => onSelect(option.value)}
 *           style={{
 *             backgroundColor: option.color,
 *             padding: 10,
 *             borderRadius: 8
 *           }}
 *         >
 *           <Text style={{color: 'white'}}>{option.label}</Text>
 *         </TouchableOpacity>
 *       ))}
 *     </View>
 *   );
 * }
 *
 * @example
 * // Usage in task creation form
 * const [priority, setPriority] = useState(PRIORITY_OPTIONS[2].value); // Default to 'medium'
 *
 * <Picker
 *   selectedValue={priority}
 *   onValueChange={setPriority}
 * >
 *   {PRIORITY_OPTIONS.map(option => (
 *     <Picker.Item
 *       key={option.value}
 *       label={option.label}
 *       value={option.value}
 *     />
 *   ))}
 * </Picker>
 *
 * @example
 * // Find priority option by value
 * const getPriorityLabel = (value: string) => {
 *   const option = PRIORITY_OPTIONS.find(opt => opt.value === value);
 *   return option?.label || 'Unknown';
 * };
 *
 * @type {Array<{label: string, value: string, color: string}>}
 */
export const PRIORITY_OPTIONS = [
  {label: 'Low', value: 'low', color: '#4CAF50'},
  {label: 'Medium', value: 'medium', color: '#FFC107'},
  {label: 'High', value: 'high', color: '#FF9800'},
  {label: 'Urgent', value: 'urgent', color: '#F44336'},
];

/**
 * TypeScript type for priority option structure
 */
export type PriorityOption = {
  label: string;
  value: 'low' | 'medium' | 'high' | 'urgent';
  color: string;
};
