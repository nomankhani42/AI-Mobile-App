import React, {useState, useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions, Animated} from 'react-native';
import {useAppDispatch} from '../redux/hooks';
import {completeOnboarding} from '../redux/slices/authSlice';
import {COLORS} from '../utils/colors';
import {ONBOARDING_DATA} from '../utils/constants';

const {width} = Dimensions.get('window');

export const OnboardingScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const dispatch = useAppDispatch();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleSkip = () => {
    dispatch(completeOnboarding());
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      flatListRef.current?.scrollToIndex({index: currentIndex + 1});
    } else {
      dispatch(completeOnboarding());
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({index: currentIndex - 1});
    }
  };

  const renderItem = ({item}: any) => (
    <View style={styles.slide}>
      <Text style={styles.icon}>{item.icon}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
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

      <View style={styles.footer}>
        <View style={styles.indicators}>
          {ONBOARDING_DATA.map((_, index) => (
            <View
              key={index}
              style={[styles.indicator, index === currentIndex && styles.indicatorActive]}
            />
          ))}
        </View>

        <View style={styles.buttons}>
          {currentIndex > 0 ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
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
