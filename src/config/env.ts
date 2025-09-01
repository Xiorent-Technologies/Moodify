import { Platform } from 'react-native';

export const ENV = {
  // App Configuration
  APP_NAME: 'Moodify',
  APP_VERSION: '1.0.0',
  
  // API Configuration
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.moodify.com',
  API_TIMEOUT: 30000,
  
  // Feature Flags
  ENABLE_ANALYTICS: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
  ENABLE_CRASH_REPORTING: process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING === 'true',
  
  // Development
  IS_DEVELOPMENT: __DEV__,
  IS_PRODUCTION: !__DEV__,
  
  // Platform
  IS_IOS: Platform.OS === 'ios',
  IS_ANDROID: Platform.OS === 'android',
  IS_WEB: Platform.OS === 'web',
};

export default ENV;
