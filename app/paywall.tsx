import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SubscriptionService } from '../src/services/subscriptionService';
import { AuthService } from '../src/services/authService';
import { auth } from '../src/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SuccessModal from '../src/components/SuccessModal';

export default function PaywallScreen() {
  const [showFreeTrial, setShowFreeTrial] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState({
    title: '',
    message: '',
    buttonText: '',
    onPress: () => {}
  });

  useEffect(() => {
    if (auth.currentUser) {
      setUser(auth.currentUser);
    }
  }, []);

  const handleToggleChange = (value: boolean) => {
    setShowFreeTrial(value);
    setSelectedPlan(value ? 'monthly' : 'yearly');
  };

  const handleBack = () => {
    // Go back to email login screen
    router.replace('/email-login');
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

  const handleSubscribe = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    setIsLoading(true);
    try {
      if (showFreeTrial) {
        // Start free trial
        const result = await SubscriptionService.startFreeTrial(user.uid, selectedPlan);
        
        // Store subscription status in AsyncStorage for quick access
        await AsyncStorage.setItem('subscriptionStatus', 'trial');
        
        setSuccessData({
          title: 'Free Trial Started! 🎉',
          message: 'You now have 3 days of free access. Connect your Spotify account to start enjoying your personalized music experience.',
          buttonText: 'Connect Spotify',
          onPress: () => {
            setShowSuccessModal(false);
            router.replace('/login');
          }
        });
        setShowSuccessModal(true);
      } else {
        // Show coming soon message
        setSuccessData({
          title: 'Coming Soon! 🚀',
          message: 'Paid subscription options will be available soon. For now, we\'re offering a free trial to all users! Would you like to start your free trial?',
          buttonText: 'Start Free Trial',
          onPress: () => {
            setShowSuccessModal(false);
            // Enable free trial and start it
            setShowFreeTrial(true);
            setSelectedPlan('monthly');
            // Start the free trial
            handleSubscribe();
          }
        });
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to start subscription: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const plans = {
    monthly: {
      price: '$9.99',
      period: 'month',
      savings: null
    },
    yearly: {
      price: '$99.99',
      period: 'year',
      savings: 'Save 17%'
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>Unlock the full Moodify experience</Text>
        </View>

        <View style={styles.toggleContainer}>
          <View style={styles.toggleHeader}>
            <Text style={styles.toggleLabel}>Avail free trial</Text>
            <Switch
              value={showFreeTrial}
              onValueChange={handleToggleChange}
              trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#00CAFE' }}
              thumbColor={showFreeTrial ? '#FFFFFF' : '#FFFFFF'}
              ios_backgroundColor="rgba(255, 255, 255, 0.2)"
            />
          </View>
          <Text style={styles.toggleDescription}>
            {showFreeTrial
              ? 'Start with 3 days free trial, then continue with monthly plan'
              : 'Paid subscriptions coming soon! For now, enjoy our free trial'
            }
          </Text>
        </View>

        <View style={styles.plansContainer}>
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'monthly' && styles.selectedPlan
            ]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Monthly</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>{plans.monthly.price}</Text>
                <Text style={styles.period}>/{plans.monthly.period}</Text>
              </View>
            </View>
            <Text style={styles.planDescription}>
              Perfect for trying out Moodify
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'yearly' && styles.selectedPlan
            ]}
            onPress={() => setSelectedPlan('yearly')}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Yearly</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>{plans.yearly.price}</Text>
                <Text style={styles.period}>/{plans.yearly.period}</Text>
              </View>
              {plans.yearly.savings && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>{plans.yearly.savings}</Text>
                </View>
              )}
            </View>
            <Text style={styles.planDescription}>
              Best value for long-term users
            </Text>
          </TouchableOpacity>
        </View>

        {!showFreeTrial && (
          <View style={styles.comingSoonContainer}>
            <View style={styles.comingSoonCard}>
              <Ionicons name="time-outline" size={32} color="#00CAFE" />
              <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
              <Text style={styles.comingSoonMessage}>
                We're working hard to bring you paid subscription options. 
                For now, enjoy our free trial and explore all the amazing features!
              </Text>
              <View style={styles.comingSoonFeatures}>
                <Text style={styles.comingSoonFeatureText}>• 3 days free trial</Text>
                <Text style={styles.comingSoonFeatureText}>• Full access to all features</Text>
                <Text style={styles.comingSoonFeatureText}>• No payment required</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What's Included</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#00CAFE" />
              <Text style={styles.featureText}>Unlimited mood playlists</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#00CAFE" />
              <Text style={styles.featureText}>AI-powered recommendations</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#00CAFE" />
              <Text style={styles.featureText}>Premium Spotify integration</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#00CAFE" />
              <Text style={styles.featureText}>Ad-free experience</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#00CAFE" />
              <Text style={styles.featureText}>Priority support</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.subscribeButton, isLoading && styles.disabledButton]}
          onPress={handleSubscribe}
          disabled={isLoading}
        >
          <Text style={styles.subscribeButtonText}>
            {isLoading
              ? 'Processing...'
              : showFreeTrial
              ? 'Start Free Trial'
              : 'Coming Soon'
            }
          </Text>
        </TouchableOpacity>

        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            {showFreeTrial 
              ? 'By starting your free trial, you agree to our Terms of Service and Privacy Policy. Cancel anytime during your trial.'
              : 'Paid subscription options coming soon! For now, enjoy our free trial with no payment required.'
            }
          </Text>
        </View>
      </ScrollView>

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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  toggleContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  toggleDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  plansContainer: {
    marginBottom: 30,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPlan: {
    borderColor: '#00CAFE',
    backgroundColor: 'rgba(0, 202, 254, 0.1)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00CAFE',
  },
  period: {
    fontSize: 16,
    color: '#CCCCCC',
    marginLeft: 4,
  },
  savingsBadge: {
    backgroundColor: '#00CAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planDescription: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 16,
    color: '#CCCCCC',
    marginLeft: 12,
  },
  subscribeButton: {
    backgroundColor: '#00CAFE',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  termsContainer: {
    paddingHorizontal: 10,
  },
  termsText: {
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 16,
  },
  comingSoonContainer: {
    marginBottom: 30,
  },
  comingSoonCard: {
    backgroundColor: 'rgba(0, 202, 254, 0.1)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 202, 254, 0.3)',
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00CAFE',
    marginTop: 16,
    marginBottom: 12,
  },
  comingSoonMessage: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  comingSoonFeatures: {
    alignItems: 'flex-start',
    width: '100%',
  },
  comingSoonFeatureText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '500',
  },
});
