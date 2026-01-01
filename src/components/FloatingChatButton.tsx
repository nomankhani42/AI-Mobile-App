/**
 * FloatingChatButton Component
 *
 * A floating action button (FAB) that opens the AI chat assistant modal.
 * Features smooth entrance animations and tactile press feedback using React Native's
 * Animated API. Positioned in the bottom-right corner of the screen.
 *
 * This component demonstrates:
 * - Floating action buttons (FAB) pattern common in mobile apps
 * - Spring animations for smooth, natural motion
 * - Absolute positioning for overlay elements
 * - Touch feedback with scale animations
 */

import React, {useRef, useEffect} from 'react';
// TouchableOpacity: A wrapper component that responds to touches with opacity feedback
// Text: Core component for displaying text in React Native
// StyleSheet: API for creating optimized style objects (better performance than inline styles)
// Animated: React Native's animation library for smooth, performant animations
import {TouchableOpacity, Text, StyleSheet, Animated} from 'react-native';
import {COLORS} from '../utils/colors';

/**
 * Props interface for FloatingChatButton component
 *
 * @interface FloatingChatButtonProps
 * @property {() => void} onPress - Callback function executed when button is pressed
 */
interface FloatingChatButtonProps {
  onPress: () => void;
}

/**
 * FloatingChatButton - A floating action button for opening the chat modal
 *
 * @component
 * @param {FloatingChatButtonProps} props - Component props
 * @returns {JSX.Element} Animated floating chat button
 *
 * @example
 * <FloatingChatButton onPress={() => setChatVisible(true)} />
 */
export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({onPress}) => {
  /**
   * Animation value for scale transformation
   * useRef preserves the animated value across re-renders
   * Initialized to 0 for entrance animation (button grows from nothing)
   */
  const scaleAnim = useRef(new Animated.Value(0)).current;

  /**
   * Entrance animation effect
   * Runs once when component mounts (empty dependency array)
   *
   * Spring animation creates a natural, bouncy entrance effect:
   * - toValue: 1 (full scale)
   * - tension: Controls the spring's tightness (higher = snappier)
   * - friction: Controls bounciness (lower = more bouncy)
   * - useNativeDriver: Offloads animation to native thread for better performance
   */
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  /**
   * Press handler with tactile feedback animation
   *
   * Creates a "press and release" effect:
   * 1. Scales down to 0.9 (90% size) - simulates button being pressed
   * 2. Springs back to 1.0 (100% size) - simulates button being released
   *
   * Animated.sequence runs animations one after another
   * After animation completes, calls the parent's onPress callback
   */
  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  /**
   * Render the floating chat button
   *
   * Structure:
   * - Animated.View: Wrapper with scale animation applied
   * - TouchableOpacity: Handles touch events with opacity feedback
   * - Text: Displays the chat icon emoji
   *
   * Why TouchableOpacity?
   * - Provides visual feedback (opacity change on press)
   * - activeOpacity={0.9} keeps button mostly visible when pressed
   * - Better for round buttons compared to Pressable's ripple effect
   */
  return (
    <Animated.View style={[styles.container, {transform: [{scale: scaleAnim}]}]}>
      <TouchableOpacity style={styles.button} onPress={handlePress} activeOpacity={0.9}>
        <Text style={styles.icon}>💬</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * Styles for FloatingChatButton component
 *
 * StyleSheet.create provides:
 * - Performance: Styles are created once and referenced by ID
 * - Validation: Catches typos and invalid values during development
 */
const styles = StyleSheet.create({
  /**
   * Container - Positions the button and adds shadow
   *
   * position: 'absolute' - Removes from normal document flow
   * bottom/right: 24 - Positions 24dp from bottom-right corner
   *
   * Shadow properties (iOS):
   * - shadowColor: Shadow color
   * - shadowOffset: Shadow direction and distance
   * - shadowOpacity: Shadow transparency (0-1)
   * - shadowRadius: Shadow blur radius
   *
   * elevation: 8 - Android shadow (higher = more elevation)
   */
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  /**
   * Button - Circular button styling
   *
   * borderRadius: 30 (half of width/height) creates perfect circle
   * justifyContent/alignItems: 'center' - Centers icon using flexbox
   *
   * Flexbox in React Native:
   * - Default flex direction is 'column' (unlike web's 'row')
   * - justifyContent: Centers along main axis (vertical)
   * - alignItems: Centers along cross axis (horizontal)
   */
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  /**
   * Icon - Text styling for emoji icon
   * fontSize makes the emoji appropriately sized for the button
   */
  icon: {
    fontSize: 28,
  },
});
