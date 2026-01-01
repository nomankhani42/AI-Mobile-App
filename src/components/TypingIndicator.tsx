/**
 * TypingIndicator Component
 *
 * An animated "..." indicator that shows when the AI is processing a response.
 * Features a staggered pulsing animation across three dots for a natural typing effect.
 *
 * This component demonstrates:
 * - Looping animations for continuous effects
 * - Staggered timing for sequential visual rhythm
 * - Animation cleanup in useEffect return function
 * - Creating reusable animation factories
 */

import React, {useEffect, useRef} from 'react';
// View: Container component
// StyleSheet: Style creation API
// Animated: Animation library for the pulsing dots
import {View, StyleSheet, Animated} from 'react-native';

/**
 * TypingIndicator - Shows animated dots when AI is typing
 *
 * @component
 * @returns {JSX.Element} Animated typing indicator with three pulsing dots
 *
 * @example
 * {isTyping && <TypingIndicator />}
 */
export const TypingIndicator: React.FC = () => {
  /**
   * Opacity values for each dot
   * Each starts at 0.3 (dim) and will pulse to 1.0 (bright)
   * Three separate values allow independent animation timing
   */
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  /**
   * Animation setup effect
   *
   * Creates a looping, staggered pulsing effect:
   * - Each dot pulses from dim (0.3) to bright (1.0) and back
   * - Dots are offset by 150ms for a wave-like effect
   * - Loop continues until component unmounts
   */
  useEffect(() => {
    /**
     * Animation factory function
     *
     * Creates a looping pulse animation for a single dot
     *
     * @param {Animated.Value} animatedValue - The opacity value to animate
     * @param {number} delay - Milliseconds to delay start (creates stagger effect)
     * @returns {Animated.CompositeAnimation} Looping animation
     *
     * How it works:
     * 1. Delay (creates offset between dots)
     * 2. Fade to bright over 400ms
     * 3. Fade to dim over 400ms
     * 4. Repeat from step 1
     */
    const createAnimation = (animatedValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    /**
     * Start all three dot animations in parallel
     * Delays: 0ms, 150ms, 300ms - creates left-to-right wave
     */
    const animations = Animated.parallel([
      createAnimation(dot1Opacity, 0),
      createAnimation(dot2Opacity, 150),
      createAnimation(dot3Opacity, 300),
    ]);

    animations.start();

    /**
     * Cleanup function
     * Stops animations when component unmounts
     * Prevents memory leaks and warnings about updating unmounted components
     */
    return () => animations.stop();
  }, []);

  /**
   * Render the typing indicator
   *
   * Structure:
   * - View (container with padding)
   *   - View (bubble matching ChatMessage bot style)
   *     - View (dots container)
   *       - Animated.View (dot 1) - pulses with no delay
   *       - Animated.View (dot 2) - pulses with 150ms delay
   *       - Animated.View (dot 3) - pulses with 300ms delay
   *
   * Styled like a bot message to fit naturally in chat flow
   */
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, {opacity: dot1Opacity}]} />
          <Animated.View style={[styles.dot, {opacity: dot2Opacity}]} />
          <Animated.View style={[styles.dot, {opacity: dot3Opacity}]} />
        </View>
      </View>
    </View>
  );
};

/**
 * Styles for TypingIndicator component
 *
 * Matches ChatMessage bot bubble styling for visual consistency
 */
const styles = StyleSheet.create({
  /**
   * Container
   *
   * alignItems: 'flex-start' - Left-aligns bubble (like bot messages)
   * Padding matches ChatMessage component
   */
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'flex-start',
  },

  /**
   * Bubble
   *
   * Matches bot message bubble styling from ChatMessage:
   * - White background
   * - Rounded corners with pointed bottom-left (chat tail)
   * - Subtle shadow for depth
   */
  bubble: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  /**
   * Dots container
   *
   * flexDirection: 'row' - Dots arranged horizontally
   * gap: 6 - Small space between dots
   * alignItems: 'center' - Vertically centers dots
   */
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  /**
   * Individual dot
   *
   * Perfect circle (width = height, borderRadius = half)
   * iOS blue color matches app theme
   * Opacity animated by component logic (0.3 to 1.0 pulse)
   */
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
});
