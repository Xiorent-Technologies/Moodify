import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Platform } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    loadProfileImage();
    
    // Listen for profile image updates
    const interval = setInterval(loadProfileImage, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const loadProfileImage = async () => {
    try {
      const image = await AsyncStorage.getItem('spotifyProfileImage');
      if (image) {
        setProfileImage(image);
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'search' : 'search-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'library' : 'library-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: focused ? 2 : 1,
                  borderColor: focused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)',
                }}
                resizeMode="cover"
              />
            ) : (
              <Ionicons 
                name={focused ? 'person' : 'person-outline'} 
                size={24} 
                color={color} 
              />
            )
          ),
        }}
      />
    </Tabs>
  );
}
