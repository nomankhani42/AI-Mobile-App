import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Task, TaskStatus} from '../types';
import {COLORS, getPriorityColor} from '../utils/colors';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onStatusToggle: () => void;
  onDelete: () => void;
}

const getStatusConfig = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.PENDING:
      return {icon: '⏳', color: '#FF9500', label: 'Pending'};
    case TaskStatus.IN_PROGRESS:
      return {icon: '🚀', color: '#007AFF', label: 'In Progress'};
    case TaskStatus.COMPLETED:
      return {icon: '✅', color: '#34C759', label: 'Completed'};
    default:
      return {icon: '⏳', color: '#FF9500', label: 'Pending'};
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({task, onPress, onStatusToggle, onDelete}) => {
  const priorityColor = getPriorityColor(task.priority);
  const statusConfig = getStatusConfig(task.status);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.priorityBar, {backgroundColor: priorityColor}]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, task.status === 'completed' && styles.completedText]}>
            {task.title}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onStatusToggle} style={styles.checkbox}>
              <View style={[styles.checkboxInner, task.status === 'completed' && styles.checkboxCompleted]}>
                {task.status === 'completed' && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
        {task.description && (
          <Text style={styles.description} numberOfLines={2}>{task.description}</Text>
        )}
        <View style={styles.footer}>
          <View style={[styles.badge, {backgroundColor: priorityColor + '20'}]}>
            <Text style={[styles.badgeText, {color: priorityColor}]}>{task.priority}</Text>
          </View>
          <View style={[styles.statusBadge, {backgroundColor: statusConfig.color + '15'}]}>
            <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
            <Text style={[styles.statusText, {color: statusConfig.color}]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  priorityBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusIcon: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: COLORS.primary,
  },
  checkmark: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#FFE5E5',
  },
  deleteIcon: {
    fontSize: 16,
  },
});
