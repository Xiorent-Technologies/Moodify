import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, Stack, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function NotFoundScreen() {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check authentication status and redirect appropriately
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
      const isFirstTimeUser = await AsyncStorage.getItem('isFirstTimeUser');

      if (isLoggedIn === 'true') {
        if (isFirstTimeUser === 'true') {
          if (onboardingCompleted === 'true') {
            router.replace('/mood-creation');
          } else {
            router.replace('/onboarding');
          }
        } else {
          router.replace('/(tabs)');
        }
      } else {
        router.replace('/login');
      }
    } catch (error) {
      router.replace('/login');
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00CAFE" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#0A0A0A', '#1A1A2E', '#16213E']}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Oops!</Text>
          <Text style={styles.subtitle}>This screen doesn't exist</Text>
          <Text style={styles.description}>
            Don't worry, we'll get you back on track!
          </Text>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={checkAuthAndRedirect}
          >
            <Text style={styles.buttonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#CCCCCC',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#00CAFE',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    minWidth: 150,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
