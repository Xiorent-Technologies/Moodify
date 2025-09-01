import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { BackgroundDecorations, ThemedText } from '../src/components';

export default function WelcomeScreen() {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const firstName = await AsyncStorage.getItem('firstName');
      const lastName = await AsyncStorage.getItem('lastName');
      if (firstName) {
        setUserName(firstName);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('isLoggedIn');
      await AsyncStorage.removeItem('userEmail');
      await AsyncStorage.removeItem('firstName');
      await AsyncStorage.removeItem('lastName');
      await AsyncStorage.removeItem('onboardingCompleted');
      router.replace('/signup');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleContinue = async () => {
    // Check if onboarding is completed
    const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
    if (onboardingCompleted === 'true') {
      router.push('/(tabs)');
    } else {
      router.push('/onboarding');
    }
  };

  return (
    <View style={styles.container}>
      <BackgroundDecorations />
      
      {/* Header with logout button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Welcome Content */}
      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <ThemedText style={styles.welcomeTitle}>
            Welcome back{userName ? `, ${userName}` : ''}! 🎵
          </ThemedText>
          <ThemedText style={styles.welcomeSubtitle}>
            Ready to discover your perfect mood music?
          </ThemedText>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleContinue}>
            <ThemedText style={styles.actionButtonText}>Continue to App</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout}>
            <ThemedText style={styles.secondaryButtonText}>Switch Account</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070031',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 26,
  },
  actionsContainer: {
    width: '100%',
    gap: 20,
  },
  actionButton: {
    backgroundColor: '#00CAFE',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#00CAFE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 18,
    fontWeight: '500',
  },
});
