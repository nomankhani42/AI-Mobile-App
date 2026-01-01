import React, {useState, useEffect} from 'react';
import {View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert} from 'react-native';
import {useAppDispatch, useAppSelector} from '../redux/hooks';
import {
  fetchTasks,
  updateTask,
  deleteTask,
  setFilter,
  optimisticUpdateTask,
  optimisticDeleteTask,
} from '../redux/slices/tasksSlice';
import {logout} from '../redux/slices/authSlice';
import {TaskCard} from '../components/TaskCard';
import {FloatingChatButton} from '../components/FloatingChatButton';
import {FloatingAddButton} from '../components/FloatingAddButton';
import {ChatModal} from '../components/ChatModal';
import {AddTaskModal} from '../components/AddTaskModal';
import {StatusDropdown} from '../components/StatusDropdown';
import {DeleteConfirmModal} from '../components/DeleteConfirmModal';
import {COLORS} from '../utils/colors';
import {TASK_FILTERS} from '../utils/constants';
import {TaskStatus, Task} from '../types';

export const HomeScreen = () => {
  const [chatVisible, setChatVisible] = useState(false);
  const [addTaskVisible, setAddTaskVisible] = useState(false);
  const [statusDropdownVisible, setStatusDropdownVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useAppDispatch();
  const {items: tasks, filter} = useAppSelector(state => state.tasks);
  const {user} = useAppSelector(state => state.auth);
  const {messages} = useAppSelector(state => state.chat);

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  // Refetch tasks when chat messages change (real-time updates after AI creates/modifies tasks)
  useEffect(() => {
    if (messages.length > 0 && !chatVisible) {
      // Only refetch if chat modal is closed and we have messages
      dispatch(fetchTasks());
    }
  }, [messages.length, chatVisible, dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchTasks()).unwrap();
    setRefreshing(false);
  };

  const handleTaskPress = (task: Task) => {
    Alert.alert(
      task.title,
      task.description || 'No description',
      [
        {text: 'Close', style: 'cancel'},
      ],
    );
  };

  const handleDeletePress = (task: Task) => {
    setSelectedTask(task);
    setDeleteModalVisible(true);
  };

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

  const handleStatusPress = (task: Task) => {
    setSelectedTask(task);
    setStatusDropdownVisible(true);
  };

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

  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter(t => t.status === filter);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>TaskMaster</Text>
          <Text style={styles.headerSubtitle}>{user?.email}</Text>
        </View>
        <TouchableOpacity onPress={() => dispatch(logout())} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

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

      <FloatingAddButton onPress={() => setAddTaskVisible(true)} />
      <FloatingChatButton onPress={() => setChatVisible(true)} />

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
