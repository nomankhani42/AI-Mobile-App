/**
 * HomeScreen.tsx
 *
 * Purpose:
 * Main dashboard screen showing user's tasks in a list view with filtering options.
 * Central hub for task management with quick access to AI chat and task creation.
 *
 * Key Features:
 * - Task list with pull-to-refresh
 * - Filter tabs (All, Pending, In Progress, Completed)
 * - Optimistic UI updates for instant feedback
 * - Multiple action modals (Add Task, Chat, Status Change, Delete Confirm)
 * - Real-time sync with AI chat (refetches after AI modifications)
 * - Floating action buttons for quick access
 *
 * State Management:
 * - Redux for tasks, auth, and chat state
 * - Local state for modal visibility and selected task
 * - Optimistic updates: UI changes immediately, then syncs with server
 *
 * Learning Focus:
 * - FlatList with RefreshControl for pull-to-refresh
 * - Modal management patterns
 * - Optimistic UI updates (update UI before API confirms)
 * - Redux selectors for multiple slices
 * - Real-time data synchronization
 */

import React, {useState, useEffect} from 'react';

/**
 * React Native Core Components
 *
 * FlatList: Performant scrolling list (virtualizes items)
 * RefreshControl: Pull-to-refresh functionality
 * Alert: Native alert dialogs
 */
import {View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert} from 'react-native';

/**
 * Redux Integration
 */
import {useAppDispatch, useAppSelector} from '../redux/hooks';

/**
 * Redux Actions - Task Management
 *
 * fetchTasks: Fetch all tasks from API
 * updateTask: Update task on server
 * deleteTask: Delete task from server
 * setFilter: Change active filter (all/pending/in-progress/completed)
 * optimisticUpdateTask: Update UI immediately before API call
 * optimisticDeleteTask: Remove from UI immediately before API call
 */
import {
  fetchTasks,
  updateTask,
  deleteTask,
  setFilter,
  optimisticUpdateTask,
  optimisticDeleteTask,
} from '../redux/slices/tasksSlice';

/**
 * Redux Actions - Auth
 */
import {logout} from '../redux/slices/authSlice';

/**
 * Custom Components
 * All imported from ../components directory
 */
import {TaskCard} from '../components/TaskCard';
import {FloatingChatButton} from '../components/FloatingChatButton';
import {FloatingAddButton} from '../components/FloatingAddButton';
import {ChatModal} from '../components/ChatModal';
import {AddTaskModal} from '../components/AddTaskModal';
import {StatusDropdown} from '../components/StatusDropdown';
import {DeleteConfirmModal} from '../components/DeleteConfirmModal';

/**
 * Constants and Types
 */
import {COLORS} from '../utils/colors';
import {TASK_FILTERS} from '../utils/constants';
import {TaskStatus, Task} from '../types';

/**
 * HomeScreen Component
 *
 * Main application screen after authentication.
 *
 * Modal Management:
 * - Separate visibility state for each modal
 * - selectedTask tracks which task is being modified
 * - Modals close and refetch data on completion
 *
 * Optimistic Updates:
 * - UI updates immediately when user takes action
 * - API call happens in background
 * - If API fails, data is refetched to restore correct state
 * - Provides instant feedback, better UX
 *
 * Navigation:
 * - No navigation prop needed (this is a tab/stack screen)
 * - Uses Redux logout action to trigger auth flow
 */
export const HomeScreen = () => {
  /**
   * Modal Visibility State
   *
   * Controls which modal is currently displayed.
   * Only one modal can be visible at a time.
   */
  const [chatVisible, setChatVisible] = useState(false);
  const [addTaskVisible, setAddTaskVisible] = useState(false);
  const [statusDropdownVisible, setStatusDropdownVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  /**
   * Selected Task State
   *
   * Tracks which task is being modified (status change or delete).
   * Null when no task is selected.
   */
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  /**
   * Pull-to-Refresh State
   *
   * Controls RefreshControl loading indicator
   */
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Redux State Selection
   *
   * tasks: Array of task items from Redux store
   * filter: Current active filter (all, pending, in-progress, completed)
   * user: Current authenticated user
   * messages: Chat messages (used to detect AI task modifications)
   */
  const dispatch = useAppDispatch();
  const {items: tasks, filter} = useAppSelector(state => state.tasks);
  const {user} = useAppSelector(state => state.auth);
  const {messages} = useAppSelector(state => state.chat);

  /**
   * Initial Tasks Fetch Effect
   *
   * Runs once on component mount to load tasks.
   * Dependencies: [dispatch] (stable, won't cause re-runs)
   */
  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  /**
   * Real-time Sync Effect
   *
   * Purpose: Refetch tasks after AI chat modifies them
   *
   * Dependencies: [messages.length, chatVisible, dispatch]
   * - Triggers when new message is added (messages.length changes)
   * - Only refetches when chat is closed (chatVisible === false)
   * - Ensures task list reflects AI-created/modified tasks
   *
   * Why this works:
   * - AI responses create/modify tasks via backend
   * - Backend state changes aren't automatically synced to Redux
   * - This effect detects new messages and refetches to sync state
   */
  useEffect(() => {
    if (messages.length > 0 && !chatVisible) {
      // Only refetch if chat modal is closed and we have messages
      dispatch(fetchTasks());
    }
  }, [messages.length, chatVisible, dispatch]);

  /**
   * Pull-to-Refresh Handler
   *
   * Flow:
   * 1. Set refreshing state to true (shows spinner)
   * 2. Dispatch fetchTasks action
   * 3. Wait for API response (unwrap)
   * 4. Set refreshing to false (hides spinner)
   *
   * RefreshControl displays native pull-to-refresh UI
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchTasks()).unwrap();
    setRefreshing(false);
  };

  /**
   * Task Press Handler
   *
   * Shows task details in native alert dialog.
   * Simple implementation - could be replaced with modal for richer UI.
   */
  const handleTaskPress = (task: Task) => {
    Alert.alert(
      task.title,
      task.description || 'No description',
      [
        {text: 'Close', style: 'cancel'},
      ],
    );
  };

  /**
   * Delete Press Handler
   *
   * Opens delete confirmation modal.
   * Stores selected task for deletion.
   */
  const handleDeletePress = (task: Task) => {
    setSelectedTask(task);
    setDeleteModalVisible(true);
  };

  /**
   * Delete Confirm Handler
   *
   * Demonstrates OPTIMISTIC UPDATE pattern:
   *
   * 1. Optimistic Update: Remove from UI immediately
   *    - Provides instant feedback
   *    - User sees result right away
   *
   * 2. API Call: Delete on server
   *    - Happens in background
   *    - User doesn't wait for network
   *
   * 3. Error Handling: Restore on failure
   *    - If API fails, refetch to restore correct state
   *    - Show error alert to user
   *
   * This pattern makes app feel fast and responsive.
   */
  const handleDeleteConfirm = async () => {
    if (!selectedTask) return;

    try {
      console.log('[HomeScreen] Deleting task:', selectedTask.id);

      // Optimistically remove from UI immediately
      dispatch(optimisticDeleteTask(selectedTask.id));
      setDeleteModalVisible(false);
      setSelectedTask(null);

      // Make API call
      await dispatch(deleteTask(selectedTask.id)).unwrap();
    } catch (error) {
      console.error('[HomeScreen] Delete failed:', error);
      // Refetch to restore the task if delete failed
      dispatch(fetchTasks());
      Alert.alert('Error', 'Failed to delete task');
    }
  };

  /**
   * Status Press Handler
   *
   * Opens status dropdown modal for changing task status.
   */
  const handleStatusPress = (task: Task) => {
    setSelectedTask(task);
    setStatusDropdownVisible(true);
  };

  /**
   * Status Select Handler
   *
   * Updates task status using OPTIMISTIC UPDATE pattern.
   * Same pattern as delete: update UI first, then sync with API.
   *
   * If API fails, refetch restores correct state.
   */
  const handleStatusSelect = async (status: TaskStatus) => {
    if (!selectedTask) return;

    try {
      console.log('[HomeScreen] Updating task status:', selectedTask.id, status);

      // Optimistically update UI immediately
      dispatch(optimisticUpdateTask({id: selectedTask.id, updates: {status}}));
      setSelectedTask(null);
      setStatusDropdownVisible(false);

      // Make API call
      await dispatch(updateTask({id: selectedTask.id, data: {status}})).unwrap();
    } catch (error) {
      console.error('[HomeScreen] Update failed:', error);
      // Refetch to restore correct state if update failed
      dispatch(fetchTasks());
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  /**
   * Filtered Tasks Computation
   *
   * Filters task list based on active filter.
   * - 'all': Shows all tasks
   * - Other values: Filters by task status (pending, in-progress, completed)
   *
   * This could be memoized with useMemo for performance,
   * but filter operation is fast enough for typical task lists.
   */
  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter(t => t.status === filter);

  /**
   * Render Method
   *
   * Layout Structure:
   * 1. Header: App title, user email, logout button
   * 2. Filter Tabs: All, Pending, In Progress, Completed
   * 3. FlatList: Scrollable task list with pull-to-refresh
   * 4. Floating Buttons: Add Task, AI Chat
   * 5. Modals: Add Task, Chat, Status Dropdown, Delete Confirm
   *
   * FlatList Props:
   * - data: Array of tasks to render
   * - renderItem: Function that renders each task
   * - keyExtractor: Unique key for each item (task.id)
   * - refreshControl: Pull-to-refresh component
   * - ListEmptyComponent: Shown when no tasks exist
   *
   * FlatList Performance:
   * - Virtualizes items (only renders visible items)
   * - Reuses item components as user scrolls
   * - Much better than ScrollView for long lists
   */
  return (
    <View style={styles.container}>
      {/* Header with app branding and logout */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>TaskMaster</Text>
          <Text style={styles.headerSubtitle}>{user?.email}</Text>
        </View>
        <TouchableOpacity onPress={() => dispatch(logout())} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs for task status */}
      <View style={styles.filters}>
        {TASK_FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterButton, filter === f.value && styles.filterButtonActive]}
            onPress={() => dispatch(setFilter(f.value as TaskStatus | 'all'))}>
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/**
       * FlatList - Main Task List
       *
       * renderItem: Renders TaskCard component for each task
       * - TaskCard receives task data and event handlers
       * - Event handlers are passed as props for clean separation
       *
       * RefreshControl: Native pull-to-refresh
       * - Triggers onRefresh when user pulls down
       * - Shows spinner while refreshing state is true
       *
       * ListEmptyComponent: Shown when filteredTasks is empty
       * - Provides guidance to user on how to create tasks
       */}
      <FlatList
        data={filteredTasks}
        renderItem={({item}) => (
          <TaskCard
            task={item}
            onPress={() => handleTaskPress(item)}
            onStatusToggle={() => handleStatusPress(item)}
            onDelete={() => handleDeletePress(item)}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>Tap the + or chat button to create your first task!</Text>
          </View>
        }
      />

      {/* Floating action buttons positioned absolutely */}
      <FloatingAddButton onPress={() => setAddTaskVisible(true)} />
      <FloatingChatButton onPress={() => setChatVisible(true)} />

      {/**
       * Modal Components
       *
       * Modal Pattern:
       * - Controlled by local state (visible prop)
       * - onClose callback closes modal and refetches data
       * - Data refetch ensures UI shows latest changes
       *
       * Why Refetch in onClose:
       * - Modals make changes on backend
       * - Redux state may be stale after modal actions
       * - Refetch syncs Redux state with backend
       */}
      <AddTaskModal
        visible={addTaskVisible}
        onClose={() => {
          setAddTaskVisible(false);
          // Refetch tasks when modal closes to show newly created task
          dispatch(fetchTasks());
        }}
      />
      <ChatModal
        visible={chatVisible}
        onClose={() => {
          setChatVisible(false);
          // Refetch tasks when chat closes to show any AI-created/modified tasks
          dispatch(fetchTasks());
        }}
      />

      <StatusDropdown
        visible={statusDropdownVisible}
        currentStatus={selectedTask?.status || TaskStatus.PENDING}
        onSelect={handleStatusSelect}
        onClose={() => {
          setStatusDropdownVisible(false);
          setSelectedTask(null);
        }}
      />

      <DeleteConfirmModal
        visible={deleteModalVisible}
        taskTitle={selectedTask?.title || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalVisible(false);
          setSelectedTask(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  header: {backgroundColor: COLORS.primary, paddingVertical: 16, paddingHorizontal: 20, paddingTop: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  headerTitle: {fontSize: 24, fontWeight: 'bold', color: '#FFF'},
  headerSubtitle: {fontSize: 12, color: '#FFF', opacity: 0.8, marginTop: 4},
  logoutButton: {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)'},
  logoutText: {color: '#FFF', fontSize: 14, fontWeight: '600'},
  filters: {flexDirection: 'row', padding: 16, gap: 8},
  filterButton: {flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#FFF', alignItems: 'center'},
  filterButtonActive: {backgroundColor: COLORS.primary},
  filterText: {fontSize: 14, color: COLORS.text, fontWeight: '500'},
  filterTextActive: {color: '#FFF'},
  list: {paddingBottom: 100},
  empty: {alignItems: 'center', paddingTop: 100, paddingHorizontal: 40},
  emptyIcon: {fontSize: 64, marginBottom: 16},
  emptyText: {fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 8},
  emptySubtext: {fontSize: 14, color: COLORS.textSecondary, textAlign: 'center'},
});
