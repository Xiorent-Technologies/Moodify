import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SpotifyAuthService } from '../src/services/spotifyAuth';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [lightModeEnabled, setLightModeEnabled] = useState(true);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
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
              // Clear all stored data
              await AsyncStorage.multiRemove([
                'isLoggedIn',
                'userEmail',
                'firstName',
                'lastName',
                'spotifyAccessToken',
                'spotifyRefreshToken',
                'spotifyTokenExpiry',
                'spotifyUserId',
                'spotifyUserEmail',
                'spotifyDisplayName',
                'spotifyProfileImage',
                'isFirstTimeUser'
              ]);
              
              // Logout from Spotify
              await SpotifyAuthService.logout();
              
              // Navigate to login screen
              router.replace('/login');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleAccountPress = () => {
    // Navigate to account settings
    console.log('Account pressed');
  };

  const handleSubscriptionPress = () => {
    // Navigate to subscription settings
    console.log('Subscription pressed');
  };

  const handleSecurityPress = () => {
    // Navigate to security settings
    console.log('Security pressed');
  };

  const handleTermsPress = () => {
    // Navigate to terms and conditions
    console.log('Terms & Conditions pressed');
  };

  const handlePrivacyPress = () => {
    // Navigate to privacy policy
    console.log('Privacy Policy pressed');
  };

  const handleHelpPress = () => {
    // Navigate to help
    console.log('Help pressed');
  };

  const handleInviteFriendPress = () => {
    // Navigate to invite friend
    console.log('Invite a friend pressed');
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
      {/* Background Decorations */}
      <View style={styles.backgroundDecorations}>
        <View style={[styles.orb, styles.orb1]} />
        <View style={[styles.orb, styles.orb2]} />
        <View style={[styles.orb, styles.orb3]} />
        <View style={[styles.orb, styles.orb4]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account & Preferences Section */}
        <View style={styles.section}>
          {renderSettingItem('person-outline', 'Account', handleAccountPress)}
          {renderSettingItem(
            'notifications-outline', 
            'Notifications', 
            () => {}, 
            false, 
            true, 
            notificationsEnabled, 
            setNotificationsEnabled,
            true
          )}
          {renderSettingItem(
            'sunny-outline', 
            'Light Mode', 
            () => {}, 
            false, 
            true, 
            lightModeEnabled, 
            setLightModeEnabled
          )}
          {renderSettingItem('globe-outline', 'Subscription', handleSubscriptionPress)}
        </View>

        {/* Legal & Support Section */}
        <View style={styles.section}>
          {renderSettingItem('shield-checkmark-outline', 'Security', handleSecurityPress)}
          {renderSettingItem('document-text-outline', 'Terms & Conditions', handleTermsPress)}
          {renderSettingItem('lock-closed-outline', 'Privacy Policy', handlePrivacyPress)}
          {renderSettingItem('information-circle-outline', 'Help', handleHelpPress)}
        </View>

        {/* Social & Logout Section */}
        <View style={styles.section}>
          {renderSettingItem('people-outline', 'Invite a friend', handleInviteFriendPress)}
          {renderSettingItem('log-out-outline', 'Logout', handleLogout, false)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundDecorations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  orb: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  orb1: {
    width: 120,
    height: 120,
    top: 100,
    left: -30,
  },
  orb2: {
    width: 80,
    height: 80,
    top: 200,
    right: -20,
  },
  orb3: {
    width: 100,
    height: 100,
    bottom: 300,
    left: -40,
  },
  orb4: {
    width: 60,
    height: 60,
    bottom: 200,
    right: -10,
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 16,
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
});
