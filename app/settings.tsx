import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState, useEffect, memo } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
    Clipboard
} from 'react-native';
import { Image } from 'expo-image';
import { SpotifyAuthService } from '../src/services/spotifyAuth';
import { AuthService } from '../src/services/authService';
import { auth } from '../src/config/firebase';

const SettingsScreen = memo(() => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [lightModeEnabled, setLightModeEnabled] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [isLoadingReferral, setIsLoadingReferral] = useState(true);

  useEffect(() => {
    loadReferralCode();
  }, []);

  const loadReferralCode = async () => {
    try {
      if (auth.currentUser) {
        let code = await AuthService.getUserReferralCode(auth.currentUser.uid);
        
        // If no referral code exists, generate one
        if (!code) {
          code = await AuthService.generateReferralCode(auth.currentUser.uid);
        }
        
        setReferralCode(code || '');
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setIsLoadingReferral(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will clear all your data and you\'ll need to sign in again.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              
              // 1. Logout from Firebase Auth
              await AuthService.signOut();
              
              // 2. Logout from Spotify
              await SpotifyAuthService.logout();
              
              // 3. Clear ALL AsyncStorage data
              await AsyncStorage.clear();
              
              // 4. Navigate to email login screen
              router.replace('/email-login');
              
            } catch (error) {
              Alert.alert('Error', 'Failed to logout completely. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleAccountPress = () => {
    // Navigate to account settings
  };

  const handleSubscriptionPress = () => {
    // Navigate to subscription screen
    router.push('/subscription');
  };

  const handleSecurityPress = () => {
    // Navigate to security settings
  };

  const handleTermsPress = () => {
    // Navigate to terms and conditions
  };

  const handlePrivacyPress = () => {
    // Navigate to privacy policy
  };

  const handleHelpPress = () => {
    // Navigate to help
  };

  const handleInviteFriendPress = () => {
    // Navigate to refer and earn screen
    router.push('/refer-earn');
  };

  const handleCopyReferralCode = async () => {
    if (!referralCode) {
      Alert.alert('Error', 'No referral code available');
      return;
    }
    
    try {
      await Clipboard.setString(referralCode);
      Alert.alert('Copied!', 'Referral code copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy referral code');
    }
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    onPress: () => void,
    showArrow: boolean = true,
    showToggle: boolean = false,
    toggleValue: boolean = false,
    onToggleChange: (value: boolean) => void = () => {},
    showNotificationDot: boolean = false
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={20} color="#FFFFFF" />
          {showNotificationDot && <View style={styles.notificationDot} />}
        </View>
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      <View style={styles.settingRight}>
        {showToggle ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggleChange}
            trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#00CAFE' }}
            thumbColor={toggleValue ? '#FFFFFF' : '#FFFFFF'}
            ios_backgroundColor="rgba(255, 255, 255, 0.2)"
          />
        ) : showArrow ? (
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Refer & Earn Banner */}
        <View style={styles.referBanner}>
          <Image
            source={require('../assets/images/profile/refer.png')}
            style={styles.referImage}
            contentFit="cover"
          />
          <View style={styles.referOverlay}>
            <View style={styles.textContainer}>
              <Text style={styles.referTitle}>REFER & EARN</Text>
              <TouchableOpacity 
                style={[
                  styles.referralCodeContainer,
                  (isLoadingReferral || !referralCode) && styles.referralCodeContainerDisabled
                ]} 
                onPress={handleCopyReferralCode}
                disabled={isLoadingReferral || !referralCode}
              >
                <Text style={styles.referralCode}>
                  {isLoadingReferral ? 'Loading...' : referralCode || 'No code available'}
                </Text>
                <Text style={styles.tapToCopy}>
                  {isLoadingReferral ? 'Please wait' : 'Tap to Copy'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.referDescription}>Refer to your friends and get exciting rewards on your next purchase</Text>
            </View>
          </View>
        </View>

        {/* Account & Preferences Section */}
        <View style={styles.section}>
          {renderSettingItem('person-outline', 'Account', handleAccountPress)}
          <View style={styles.separator} />
          {renderSettingItem(
            'notifications-outline', 
            'Notifications', 
            () => {}, 
            false, 
            true, 
            notificationsEnabled, 
            setNotificationsEnabled
          )}
          <View style={styles.separator} />
          {renderSettingItem(
            'sunny-outline', 
            'Light Mode', 
            () => {}, 
            false, 
            true, 
            lightModeEnabled, 
            setLightModeEnabled
          )}
          <View style={styles.separator} />
          {renderSettingItem('globe-outline', 'Subscription', handleSubscriptionPress)}
        </View>

        {/* Legal & Support Section */}
        <View style={styles.section}>
          {renderSettingItem('shield-checkmark-outline', 'Security', handleSecurityPress)}
          <View style={styles.separator} />
          {renderSettingItem('document-text-outline', 'Terms & Conditions', handleTermsPress)}
          <View style={styles.separator} />
          {renderSettingItem('lock-closed-outline', 'Privacy Policy', handlePrivacyPress)}
          <View style={styles.separator} />
          {renderSettingItem('information-circle-outline', 'Help', handleHelpPress)}
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          {renderSettingItem('people-outline', 'Invite a friend', handleInviteFriendPress)}
          <View style={styles.separator} />
          {renderSettingItem('log-out-outline', 'Logout', handleLogout, false)}
        </View>
      </ScrollView>
    </View>
  );
});

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#03021F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Refer & Earn Banner
  referBanner: {
    height: 320,
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  referImage: {
    width: '100%',
    height: '100%',
  },
  referOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  textContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backdropFilter: 'blur(300px)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 'auto',
  },
  referTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'left',
    fontStyle: 'italic',
  },
  referralCodeContainer: {
    borderWidth: 2,
    borderColor: '#FFA500',
    borderStyle: 'dashed',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  referralCodeContainerDisabled: {
    opacity: 0.5,
  },
  referralCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00BFFF',
    textAlign: 'left',
  },
  tapToCopy: {
    fontSize: 12,
    color: '#CCCCCC',
    fontStyle: 'italic',
  },
  referDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'left',
    opacity: 0.9,
    lineHeight: 20,
    alignSelf: 'flex-start',
  },
  // Settings Sections
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 16,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  settingTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  settingRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#fff',
    marginLeft: 20,
    marginRight: 20,
  },
});
