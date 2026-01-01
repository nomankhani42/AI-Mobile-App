# 🎉 Complete App Redesign - Final Setup

## ✅ What's Been Created:

1. ✅ Redux slices (auth, chat, tasks)
2. ✅ API service with task endpoints
3. ✅ Colors & constants utilities
4. ✅ Components: TaskCard, FloatingChatButton, ChatModal
5. ✅ Updated type definitions

## 📝 Remaining Files to Create:

### 1. Onboarding Screen

Create: `src/screens/OnboardingScreen.tsx`

```typescript
import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions} from 'react-native';
import {useAppDispatch} from '../redux/hooks';
import {completeOnboarding} from '../redux/slices/authSlice';
import {COLORS} from '../utils/colors';
import {ONBOARDING_DATA} from '../utils/constants';

const {width} = Dimensions.get('window');

export const OnboardingScreen = ({navigation}: any) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const dispatch = useAppDispatch();

  const handleSkip = () => {
    dispatch(completeOnboarding());
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      dispatch(completeOnboarding());
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
        data={ONBOARDING_DATA}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
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
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
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
  container: {flex: 1, backgroundColor: COLORS.background},
  slide: {width, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40},
  icon: {fontSize: 100, marginBottom: 40},
  title: {fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 16, textAlign: 'center'},
  description: {fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24},
  footer: {padding: 20, paddingBottom: 40},
  indicators: {flexDirection: 'row', justifyContent: 'center', marginBottom: 20},
  indicator: {width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border, marginHorizontal: 4},
  indicatorActive: {backgroundColor: COLORS.primary, width: 24},
  buttons: {flexDirection: 'row', justifyContent: 'space-between'},
  skipButton: {padding: 16},
  skipText: {color: COLORS.textSecondary, fontSize: 16},
  nextButton: {backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 8},
  nextText: {color: '#FFF', fontSize: 16, fontWeight: '600'},
});
```

### 2. Home Screen

Create: `src/screens/HomeScreen.tsx`

```typescript
import React, {useState, useEffect} from 'react';
import {View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert} from 'react-native';
import {useAppDispatch, useAppSelector} from '../redux/hooks';
import {fetchTasks, updateTask, setFilter} from '../redux/slices/tasksSlice';
import {logout} from '../redux/slices/authSlice';
import {TaskCard} from '../components/TaskCard';
import {FloatingChatButton} from '../components/FloatingChatButton';
import {ChatModal} from '../components/ChatModal';
import {COLORS} from '../utils/colors';
import {TASK_FILTERS} from '../utils/constants';
import {TaskStatus} from '../types';

export const HomeScreen = () => {
  const [chatVisible, setChatVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useAppDispatch();
  const {items: tasks, filter, isLoading} = useAppSelector(state => state.tasks);
  const {user} = useAppSelector(state => state.auth);

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchTasks()).unwrap();
    setRefreshing(false);
  };

  const handleTaskPress = (task: any) => {
    Alert.alert(task.title, task.description || 'No description');
  };

  const handleStatusToggle = async (task: any) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await dispatch(updateTask({id: task.id, data: {status: newStatus}}));
  };

  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter(t => t.status === filter);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>TaskMaster</Text>
          <Text style={styles.headerSubtitle}>{user?.email}</Text>
        </View>
        <TouchableOpacity onPress={() => dispatch(logout())} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        {TASK_FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterButton, filter === f.value && styles.filterButtonActive]}
            onPress={() => dispatch(setFilter(f.value as TaskStatus | 'all'))}>
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={({item}) => (
          <TaskCard
            task={item}
            onPress={() => handleTaskPress(item)}
            onStatusToggle={() => handleStatusToggle(item)}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>Tap the chat button to create your first task!</Text>
          </View>
        }
      />

      <FloatingChatButton onPress={() => setChatVisible(true)} />
      <ChatModal visible={chatVisible} onClose={() => setChatVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  header: {backgroundColor: COLORS.primary, paddingVertical: 16, paddingHorizontal: 20, paddingTop: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  headerTitle: {fontSize: 24, fontWeight: 'bold', color: '#FFF'},
  headerSubtitle: {fontSize: 12, color: '#FFF', opacity: 0.8, marginTop: 4},
  logoutButton: {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)'},
  logoutText: {color: '#FFF', fontSize: 14, fontWeight: '600'},
  filters: {flexDirection: 'row', padding: 16, gap: 8},
  filterButton: {flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#FFF', alignItems: 'center'},
  filterButtonActive: {backgroundColor: COLORS.primary},
  filterText: {fontSize: 14, color: COLORS.text, fontWeight: '500'},
  filterTextActive: {color: '#FFF'},
  list: {paddingBottom: 100},
  empty: {alignItems: 'center', paddingTop: 100, paddingHorizontal: 40},
  emptyIcon: {fontSize: 64, marginBottom: 16},
  emptyText: {fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 8},
  emptySubtext: {fontSize: 14, color: COLORS.textSecondary, textAlign: 'center'},
});
```

### 3. Update App.tsx

Replace your entire `App.tsx` with:

```typescript
import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {ActivityIndicator, View, StyleSheet} from 'react-native';
import {store, persistor} from './src/redux/store';
import {useAppSelector} from './src/redux/hooks';
import {apiService} from './src/api/apiService';
import {LoginScreen} from './src/screens/LoginScreen';
import {RegisterScreen} from './src/screens/RegisterScreen';
import {OnboardingScreen} from './src/screens/OnboardingScreen';
import {HomeScreen} from './src/screens/HomeScreen';

const Stack = createNativeStackNavigator();

const Navigation = () => {
  const {isAuthenticated, hasSeenOnboarding, token} = useAppSelector(state => state.auth);

  useEffect(() => {
    if (token) {
      apiService.setToken(token);
    }
  }, [token]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {!hasSeenOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : isAuthenticated ? (
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6C63FF" />
          </View>
        }
        persistor={persistor}>
        <Navigation />
      </PersistGate>
    </Provider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA'},
});

export default App;
```

## 🚀 Final Steps:

1. Create the two screens above (OnboardingScreen, HomeScreen)
2. Replace App.tsx with the code above
3. Clean and rebuild:
```bash
cd myapp
rm -rf android/build android/app/build
npm start -- --reset-cache
# In another terminal:
npm run android
```

## 🎨 What You'll Get:

1. **Onboarding** - Beautiful 3-screen intro
2. **Home Dashboard** - Task list with filters
3. **Floating Chat** - AI assistant modal
4. **Task Management** - Create/complete tasks
5. **Modern Design** - Purple gradient, card UI

## 📱 User Flow:

First Launch → Onboarding → Login → Home (Tasks) → Floating Chat Button

The app is 95% complete! Just add those 2 screens and you're done! 🎉
