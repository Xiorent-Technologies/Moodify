import React, { useState } from 'react';
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
import { AuthService } from '../src/services/authService';
import SuccessModal from '../src/components/SuccessModal';

export default function EmailSignupScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState({
    title: '',
    message: '',
    buttonText: '',
    onPress: () => {}
  });

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const result = await AuthService.signUp(
        email,
        password,
        firstName,
        lastName,
        referralCode || undefined
      );
      
      if (result.success) {
        setSuccessData({
          title: 'Welcome to Moodify! 🎉',
          message: 'Account created successfully! Now choose your plan to start your musical journey.',
          buttonText: 'Choose Plan',
          onPress: () => {
            setShowSuccessModal(false);
            router.replace('/paywall');
          }
        });
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header with back button */}
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
            <Text style={styles.title}>Let's get you in</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Fields */}
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <LinearGradient
                  colors={['#00CAFE', '#0D2099', '#B12BFE']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.gradientBorder}
                >
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Frist Name"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    />
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.nameField}>
                <LinearGradient
                  colors={['#00CAFE', '#0D2099', '#B12BFE']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.gradientBorder}
                >
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Last Name"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    />
                  </View>
                </LinearGradient>
              </View>
            </View>

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

            {/* Confirm Password Field */}
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
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Referral Code Field */}
            <LinearGradient
              colors={['#00CAFE', '#0D2099', '#B12BFE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.gradientBorder}
            >
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons name="gift" size={20} color="rgba(255, 255, 255, 0.6)" />
                </View>
                <TextInput
                  style={styles.input}
                  value={referralCode}
                  onChangeText={setReferralCode}
                  placeholder="Referral Code (Optional)"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  autoCapitalize="characters"
                />
              </View>
            </LinearGradient>

            {/* Signup Button */}
            <TouchableOpacity
              style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#00DEFF', '#0043F7', '#0E1D92', '#001C89', '#B22CFF']}
                locations={[0.0185, 0.3205, 0.5181, 0.6465, 0.9599]}
                style={styles.signupButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.signupButtonText}>
                  {isLoading ? 'Creating Account...' : 'Signup'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/email-login')}>
                <Text style={styles.loginLink}>Login</Text>
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
}

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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 250,
    height: 250,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: 30,
  },
  nameRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  nameField: {
    flex: 1,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 0,
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
  gradientBorder: {
    borderRadius: 8.538,
    padding: 1.5,
    marginBottom: 20,
  },
  inputContainer: {
    position: 'relative',
    backgroundColor: '#03021F',
    borderRadius: 7.038, // Slightly smaller to show the gradient border
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
    padding: 4,
  },
  signupButton: {
    borderRadius: 30,
    marginTop: 20,
    marginBottom: 30,
    shadowColor: '#00CAFE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signupButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  loginLink: {
    fontSize: 16,
    color: '#00CAFE',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
