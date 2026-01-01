/**
 * Chat Redux Slice
 *
 * Manages all chat-related state using Redux Toolkit.
 * This slice handles sending messages to the AI assistant, displaying bot responses,
 * and managing the conversation history.
 *
 * Key Features:
 * - Real-time conversation flow with typing indicators
 * - Integration with backend AI assistant API
 * - Cross-slice communication (triggers task refresh when tasks are modified via chat)
 * - Optimistic UI updates (user message appears immediately)
 *
 * Redux Toolkit Concepts Used:
 * - createSlice: Simplifies reducer and action creation
 * - createAsyncThunk: Handles async operations (API calls)
 * - PayloadAction: Type-safe action with typed payload
 * - extraReducers: Handle actions created outside this slice (async thunks)
 * - Cross-slice dispatch: Dispatching actions from other slices (advanced pattern)
 */

// Redux Toolkit imports
import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
// createSlice: Creates reducer + action creators automatically
// createAsyncThunk: Creates async action creators (handles pending/fulfilled/rejected)
// PayloadAction: Generic type for actions with payload

// Type definitions for chat state and message structure
import {ChatState, Message} from '../../types';

// API service for making HTTP requests to chat endpoint
import {apiService} from '../../api/apiService';

/**
 * Initial Chat State
 *
 * Defines the default state when app first loads or when chat is cleared.
 *
 * @property {Message[]} messages - Array of chat messages (both user and bot)
 * @property {boolean} isTyping - Whether bot is currently "typing" (processing response)
 * @property {string|null} error - Error message if chat request fails
 */
const initialState: ChatState = {
  messages: [], // Empty conversation initially
  isTyping: false, // No typing indicator
  error: null, // No errors
};

/**
 * Send Message Async Thunk
 *
 * Sends a user message to the AI assistant API and handles the response.
 * This is the core of the chat functionality and demonstrates several advanced patterns.
 *
 * CROSS-SLICE DISPATCH PATTERN:
 * This thunk demonstrates an advanced Redux pattern where one slice dispatches
 * actions from another slice. When the chat bot performs task operations
 * (create/update/delete), we need to refresh the tasks list to show the changes.
 *
 * Why cross-slice dispatch?
 * - Tasks can be modified through chat OR through the tasks screen
 * - Both places need to stay in sync with the backend
 * - Instead of duplicating task refresh logic, we reuse fetchTasks from tasksSlice
 *
 * Dynamic Import Pattern:
 * We use dynamic import to avoid circular dependency issues:
 * - chatSlice imports tasksSlice (to get fetchTasks)
 * - If tasksSlice imports chatSlice, we have a circular dependency
 * - Dynamic import breaks this cycle by loading tasksSlice only when needed
 *
 * ThunkAPI Parameters:
 * @param {string} messageText - The user's message to send
 * @param {ThunkAPI} thunkAPI - Provides:
 *   - rejectWithValue: For error handling
 *   - dispatch: To dispatch other actions (cross-slice communication)
 *   - getState: Access to entire Redux state (not used here)
 *
 * Response Flow:
 * 1. User types message and hits send
 * 2. Component dispatches: dispatch(sendMessage("create task"))
 * 3. Pending state: isTyping = true (bot appears to be thinking)
 * 4. API call made to backend AI assistant
 * 5. Backend processes message and may perform task operations
 * 6. Response includes: { message: "Task created!", action: "create" }
 * 7. If action exists, we dispatch fetchTasks() to refresh task list
 * 8. Fulfilled state: bot message added, isTyping = false
 *
 * @returns {Promise} Resolves with API response or rejects with error message
 */
export const sendMessage = createAsyncThunk(
  'chat/sendMessage', // Action type prefix
  async (messageText: string, {rejectWithValue, dispatch}) => {
    try {
      console.log('[chatSlice] Sending message to API:', messageText);

      // Call API service to send message to AI assistant
      const response = await apiService.sendChatMessage(messageText);
      console.log('[chatSlice] API response received:', response);

      /**
       * CROSS-SLICE INTERACTION:
       * Check if the bot performed a task-related action.
       * The API response includes an 'action' field indicating what the bot did:
       * - 'create': Bot created a new task
       * - 'update': Bot modified an existing task
       * - 'delete': Bot removed a task
       */
      if (response.action === 'create' || response.action === 'update' || response.action === 'delete') {
        console.log('[chatSlice] Task action detected, refreshing tasks...');

        /**
         * Dynamic Import to Avoid Circular Dependency:
         *
         * Problem: If we import fetchTasks at the top:
         *   import { fetchTasks } from './tasksSlice';
         *
         * And tasksSlice imports something from chatSlice, we get:
         *   chatSlice -> tasksSlice -> chatSlice (circular!)
         *
         * Solution: Import fetchTasks only when needed (at runtime):
         *   const { fetchTasks } = await import('./tasksSlice');
         *
         * Benefits:
         * - Breaks circular dependency
         * - Loads tasksSlice code only when task action occurs
         * - Still gets full TypeScript type safety
         */
        const {fetchTasks} = await import('./tasksSlice');

        /**
         * Dispatch fetchTasks to refresh task list:
         * This is a cross-slice dispatch - we're dispatching an action from
         * a different slice (tasksSlice) while inside chatSlice.
         *
         * This keeps task data in sync across the app:
         * - Chat screen shows updated task in conversation
         * - Tasks screen shows the same updated task in list
         * - Both use the same source of truth (Redux store)
         */
        dispatch(fetchTasks());
      }

      // Return response to be used in fulfilled action payload
      return response;
    } catch (error: any) {
      console.error('[chatSlice] API error:', error);

      // Extract error message from various possible error formats
      const errorMsg = error.response?.data?.message || error.message || 'Failed to send message';
      console.error('[chatSlice] Error message:', errorMsg);

      // rejectWithValue passes error to the rejected action payload
      return rejectWithValue(errorMsg);
    }
  },
);

/**
 * Chat Slice
 *
 * createSlice automatically generates:
 * - Action creators for each reducer
 * - A reducer function that handles all actions
 * - Action types following the pattern: 'chat/actionName'
 *
 * This slice manages the conversation UI and state, while sendMessage
 * handles the API communication.
 */
const chatSlice = createSlice({
  name: 'chat', // Slice name - used as prefix for action types

  initialState, // Initial state defined above

  /**
   * Reducers
   *
   * These are synchronous actions that directly modify state.
   * Redux Toolkit uses Immer library, so we can "mutate" state directly.
   *
   * CHAT MESSAGE FLOW (Optimistic UI Pattern):
   * 1. User types message and presses send
   * 2. Component dispatches addUserMessage() - message appears immediately
   * 3. Component dispatches sendMessage() - API call starts
   * 4. While waiting, isTyping indicator shows (see extraReducers)
   * 5. When API responds, bot message is added (see extraReducers)
   *
   * This pattern makes the UI feel instant even though API call takes time.
   */
  reducers: {
    /**
     * Add User Message Action
     *
     * Adds a user message to the conversation immediately (optimistic update).
     * This is called BEFORE sendMessage API call, so user sees their message
     * appear instantly without waiting for the server.
     *
     * Usage: dispatch(addUserMessage("Hello, bot!"))
     *
     * Message Structure:
     * - id: Unique identifier (timestamp-based)
     * - text: The actual message content
     * - isUser: true = user message, false = bot message
     * - timestamp: When message was created (for sorting/display)
     *
     * @param {ChatState} state - Current chat state (Immer draft)
     * @param {PayloadAction<string>} action - Contains message text in payload
     */
    addUserMessage: (state, action: PayloadAction<string>) => {
      const newMessage: Message = {
        id: Date.now().toString(), // Simple unique ID
        text: action.payload, // User's message text
        isUser: true, // Mark as user message
        timestamp: Date.now(), // Current time
      };
      state.messages.push(newMessage); // Add to messages array
    },

    /**
     * Add Bot Message Action
     *
     * Manually adds a bot message to the conversation.
     * This is used for local bot messages (errors, system messages, etc.)
     * NOT for API responses - those are handled by sendMessage.fulfilled
     *
     * Usage: dispatch(addBotMessage("Sorry, I didn't understand that"))
     *
     * When to use this vs sendMessage?
     * - Use this: For immediate local messages (no API call)
     * - Use sendMessage: For messages that need AI processing
     *
     * @param {ChatState} state - Current chat state
     * @param {PayloadAction<string>} action - Contains message text
     */
    addBotMessage: (state, action: PayloadAction<string>) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: action.payload,
        isUser: false, // Mark as bot message
        timestamp: Date.now(),
      };
      state.messages.push(newMessage);
    },

    /**
     * Clear Messages Action
     *
     * Removes all messages from the conversation and clears errors.
     * Useful for "Start new conversation" feature.
     *
     * Usage: dispatch(clearMessages())
     *
     * Note: This only clears local state, not backend conversation history.
     * If your backend maintains conversation context, you may need to
     * also call an API endpoint to reset the conversation.
     *
     * @param {ChatState} state - Current chat state
     */
    clearMessages: state => {
      state.messages = []; // Empty the messages array
      state.error = null; // Clear any errors
    },

    /**
     * Clear Error Action
     *
     * Removes error message from state.
     * Useful after showing error to user in a toast/alert.
     *
     * Usage: dispatch(clearError())
     *
     * @param {ChatState} state - Current chat state
     */
    clearError: state => {
      state.error = null; // Reset error to null
    },
  },

  /**
   * Extra Reducers
   *
   * Handle actions created OUTSIDE this slice (the sendMessage async thunk).
   * Uses builder pattern for type-safe action handling.
   *
   * For the sendMessage async thunk, we handle three cases:
   * - pending: API call started (show typing indicator)
   * - fulfilled: API call succeeded (add bot message)
   * - rejected: API call failed (show error)
   *
   * This is the second half of the chat message flow (after optimistic user message).
   */
  extraReducers: builder => {
    builder
      /**
       * Send Message Pending
       *
       * Triggered when sendMessage API call starts.
       * Show typing indicator to let user know bot is processing their message.
       *
       * Visual Effect:
       * - User sees "..." or typing animation
       * - Indicates the bot is "thinking" or processing
       * - Provides feedback that request is in progress
       *
       * @param {ChatState} state - Current chat state
       */
      .addCase(sendMessage.pending, state => {
        console.log('[chatSlice] sendMessage.pending - setting isTyping to true');
        state.isTyping = true; // Show typing indicator
        state.error = null; // Clear previous errors
      })

      /**
       * Send Message Fulfilled
       *
       * Triggered when sendMessage API call succeeds.
       * Add the bot's response message to the conversation.
       *
       * API Response Format:
       * {
       *   message: "I've created the task for you!",
       *   action: "create", // Optional: what action bot performed
       *   taskId: "123"     // Optional: related task ID
       * }
       *
       * Note: The cross-slice dispatch (fetching tasks) already happened
       * in the thunk itself. Here we only handle updating chat state.
       *
       * @param {ChatState} state - Current chat state
       * @param {PayloadAction<any>} action - Contains API response in payload
       */
      .addCase(sendMessage.fulfilled, (state, action: PayloadAction<any>) => {
        console.log('[chatSlice] sendMessage.fulfilled - received payload:', action.payload);
        state.isTyping = false; // Hide typing indicator

        // Create bot message from API response
        const botMessage: Message = {
          id: Date.now().toString(),
          // API returns { message: "..." } or just a string
          text: action.payload.message || action.payload,
          isUser: false, // This is a bot message
          timestamp: Date.now(),
        };

        // Add bot message to conversation
        state.messages.push(botMessage);
        console.log('[chatSlice] Bot message added, total messages:', state.messages.length);
      })

      /**
       * Send Message Rejected
       *
       * Triggered when sendMessage API call fails.
       * Could be due to network error, server error, or validation error.
       *
       * Common Errors:
       * - Network timeout: "Failed to send message"
       * - Server error: "Internal server error"
       * - Authentication: "Unauthorized - please log in again"
       *
       * Error Handling Strategy:
       * - Store error in state for display in UI
       * - Hide typing indicator
       * - User's message remains in conversation
       * - User can retry sending
       *
       * @param {ChatState} state - Current chat state
       * @param {PayloadAction} action - Contains error message in payload
       */
      .addCase(sendMessage.rejected, (state, action) => {
        console.log('[chatSlice] sendMessage.rejected - error:', action.payload);
        state.isTyping = false; // Hide typing indicator
        state.error = action.payload as string; // Store error message
        // Note: User's message is still visible (added via addUserMessage)
        // This allows them to see what they tried to send
      });
  },
});

/**
 * Export Action Creators
 *
 * These are automatically generated by createSlice.
 * Import and use them in components to dispatch actions.
 *
 * Typical Usage in ChatScreen Component:
 *
 * const handleSendMessage = async (text: string) => {
 *   // 1. Add user message immediately (optimistic UI)
 *   dispatch(addUserMessage(text));
 *
 *   // 2. Send to API and get bot response
 *   await dispatch(sendMessage(text));
 * };
 *
 * Available Actions:
 * - addUserMessage(text): Add user message to conversation
 * - addBotMessage(text): Add bot message to conversation (local only)
 * - clearMessages(): Clear entire conversation history
 * - clearError(): Clear error state
 * - sendMessage(text): Send message to API (async thunk, exported separately)
 */
export const {addUserMessage, addBotMessage, clearMessages, clearError} =
  chatSlice.actions;

/**
 * Export Reducer
 *
 * This is imported in store.ts and combined with other reducers.
 * The reducer function handles all chat actions and returns new state.
 *
 * State Structure in Redux Store:
 * {
 *   auth: { ... },
 *   tasks: { ... },
 *   chat: {                    // <- This reducer manages this part
 *     messages: [
 *       { id: "1", text: "Hello", isUser: true, timestamp: 123456 },
 *       { id: "2", text: "Hi there!", isUser: false, timestamp: 123457 }
 *     ],
 *     isTyping: false,
 *     error: null
 *   }
 * }
 *
 * COMPLETE CHAT MESSAGE FLOW SUMMARY:
 *
 * 1. Initial State:
 *    messages: [], isTyping: false, error: null
 *
 * 2. User types "create a task" and presses send:
 *    Component calls: dispatch(addUserMessage("create a task"))
 *
 * 3. User message appears immediately:
 *    messages: [{ text: "create a task", isUser: true, ... }]
 *
 * 4. Component calls: dispatch(sendMessage("create a task"))
 *    This triggers: sendMessage.pending
 *
 * 5. Typing indicator shows:
 *    isTyping: true
 *
 * 6. API processes request and returns response:
 *    { message: "Task created!", action: "create" }
 *
 * 7. Cross-slice dispatch happens (inside sendMessage thunk):
 *    dispatch(fetchTasks()) - Refreshes task list
 *
 * 8. API success triggers: sendMessage.fulfilled
 *
 * 9. Bot message appears:
 *    messages: [
 *      { text: "create a task", isUser: true, ... },
 *      { text: "Task created!", isUser: false, ... }
 *    ]
 *    isTyping: false
 *
 * 10. Both chat and tasks screens now show updated data!
 *
 * If error occurs at step 6:
 * - sendMessage.rejected is triggered
 * - error: "Failed to send message"
 * - isTyping: false
 * - User can retry by sending message again
 */
export default chatSlice.reducer;
