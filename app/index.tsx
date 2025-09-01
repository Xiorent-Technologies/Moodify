import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { SplashScreen } from '../src/components/SplashScreen';

export default function Index() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      // Check if user is logged in from AsyncStorage
      const loginStatus = await AsyncStorage.getItem('isLoggedIn');
      const onboardingStatus = await AsyncStorage.getItem('onboardingCompleted');
      const firstTimeStatus = await AsyncStorage.getItem('isFirstTimeUser');

      const isLoggedIn = loginStatus === 'true';
      const hasCompletedOnboarding = onboardingStatus === 'true';
      const isFirstTime = firstTimeStatus === 'true';

      // Use actual values from AsyncStorage
      setIsLoggedIn(isLoggedIn);
      setOnboardingCompleted(hasCompletedOnboarding);
      setIsFirstTimeUser(isFirstTime);

    } catch (error) {
      console.error('Error checking status:', error);
      setIsLoggedIn(false);
      setOnboardingCompleted(false);
      setIsFirstTimeUser(false);
    }
  };

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // Show loading while checking status
  if (isLoggedIn === null || onboardingCompleted === null || isFirstTimeUser === null) {
    return null;
  }

  // Redirect based on status
  if (isLoggedIn) {
    if (isFirstTimeUser) {
      // First time user: go through complete flow
      if (onboardingCompleted) {
        return <Redirect href="/mood-creation" />;
      } else {
        return <Redirect href="/onboarding" />;
      }
    } else {
      // Returning user: go directly to home
      return <Redirect href="/(tabs)" />;
    }
  } else {
    return <Redirect href="/login" />;
  }
}
