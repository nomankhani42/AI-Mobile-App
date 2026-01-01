export const COLORS = {
  primary: '#6C63FF',
  secondary: '#4CAF50',
  accent: '#FF6B6B',
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#2C3E50',
  textSecondary: '#7F8C8D',
  border: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',

  // Priority colors
  priorityUrgent: '#F44336',
  priorityHigh: '#FF9800',
  priorityMedium: '#FFC107',
  priorityLow: '#4CAF50',

  // Status colors
  statusPending: '#FFC107',
  statusInProgress: '#2196F3',
  statusCompleted: '#4CAF50',

  // Gradients
  gradientStart: '#6C63FF',
  gradientEnd: '#4E47D9',
};

export const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'urgent':
      return COLORS.priorityUrgent;
    case 'high':
      return COLORS.priorityHigh;
    case 'medium':
      return COLORS.priorityMedium;
    case 'low':
      return COLORS.priorityLow;
    default:
      return COLORS.textSecondary;
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return COLORS.statusPending;
    case 'in_progress':
      return COLORS.statusInProgress;
    case 'completed':
      return COLORS.statusCompleted;
    default:
      return COLORS.textSecondary;
  }
};
