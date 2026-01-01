/**
 * FloatingAddButton Component
 *
 * A floating action button (FAB) positioned on the left side that opens the
 * Add Task modal. Mirrors the FloatingChatButton but positioned on the opposite side.
 *
 * This component demonstrates:
 * - Reusable component patterns with similar structure but different positioning
 * - Consistent animation behavior across multiple FABs
 * - Left-side FAB positioning (complementing right-side chat button)
 */

import React, {useRef, useEffect} from 'react';
// Core React Native components for building the floating button
import {TouchableOpacity, Text, StyleSheet, Animated} from 'react-native';
import {COLORS} from '../utils/colors';

/**
 * Props interface for FloatingAddButton component
 *
 * @interface FloatingAddButtonProps
 * @property {() => void} onPress - Callback executed when button is pressed
 */
interface FloatingAddButtonProps {
  onPress: () => void;
}

/**
 * FloatingAddButton - A floating action button for creating new tasks
 *
 * @component
 * @param {FloatingAddButtonProps} props - Component props
 * @returns {JSX.Element} Animated floating add button
 *
 * @example
 * <FloatingAddButton onPress={() => setAddModalVisible(true)} />
 */
export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({onPress}) => {
  /**
   * Scale animation value
   * Starts at 0 to create an entrance animation where button grows into view
   */
  const scaleAnim = useRef(new Animated.Value(0)).current;

  /**
   * Mount animation effect
   * Creates a spring animation when component first renders
   *
   * The spring animation gives a natural, bouncy feel that's more
   * engaging than a simple fade or slide animation
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
   * Press handler with bounce-back animation
   *
   * Provides tactile feedback by:
   * 1. Shrinking button to 90% size (feels pressed)
   * 2. Springing back to 100% size (feels released)
   *
   * This creates a satisfying interaction that confirms the tap
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
   * Render floating add button
   *
   * Uses same pattern as FloatingChatButton:
   * - Animated.View for scale transform
   * - TouchableOpacity for touch handling
   * - Plus sign (+) as the icon
   */
  return (
    <Animated.View style={[styles.container, {transform: [{scale: scaleAnim}]}]}>
      <TouchableOpacity style={styles.button} onPress={handlePress} activeOpacity={0.9}>
        <Text style={styles.icon}>+</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * Component styles
 *
 * Nearly identical to FloatingChatButton, but:
 * - Positioned on LEFT side (left: 24 instead of right: 24)
 * - Uses a "+" icon instead of chat emoji
 * - Icon has explicit white color and bold weight
 */
const styles = StyleSheet.create({
  /**
   * Container with absolute positioning
   *
   * Key difference from FloatingChatButton: uses 'left' instead of 'right'
   * This creates a balanced UI with FABs on both corners
   *
   * Platform-specific shadows:
   * - iOS: Uses shadowColor, shadowOffset, shadowOpacity, shadowRadius
   * - Android: Uses elevation (single property for material design shadow)
   */
  container: {
    position: 'absolute',
    bottom: 24,
    left: 24, // Left positioning makes this the "add" button
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  /**
   * Circular button with centered content
   *
   * borderRadius of 30 = half of width/height = perfect circle
   * Flexbox centers the icon both horizontally and vertically
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
   * Plus icon styling
   *
   * Larger and bolder than chat icon to match the "add" action's prominence
   * White color ensures contrast against primary background
   */
  icon: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: 'bold',
  },
});
