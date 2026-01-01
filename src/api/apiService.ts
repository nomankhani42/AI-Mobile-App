import axios, {AxiosInstance, AxiosError} from 'axios';
import {LoginCredentials, RegisterCredentials, User} from '../types';
import Config from 'react-native-config';

const API_BASE_URL = Config.API_URL || 'http://10.0.2.2:8000';

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    // Debug: Log the API URL being used
    console.log('[ApiService] Initializing with base URL:', API_BASE_URL);
    console.log('[ApiService] Config.API_URL:', Config.API_URL);
    console.log('[ApiService] Config.API_TIMEOUT:', Config.API_TIMEOUT);

    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: parseInt(Config.API_TIMEOUT || '30000', 10),
    });

    this.api.interceptors.request.use(
      config => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      error => Promise.reject(error),
    );

    this.api.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.token = null;
        }
        return Promise.reject(error);
      },
    );
  }

  setToken(token: string | null) {
    this.token = token;
  }

  async login(
    credentials: LoginCredentials,
  ): Promise<{user: User; token: string}> {
    try {
      console.log('🔵 Attempting login to:', `${API_BASE_URL}/api/v1/auth/login`);
      console.log('🔵 Credentials:', {email: credentials.email, password: '***'});

      const response = await this.api.post('/api/v1/auth/login', credentials);

      console.log('✅ Login response status:', response.status);
      console.log('✅ Login response data:', JSON.stringify(response.data, null, 2));

      const {access_token} = response.data;

      if (!access_token) {
        console.error('❌ No access_token in response');
        throw new Error('No access token received from server');
      }

      this.setToken(access_token);
      console.log('✅ Token set successfully');

      console.log('🔵 Fetching user details...');
      const userResponse = await this.api.get('/api/v1/auth/me');
      console.log('✅ User details received:', JSON.stringify(userResponse.data, null, 2));

      return {
        user: userResponse.data,
        token: access_token,
      };
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw this.handleError(error);
    }
  }

  async register(
    credentials: RegisterCredentials,
  ): Promise<{user: User; token: string}> {
    try {
      const response = await this.api.post('/api/v1/auth/register', credentials);
      const {user, access_token} = response.data;

      this.setToken(access_token);

      return {
        user: user,
        token: access_token,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.api.get('/api/v1/auth/me');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/api/v1/auth/logout');
      this.setToken(null);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async sendChatMessage(message: string): Promise<any> {
    try {
      console.log('[ApiService] Sending chat message:', message);
      console.log('[ApiService] Request URL:', `${API_BASE_URL}/api/v1/agent/chat`);
      const response = await this.api.post('/api/v1/agent/chat', {message});
      console.log('[ApiService] Response status:', response.status);
      console.log('[ApiService] Response data:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('[ApiService] Chat message error:', error);
      throw this.handleError(error);
    }
  }

  async getAgentCapabilities(): Promise<any> {
    try {
      const response = await this.api.get('/api/v1/agent/capabilities');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTasks(): Promise<any[]> {
    try {
      const response = await this.api.get('/api/v1/tasks');
      return response.data.items || [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createTask(taskData: any): Promise<any> {
    try {
      console.log('[API] Creating task:', JSON.stringify(taskData, null, 2));
      const response = await this.api.post('/api/v1/tasks', taskData);
      console.log('[API] Create task response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('[API] Create task failed:', error);
      throw this.handleError(error);
    }
  }

  async updateTask(id: string, taskData: any): Promise<any> {
    try {
      console.log('[API] Updating task:', id);
      console.log('[API] Update data:', JSON.stringify(taskData, null, 2));
      console.log('[API] Request URL:', `/api/v1/tasks/${id}`);
      console.log('[API] Request method: PUT');
      const response = await this.api.put(`/api/v1/tasks/${id}`, taskData);
      console.log('[API] Update response status:', response.status);
      console.log('[API] Update response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('[API] Update task failed:', error);
      throw this.handleError(error);
    }
  }

  async deleteTask(id: string): Promise<void> {
    try {
      console.log('[API] Deleting task:', id);
      await this.api.delete(`/api/v1/tasks/${id}`);
      console.log('[API] Task deleted successfully');
    } catch (error) {
      console.error('[API] Delete task failed:', error);
      throw this.handleError(error);
    }
  }

  async checkEmail(email: string): Promise<{exists: boolean; message: string}> {
    try {
      const response = await this.api.get(`/api/v1/auth/check-email?email=${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      console.error('🔴 Axios Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
      });

      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'An error occurred';
      return new Error(message);
    }
    console.error('🔴 Unknown Error:', error);
    return error;
  }
}

export const apiService = new ApiService();
