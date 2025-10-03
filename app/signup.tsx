import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { BackgroundDecorations, ThemedText } from '../src/components';

export default function SignupScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    try {
      // Here you would typically handle signup with your backend
      // For now, we'll simulate a successful signup
      
      // Set login status in AsyncStorage
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('userEmail', email);
      await AsyncStorage.setItem('firstName', firstName);
      await AsyncStorage.setItem('lastName', lastName);
      await AsyncStorage.setItem('isFirstTimeUser', 'true');
      
      Alert.alert('Success', 'Account created successfully!');
      router.replace('/onboarding');
    } catch (error) {
      Alert.alert('Error', 'Signup failed. Please try again.');
    }
  };

  const handleLogin = () => {
    router.replace('/login');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <BackgroundDecorations />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Logo Section */}
      <View style={styles.logoSection}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo/logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
        {/* Shadowish blue line under logo */}
        <View style={styles.shadowLine} />
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <ThemedText style={styles.title}>Let's get you in</ThemedText>
        
        <View style={styles.form}>
          <View style={styles.nameRow}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWithIcon}>
              <Ionicons name="mail" size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIconText]}
                placeholder="Email"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWithIcon}>
              <Ionicons name="lock-closed" size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIconText]}
                placeholder="Password"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color="rgba(255, 255, 255, 0.7)" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWithIcon}>
              <Ionicons name="lock-closed" size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIconText]}
                placeholder="Confirm Password"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Ionicons name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="rgba(255, 255, 255, 0.7)" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
            <LinearGradient
              colors={['#00CAFE', '#0D2099', '#B12BFE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <ThemedText style={styles.signupButtonText}>Signup</ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>Don't have an account? </ThemedText>
        <TouchableOpacity onPress={handleLogin}>
          <ThemedText style={styles.loginLink}>Login</ThemedText>
        </TouchableOpacity>
      </View>
        </ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#03021F',
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  logoContainer: {
    width: 150,
    height: 150,
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
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 0.5,
  },
  form: {
    gap: 20,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
  },
  halfWidth: {
    width: '48%',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 202, 254, 0.5)',
    shadowColor: '#00CAFE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 202, 254, 0.5)',
    shadowColor: '#00CAFE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  inputWithIconText: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  eyeIcon: {
    padding: 16,
  },
  signupButton: {
    marginTop: 30,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#00CAFE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  gradientButton: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  loginLink: {
    color: '#00CAFE',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
});
