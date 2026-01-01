import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Easing,
} from 'react-native';
import {TaskStatus} from '../types';
import {COLORS} from '../utils/colors';

interface StatusOption {
  value: TaskStatus;
  label: string;
  icon: string;
  color: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: TaskStatus.PENDING,
    label: 'Pending',
    icon: '⏳',
    color: '#FF9500',
  },
  {
    value: TaskStatus.IN_PROGRESS,
    label: 'In Progress',
    icon: '🚀',
    color: '#007AFF',
  },
  {
    value: TaskStatus.COMPLETED,
    label: 'Completed',
    icon: '✅',
    color: '#34C759',
  },
];

interface StatusDropdownProps {
  visible: boolean;
  currentStatus: TaskStatus;
  onSelect: (status: TaskStatus) => void;
  onClose: () => void;
}

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  visible,
  currentStatus,
  onSelect,
  onClose,
}) => {
  const translateY = useRef(new Animated.Value(300)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 300,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleSelect = (status: TaskStatus) => {
    onSelect(status);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, {opacity}]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.container,
            {
              transform: [{translateY}],
            },
          ]}>
          <View style={styles.dragIndicatorContainer}>
            <View style={styles.dragIndicator} />
          </View>

          <Text style={styles.title}>Update Status</Text>

          <View style={styles.optionsContainer}>
            {STATUS_OPTIONS.map((option, index) => {
              const isSelected = option.value === currentStatus;
              const isLast = index === STATUS_OPTIONS.length - 1;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    isSelected && styles.optionSelected,
                    !isLast && styles.optionBorder,
                  ]}
                  onPress={() => handleSelect(option.value)}
                  activeOpacity={0.7}>
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.iconContainer,
                        {backgroundColor: option.color + '20'},
                      ]}>
                      <Text style={styles.optionIcon}>{option.icon}</Text>
                    </View>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                  </View>

                  {isSelected && (
                    <View
                      style={[
                        styles.checkmark,
                        {backgroundColor: option.color},
                      ]}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionSelected: {
    backgroundColor: '#F8F8F8',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIcon: {
    fontSize: 20,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});
