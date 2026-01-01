import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {TasksState, Task, TaskCreate, TaskUpdate, TaskStatus} from '../../types';
import {apiService} from '../../api/apiService';

const initialState: TasksState = {
  items: [],
  isLoading: false,
  error: null,
  filter: 'all',
};

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, {rejectWithValue}) => {
    try {
      return await apiService.getTasks();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: TaskCreate, {rejectWithValue}) => {
    try {
      return await apiService.createTask(taskData);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async (
    {id, data}: {id: string; data: TaskUpdate},
    {rejectWithValue},
  ) => {
    try {
      return await apiService.updateTask(id, data);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id: string, {rejectWithValue}) => {
    try {
      await apiService.deleteTask(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<TaskStatus | 'all'>) => {
      state.filter = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
    // Optimistic update for task status changes
    optimisticUpdateTask: (state, action: PayloadAction<{id: string; updates: Partial<Task>}>) => {
      const index = state.items.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = {...state.items[index], ...action.payload.updates};
      }
    },
    // Optimistic delete
    optimisticDeleteTask: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(t => t.id !== action.payload);
    },
    // Add new task optimistically
    optimisticAddTask: (state, action: PayloadAction<Task>) => {
      state.items.unshift(action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchTasks.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createTask.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.isLoading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateTask.pending, state => {
        state.error = null;
        // Don't set isLoading for updates to keep UI responsive
      })
      .addCase(updateTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.isLoading = false;
        // Update with server response to ensure consistency
        const index = state.items.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // Note: Rollback will be handled by refetching tasks on error
      })
      .addCase(deleteTask.pending, state => {
        state.error = null;
        // Don't set isLoading for deletes to keep UI responsive
      })
      .addCase(deleteTask.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        // Ensure task is removed (in case optimistic delete didn't fire)
        state.items = state.items.filter(t => t.id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // Note: Rollback will be handled by refetching tasks on error
      });
  },
});

export const {
  setFilter,
  clearError,
  optimisticUpdateTask,
  optimisticDeleteTask,
  optimisticAddTask,
} = tasksSlice.actions;
export default tasksSlice.reducer;
