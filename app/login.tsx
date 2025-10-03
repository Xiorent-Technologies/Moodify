import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BackgroundDecorations, ThemedText } from '../src/components';
import { SpotifyAuthService } from '../src/services/spotifyAuth';
import { AuthService } from '../src/services/authService';
import { auth } from '../src/config/firebase';

export default function LoginScreen() {
  const [isSpotifyLoading, setIsSpotifyLoading] = useState(false);
  const [spotifyLoadingText, setSpotifyLoadingText] = useState('Connect with Spotify');



  const handleSpotifyLogin = async () => {
    try {
      setIsSpotifyLoading(true);
      setSpotifyLoadingText('Opening Spotify...');
      
      // Authenticate with Spotify
      setSpotifyLoadingText('Authenticating with Spotify...');
      await SpotifyAuthService.authenticate();
      
      // Get user profile from Spotify
      setSpotifyLoadingText('Getting your profile...');
      const userProfile = await SpotifyAuthService.getUserProfile();
      
      // Set login status and user data in AsyncStorage
      setSpotifyLoadingText('Setting up your account...');
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('userEmail', userProfile.email || 'spotify_user@moodify.com');
      await AsyncStorage.setItem('firstName', userProfile.display_name?.split(' ')[0] || 'User');
      await AsyncStorage.setItem('lastName', userProfile.display_name?.split(' ').slice(1).join(' ') || '');
      await AsyncStorage.setItem('isFirstTimeUser', 'true');
      await AsyncStorage.setItem('onboardingCompleted', 'false');
      
      // Store Spotify email in Firebase if user is logged in
      if (auth.currentUser) {
        try {
          await AuthService.updateSpotifyConnection(auth.currentUser.uid, {
            email: userProfile.email,
            displayName: userProfile.display_name,
            id: userProfile.id
          });
        } catch (error) {
          // Don't fail the login if Firebase update fails
        }
      }
      
      
      // Navigate to onboarding for first-time Spotify users
      
      // Add a small delay to ensure all AsyncStorage operations are complete
      setTimeout(() => {
        router.replace('/onboarding');
      }, 100);
    } catch (error) {
      Alert.alert('Error', `Spotify login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSpotifyLoading(false);
      setSpotifyLoadingText('Connect with Spotify');
    }
  };



  return (
    <View style={styles.container}>
      <BackgroundDecorations />
      
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        {/* Shadowish blue line under logo */}
        <View style={styles.shadowLine} />
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        
        <View style={styles.form}>
          {/* Spotify Login Button */}
          <TouchableOpacity 
            style={styles.spotifyButton} 
            onPress={handleSpotifyLogin} 
            disabled={isSpotifyLoading}
          >
            <LinearGradient
              colors={['#1DB954', '#1ed760']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.spotifyButtonGradient}
            >
              {isSpotifyLoading ? (
                <Ionicons name="refresh" size={24} color="#FFFFFF" />
              ) : (
                <Ionicons name="musical-notes" size={24} color="#FFFFFF" />
              )}
              <ThemedText style={styles.spotifyButtonText}>
                {isSpotifyLoading ? spotifyLoadingText : 'Connect with Spotify'}
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>

          {/* <TouchableOpacity 
            style={styles.emailButton} 
            onPress={() => router.push('/email-login')}
          >
            <LinearGradient
              colors={['#00CAFE', '#0099CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.emailButtonGradient}
            >
              <Ionicons name="mail" size={24} color="#FFFFFF" />
              <ThemedText style={styles.emailButtonText}>Continue with Email</ThemedText>
            </LinearGradient>
          </TouchableOpacity> */}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#03021F',
  },

  logoSection: {
    flex: 0.6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  shadowLine: {
    width: 80,
    height: 2,
    backgroundColor: 'rgba(0, 202, 254, 0.4)',
    borderRadius: 1,
    marginTop: 15,
    shadowColor: '#00CAFE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  mainContent: {
    flex: 0.4,
    paddingHorizontal: 20,
    paddingBottom: 50,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  form: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotifyButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    width: '100%',
  },
  spotifyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  spotifyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  emailButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#00CAFE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    width: '100%',
  },
  emailButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  emailButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
});
