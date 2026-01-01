/**
 * OnboardingScreen.tsx
 *
 * Purpose:
 * First-time user experience screen shown before authentication.
 * Introduces app features through horizontal swipe carousel.
 *
 * Key Features:
 * - Horizontal swipeable carousel with pagination
 * - Animated page indicators
 * - Skip, Back, and Next navigation
 * - Auto-calculated slide width based on device
 * - Smooth page transitions
 *
 * State Management:
 * - Local state for current slide index
 * - Redux action to mark onboarding as complete
 * - useRef for FlatList and scroll animation
 *
 * Learning Focus:
 * - Horizontal FlatList with pagination
 * - Animated.Value for scroll tracking
 * - Dimensions API for responsive sizing
 * - useRef for imperative navigation
 * - Onboarding UX patterns
 */

import React, {useState, useRef} from 'react';

/**
 * React Native Core Components
 *
 * Dimensions: Get device screen dimensions
 * Animated: Animation library for scroll tracking
 */
import {View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions, Animated} from 'react-native';

/**
 * Redux Integration
 */
import {useAppDispatch} from '../redux/hooks';

/**
 * Redux Actions
 *
 * completeOnboarding: Marks onboarding as seen, shows auth screens
 */
import {completeOnboarding} from '../redux/slices/authSlice';

/**
 * Constants
 */
import {COLORS} from '../utils/colors';
import {ONBOARDING_DATA} from '../utils/constants';

/**
 * Device Width
 *
 * Each slide takes full screen width.
 * Dimensions.get('window') returns current window dimensions.
 * Responsive to device size automatically.
 */
const {width} = Dimensions.get('window');

/**
 * OnboardingScreen Component
 *
 * Carousel-based onboarding flow.
 *
 * Navigation Patterns:
 * - Skip: Jump to end (mark complete)
 * - Back: Go to previous slide
 * - Next: Go to next slide or complete if on last slide
 *
 * Scroll Tracking:
 * - scrollX Animated.Value tracks horizontal scroll position
 * - Used to animate page indicators
 * - onMomentumScrollEnd updates currentIndex when scroll finishes
 */
export const OnboardingScreen = () => {
  /**
   * Local State
   *
   * currentIndex: Currently visible slide (0-indexed)
   */
  const [currentIndex, setCurrentIndex] = useState(0);

  /**
   * Redux
   */
  const dispatch = useAppDispatch();

  /**
   * Refs
   *
   * flatListRef: Reference to FlatList for programmatic scrolling
   * scrollX: Animated value tracking scroll position
   * - Used for page indicator animation
   * - Updated via Animated.event on scroll
   */
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  /**
   * Skip Handler
   *
   * Immediately completes onboarding without viewing all slides.
   * Common UX pattern for returning users or impatient users.
   */
  const handleSkip = () => {
    dispatch(completeOnboarding());
  };

  /**
   * Next Handler
   *
   * Advances to next slide or completes onboarding.
   * - If not on last slide: scrollToIndex next slide
   * - If on last slide: complete onboarding
   *
   * scrollToIndex is imperative API via ref.
   */
  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      flatListRef.current?.scrollToIndex({index: currentIndex + 1});
    } else {
      dispatch(completeOnboarding());
    }
  };

  /**
   * Back Handler
   *
   * Returns to previous slide.
   * Only enabled when not on first slide (currentIndex > 0).
   */
  const handleBack = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({index: currentIndex - 1});
    }
  };

  /**
   * Slide Render Function
   *
   * Each slide displays:
   * - Large emoji icon
   * - Title
   * - Description
   *
   * Full screen width per slide (width from Dimensions).
   */
  const renderItem = ({item}: any) => (
    <View style={styles.slide}>
      <Text style={styles.icon}>{item.icon}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  /**
   * Render Method
   *
   * Layout Structure:
   * 1. Horizontal FlatList: Carousel slides
   * 2. Footer: Page indicators and navigation buttons
   *
   * FlatList Props:
   * - horizontal: Enables horizontal scrolling
   * - pagingEnabled: Snaps to full-screen slides
   * - onScroll: Animated.event tracks scroll position
   * - onMomentumScrollEnd: Updates currentIndex when scroll stops
   *
   * Animated.event:
   * - Maps scroll x offset to scrollX animated value
   * - useNativeDriver: false (required for layout animations)
   * - Enables smooth page indicator animation
   *
   * onMomentumScrollEnd:
   * - Fires when user stops scrolling
   * - Calculates index from scroll offset
   * - Updates currentIndex for button logic
   *
   * Footer Layout:
   * - Page indicators: Shows current position
   * - Conditional left button: Skip (first slide) or Back (other slides)
   * - Next button: Next (most slides) or Get Started (last slide)
   */
  return (
    <View style={styles.container}>
      {/**
       * Horizontal Carousel FlatList
       *
       * Key Props:
       * - horizontal: Scroll left/right instead of up/down
       * - pagingEnabled: Snap to each slide (no partial slides)
       * - showsHorizontalScrollIndicator: false (custom indicators below)
       *
       * Scroll Tracking:
       * - Animated.event connects scroll to scrollX value
       * - onMomentumScrollEnd calculates current slide index
       */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{nativeEvent: {contentOffset: {x: scrollX}}}], {useNativeDriver: false})}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {/**
       * Footer: Indicators and Navigation
       *
       * Page Indicators:
       * - One dot per slide
       * - Active indicator is wider and colored
       * - Visual feedback of current position
       *
       * Navigation Buttons:
       * - Left button: Skip (index 0) or Back (index > 0)
       * - Right button: Next or Get Started (last slide)
       *
       * Button Text Logic:
       * - Dynamic based on currentIndex
       * - Provides clear action for user
       */}
      <View style={styles.footer}>
        {/* Page indicators */}
        <View style={styles.indicators}>
          {ONBOARDING_DATA.map((_, index) => (
            <View
              key={index}
              style={[styles.indicator, index === currentIndex && styles.indicatorActive]}
            />
          ))}
        </View>

        {/* Navigation buttons */}
        <View style={styles.buttons}>
          {/* Conditional left button: Skip or Back */}
          {currentIndex > 0 ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
          {/* Right button: Next or Get Started */}
          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextText}>
              {currentIndex === ONBOARDING_DATA.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  slide: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  icon: {
    fontSize: 120,
    marginBottom: 50,
    textShadowColor: 'rgba(108, 99, 255, 0.1)',
    textShadowOffset: {width: 0, height: 4},
    textShadowRadius: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 17,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  footer: {
    padding: 24,
    paddingBottom: 50,
    backgroundColor: COLORS.background,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.border,
    marginHorizontal: 5,
  },
  indicatorActive: {
    backgroundColor: COLORS.primary,
    width: 30,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    padding: 16,
    paddingHorizontal: 20,
  },
  skipText: {
    color: COLORS.textSecondary,
    fontSize: 17,
    fontWeight: '600',
  },
  backButton: {
    padding: 16,
    paddingHorizontal: 20,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 14,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  nextText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
