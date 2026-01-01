/**
 * ChatModal Component
 *
 * A comprehensive chat interface modal for AI assistant interaction. Features message
 * history, voice input, typing indicators, and smooth animations. Demonstrates advanced
 * list rendering and state management with Redux.
 *
 * This component demonstrates:
 * - FlatList for efficient message list rendering
 * - Redux state management (useAppSelector, useAppDispatch)
 * - Custom hooks (useVoiceInput)
 * - Voice input integration
 * - TextInput for multi-line chat input
 * - Ref usage for programmatic scrolling (flatListRef)
 * - useEffect with dependencies for side effects
 * - Complex state synchronization (voice input → text input → message send)
 * - Loading states (typing indicator)
 * - Error handling and display
 * - Auto-scrolling to latest message
 * - KeyboardAvoidingView for input visibility
 */

import React, {useState, useRef, useEffect} from 'react';
// FlatList: High-performance list component (virtualizes items for efficiency)
// - Only renders visible items
// - Recycles item components
// - Much better than ScrollView for long lists
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
// Redux hooks for state management
import {useAppDispatch, useAppSelector} from '../redux/hooks';
import {sendMessage, addUserMessage, clearError} from '../redux/slices/chatSlice';
// Child components
import {ChatMessage} from './ChatMessage';
import {TypingIndicator} from './TypingIndicator';
import {COLORS} from '../utils/colors';
// Custom hook for voice input functionality
import {useVoiceInput} from '../hooks/useVoiceInput';

/**
 * Modal sizing - 65% of screen height
 * Slightly smaller than AddTaskModal (75%) to leave room for context
 */
const {height: SCREEN_HEIGHT} = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.65;

/**
 * Props interface for ChatModal
 *
 * @interface ChatModalProps
 * @property {boolean} visible - Controls modal visibility
 * @property {() => void} onClose - Callback to close modal
 */
interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * ChatModal - AI assistant chat interface
 *
 * @component
 * @example
 * <ChatModal
 *   visible={showChat}
 *   onClose={() => setShowChat(false)}
 * />
 */
export const ChatModal: React.FC<ChatModalProps> = ({visible, onClose}) => {
  /**
   * Local state for text input
   * Controlled input pattern: value={inputText} onChange={setInputText}
   */
  const [inputText, setInputText] = useState('');

  /**
   * Ref for FlatList to control scrolling
   *
   * useRef<FlatList>(null):
   * - Generic type FlatList for TypeScript
   * - Initialize as null
   * - Will be set when FlatList mounts (ref={flatListRef})
   * - Used for: flatListRef.current?.scrollToEnd()
   */
  const flatListRef = useRef<FlatList>(null);

  /**
   * Redux hooks
   *
   * dispatch: Sends actions to Redux store
   * useAppSelector: Reads state from Redux store
   *   - messages: Array of chat messages
   *   - isTyping: Boolean indicating if AI is responding
   *   - error: Error message if request failed
   */
  const dispatch = useAppDispatch();
  const {messages, isTyping, error} = useAppSelector(state => state.chat);

  /**
   * Animation values for modal and voice recording
   */
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const microphoneScale = useRef(new Animated.Value(1)).current;
  const recordingPulse = useRef(new Animated.Value(1)).current;

  /**
   * Custom hook for voice input
   *
   * Returns:
   * - isRecording: Boolean indicating recording state
   * - recognizedText: Transcribed text from speech
   * - error: Voice input error
   * - isAvailable: Whether device supports voice input
   * - startRecording: Function to start recording
   * - stopRecording: Function to stop recording
   * - clearText: Function to clear recognized text
   *
   * This demonstrates custom hook pattern:
   * - Encapsulates complex logic
   * - Reusable across components
   * - Clean API with destructuring
   */
  const {
    isRecording,
    recognizedText,
    error: voiceError,
    isAvailable: isVoiceAvailable,
    startRecording,
    stopRecording,
    clearText,
  } = useVoiceInput();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: MODAL_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (recognizedText) {
      setInputText(recognizedText);
    }
  }, [recognizedText]);

  // Auto-send message when voice recording stops with recognized text
  const previousRecordingRef = useRef(false);
  useEffect(() => {
    const wasRecording = previousRecordingRef.current;
    previousRecordingRef.current = isRecording;

    // If recording just stopped and we have text, send it automatically
    if (wasRecording && !isRecording && recognizedText.trim()) {
      console.log('[ChatModal] Voice recording stopped, auto-sending message:', recognizedText);

      // Send the recognized text directly (don't wait for inputText state to update)
      const messageText = recognizedText.trim();
      setInputText('');
      clearText();

      dispatch(addUserMessage(messageText));

      dispatch(sendMessage(messageText))
        .unwrap()
        .then((result) => {
          console.log('[ChatModal] Voice message sent successfully:', result);
        })
        .catch((error) => {
          console.error('[ChatModal] Failed to send voice message:', error);
        });
    }
  }, [isRecording, recognizedText]);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingPulse, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(recordingPulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      recordingPulse.setValue(1);
    }
  }, [isRecording]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText('');
    clearText();
    console.log('[ChatModal] Sending message:', messageText);
    dispatch(addUserMessage(messageText));

    try {
      console.log('[ChatModal] Dispatching sendMessage thunk...');
      const result = await dispatch(sendMessage(messageText)).unwrap();
      console.log('[ChatModal] Message sent successfully, response:', result);
    } catch (error) {
      console.error('[ChatModal] Failed to send message:', error);
      console.error('[ChatModal] Error details:', JSON.stringify(error, null, 2));
    }
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{translateY: slideAnim}],
            },
          ]}>
          <View style={styles.dragIndicatorContainer}>
            <View style={styles.dragIndicator} />
          </View>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={styles.content}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={({item}) => <ChatMessage message={item} />}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>👋</Text>
                  <Text style={styles.emptyTitle}>Hi! I'm your AI assistant</Text>
                  <Text style={styles.emptySubtitle}>
                    Ask me to create tasks, check your progress, or get help!
                  </Text>
                </View>
              }
              ListFooterComponent={isTyping ? <TypingIndicator /> : null}
            />

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error: {error}</Text>
                <TouchableOpacity
                  onPress={() => dispatch(clearError())}
                  style={styles.errorCloseButton}>
                  <Text style={styles.errorCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputContainer}>
              {isRecording && (
                <View style={styles.recordingIndicator}>
                  <Animated.View
                    style={[
                      styles.recordingDot,
                      {transform: [{scale: recordingPulse}]},
                    ]}
                  />
                  <View>
                    <Text style={styles.recordingText}>Listening...</Text>
                    <Text style={styles.recordingHint}>Speak clearly and loudly</Text>
                  </View>
                </View>
              )}
              <TextInput
                style={styles.input}
                placeholder={isRecording ? 'Speak now...' : 'Type a message...'}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                multiline
                maxLength={2000}
                editable={!isRecording}
              />
              {isVoiceAvailable && (
                <TouchableOpacity
                  style={[
                    styles.voiceButton,
                    isRecording && styles.voiceButtonActive,
                  ]}
                  onPress={handleVoiceToggle}
                  disabled={isTyping}>
                  <Animated.Text
                    style={[
                      styles.voiceButtonText,
                      {transform: [{scale: isRecording ? recordingPulse : 1}]},
                    ]}>
                    {isRecording ? '⏹' : '🎤'}
                  </Animated.Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!inputText.trim() || isTyping || isRecording}>
                <Text style={styles.sendButtonText}>→</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    height: MODAL_HEIGHT,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 16,
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
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
  emptyText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
  },
  recordingText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
  recordingHint: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    minWidth: 0,
  },
  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#FF3B30',
  },
  voiceButtonText: {
    fontSize: 24,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FEE',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: '#F44',
  },
  errorText: {
    color: '#C00',
    fontSize: 14,
    flex: 1,
  },
  errorCloseButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorCloseText: {
    color: '#C00',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
