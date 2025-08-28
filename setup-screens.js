// Save as setup-screens.js and run: node setup-screens.js

const fs = require('fs');
const path = require('path');

const screens = [
  // Auth screens
  { file: 'src/screens/auth/SplashScreen.tsx', name: 'SplashScreen', component: 'Splash' },
  { file: 'src/screens/auth/IntroScreen.tsx', name: 'IntroScreen', component: 'Intro' },
  { file: 'src/screens/auth/RegisterScreen.tsx', name: 'RegisterScreen', component: 'Register' },
  { file: 'src/screens/auth/PhoneVerificationScreen.tsx', name: 'PhoneVerificationScreen', component: 'PhoneVerification' },
  { file: 'src/screens/auth/EmailVerificationScreen.tsx', name: 'EmailVerificationScreen', component: 'EmailVerification' },
  { file: 'src/screens/auth/LoginScreen.tsx', name: 'LoginScreen', component: 'Login' },
  
  // Onboarding screens
  { file: 'src/screens/onboarding/SetupChoiceScreen.tsx', name: 'SetupChoiceScreen', component: 'SetupChoice' },
  { file: 'src/screens/onboarding/VoiceSetupScreen.tsx', name: 'VoiceSetupScreen', component: 'VoiceSetup' },
  { file: 'src/screens/onboarding/ManualSetupScreen.tsx', name: 'ManualSetupScreen', component: 'ManualSetup' },
  { file: 'src/screens/onboarding/WelcomeScreen.tsx', name: 'WelcomeScreen', component: 'Welcome' },
  
  // Main screens
  { file: 'src/screens/main/DashboardScreen.tsx', name: 'DashboardScreen', component: 'Dashboard' },
  { file: 'src/screens/main/ProfileScreen.tsx', name: 'ProfileScreen', component: 'Profile' },
  { file: 'src/screens/main/SettingsScreen.tsx', name: 'SettingsScreen', component: 'Settings' },
  { file: 'src/screens/main/NotificationsScreen.tsx', name: 'NotificationsScreen', component: 'Notifications' },
  
  // Other screens...
];

const createScreenContent = (name, component) => `import React from 'react';
import { Box, Text, Center } from 'native-base';

const ${name}: React.FC = () => {
  return (
    <Center flex={1} bg="white">
      <Box>
        <Text fontSize="xl" fontWeight="bold">
          ${component} Screen
        </Text>
        <Text mt={4} color="gray.500">
          Coming soon...
        </Text>
      </Box>
    </Center>
  );
};

export default ${name};
`;

screens.forEach(({ file, name, component }) => {
  fs.writeFileSync(file, createScreenContent(name, component));
  console.log(`Created ${file}`);
});

console.log('All screens created!');