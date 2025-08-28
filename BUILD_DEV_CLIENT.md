# Building a Development Client for WebRTC Support

Since Expo Go doesn't support WebRTC, you need to create a custom development build.

## Steps to Create Development Build:

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Configure your project
```bash
eas build:configure
```

### 3. Install WebRTC package
```bash
npx expo install react-native-webrtc
```

### 4. Create development build for Android
```bash
eas build --profile development --platform android
```

### 5. Create development build for iOS (Mac required)
```bash
eas build --profile development --platform ios
```

## Alternative: Local Build (Android)

### Prerequisites:
- Android Studio installed
- Android SDK configured

### Steps:
```bash
# Generate native Android project
npx expo prebuild --platform android

# Build APK
cd android
./gradlew assembleDebug

# Install on device
adb install app/build/outputs/apk/debug/app-debug.apk
```

## Testing with Development Build:
Once installed, the app will work like Expo Go but with native module support including WebRTC.