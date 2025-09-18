import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../src/services/authService';
import { SubscriptionService } from '../src/services/subscriptionService';
import { auth } from '../src/config/firebase';
import SuccessModal from '../src/components/SuccessModal';

const EmailLoginScreen = memo(() => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState({
    title: '',
    message: '',
    buttonText: '',
    onPress: () => {}
  });

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await AuthService.signIn(email, password);
      
      if (result.success) {
        // Check subscription status
        const subscription = await SubscriptionService.getSubscriptionStatus(result.user.uid);
        
        if (subscription?.status === 'trial' || subscription?.status === 'active') {
          // Check if user has connected Spotify
          const spotifyConnected = await AsyncStorage.getItem('spotifyAccessToken');
          if (spotifyConnected) {
            setSuccessData({
              title: 'Welcome Back! 🎉',
              message: 'Login successful! Taking you to your music library.',
              buttonText: 'Continue',
              onPress: () => {
                setShowSuccessModal(false);
                router.replace('/(tabs)');
              }
            });
            setShowSuccessModal(true);
          } else {
            setSuccessData({
              title: 'Login Successful! ✅',
              message: 'Now connect your Spotify account to access your music.',
              buttonText: 'Connect Spotify',
              onPress: () => {
                setShowSuccessModal(false);
                router.replace('/login');
              }
            });
            setShowSuccessModal(true);
          }
        } else {
          setSuccessData({
            title: 'Login Successful! ✅',
            message: 'Choose your plan to start your musical journey with Moodify.',
            buttonText: 'Choose Plan',
            onPress: () => {
              setShowSuccessModal(false);
              router.replace('/paywall');
            }
          });
          setShowSuccessModal(true);
        }
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  }, [email, password]);

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email first');
      return;
    }

    try {
      await AuthService.resetPassword(email);
      Alert.alert('Success', 'Password reset email sent!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.signOut();
      // Clear all local storage
      await AsyncStorage.clear();
      // Redirect to login
      router.replace('/email-login');
    } catch (error: any) {
      Alert.alert('Logout Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/logo/logo.png')}
                style={styles.logoImage}
                contentFit="contain"
              />
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Login to your account</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Field */}
            <LinearGradient
              colors={['#00CAFE', '#0D2099', '#B12BFE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.gradientBorder}
            >
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons name="mail" size={20} color="rgba(255, 255, 255, 0.6)" />
                </View>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </LinearGradient>

            {/* Password Field */}
            <LinearGradient
              colors={['#00CAFE', '#0D2099', '#B12BFE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.gradientBorder}
            >
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons name="lock-closed" size={20} color="rgba(255, 255, 255, 0.6)" />
                </View>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Remember Me */}
            <View style={styles.rememberContainer}>
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Ionicons name="checkmark" size={16} color="#00CAFE" />}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#00DEFF', '#0043F7', '#0E1D92', '#001C89', '#B22CFF']}
                locations={[0.0185, 0.3205, 0.5181, 0.6465, 0.9599]}
                style={styles.loginButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Signing In...' : 'Login'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotText}>Forgot the password?</Text>
            </TouchableOpacity>

            {/* Signup Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/email-signup')}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title={successData.title}
        message={successData.message}
        buttonText={successData.buttonText}
        onPress={successData.onPress}
        icon="checkmark-circle"
        color="#00CAFE"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#03021F',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 30,
  },
  header: {
    marginTop: 60,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 250,
    height: 250,
    marginBottom: 10,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  gradientBorder: {
    borderRadius: 8.538,
    padding: 1.5,
    marginBottom: 20,
  },
  inputContainer: {
    position: 'relative',
    backgroundColor: '#03021F',
    borderRadius: 7.038,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8.538,
    padding: 16,
    paddingLeft: 50,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 0,
    minHeight: 56,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
    padding: 4,
  },
  rememberContainer: {
    marginBottom: 30,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#00CAFE',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: 'rgba(0, 202, 254, 0.1)',
  },
  rememberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  loginButton: {
    borderRadius: 30,
    marginBottom: 20,
    shadowColor: '#00CAFE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  forgotButton: {
    alignItems: 'center',
    marginBottom: 30,
  },
  forgotText: {
    color: '#00CAFE',
    fontSize: 16,
    fontWeight: '500',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signupText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  signupLink: {
    color: '#00CAFE',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmailLoginScreen;
