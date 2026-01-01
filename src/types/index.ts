/**
 * TypeScript Type Definitions
 *
 * This file contains all TypeScript interfaces and enums used throughout the app.
 * Centralizing types provides:
 * - Single source of truth for data structures
 * - Better IDE autocomplete and type checking
 * - Easier refactoring across the codebase
 * - Self-documenting code
 *
 * TypeScript Benefits:
 * - Catch errors at compile time instead of runtime
 * - Better refactoring support
 * - Improved developer experience with autocomplete
 * - Living documentation of data structures
 */

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

/**
 * User Interface
 *
 * Represents an authenticated user in the system.
 * This matches the user object returned from the backend API.
 *
 * @interface User
 * @property {string} id - Unique user identifier (UUID from database)
 * @property {string} email - User's email address (used for login)
 * @property {string} [full_name] - Optional user's full name (for display)
 *
 * Optional properties (marked with ?) may be undefined/null
 */
export interface User {
  id: string; // UUID from backend
  email: string; // Required for authentication
  full_name?: string; // Optional - may not be provided
}

/**
 * Authentication State Interface
 *
 * Represents the complete authentication state in Redux store.
 * Managed by authSlice reducer.
 *
 * @interface AuthState
 * @property {User|null} user - Currently logged in user or null if not authenticated
 * @property {string|null} token - JWT authentication token for API requests
 * @property {boolean} isAuthenticated - Quick boolean check for auth status
 * @property {boolean} isLoading - Whether an auth request is in progress
 * @property {string|null} error - Error message from failed auth attempt
 * @property {boolean} hasSeenOnboarding - Whether user completed onboarding flow
 *
 * State Flow:
 * 1. Initial: { user: null, token: null, isAuthenticated: false, ... }
 * 2. Login starts: { isLoading: true, error: null }
 * 3. Login success: { user: {...}, token: "jwt...", isAuthenticated: true, isLoading: false }
 * 4. Login fails: { error: "Invalid credentials", isLoading: false }
 */
export interface AuthState {
  user: User | null; // Null when logged out
  token: string | null; // JWT token for API authorization
  isAuthenticated: boolean; // True if user is logged in
  isLoading: boolean; // True during login/register API calls
  error: string | null; // Error message to display to user
  hasSeenOnboarding: boolean; // Persisted - won't show onboarding again
}

// ============================================================================
// CHAT TYPES
// ============================================================================

/**
 * Chat Message Interface
 *
 * Represents a single message in the chat interface.
 * Can be from user or AI bot.
 *
 * @interface Message
 * @property {string} id - Unique message identifier (timestamp-based for simplicity)
 * @property {string} text - Message content/text
 * @property {boolean} isUser - True if message is from user, false if from AI
 * @property {number} timestamp - Unix timestamp when message was created
 *
 * Usage:
 * - User messages: { id: "123", text: "Hello", isUser: true, timestamp: Date.now() }
 * - Bot messages: { id: "124", text: "Hi!", isUser: false, timestamp: Date.now() }
 */
export interface Message {
  id: string; // Usually Date.now().toString()
  text: string; // Message content
  isUser: boolean; // Determines message styling and alignment
  timestamp: number; // For sorting and display
}

/**
 * Chat State Interface
 *
 * Represents the chat state in Redux store.
 * Managed by chatSlice reducer.
 *
 * @interface ChatState
 * @property {Message[]} messages - Array of all chat messages (user + bot)
 * @property {boolean} isTyping - Whether bot is "typing" (loading state)
 * @property {string|null} error - Error message if chat API fails
 *
 * Message Flow:
 * 1. User types message
 * 2. Add user message to array: messages.push({ isUser: true, ... })
 * 3. Set isTyping: true (show typing indicator)
 * 4. Send to API
 * 5. Add bot response: messages.push({ isUser: false, ... })
 * 6. Set isTyping: false
 */
export interface ChatState {
  messages: Message[]; // Chat history
  isTyping: boolean; // Show/hide typing indicator
  error: string | null; // Display error to user
}

// ============================================================================
// TASK TYPES
// ============================================================================

/**
 * Task Status Enum
 *
 * Represents the current state of a task.
 * Using enum ensures only valid values are used.
 *
 * @enum {string}
 * @readonly
 *
 * Values:
 * - PENDING: Task not started yet
 * - IN_PROGRESS: Currently working on task
 * - COMPLETED: Task finished
 *
 * TypeScript enum benefits:
 * - Autocomplete for valid values
 * - Compile-time checking
 * - Can't accidentally use invalid status
 */
export enum TaskStatus {
  PENDING = 'pending', // Not started
  IN_PROGRESS = 'in_progress', // In progress
  COMPLETED = 'completed', // Done
}

/**
 * Task Priority Enum
 *
 * Represents task priority levels.
 * Used for sorting and visual indicators (colors).
 *
 * @enum {string}
 * @readonly
 *
 * Values ordered by urgency:
 * - LOW: Can wait, no rush
 * - MEDIUM: Normal priority
 * - HIGH: Important, should do soon
 * - URGENT: Critical, do immediately
 *
 * Maps to colors in utils/colors.ts:
 * - LOW: #4CAF50 (green)
 * - MEDIUM: #2196F3 (blue)
 * - HIGH: #FF9800 (orange)
 * - URGENT: #F44336 (red)
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Task Interface
 *
 * Represents a complete task object from the backend.
 * Includes user-set fields and AI-suggested fields.
 *
 * @interface Task
 * @property {string} id - Unique task identifier (UUID)
 * @property {string} owner_id - ID of user who created the task
 * @property {string} title - Task title/name (required)
 * @property {string} [description] - Optional detailed description
 * @property {TaskStatus} status - Current task status (pending/in_progress/completed)
 * @property {TaskPriority} priority - User-set priority level
 * @property {string} [deadline] - Optional deadline (ISO 8601 date string)
 * @property {number} [estimated_duration] - Optional time estimate in minutes
 * @property {string} [completed_at] - ISO date when task was completed
 * @property {TaskPriority} [ai_priority] - AI-suggested priority
 * @property {number} [ai_estimated_duration] - AI-suggested duration in minutes
 * @property {string} created_at - ISO date when task was created
 * @property {string} updated_at - ISO date of last update
 *
 * AI Fields:
 * Tasks can have AI-suggested values (ai_priority, ai_estimated_duration)
 * that the user can choose to accept or ignore.
 */
export interface Task {
  id: string; // UUID from backend
  owner_id: string; // User who owns this task
  title: string; // Required task name
  description?: string; // Optional details
  status: TaskStatus; // Current workflow state
  priority: TaskPriority; // User-set importance
  deadline?: string; // Optional due date (ISO string)
  estimated_duration?: number; // User's time estimate (minutes)
  completed_at?: string; // When task was marked complete
  ai_priority?: TaskPriority; // AI's suggested priority
  ai_estimated_duration?: number; // AI's time estimate (minutes)
  created_at: string; // Creation timestamp
  updated_at: string; // Last modification timestamp
}

/**
 * Tasks State Interface
 *
 * Represents the tasks state in Redux store.
 * Managed by tasksSlice reducer.
 *
 * @interface TasksState
 * @property {Task[]} items - Array of all user's tasks
 * @property {boolean} isLoading - Whether tasks are being fetched/modified
 * @property {string|null} error - Error message from API failure
 * @property {TaskStatus|'all'} filter - Current filter (all/pending/in_progress/completed)
 *
 * Filtering:
 * - 'all': Show all tasks
 * - TaskStatus.PENDING: Show only pending tasks
 * - TaskStatus.IN_PROGRESS: Show only in-progress tasks
 * - TaskStatus.COMPLETED: Show only completed tasks
 */
export interface TasksState {
  items: Task[]; // All tasks from API
  isLoading: boolean; // Show loading indicator
  error: string | null; // Display error message
  filter: TaskStatus | 'all'; // Current view filter
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Login Credentials Interface
 *
 * Data required to authenticate a user.
 *
 * @interface LoginCredentials
 * @property {string} email - User's email address
 * @property {string} password - User's password (plain text, encrypted in transit)
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration Credentials Interface
 *
 * Data required to create a new user account.
 * Password confirmation is handled by frontend validation.
 *
 * @interface RegisterCredentials
 * @property {string} email - New user's email
 * @property {string} password - New user's password
 * @property {string} [full_name] - Optional user's full name
 */
export interface RegisterCredentials {
  email: string;
  password: string;
  full_name?: string;
}

/**
 * Task Creation Interface
 *
 * Data required to create a new task.
 * Other fields (id, owner_id, timestamps) are set by backend.
 *
 * @interface TaskCreate
 * @property {string} title - Task name (required)
 * @property {string} [description] - Optional task details
 * @property {string} [deadline] - Optional deadline (ISO date string)
 */
export interface TaskCreate {
  title: string; // Only required field
  description?: string;
  deadline?: string;
}

/**
 * Task Update Interface
 *
 * Data for updating an existing task.
 * All fields are optional - only send what changed.
 *
 * @interface TaskUpdate
 * @property {string} [title] - New task title
 * @property {string} [description] - New description
 * @property {TaskStatus} [status] - New status
 * @property {TaskPriority} [priority] - New priority
 * @property {string} [deadline] - New deadline
 *
 * Partial Update Pattern:
 * Only include fields you want to change:
 * - Change status only: { status: TaskStatus.COMPLETED }
 * - Change multiple: { title: "New", priority: TaskPriority.HIGH }
 */
export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  deadline?: string;
}

/**
 * Generic API Response Interface
 *
 * Standard response format from the backend API.
 * Uses TypeScript generics for type-safe responses.
 *
 * @interface ApiResponse
 * @template T - The type of data being returned
 * @property {string} status - Response status ("success" or "error")
 * @property {T} [data] - Single item response
 * @property {T[]} [items] - Array of items response
 * @property {number} [total] - Total count for pagination
 * @property {string} [message] - Human-readable message
 *
 * Usage Examples:
 * - Single task: ApiResponse<Task> → { status: "success", data: {...} }
 * - Task list: ApiResponse<Task> → { status: "success", items: [...], total: 10 }
 * - Login: ApiResponse<{user: User, token: string}>
 */
export interface ApiResponse<T> {
  status: string; // "success" | "error"
  data?: T; // Single item
  items?: T[]; // Multiple items
  total?: number; // Pagination total
  message?: string; // User-facing message
}

/**
 * Error Response Interface
 *
 * Standard error format from the backend API.
 *
 * @interface ErrorResponse
 * @property {string} message - Main error message
 * @property {Record<string, string[]>} [errors] - Field-specific validation errors
 *
 * Example:
 * {
 *   message: "Validation failed",
 *   errors: {
 *     email: ["Email already exists"],
 *     password: ["Password too short", "Must contain number"]
 *   }
 * }
 */
export interface ErrorResponse {
  message: string; // General error message
  errors?: Record<string, string[]>; // Field-level errors for forms
}
