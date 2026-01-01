// API Configuration
// UPDATE THIS with your Vercel backend URL after deployment
const VERCEL_API_URL = 'https://ai-powered-todo-five.vercel.app';

export const API_CONFIG = {
  // Development: Use Android emulator localhost (10.0.2.2) or your computer's IP for real device
  // Production: Use your Vercel deployment URL
  BASE_URL: __DEV__ ? 'https://ai-powered-todo-five.vercel.app' : VERCEL_API_URL,
  TIMEOUT: 30000,
};

export const getApiUrl = () => {
  return API_CONFIG.BASE_URL;
};
