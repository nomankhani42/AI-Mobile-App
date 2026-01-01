#!/bin/bash

echo "=================================="
echo "Voice Integration Setup Script"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Checking package installation...${NC}"
if grep -q "@react-native-voice/voice" package.json; then
    echo -e "${GREEN}✓ Voice package found in package.json${NC}"
else
    echo -e "${RED}✗ Voice package not found${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Checking patch file...${NC}"
if [ -f "patches/@react-native-voice+voice+3.2.4.patch" ]; then
    echo -e "${GREEN}✓ Voice patch file exists${NC}"
else
    echo -e "${RED}✗ Patch file missing${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 3: Checking Android permissions...${NC}"
if grep -q "RECORD_AUDIO" android/app/src/main/AndroidManifest.xml; then
    echo -e "${GREEN}✓ RECORD_AUDIO permission added${NC}"
else
    echo -e "${RED}✗ RECORD_AUDIO permission missing${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 4: Cleaning previous builds...${NC}"
cd android
./gradlew clean > /dev/null 2>&1
echo -e "${GREEN}✓ Android build cleaned${NC}"
cd ..

echo ""
echo -e "${YELLOW}Step 5: Clearing Metro cache...${NC}"
rm -rf /tmp/metro-* > /dev/null 2>&1
rm -rf /tmp/react-* > /dev/null 2>&1
echo -e "${GREEN}✓ Metro cache cleared${NC}"

echo ""
echo -e "${GREEN}=================================="
echo "Setup verification completed!"
echo "=================================="
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Make sure Google app is installed on your device"
echo "2. Run: npm run android"
echo "3. Check logs with: adb logcat | grep Voice"
echo ""
