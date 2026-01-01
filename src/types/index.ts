export interface User {
  id: string;
  email: string;
  full_name?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasSeenOnboarding: boolean;
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  error: string | null;
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface Task {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: string;
  estimated_duration?: number;
  completed_at?: string;
  ai_priority?: TaskPriority;
  ai_estimated_duration?: number;
  created_at: string;
  updated_at: string;
}

export interface TasksState {
  items: Task[];
  isLoading: boolean;
  error: string | null;
  filter: TaskStatus | 'all';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  full_name?: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  deadline?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  deadline?: string;
}

export interface ApiResponse<T> {
  status: string;
  data?: T;
  items?: T[];
  total?: number;
  message?: string;
}

export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}
