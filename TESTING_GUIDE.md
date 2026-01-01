# Testing Guide - Task Management App

## ✅ Fixed Issues

### 1. **Update Task Method**
- ✅ Added proper `pending`, `fulfilled`, and `rejected` cases
- ✅ Proper error handling and loading states
- ✅ Full API logging for debugging

### 2. **Delete Task Method**
- ✅ Added proper `pending`, `fulfilled`, and `rejected` cases
- ✅ Complete error handling

### 3. **Removed react-native-reanimated**
- ✅ Incompatible with RN 0.83
- ✅ Converted to standard React Native Animated API
- ✅ All animations work without external dependencies

---

## 🧪 Testing Checklist

### **Test 1: Create Task**

**Via Modal:**
```
1. Tap + button (bottom left)
2. Enter title: "Test Task 1"
3. Enter description: "Testing create"
4. Tap "Create Task"
```

**Expected Logs:**
```
[API] Creating task: {"title":"Test Task 1","description":"Testing create"}
[API] Create task response: {...}
```

**Via Voice:**
```
1. Tap 💬 button (bottom right)
2. Tap 🎤 microphone
3. Say: "Create a task to test voice"
4. Send message
```

**Expected Logs:**
```
[Voice] Recognized text: Create a task to test voice
[API] Creating task: {...}
```

---

### **Test 2: Update Task Status**

```
1. Tap on the status badge or checkbox on any task
2. Status dropdown slides up from bottom
3. See current status with checkmark
4. Select different status (e.g., Pending → In Progress)
5. Dropdown slides down
```

**Expected Logs:**
```
[HomeScreen] Updating task status: <task-id> in_progress
[API] Updating task: <task-id>
[API] Update data: {
  "status": "in_progress"
}
[API] Update response: {
  "id": "<task-id>",
  "status": "in_progress",
  ...
}
```

**Expected UI:**
- Task card updates immediately
- Status badge changes icon and color
  - ⏳ Pending (Orange)
  - 🚀 In Progress (Blue)
  - ✅ Completed (Green)
- Success alert appears

---

### **Test 3: Delete Task**

```
1. Tap 🗑️ delete icon on task card
2. Modern modal pops up with scale animation
3. Shows task title being deleted
4. Tap "Delete"
5. Modal disappears
6. Task removed from list
```

**Expected Logs:**
```
[HomeScreen] Deleting task: <task-id>
[API] Deleting task: <task-id>
[API] Task deleted successfully
```

**Expected UI:**
- Modal scales in smoothly
- Backdrop fades in
- Task disappears after confirmation
- Success alert appears

---

## 🐛 Debugging

### **Watch All Logs:**
```bash
adb logcat | grep -E "\[API\]|\[HomeScreen\]|\[Voice\]"
```

### **Check Network Requests:**
```bash
adb logcat | grep -i "axios"
```

### **Common Issues:**

#### **1. "Failed to update task status"**
**Check:**
- Backend is running
- Task ID is valid
- Auth token is valid

**Logs to check:**
```
[API] Update task failed: <error>
🔴 Axios Error: {...}
```

**Solution:**
- Logout and login again (refresh token)
- Check backend logs
- Verify API endpoint: `PATCH /api/v1/tasks/{id}`

---

#### **2. Status not updating in UI**
**Check:**
- Response returns updated task object
- Task ID matches

**Logs to check:**
```
[API] Update response: {
  "id": "...",
  "status": "in_progress"  // ← Should be updated
}
```

**Solution:**
- Refresh the task list (pull down)
- Check if backend returns complete task object

---

#### **3. Delete confirmation modal doesn't appear**
**Check:**
- Modal state management
- selectedTask is set

**Debug:**
```javascript
console.log('Delete pressed, task:', task);
console.log('Modal visible:', deleteModalVisible);
```

---

## 📊 Expected Status Flow

### **Status Transitions:**
```
Pending (⏳) → In Progress (🚀) → Completed (✅)
     ↑                                    ↓
     └────────────────────────────────────┘
```

### **API Payload:**
```json
{
  "status": "pending"      // ⏳ Orange
  "status": "in_progress"  // 🚀 Blue
  "status": "completed"    // ✅ Green
}
```

---

## 🎯 Success Criteria

### **Update Task:**
- ✅ Dropdown slides smoothly
- ✅ Current status highlighted
- ✅ Select works on first tap
- ✅ API called with correct payload
- ✅ UI updates immediately
- ✅ Success alert shows
- ✅ Logs show complete flow

### **Delete Task:**
- ✅ Modal scales in smoothly
- ✅ Shows correct task title
- ✅ Confirmation required
- ✅ API called on confirm
- ✅ Task removed from list
- ✅ Success alert shows
- ✅ Logs show complete flow

### **Voice Integration:**
- ✅ Microphone button appears (if supported)
- ✅ Permission requested
- ✅ Voice recognition works
- ✅ Text appears in input
- ✅ Tasks created successfully

---

## 🚀 Build Commands

```bash
cd /home/noman-khan/Desktop/mobile/myapp

# Clean and build
cd android && ./gradlew clean && cd ..
rm -rf /tmp/metro-*
adb uninstall com.myapp
npm run android
```

---

## 📝 Notes

- Update uses `PUT` method (matching backend route)
- Status must be exact: `pending`, `in_progress`, or `completed`
- All operations have loading states
- All operations have error handling
- All operations have detailed logging
- No external animation dependencies needed
- Uses React Native's built-in Animated API (no Reanimated)
