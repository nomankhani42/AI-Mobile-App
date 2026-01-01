#!/bin/bash

echo "🔍 Verifying Voice Module Setup..."
echo ""

# Check if package is installed
echo "1. Checking npm package..."
if npm list @react-native-voice/voice | grep -q "@react-native-voice/voice@"; then
    echo "   ✅ Package installed: $(npm list @react-native-voice/voice 2>/dev/null | grep @react-native-voice)"
else
    echo "   ❌ Package not found!"
    exit 1
fi

# Check if module files exist
echo ""
echo "2. Checking module files..."
if [ -d "node_modules/@react-native-voice/voice" ]; then
    echo "   ✅ Module directory exists"
    if [ -f "node_modules/@react-native-voice/voice/dist/index.js" ]; then
        echo "   ✅ JavaScript files present"
    else
        echo "   ⚠️  JavaScript files missing - try: npm install"
    fi
else
    echo "   ❌ Module directory not found!"
    exit 1
fi

# Check Android setup
echo ""
echo "3. Checking Android setup..."
if [ -f "android/settings.gradle" ]; then
    if grep -q "react-native-voice" android/settings.gradle; then
        echo "   ✅ Module included in settings.gradle"
    else
        echo "   ℹ️  Auto-linking should handle this"
    fi
fi

if [ -d "node_modules/@react-native-voice/voice/android" ]; then
    echo "   ✅ Android native code present"
else
    echo "   ⚠️  Android native code missing"
fi

# Check iOS setup
echo ""
echo "4. Checking iOS setup..."
if [ -d "ios" ]; then
    if [ -f "ios/Podfile" ]; then
        echo "   ✅ Podfile exists"
        if [ -f "ios/Podfile.lock" ]; then
            if grep -q "react-native-voice" ios/Podfile.lock; then
                echo "   ✅ Voice module in Podfile.lock"
            else
                echo "   ⚠️  Voice module NOT in Podfile.lock - run: cd ios && pod install"
            fi
        else
            echo "   ⚠️  Podfile.lock not found - run: cd ios && pod install"
        fi
    fi
    
    if [ -d "node_modules/@react-native-voice/voice/ios" ]; then
        echo "   ✅ iOS native code present"
    else
        echo "   ⚠️  iOS native code missing"
    fi
else
    echo "   ℹ️  iOS folder not found (normal for Android-only setup)"
fi

# Check permissions
echo ""
echo "5. Checking permissions..."
if grep -q "RECORD_AUDIO" android/app/src/main/AndroidManifest.xml 2>/dev/null; then
    echo "   ✅ Android RECORD_AUDIO permission present"
else
    echo "   ⚠️  Android RECORD_AUDIO permission missing"
fi

if [ -f "ios/myapp/Info.plist" ]; then
    if grep -q "NSMicrophoneUsageDescription" ios/myapp/Info.plist; then
        echo "   ✅ iOS microphone permission present"
    else
        echo "   ⚠️  iOS microphone permission missing"
    fi
    if grep -q "NSSpeechRecognitionUsageDescription" ios/myapp/Info.plist; then
        echo "   ✅ iOS speech recognition permission present"
    else
        echo "   ⚠️  iOS speech recognition permission missing"
    fi
fi

echo ""
echo "📋 Next Steps:"
echo ""
echo "If you see any ⚠️ or ❌ above, run:"
echo ""
echo "For Android:"
echo "  cd android && ./gradlew clean && cd .. && npm run android"
echo ""
echo "For iOS:"
echo "  cd ios && pod install && cd .. && npm run ios"
echo ""
echo "Note: Metro bundler restart is NOT enough - native rebuild required!"
