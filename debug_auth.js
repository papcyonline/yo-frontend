// Simple debug script to check what's in AsyncStorage for auth
const AsyncStorage = require('@react-native-async-storage/async-storage');

async function checkAuthStorage() {
  try {
    console.log('🔍 Checking authentication storage...');
    
    // Get the auth storage key (from authStore.ts line 142)
    const authData = await AsyncStorage.getItem('yofam-auth-storage');
    
    if (!authData) {
      console.log('❌ No auth data found in storage');
      return;
    }
    
    const parsed = JSON.parse(authData);
    console.log('📱 Auth storage contents:');
    console.log('  Authenticated:', parsed.state?.isAuthenticated || false);
    console.log('  User:', parsed.state?.user?.firstName || 'null', parsed.state?.user?.lastName || '');
    console.log('  Token:', parsed.state?.token ? 'Present' : 'Missing');
    console.log('  Refresh Token:', parsed.state?.refreshToken ? 'Present' : 'Missing');
    console.log('  Onboarding Complete:', parsed.state?.hasCompletedOnboarding || false);
    
    if (parsed.state?.token) {
      console.log('✅ Token exists - checking if valid...');
      
      // Try to decode JWT to check expiration (basic check)
      const tokenParts = parsed.state.token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        const now = Math.floor(Date.now() / 1000);
        const expires = payload.exp;
        
        console.log('  Token expires:', new Date(expires * 1000));
        console.log('  Current time:', new Date());
        console.log('  Token valid:', expires > now ? 'Yes' : 'EXPIRED');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking auth storage:', error.message);
  }
}

checkAuthStorage();