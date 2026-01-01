import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {ChatState, Message} from '../../types';
import {apiService} from '../../api/apiService';

const initialState: ChatState = {
  messages: [],
  isTyping: false,
  error: null,
};

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (messageText: string, {rejectWithValue, dispatch}) => {
    try {
      console.log('[chatSlice] Sending message to API:', messageText);
      const response = await apiService.sendChatMessage(messageText);
      console.log('[chatSlice] API response received:', response);

      // If a task was created or updated, refresh the tasks list
      if (response.action === 'create' || response.action === 'update' || response.action === 'delete') {
        console.log('[chatSlice] Task action detected, refreshing tasks...');
        // Import fetchTasks dynamically to avoid circular dependency
        const {fetchTasks} = await import('./tasksSlice');
        dispatch(fetchTasks());
      }

      return response;
    } catch (error: any) {
      console.error('[chatSlice] API error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to send message';
      console.error('[chatSlice] Error message:', errorMsg);
      return rejectWithValue(errorMsg);
    }
  },
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addUserMessage: (state, action: PayloadAction<string>) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: action.payload,
        isUser: true,
        timestamp: Date.now(),
      };
      state.messages.push(newMessage);
    },
    addBotMessage: (state, action: PayloadAction<string>) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: action.payload,
        isUser: false,
        timestamp: Date.now(),
      };
      state.messages.push(newMessage);
    },
    clearMessages: state => {
      state.messages = [];
      state.error = null;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(sendMessage.pending, state => {
        console.log('[chatSlice] sendMessage.pending - setting isTyping to true');
        state.isTyping = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action: PayloadAction<any>) => {
        console.log('[chatSlice] sendMessage.fulfilled - received payload:', action.payload);
        state.isTyping = false;
        const botMessage: Message = {
          id: Date.now().toString(),
          text: action.payload.message || action.payload,
          isUser: false,
          timestamp: Date.now(),
        };
        state.messages.push(botMessage);
        console.log('[chatSlice] Bot message added, total messages:', state.messages.length);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        console.log('[chatSlice] sendMessage.rejected - error:', action.payload);
        state.isTyping = false;
        state.error = action.payload as string;
      });
  },
});

export const {addUserMessage, addBotMessage, clearMessages, clearError} =
  chatSlice.actions;
export default chatSlice.reducer;
