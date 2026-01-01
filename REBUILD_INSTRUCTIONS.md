# Rebuild Instructions - IMPORTANT

## Issues Fixed
1. ✅ Modal bubbling when clicking input fields in AddTaskModal
2. ✅ Voice integration error handling improved (was showing `{}`)

## Required Steps to Apply Fixes

### 1. Clean and Rebuild (REQUIRED)

The voice integration requires native module linking. You MUST rebuild the app:

#### For Android:
```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npm run android
```

#### For iOS:
```bash
# Install pods and rebuild
cd ios
pod install
cd ..
npm run ios
```

### 2. Verify Voice Setup

After rebuilding, check the console logs when opening the chat modal. You should see:

**✅ Success:**
```
[Voice] Initializing voice module...
[Voice] Module type: object
[Voice] Module keys: start, stop, cancel, destroy, ...
[Voice] Voice recognition available: 1
[Voice] ✅ Event listeners registered successfully
```

**❌ Failure (needs rebuild):**
```
[Voice] Voice module is not loaded
```

### 3. Test Voice Integration

1. Open the chat modal (tap chat button)
2. Tap the microphone button 🎤
3. Grant microphone permission if prompted
4. Speak your message
5. Voice text should appear in the input field

**Android Requirements:**
- Google app must be installed and updated
- Microphone permission required

**iOS Requirements:**
- iOS 10+ required
- Microphone and Speech Recognition permissions required (already added to Info.plist)

### 4. Test Modal Fix

1. Tap the + button to create a new task
2. Click on the Title input field - modal should NOT close
3. Click on the Description textarea - modal should NOT close
4. Click on the Deadline button - date picker should open
5. Click outside the modal (on dark backdrop) - modal SHOULD close

### 5. Test Date Picker

1. Open Add Task modal
2. Tap the deadline field (shows "No deadline set")
3. Select a date and time in the picker
4. Tap "Confirm"
5. Date should display formatted (e.g., "December 25, 2025 at 2:30 PM")
6. Tap "Clear deadline" to remove it
7. Create task and verify deadline is saved correctly

## Troubleshooting

### Voice Not Working After Rebuild

**Android:**
1. Make sure Google app is installed: `adb shell pm list packages | grep google`
2. Update Google app from Play Store
3. Check microphone permission in app settings
4. Check logs: `adb logcat | grep Voice`

**iOS:**
1. Check microphone permission in Settings > Privacy > Microphone
2. Check speech recognition permission in Settings > Privacy > Speech Recognition
3. Make sure pods were installed: `cd ios && pod install`
4. Clean build folder: Xcode > Product > Clean Build Folder

### Modal Still Closing

- Make sure you rebuilt the app after the fix
- The TouchableWithoutFeedback wrapper now prevents touch propagation

### Date Picker Not Showing

- Rebuild the app (new dependency: react-native-date-picker)
- iOS: Make sure pods are installed
- Android: Make sure gradle built successfully

## Verification Commands

```bash
# Check if packages are installed
npm list @react-native-voice/voice
npm list react-native-date-picker

# For iOS - verify pods
cd ios && pod list | grep -E "RNDatePicker|react-native-voice"

# For Android - check if modules are linked
./gradlew :app:dependencies | grep -E "voice|date"
```

## Notes

- All changes require a full rebuild (not just Metro bundler restart)
- Voice module uses native code that must be compiled
- Date picker also requires native linking
- If issues persist, try: `npm run android -- --reset-cache` or `npm run ios -- --reset-cache`
