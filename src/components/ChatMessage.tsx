/**
 * ChatMessage Component
 *
 * Displays a single message in a chat interface with smooth entrance animations.
 * Differentiates between user and bot messages through styling and alignment.
 *
 * This component demonstrates:
 * - Parallel animations (fade, slide, scale combined)
 * - Conditional styling based on message sender
 * - Chat bubble UI patterns (different colors and alignment)
 * - Combination of Animated.timing and Animated.spring
 */

import React, {useEffect, useRef} from 'react';
// View: Container component
// Text: Text display component
// StyleSheet: Style creation API
// Animated: Animation library for smooth visual effects
import {View, Text, StyleSheet, Animated} from 'react-native';
import {Message} from '../types';

/**
 * Props interface for ChatMessage component
 *
 * @interface ChatMessageProps
 * @property {Message} message - Message object containing text and sender info
 */
interface ChatMessageProps {
  message: Message;
}

/**
 * ChatMessage - Renders a single chat message with entrance animation
 *
 * @component
 * @param {ChatMessageProps} props - Component props
 * @returns {JSX.Element} Animated chat message bubble
 *
 * @example
 * <ChatMessage message={{id: '1', text: 'Hello!', isUser: true}} />
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({message}) => {
  /**
   * Animation values for entrance effect
   *
   * Three separate animations create a rich entrance:
   * - opacity: Fades in from transparent (0) to visible (1)
   * - translateY: Slides up from below (20) to position (0)
   * - scale: Grows from slightly small (0.9) to full size (1)
   */
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  /**
   * Entrance animation effect
   * Runs once when message first appears (empty dependency array)
   *
   * Animated.parallel runs multiple animations simultaneously:
   * - timing: Linear interpolation for opacity
   * - spring: Bouncy motion for translateY and scale
   *
   * This creates a smooth "fade in and slide up" effect with a subtle bounce
   */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /**
   * Render the chat message bubble
   *
   * Structure:
   * - Animated.View: Container with animations applied
   *   - View: Message bubble with background color
   *     - Text: The actual message text
   *
   * Conditional styling:
   * - User messages: Right-aligned, blue background, white text
   * - Bot messages: Left-aligned, white background, black text
   *
   * The transform array applies both translateY and scale simultaneously
   */
  return (
    <Animated.View
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.botMessage,
        {
          opacity,
          transform: [{translateY}, {scale}],
        },
      ]}>
      <View
        style={[
          styles.messageBubble,
          message.isUser ? styles.userBubble : styles.botBubble,
        ]}>
        <Text
          style={[
            styles.messageText,
            message.isUser ? styles.userText : styles.botText,
          ]}>
          {message.text}
        </Text>
      </View>
    </Animated.View>
  );
};

/**
 * Styles for ChatMessage component
 *
 * Chat bubble pattern:
 * - User messages on right (flex-end alignment)
 * - Bot messages on left (flex-start alignment)
 * - Different colors for visual distinction
 * - Rounded corners with one corner "pointed" (chat tail effect)
 */
const styles = StyleSheet.create({
  /**
   * Message container
   * Provides consistent spacing and horizontal padding
   */
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },

  /**
   * User message alignment
   * alignItems: 'flex-end' pushes bubble to the right side
   */
  userMessage: {
    alignItems: 'flex-end',
  },

  /**
   * Bot message alignment
   * alignItems: 'flex-start' keeps bubble on the left side
   */
  botMessage: {
    alignItems: 'flex-start',
  },

  /**
   * Message bubble base styles
   *
   * maxWidth: '80%' - Prevents bubbles from spanning full width
   * borderRadius: 20 - Rounded corners for modern look
   * Subtle shadow for depth
   */
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  /**
   * User bubble styling
   *
   * iOS blue color (#007AFF) for user messages
   * borderBottomRightRadius: 4 - Creates chat "tail" on bottom-right
   * This is a common pattern in messaging apps
   */
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },

  /**
   * Bot bubble styling
   *
   * White background for bot messages
   * borderBottomLeftRadius: 4 - Chat "tail" on bottom-left
   */
  botBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },

  /**
   * Message text base styles
   * lineHeight: 22 - Comfortable reading spacing
   */
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },

  /**
   * User text color - white for contrast on blue background
   */
  userText: {
    color: '#fff',
  },

  /**
   * Bot text color - black for contrast on white background
   */
  botText: {
    color: '#000',
  },
});
