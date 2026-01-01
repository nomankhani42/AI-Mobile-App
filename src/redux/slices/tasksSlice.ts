/**
 * Tasks Redux Slice
 *
 * Manages all task-related state using Redux Toolkit with optimistic UI updates.
 * This slice handles task CRUD operations (Create, Read, Update, Delete) and filtering.
 *
 * Key Features:
 * - Async thunks for API operations
 * - Optimistic UI updates for instant user feedback
 * - Task filtering by status
 * - Comprehensive error handling
 *
 * Redux Toolkit Concepts Used:
 * - createSlice: Simplifies reducer and action creation
 * - createAsyncThunk: Handles async operations (API calls)
 * - PayloadAction: Type-safe action with typed payload
 * - extraReducers: Handle actions created outside this slice (async thunks)
 *
 * Advanced Pattern: Optimistic Updates
 * - Updates UI immediately before API call completes
 * - Provides instant feedback to users
 * - Syncs with server response when API call completes
 * - Handles rollback on errors
 */

// Redux Toolkit imports
import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
// createSlice: Creates reducer + action creators automatically
// createAsyncThunk: Creates async action creators (handles pending/fulfilled/rejected)
// PayloadAction: Generic type for actions with payload

// Type definitions for tasks state and task models
import {TasksState, Task, TaskCreate, TaskUpdate, TaskStatus} from '../../types';
// TasksState: Shape of the entire tasks slice state
// Task: Full task object with all properties
// TaskCreate: Data needed to create a new task
// TaskUpdate: Partial task data for updates
// TaskStatus: Task status enum ('pending' | 'in_progress' | 'completed')

// API service for making HTTP requests
import {apiService} from '../../api/apiService';

/**
 * Initial Tasks State
 *
 * Defines the default state when app first loads.
 *
 * @property {Task[]} items - Array of all tasks
 * @property {boolean} isLoading - Whether a request is in progress
 * @property {string|null} error - Error message if operation fails
 * @property {TaskStatus|'all'} filter - Current filter ('all', 'pending', 'in_progress', 'completed')
 */
const initialState: TasksState = {
  items: [], // No tasks initially
  isLoading: false, // No loading state
  error: null, // No errors
  filter: 'all', // Show all tasks by default
};

/**
 * Fetch Tasks Async Thunk
 *
 * Retrieves all tasks from the server.
 *
 * createAsyncThunk automatically creates three action types:
 * - 'tasks/fetchTasks/pending': When API call starts
 * - 'tasks/fetchTasks/fulfilled': When API call succeeds
 * - 'tasks/fetchTasks/rejected': When API call fails
 *
 * Flow:
 * 1. Component dispatches: dispatch(fetchTasks())
 * 2. Thunk triggers: 'fetchTasks.pending' -> sets isLoading = true
 * 3. API call to GET /tasks
 * 4. On success: 'fetchTasks.fulfilled' -> replaces all tasks in state
 *    On error: 'fetchTasks.rejected' -> sets error message
 *
 * @param {void} _ - No parameters needed (underscore indicates unused)
 * @param {ThunkAPI} thunkAPI - Provides rejectWithValue for error handling
 * @returns {Promise<Task[]>} Resolves with array of tasks or rejects with error
 */
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks', // Action type prefix
  async (_, {rejectWithValue}) => {
    try {
      // Fetch all tasks from API
      return await apiService.getTasks();
    } catch (error: any) {
      // rejectWithValue passes error to the rejected action payload
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Create Task Async Thunk
 *
 * Creates a new task on the server.
 *
 * Optimistic Update Pattern:
 * For better UX, components can use 'optimisticAddTask' reducer BEFORE
 * calling this thunk to show the task immediately. Then this thunk
 * confirms with the server and replaces the optimistic task with the
 * real one (which includes server-generated ID and timestamps).
 *
 * Flow without optimistic updates:
 * 1. Component dispatches: dispatch(createTask({ title, description }))
 * 2. Thunk triggers: 'createTask.pending' -> sets isLoading = true
 * 3. API call to POST /tasks
 * 4. On success: 'createTask.fulfilled' -> adds task to items array
 *    On error: 'createTask.rejected' -> sets error message
 *
 * Flow WITH optimistic updates:
 * 1. Component dispatches: dispatch(optimisticAddTask(tempTask))
 *    -> Task appears in UI immediately with temporary ID
 * 2. Component dispatches: dispatch(createTask({ title, description }))
 * 3. API call happens in background
 * 4. On success: 'createTask.fulfilled' -> replaces temp task with real one
 *    On error: Need to remove optimistic task (refetch or manual removal)
 *
 * @param {TaskCreate} taskData - Task data (title, description, status, etc.)
 * @param {ThunkAPI} thunkAPI - Thunk API with rejectWithValue
 * @returns {Promise<Task>} Resolves with created task or rejects with error
 */
export const createTask = createAsyncThunk(
  'tasks/createTask', // Action type prefix
  async (taskData: TaskCreate, {rejectWithValue}) => {
    try {
      // Create task via API - server will add id, createdAt, updatedAt
      return await apiService.createTask(taskData);
    } catch (error: any) {
      // Handle creation errors (validation, network, etc.)
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Update Task Async Thunk
 *
 * Updates an existing task on the server.
 *
 * Optimistic Update Pattern (Recommended for this thunk):
 * This thunk is IDEAL for optimistic updates because:
 * - Updates are frequent (status changes, title edits)
 * - Users expect instant feedback
 * - Rollback on failure is straightforward (refetch tasks)
 *
 * Optimistic update flow:
 * 1. Component dispatches: dispatch(optimisticUpdateTask({ id, updates }))
 *    -> UI updates immediately (e.g., checkbox toggles)
 * 2. Component dispatches: dispatch(updateTask({ id, data }))
 *    -> API call happens in background
 * 3. User sees change instantly, no waiting
 * 4. On success: 'updateTask.fulfilled' -> confirms with server data
 *    On error: 'updateTask.rejected' -> dispatch(fetchTasks()) to rollback
 *
 * Without optimistic updates:
 * 1. User clicks checkbox
 * 2. Wait for API call (300ms - 2s)
 * 3. UI updates after response
 * Result: Feels slow and unresponsive
 *
 * @param {Object} params - Parameters object
 * @param {string} params.id - ID of task to update
 * @param {TaskUpdate} params.data - Partial task data to update
 * @param {ThunkAPI} thunkAPI - Thunk API with rejectWithValue
 * @returns {Promise<Task>} Resolves with updated task or rejects with error
 */
export const updateTask = createAsyncThunk(
  'tasks/updateTask', // Action type prefix
  async (
    {id, data}: {id: string; data: TaskUpdate},
    {rejectWithValue},
  ) => {
    try {
      // Update task via API - PATCH /tasks/:id
      // Server returns the fully updated task
      return await apiService.updateTask(id, data);
    } catch (error: any) {
      // Handle update errors (not found, validation, conflict, etc.)
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Delete Task Async Thunk
 *
 * Deletes a task from the server.
 *
 * Optimistic Delete Pattern:
 * Deletes work great with optimistic updates:
 * - User sees task disappear immediately
 * - If API fails, task reappears (via refetch)
 * - Provides satisfying instant feedback
 *
 * Optimistic delete flow:
 * 1. Component dispatches: dispatch(optimisticDeleteTask(taskId))
 *    -> Task removed from UI immediately
 * 2. Component dispatches: dispatch(deleteTask(taskId))
 *    -> API call happens in background
 * 3. Task is already gone from UI
 * 4. On success: 'deleteTask.fulfilled' -> confirms deletion
 *    On error: 'deleteTask.rejected' -> dispatch(fetchTasks()) to restore
 *
 * Why return the ID?
 * The API DELETE call usually returns no body (204 No Content).
 * We return the ID so the fulfilled reducer knows which task to remove.
 * This ensures the task is removed even if optimistic delete wasn't used.
 *
 * @param {string} id - ID of task to delete
 * @param {ThunkAPI} thunkAPI - Thunk API with rejectWithValue
 * @returns {Promise<string>} Resolves with deleted task ID or rejects with error
 */
export const deleteTask = createAsyncThunk(
  'tasks/deleteTask', // Action type prefix
  async (id: string, {rejectWithValue}) => {
    try {
      // Delete task via API - DELETE /tasks/:id
      await apiService.deleteTask(id);
      // Return ID so fulfilled reducer knows what to remove
      return id;
    } catch (error: any) {
      // Handle delete errors (not found, forbidden, etc.)
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Tasks Slice
 *
 * createSlice automatically generates:
 * - Action creators for each reducer
 * - A reducer function that handles all actions
 * - Action types following the pattern: 'tasks/actionName'
 *
 * This slice demonstrates the Optimistic UI pattern, which provides
 * instant feedback to users before server confirmation.
 */
const tasksSlice = createSlice({
  name: 'tasks', // Slice name - used as prefix for action types

  initialState, // Initial state defined above

  /**
   * Reducers
   *
   * These are synchronous actions that directly modify state.
   * Redux Toolkit uses Immer library, so we can "mutate" state directly.
   *
   * This slice includes two types of reducers:
   * 1. Regular reducers (setFilter, clearError)
   * 2. Optimistic update reducers (optimisticUpdateTask, etc.)
   *
   * Optimistic reducers update state immediately before API confirmation.
   */
  reducers: {
    /**
     * Set Filter Action
     *
     * Changes which tasks are displayed based on status.
     * This is purely a UI state change - no API call needed.
     *
     * Usage: dispatch(setFilter('completed'))
     *
     * @param {TasksState} state - Current tasks state
     * @param {PayloadAction} action - Contains filter value
     */
    setFilter: (state, action: PayloadAction<TaskStatus | 'all'>) => {
      state.filter = action.payload; // Update filter
      // Component will filter tasks based on this value
    },

    /**
     * Clear Error Action
     *
     * Removes error message from state.
     * Useful after showing error to user.
     *
     * Usage: dispatch(clearError())
     *
     * @param {TasksState} state - Current tasks state
     */
    clearError: state => {
      state.error = null; // Reset error to null
    },

    /**
     * Optimistic Update Task Action
     *
     * OPTIMISTIC UPDATE PATTERN - Updates task in state immediately,
     * before server confirms the change.
     *
     * Why use optimistic updates?
     * - Instant feedback: Users see changes immediately
     * - Better UX: No waiting for slow network
     * - Perceived performance: App feels faster
     *
     * When to use:
     * - Status changes (pending -> completed)
     * - Quick edits (title, description)
     * - Any update where failure is rare
     *
     * Error handling:
     * If API call fails, dispatch fetchTasks() to rollback to server state.
     *
     * Usage:
     * dispatch(optimisticUpdateTask({ id: '123', updates: { status: 'completed' } }))
     * dispatch(updateTask({ id: '123', data: { status: 'completed' } }))
     *
     * @param {TasksState} state - Current tasks state (Immer draft)
     * @param {PayloadAction} action - Contains task id and updates object
     */
    optimisticUpdateTask: (state, action: PayloadAction<{id: string; updates: Partial<Task>}>) => {
      // Find task in array by ID
      const index = state.items.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        // Merge updates into existing task
        // Uses spread operator to create updated task
        state.items[index] = {...state.items[index], ...action.payload.updates};
      }
      // If task not found, do nothing (might have been deleted)
    },

    /**
     * Optimistic Delete Task Action
     *
     * OPTIMISTIC DELETE PATTERN - Removes task from state immediately,
     * before server confirms deletion.
     *
     * Flow:
     * 1. User clicks delete button
     * 2. Task disappears from UI instantly
     * 3. API call happens in background
     * 4. If successful: Change is already visible
     *    If failed: Refetch tasks to restore deleted task
     *
     * This provides the most satisfying delete experience - instant feedback.
     *
     * Usage:
     * dispatch(optimisticDeleteTask('task-id-123'))
     * dispatch(deleteTask('task-id-123'))
     *
     * @param {TasksState} state - Current tasks state
     * @param {PayloadAction} action - Contains task ID to delete
     */
    optimisticDeleteTask: (state, action: PayloadAction<string>) => {
      // Filter out the task with matching ID
      state.items = state.items.filter(t => t.id !== action.payload);
      // Task is now removed from state and won't appear in UI
    },

    /**
     * Optimistic Add Task Action
     *
     * OPTIMISTIC CREATE PATTERN - Adds task to state immediately,
     * before server confirms creation.
     *
     * Flow:
     * 1. User submits new task form
     * 2. Create temporary task with client-generated ID
     * 3. Add to state immediately (appears in UI)
     * 4. API call happens in background
     * 5. When fulfilled, replace temp task with real one from server
     *
     * Why use temporary ID?
     * - Allows task to be displayed before server responds
     * - Can be referenced in UI (for animations, etc.)
     * - Will be replaced by server-generated ID when API responds
     *
     * Note: unshift() adds to beginning of array (newest tasks first)
     *
     * Usage:
     * const tempTask = { id: 'temp-' + Date.now(), ...taskData }
     * dispatch(optimisticAddTask(tempTask))
     * dispatch(createTask(taskData))
     *
     * @param {TasksState} state - Current tasks state
     * @param {PayloadAction} action - Contains task to add
     */
    optimisticAddTask: (state, action: PayloadAction<Task>) => {
      // Add task to beginning of array (newest first)
      state.items.unshift(action.payload);
      // Task now appears in UI with temporary ID
      // Will be replaced when createTask.fulfilled fires
    },
  },
  /**
   * Extra Reducers
   *
   * Handle actions created OUTSIDE this slice (async thunks).
   * Uses builder pattern for type-safe action handling.
   *
   * For each async thunk, we handle three lifecycle states:
   * - pending: Request started (show loading, clear errors)
   * - fulfilled: Request succeeded (update data, hide loading)
   * - rejected: Request failed (show error, hide loading)
   *
   * This section demonstrates how Redux Toolkit simplifies async state
   * management compared to traditional Redux.
   */
  extraReducers: builder => {
    builder
      /**
       * FETCH TASKS - Pending
       *
       * Triggered when fetchTasks API call starts.
       * Set loading state and clear previous errors.
       *
       * UX Impact: Shows loading spinner in component
       */
      .addCase(fetchTasks.pending, state => {
        state.isLoading = true; // Show loading indicator
        state.error = null; // Clear previous errors
      })

      /**
       * FETCH TASKS - Fulfilled
       *
       * Triggered when fetchTasks API call succeeds.
       * Replace entire tasks array with server response.
       *
       * Why replace instead of merge?
       * - Server is source of truth
       * - Handles deleted tasks (removes from state)
       * - Ensures data consistency
       *
       * @param {TasksState} state - Current state
       * @param {PayloadAction<Task[]>} action - Contains array of tasks
       */
      .addCase(fetchTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        state.isLoading = false; // Hide loading indicator
        state.items = action.payload; // Replace all tasks with server data
        // Any optimistic updates are now overwritten with server truth
      })

      /**
       * FETCH TASKS - Rejected
       *
       * Triggered when fetchTasks fails (network error, server error, etc.)
       * Store error message to display to user.
       *
       * @param {TasksState} state - Current state
       * @param {PayloadAction} action - Contains error message
       */
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false; // Hide loading indicator
        state.error = action.payload as string; // Store error message
        // items array remains unchanged (keeps last successful data)
      })
      /**
       * CREATE TASK - Pending
       *
       * Triggered when createTask API call starts.
       *
       * Note: If using optimistic updates, the task is already visible
       * in the UI from optimisticAddTask. This just sets loading state.
       */
      .addCase(createTask.pending, state => {
        state.isLoading = true; // Show loading indicator
        state.error = null; // Clear previous errors
      })

      /**
       * CREATE TASK - Fulfilled
       *
       * Triggered when createTask API call succeeds.
       * Add the newly created task to the beginning of the array.
       *
       * Server response vs optimistic task:
       * - Server task has real ID (optimistic had temp ID)
       * - Server task has accurate timestamps
       * - Server task may have additional computed fields
       *
       * If optimistic update was used:
       * This will add a duplicate task (one with temp ID, one with real ID).
       * The component should handle this or you should find and replace the
       * temp task. Alternative: Don't use optimistic create, or use unshift
       * only if no matching temp task exists.
       *
       * @param {TasksState} state - Current state
       * @param {PayloadAction<Task>} action - Contains newly created task
       */
      .addCase(createTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.isLoading = false; // Hide loading indicator
        state.items.unshift(action.payload); // Add new task to beginning
        // unshift() adds to start of array (newest tasks appear first)
      })

      /**
       * CREATE TASK - Rejected
       *
       * Triggered when createTask fails (validation error, network error, etc.)
       *
       * If optimistic update was used:
       * The temp task is still in state! Component should:
       * 1. Show error message
       * 2. Either remove temp task or refetch all tasks
       *
       * @param {TasksState} state - Current state
       * @param {PayloadAction} action - Contains error message
       */
      .addCase(createTask.rejected, (state, action) => {
        state.isLoading = false; // Hide loading indicator
        state.error = action.payload as string; // Store error message
        // Optimistic task remains in state - needs manual cleanup
      })
      /**
       * UPDATE TASK - Pending
       *
       * Triggered when updateTask API call starts.
       *
       * IMPORTANT DESIGN DECISION:
       * We DON'T set isLoading = true for updates.
       *
       * Why?
       * - Updates often use optimistic updates (change is already visible)
       * - Loading spinner would appear after change is shown (confusing!)
       * - Keeps UI responsive during background sync
       *
       * We only clear errors to prepare for potential new error.
       */
      .addCase(updateTask.pending, state => {
        state.error = null; // Clear previous errors
        // isLoading intentionally NOT set to keep UI responsive
        // Optimistic update already made the change visible
      })

      /**
       * UPDATE TASK - Fulfilled
       *
       * Triggered when updateTask API call succeeds.
       * Replace the optimistic task with server-confirmed data.
       *
       * Why replace instead of merge?
       * - Server might have updated additional fields (timestamps, etc.)
       * - Ensures complete data consistency
       * - Server is source of truth
       *
       * Optimistic update reconciliation:
       * 1. User clicks checkbox (optimistic update applied)
       * 2. API call happens in background
       * 3. This handler replaces optimistic data with server response
       * 4. Usually identical, but server data is authoritative
       *
       * @param {TasksState} state - Current state
       * @param {PayloadAction<Task>} action - Contains updated task from server
       */
      .addCase(updateTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.isLoading = false; // Ensure loading is cleared
        // Update with server response to ensure consistency
        const index = state.items.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          // Replace entire task with server response
          state.items[index] = action.payload;
          // This overwrites optimistic update with confirmed data
        }
        // If task not found, it may have been deleted - do nothing
      })

      /**
       * UPDATE TASK - Rejected
       *
       * Triggered when updateTask fails (validation, conflict, network, etc.)
       *
       * CRITICAL: Optimistic Update Rollback
       * The optimistic update is now WRONG (server rejected it).
       *
       * Rollback strategies:
       * 1. Refetch all tasks: dispatch(fetchTasks())
       *    - Simple and reliable
       *    - Overwrites ALL optimistic updates
       *    - Requires network call
       *
       * 2. Store previous state and revert:
       *    - More complex
       *    - Only reverts failed update
       *    - No network call needed
       *
       * This implementation expects component to call fetchTasks() on error.
       *
       * @param {TasksState} state - Current state
       * @param {PayloadAction} action - Contains error message
       */
      .addCase(updateTask.rejected, (state, action) => {
        state.isLoading = false; // Ensure loading is cleared
        state.error = action.payload as string; // Store error message
        // NOTE: Optimistic update is still in state (incorrect!)
        // Component should dispatch fetchTasks() to rollback
        // Alternative: Store original task and revert here
      })
      /**
       * DELETE TASK - Pending
       *
       * Triggered when deleteTask API call starts.
       *
       * DESIGN DECISION:
       * We DON'T set isLoading = true for deletes.
       *
       * Why?
       * - Deletes almost always use optimistic updates
       * - Task is already gone from UI (optimisticDeleteTask)
       * - Loading indicator would show for already-deleted task
       * - Keeps UI snappy and responsive
       */
      .addCase(deleteTask.pending, state => {
        state.error = null; // Clear previous errors
        // isLoading intentionally NOT set
        // Task already removed by optimisticDeleteTask
      })

      /**
       * DELETE TASK - Fulfilled
       *
       * Triggered when deleteTask API call succeeds.
       * Ensure task is removed from state.
       *
       * Redundant with optimistic delete?
       * Yes, but provides safety:
       * - If optimisticDeleteTask wasn't called, task still gets removed
       * - Confirms server deletion was successful
       * - Handles edge case where optimistic delete failed
       *
       * filter() returns new array without the deleted task.
       * Safe to call even if task already removed.
       *
       * @param {TasksState} state - Current state
       * @param {PayloadAction<string>} action - Contains ID of deleted task
       */
      .addCase(deleteTask.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false; // Ensure loading is cleared
        // Ensure task is removed (in case optimistic delete didn't fire)
        state.items = state.items.filter(t => t.id !== action.payload);
        // filter() is safe even if task already removed by optimistic delete
        // Guarantees task is gone regardless of optimistic update
      })

      /**
       * DELETE TASK - Rejected
       *
       * Triggered when deleteTask fails (not found, forbidden, network, etc.)
       *
       * CRITICAL: Optimistic Delete Rollback
       * The task was removed from UI but server rejected deletion!
       *
       * Rollback strategies:
       * 1. Refetch all tasks: dispatch(fetchTasks())
       *    - Simple and reliable
       *    - Restores deleted task
       *    - Also syncs any other changes
       *
       * 2. Store deleted task and re-add it:
       *    - More complex
       *    - Faster (no network call)
       *    - Need to store task before deleting
       *
       * This implementation expects component to call fetchTasks() on error.
       *
       * User experience on error:
       * 1. User deletes task (disappears immediately)
       * 2. API call fails
       * 3. Error message shown
       * 4. fetchTasks() called
       * 5. Task reappears (rollback complete)
       *
       * @param {TasksState} state - Current state
       * @param {PayloadAction} action - Contains error message
       */
      .addCase(deleteTask.rejected, (state, action) => {
        state.isLoading = false; // Ensure loading is cleared
        state.error = action.payload as string; // Store error message
        // NOTE: Task is missing from state (optimistic delete)
        // Component should dispatch fetchTasks() to restore it
        // Alternative: Store deleted task and re-add it here
      });
  },
});

/**
 * Export Action Creators
 *
 * These are automatically generated by createSlice.
 * Import and use them in components to dispatch actions.
 *
 * Regular Actions:
 * - setFilter: Change which tasks are displayed
 * - clearError: Clear error message from state
 *
 * Optimistic Update Actions:
 * - optimisticUpdateTask: Update task immediately (before server confirms)
 * - optimisticDeleteTask: Delete task immediately (before server confirms)
 * - optimisticAddTask: Add task immediately (before server confirms)
 *
 * Example Component Usage:
 *
 * import { setFilter, optimisticUpdateTask, updateTask } from './tasksSlice';
 *
 * // Change filter
 * dispatch(setFilter('completed'));
 *
 * // Optimistic update pattern
 * dispatch(optimisticUpdateTask({ id: task.id, updates: { status: 'completed' } }));
 * dispatch(updateTask({ id: task.id, data: { status: 'completed' } }))
 *   .unwrap()
 *   .catch(() => {
 *     // Rollback on error
 *     dispatch(fetchTasks());
 *   });
 *
 * // Non-optimistic update pattern
 * dispatch(updateTask({ id: task.id, data: { status: 'completed' } }))
 *   .unwrap()
 *   .then(() => {
 *     // Update confirmed
 *   })
 *   .catch((error) => {
 *     // Show error
 *   });
 */
export const {
  setFilter,
  clearError,
  optimisticUpdateTask,
  optimisticDeleteTask,
  optimisticAddTask,
} = tasksSlice.actions;

/**
 * Export Reducer
 *
 * This is imported in store.ts and combined with other reducers.
 * The reducer function handles all tasks actions and returns new state.
 *
 * Store Configuration:
 * import tasksReducer from './slices/tasksSlice';
 *
 * const store = configureStore({
 *   reducer: {
 *     tasks: tasksReducer,  // State accessible via state.tasks
 *     auth: authReducer,
 *   },
 * });
 *
 * Accessing State in Components:
 * import { useSelector } from 'react-redux';
 *
 * const tasks = useSelector(state => state.tasks.items);
 * const isLoading = useSelector(state => state.tasks.isLoading);
 * const filter = useSelector(state => state.tasks.filter);
 */
export default tasksSlice.reducer;
