import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function SubscriptionScreen() {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    Alert.alert(
      'Subscription',
      `Selected plan: ${selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'}`,
      [{ text: 'OK' }]
    );
  };

  const handleTerms = () => {
    Alert.alert('Terms of Use', 'Terms of Use content would go here');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Image */}
      <Image
        source={require('../assets/images/subscribe/primum.png')}
        style={styles.backgroundImage}
        contentFit="cover"
      />
      
      {/* Overlay */}
      <View style={styles.overlay} />
      
      {/* Bottom Gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(3, 2, 31, 0.8)', '#03021F']}
        locations={[0, 0.5, 1]}
        style={styles.bottomGradient}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>Unlock Premium Features</Text>
        
        {/* Features List */}
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <View style={styles.checkmarkContainer}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.featureText}>Advanced Editing Tools</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.checkmarkContainer}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.featureText}>Unlimited Filters & Effects</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.checkmarkContainer}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.featureText}>High-Resolution Exports</Text>
          </View>
        </View>

        {/* Subscription Plans */}
        <View style={styles.plansContainer}>
          {/* Monthly Plan */}
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'monthly' && styles.selectedPlan
            ]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <Text style={styles.planPrice}>€ 4.99/m +</Text>
            <Text style={styles.planTrial}>3 Days Free</Text>
            <Text style={styles.planType}>Monthly</Text>
          </TouchableOpacity>

          {/* Yearly Plan */}
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'yearly' && styles.selectedPlan
            ]}
            onPress={() => setSelectedPlan('yearly')}
          >
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>33% Off</Text>
            </View>
            <Text style={styles.planPrice}>€ 49.99/y+</Text>
            <Text style={styles.planTrial}>33% off</Text>
            <Text style={styles.planType}>Yearly</Text>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <LinearGradient
            colors={['#00DEFF', '#0043F7', '#0E1D92', '#001C89', '#B22CFF']}
            locations={[0.0185, 0.3205, 0.5181, 0.6465, 0.9599]}
            style={styles.continueButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Cancel anytime.</Text>
          <TouchableOpacity onPress={handleTerms}>
            <Text style={styles.termsText}>Terms of Use</Text>
          </TouchableOpacity>
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
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height * 0.65, // Cover only upper 65% of screen
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.65, // Only cover the image portion
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  bottomGradient: {
    position: 'absolute',
    top: height * 0.65 - 300, // Start gradient 300px before image ends
    left: 0,
    right: 0,
    height: 300,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'left',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    lineHeight: 42,
  },
  featuresList: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    fontSize: 20,
    color: '#FFFFFF',
    opacity: 0.95,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  plansContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  planCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPlan: {
    borderColor: '#00DEFF',
    backgroundColor: 'rgba(0, 222, 255, 0.1)',
  },
  discountBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#00DEFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  planTrial: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
    fontWeight: '500',
  },
  planType: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    fontWeight: '500',
  },
  continueButton: {
    borderRadius: 30,
    marginBottom: 30,
    shadowColor: '#00DEFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  termsText: {
    fontSize: 14,
    color: '#00DEFF',
    textDecorationLine: 'underline',
  },
});
