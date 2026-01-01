# 🐛 Debugging Network Connection Issues

## Problem: React Native app not calling backend API

### Step 1: Check Backend is Running

```bash
# In backend terminal, you should see:
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.

# Test from command line:
curl http://localhost:8000/health
# Should return: {"status":"healthy","database":"ok"}
```

### Step 2: Check Metro Bundler Logs

When you open the app, look for these logs in Metro bundler:
- `🔍 Testing backend connections...`
- `✅ Backend is reachable at: http://10.0.2.2:8000`

If you see `❌ Cannot reach backend`, the app can't connect.

### Step 3: Enable React Native Debugger

1. Open the app on emulator/device
2. Shake the device or press `Ctrl+M` (Android) / `Cmd+D` (iOS)
3. Select "Debug"
4. Open Chrome DevTools
5. Check Console tab for network logs

### Step 4: Check Network Configuration

For **Android Emulator**:
- Use `10.0.2.2` instead of `localhost`
- Check `.env` file: `API_URL=http://10.0.2.2:8000`

For **iOS Simulator**:
- Use `localhost`
- Check `.env` file: `API_URL=http://localhost:8000`

For **Real Device**:
- Use your computer's IP address
- Get IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Example: `API_URL=http://192.168.1.100:8000`
- Make sure device is on same WiFi network

### Step 5: Test Direct Connection

Try this in your app to see detailed logs:

```typescript
// Add this button in LoginScreen temporarily
<TouchableOpacity
  onPress={() => testBackendConnection()}
  style={{padding: 20, backgroundColor: 'blue'}}>
  <Text style={{color: 'white'}}>Test Connection</Text>
</TouchableOpacity>
```

### Common Issues:

#### 1. Backend Not Running
```bash
# Start backend:
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 2. Firewall Blocking Connection
```bash
# Linux: Allow port 8000
sudo ufw allow 8000

# Mac: Check System Preferences > Security & Privacy > Firewall
```

#### 3. Wrong IP Address for Real Device
```bash
# Find your IP:
# Linux/Mac:
ip addr show | grep "inet "
# Windows:
ipconfig

# Update .env:
API_URL=http://YOUR_IP:8000
```

#### 4. Android Network Security (API 28+)
Android blocks cleartext HTTP by default. Create this file:

`android/app/src/main/res/xml/network_security_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

Then reference it in AndroidManifest.xml:
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

### Step 6: Verify API Endpoints

Test endpoints manually:

```bash
# Register:
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"testpassword123"}'

# Login:
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"testpassword123"}'
```

### Step 7: Check React Native Config

Verify the config is loaded:
```typescript
import Config from 'react-native-config';
console.log('API_URL:', Config.API_URL);
```

If undefined, rebuild the app:
```bash
cd android && ./gradlew clean && cd ..
npm run android
```
