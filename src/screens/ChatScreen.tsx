/**
 * ChatScreen.tsx
 *
 * Purpose:
 * AI chat interface for natural language task management.
 * Users can create, update, and query tasks using conversational commands.
 *
 * Key Features:
 * - Real-time chat with AI assistant
 * - Auto-scrolling to latest message
 * - Typing indicator during AI response
 * - Multi-line text input with character limit
 * - Safe area handling for notch devices
 * - Cross-platform keyboard management
 *
 * State Management:
 * - Redux for chat messages and isTyping state
 * - Local state for input text
 * - useRef for FlatList to control scrolling
 *
 * Learning Focus:
 * - FlatList for chat messages (reverse chronological)
 * - useRef for imperative scrolling
 * - SafeAreaView for device-specific padding
 * - KeyboardAvoidingView with platform-specific behavior
 * - Auto-scroll to latest message on updates
 */

import React, {useState, useRef, useEffect} from 'react';

/**
 * React Native Core Components
 *
 * SafeAreaView: Handles notch/home indicator padding
 * KeyboardAvoidingView: Adjusts layout when keyboard appears
 * FlatList: Scrollable message list
 */
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';

/**
 * Redux Integration
 */
import {useAppDispatch, useAppSelector} from '../redux/hooks';

/**
 * Redux Actions
 *
 * sendMessage: Send user message to AI and get response
 * addUserMessage: Add user message to Redux immediately (optimistic update)
 * logout: Log user out
 */
import {sendMessage, addUserMessage} from '../redux/slices/chatSlice';
import {logout} from '../redux/slices/authSlice';

/**
 * Custom Components
 */
import {ChatMessage} from '../components/ChatMessage';
import {TypingIndicator} from '../components/TypingIndicator';

interface ChatScreenProps {
  navigation: any;
}

/**
 * ChatScreen Component
 *
 * Conversational AI interface for task management.
 *
 * Auto-Scroll Behavior:
 * - Scrolls to bottom when new messages arrive
 * - Uses setTimeout to ensure DOM is updated before scrolling
 * - Smooth animation for better UX
 *
 * Keyboard Handling:
 * - iOS: padding behavior (shifts view up)
 * - Android: height behavior (resizes view)
 * - keyboardVerticalOffset accounts for header height
 */
export const ChatScreen: React.FC<ChatScreenProps> = ({navigation}) => {
  /**
   * Local State
   *
   * inputText: Current message being typed
   * flatListRef: Reference to FlatList for imperative scrolling
   */
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  /**
   * Redux State
   *
   * messages: Array of chat messages (user and AI)
   * isTyping: True when AI is generating response
   * user: Current authenticated user
   */
  const dispatch = useAppDispatch();
  const {messages, isTyping} = useAppSelector(state => state.chat);
  const {user} = useAppSelector(state => state.auth);

  /**
   * Auto-Scroll Effect
   *
   * Purpose: Scroll to latest message when messages update
   *
   * Dependencies: [messages, isTyping]
   * - Triggers on new message or typing state change
   *
   * setTimeout Delay:
   * - Ensures FlatList has rendered new message before scrolling
   * - 100ms is usually enough for render cycle
   * - Prevents scrolling to wrong position
   */
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);
    }
  }, [messages, isTyping]);

  /**
   * Send Message Handler
   *
   * Flow:
   * 1. Validate input (not empty)
   * 2. Clear input field immediately (better UX)
   * 3. Add user message to Redux (optimistic update)
   * 4. Scroll to show new message
   * 5. Send to AI via Redux thunk
   * 6. Scroll again when AI response arrives
   *
   * Optimistic Update Pattern:
   * - User message appears immediately
   * - AI request happens in background
   * - Better perceived performance
   */
  const handleSend = async () => {
    if (!inputText.trim()) {
      return;
    }

    const messageText = inputText.trim();
    setInputText('');

    // Add user message immediately (optimistic update)
    dispatch(addUserMessage(messageText));

    // Scroll to show user's message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({animated: true});
    }, 100);

    try {
      // Send to AI and wait for response
      await dispatch(sendMessage(messageText)).unwrap();
      // Scroll to show AI response
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  /**
   * Logout Handler
   *
   * Dispatches logout action to Redux.
   * Auth middleware handles navigation to login screen.
   */
  const handleLogout = () => {
    dispatch(logout());
  };

  /**
   * Render Method
   *
   * Layout Structure:
   * 1. SafeAreaView: Handles notch/home indicator
   * 2. Header: Title and logout button
   * 3. KeyboardAvoidingView: Manages keyboard
   * 4. FlatList: Message history
   * 5. Input Container: Text input and send button
   *
   * SafeAreaView:
   * - Automatically pads content for iPhone notch
   * - Also handles home indicator on newer iPhones
   *
   * KeyboardAvoidingView:
   * - keyboardVerticalOffset: Accounts for header height
   * - Prevents keyboard from covering input
   *
   * FlatList Props:
   * - ref: Allows imperative scrolling
   * - ListEmptyComponent: Shown on first visit
   * - ListFooterComponent: Shows typing indicator
   */
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with title and logout */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AI Task Assistant</Text>
          <Text style={styles.headerSubtitle}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/**
       * KeyboardAvoidingView wraps content area
       * - Adjusts when keyboard appears
       * - Platform-specific behavior for iOS vs Android
       */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {/**
         * FlatList for Chat Messages
         *
         * ListEmptyComponent: Onboarding message with examples
         * - Helps users understand how to interact with AI
         * - Shows suggested commands
         *
         * ListFooterComponent: Typing indicator
         * - Shown when AI is generating response
         * - Provides feedback that AI is working
         */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({item}) => <ChatMessage message={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Welcome to AI Task Assistant</Text>
              <Text style={styles.emptyText}>
                I can help you manage your tasks using natural language.
              </Text>
              <Text style={styles.emptyExamples}>Try asking:</Text>
              <Text style={styles.exampleText}>
                • "Create a task to buy groceries"
              </Text>
              <Text style={styles.exampleText}>
                • "Show me all my tasks"
              </Text>
              <Text style={styles.exampleText}>
                • "Mark my project task as completed"
              </Text>
            </View>
          }
          ListFooterComponent={
            isTyping ? <TypingIndicator /> : null
          }
        />

        {/**
         * Input Container
         *
         * TextInput Props:
         * - multiline: Allows multiple lines
         * - maxLength: Prevents excessively long messages
         * - onSubmitEditing: Send on return key (single-line mode)
         *
         * Send Button:
         * - Disabled when input is empty or AI is typing
         * - Visual feedback via opacity
         */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isTyping}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyExamples: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  exampleText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
