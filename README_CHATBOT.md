# React Native AI Task Chatbot

A full-featured React Native chatbot application with backend integration, Redux Toolkit state management, Async Storage persistence, and React Native Reanimated animations.

## Features

- **Authentication System**: Login and registration with JWT tokens
- **AI-Powered Chatbot**: Natural language task management using the backend API
- **Redux Toolkit**: Centralized state management with Redux slices
- **Persistence**: Async Storage integration for offline data persistence
- **Smooth Animations**: React Native Reanimated for fluid UI animations
- **Type-Safe**: Full TypeScript support

## Tech Stack

- **React Native**: 0.83.0
- **TypeScript**: ^5.8.3
- **Redux Toolkit**: State management
- **React Navigation**: Native stack navigation
- **Axios**: HTTP client for API requests
- **React Native Reanimated**: Advanced animations
- **Async Storage**: Local data persistence
- **Redux Persist**: Redux state persistence

## Project Structure

```
myapp/
├── src/
│   ├── api/
│   │   ├── apiService.ts         # API client and endpoints
│   │   └── config.ts             # API configuration
│   ├── components/
│   │   ├── ChatMessage.tsx       # Animated message bubbles
│   │   └── TypingIndicator.tsx   # Animated typing indicator
│   ├── redux/
│   │   ├── slices/
│   │   │   ├── authSlice.ts      # Authentication state
│   │   │   └── chatSlice.ts      # Chat state
│   │   ├── store.ts              # Redux store with persistence
│   │   └── hooks.ts              # Typed Redux hooks
│   ├── screens/
│   │   ├── LoginScreen.tsx       # Login page
│   │   ├── RegisterScreen.tsx    # Registration page
│   │   └── ChatScreen.tsx        # Main chat interface
│   └── types/
│       └── index.ts              # TypeScript type definitions
├── App.tsx                       # Main app component
└── index.js                      # App entry point
```

## Setup Instructions

### 1. Backend Setup

First, make sure your backend is running:

```bash
cd ../backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend should be accessible at `http://localhost:8000`

### 2. Update API Configuration

For Android Emulator, the API is configured to use `http://10.0.2.2:8000` (which maps to localhost).
For iOS Simulator, you may need to update the API URL in `src/api/apiService.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8000';  // iOS Simulator
```

### 3. Install Dependencies

Dependencies are already installed, but if you need to reinstall:

```bash
npm install
```

### 4. Run the App

For Android:
```bash
npm run android
```

For iOS:
```bash
cd ios && pod install && cd ..
npm run ios
```

### 5. Development

Start the Metro bundler:
```bash
npm start
```

## Usage

### Authentication

1. **Register**: Create a new account with email and password (minimum 12 characters)
2. **Login**: Sign in with your credentials
3. The app automatically saves your authentication state

### Chatbot

Once logged in, you can interact with the AI assistant:

- **Create tasks**: "Add a task to buy groceries with high priority"
- **View tasks**: "Show me all my tasks"
- **Update tasks**: "Mark my project task as completed"
- **Delete tasks**: "Delete the old task from yesterday"

### Features

- **Animated Messages**: Messages appear with smooth spring animations
- **Typing Indicator**: See when the bot is typing
- **Persistent State**: Your messages and auth state are saved locally
- **Auto-scroll**: Chat automatically scrolls to new messages

## Redux State Structure

### Auth Slice
```typescript
{
  user: User | null,
  token: string | null,
  isAuthenticated: boolean,
  isLoading: boolean,
  error: string | null
}
```

### Chat Slice
```typescript
{
  messages: Message[],
  isTyping: boolean,
  error: string | null
}
```

## API Endpoints

The app connects to these backend endpoints:

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `POST /api/agent/chat` - Send message to AI assistant
- `GET /api/agent/capabilities` - Get assistant capabilities

## Animations

The app uses React Native Reanimated for smooth animations:

- **Message Entry**: Spring animation with scale and opacity
- **Typing Indicator**: Sequenced dot animations
- **Smooth Transitions**: Between screens using React Navigation

## Troubleshooting

### Cannot connect to backend

**Android Emulator**: Use `http://10.0.2.2:8000`
**iOS Simulator**: Use `http://localhost:8000`
**Real Device**: Use your computer's IP address (e.g., `http://192.168.1.100:8000`)

### Redux Persist Warnings

If you see warnings about serializable checks, they're expected with redux-persist and already configured to be ignored.

### Animation Performance

If animations are laggy:
1. Make sure you're testing on a real device or a performant emulator
2. Enable Hermes engine (already enabled by default in RN 0.83)

## Development Tips

### Clear Cache

```bash
npm start -- --reset-cache
```

### Clear Async Storage

For development, you can clear stored data:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
AsyncStorage.clear();
```

### Debug Redux State

Install Redux DevTools extension and use Reactotron for debugging.

## Next Steps

Potential enhancements:
- Push notifications
- Voice input
- Task list view
- Task categories
- Dark mode
- Biometric authentication

## License

MIT
