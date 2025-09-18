import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { SplashScreen } from '../src/components/SplashScreen';
import { auth } from '../src/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { SubscriptionService } from '../src/services/subscriptionService';

export default function Index() {
  
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean | null>(null);

  useEffect(() => {
    // Check onboarding status first
    checkStatus();
    
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      
      if (user) {
        // User is signed in
        setIsLoggedIn(true);
        try {
          // Check subscription status from Firebase
          const subscription = await SubscriptionService.getSubscriptionStatus(user.uid);
          
          if (subscription?.status === 'trial' || subscription?.status === 'active') {
            // User has active subscription (trial or premium), check Spotify connection
            const spotifyConnected = await AsyncStorage.getItem('spotifyAccessToken');
            
            if (spotifyConnected) {
              // Spotify connected, check onboarding status
              const onboardingStatus = await AsyncStorage.getItem('onboardingCompleted');
              const firstTimeStatus = await AsyncStorage.getItem('isFirstTimeUser');
              setOnboardingCompleted(onboardingStatus === 'true');
              setIsFirstTimeUser(firstTimeStatus === 'true');
              
              // Redirect based on onboarding status
              if (onboardingStatus === 'true') {
                router.replace('/(tabs)');
              } else {
                router.replace('/onboarding');
              }
            } else {
              // Spotify not connected, redirect to Spotify login
              router.replace('/login');
            }
          } else {
            // User needs to subscribe (go to paywall for free trial)
            router.replace('/paywall');
          }
        } catch (error) {
          // If there's an error checking subscription, redirect to paywall
          router.replace('/paywall');
        }
      } else {
        // User is signed out
        setIsLoggedIn(false);
        setOnboardingCompleted(false);
        setIsFirstTimeUser(false);
        router.replace('/email-login');
      }
    });

    return () => unsubscribe();
  }, []);

  const checkStatus = async () => {
    try {
      // Check onboarding and first-time user status from AsyncStorage
      const onboardingStatus = await AsyncStorage.getItem('onboardingCompleted');
      const firstTimeStatus = await AsyncStorage.getItem('isFirstTimeUser');

      const hasCompletedOnboarding = onboardingStatus === 'true';
      const isFirstTime = firstTimeStatus === 'true';

      // Set onboarding status (login status is handled by Firebase auth state)
      setOnboardingCompleted(hasCompletedOnboarding);
      setIsFirstTimeUser(isFirstTime);

    } catch (error) {
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
    return <SplashScreen onFinish={() => {}} />;
  }

  // Debug logging

  // Redirect based on authentication status

  // Redirect based on status
  if (isLoggedIn) {
    // The useEffect above will handle the subscription and Spotify checks
    // For now, show loading while checks are being performed
    return <SplashScreen onFinish={() => {}} />;
  } else {
    // User not logged in, show email login options
    return <Redirect href="/email-login" />;
  }
}
