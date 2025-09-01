import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BackgroundDecorations, ThemedText } from '../src/components';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    image: require('../assets/images/welcome/img1.png'),
    title: 'Welcome to MoodyAi',
    subtitle: 'Your mood, your genre, your music',
    description: 'Where your creativity takes center stage!',
    step: 1
  },
  {
    id: 2,
    image: require('../assets/images/welcome/image2.png'),
    title: 'Customization',
    subtitle: 'Pick your vibe, your genre, your tempo',
    description: 'MoodyAi makes it all yours.',
    step: 2
  },
  {
    id: 3,
    image: require('../assets/images/welcome/image3.jpg'),
    title: 'Preview',
    subtitle: 'Hear your custom track, crafted just for you in seconds.',
    description: "It's your music, made real.",
    step: 3
  },
  {
    id: 4,
    image: require('../assets/images/welcome/image4.jpg'),
    title: 'Save & Share',
    subtitle: 'Love your track? Keep it, share it, and show the world your sound.',
    description: '',
    step: 4
  },
  {
    id: 5,
    image: require('../assets/images/welcome/img1.png'), // Using img1 as placeholder for now
    title: 'Welcome to MoodyAi',
    subtitle: 'Ready to create? Let\'s get started with MoodyAi!',
    description: '',
    step: 5
  }
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingData.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      router.replace('/mood-creation');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      router.replace('/mood-creation');
    }
  };

  const currentData = onboardingData[currentStep];

  return (
    <View style={styles.container}>
      <BackgroundDecorations />
      
      {/* Header */}
      <View style={styles.header}>
        {currentStep > 0 && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <ThemedText style={styles.skipText}>Skip</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Content Area with Navigation */}
        <View style={styles.contentArea}>
          {/* Large Left Navigation Area */}
          {currentStep > 0 && (
            <TouchableOpacity 
              style={styles.leftNavigationArea} 
              onPress={handleBack}
              activeOpacity={0.8}
            >
              <View style={styles.navigationIndicator}>
                <Ionicons name="chevron-back" size={20} color="rgba(255, 255, 255, 0.4)" />
              </View>
            </TouchableOpacity>
          )}

          {/* Large Right Navigation Area */}
          {currentStep < onboardingData.length - 1 && (
            <TouchableOpacity 
              style={styles.rightNavigationArea} 
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <View style={styles.navigationIndicator}>
                <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.4)" />
              </View>
            </TouchableOpacity>
          )}

          {/* Content Overlay (non-interactive for display) */}
          <View style={styles.contentOverlay} pointerEvents="none">
            {/* Image */}
            <View style={styles.imageContainer}>
              <Image
                source={currentData.image}
                style={styles.image}
                contentFit="contain"
                placeholder="Loading..."
              />
            </View>

            {/* Text Content */}
            <View style={styles.textContainer}>
              <ThemedText style={styles.title}>{currentData.title}</ThemedText>
              <ThemedText style={styles.subtitle}>{currentData.subtitle}</ThemedText>
              {currentData.description && (
                <ThemedText style={styles.description}>{currentData.description}</ThemedText>
              )}
            </View>
          </View>
        </View>

        {/* Progress Indicators */}
        <View style={styles.progressContainer}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentStep ? styles.progressDotActive : styles.progressDotInactive
              ]}
            />
          ))}
        </View>

        {/* Navigation Hint */}
        <View style={styles.swipeHint}>
          <ThemedText style={styles.swipeHintText}>
            {currentStep > 0 ? '← Tap left or right half →' : 'Tap right half →'}
          </ThemedText>
        </View>
      </View>

      {/* Next Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <ThemedText style={styles.nextButtonText}>
            {currentStep === onboardingData.length - 1 ? 'Get Started' : 'Next'}
          </ThemedText>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  contentArea: {
    flex: 1,
    width: '100%',
    paddingVertical: 20,
    position: 'relative',
  },
  leftNavigationArea: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 20,
    zIndex: 10,
  },
  rightNavigationArea: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
    zIndex: 10,
  },
  navigationIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
    padding: 8,
  },
  contentOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  imageContainer: {
    width: width * 0.8,
    height: height * 0.4,
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 26,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 12,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressDotActive: {
    backgroundColor: '#FFFFFF',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  nextButton: {
    backgroundColor: '#00CAFE',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#00CAFE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  swipeHint: {
    alignItems: 'center',
    marginTop: 20,
  },
  swipeHintText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textAlign: 'center',
  },
});
