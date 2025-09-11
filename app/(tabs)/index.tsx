import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../../src/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import { Ionicons } from '@expo/vector-icons';
import { SpotifyApiService } from '../../src/services/spotifyApi';
import { SpotifyAuthService } from '../../src/services/spotifyAuth';
import SpotifyPlayerService from '../../src/services/spotifyPlayerService';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string; images: Array<{ url: string }> };
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  images: Array<{ url: string }>;
  tracks: { total: number };
}

export default function HomeScreen() {
  const [firstName, setFirstName] = useState('');
  const [userProfileImage, setUserProfileImage] = useState('');
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [recentTracks, setRecentTracks] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [spotifyConnected, setSpotifyConnected] = useState<boolean | null>(null);

  // Music Player State
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [unsubscribePlayer, setUnsubscribePlayer] = useState<(() => void) | null>(null);

  // Premium User Status
  const [isPremiumUser, setIsPremiumUser] = useState<boolean | null>(null);

  const { width } = useWindowDimensions();

  useEffect(() => {
    // Check authentication status
    checkAuthStatus();
    
    // Cleanup function for player service
    return () => {
      if (unsubscribePlayer) {
        unsubscribePlayer();
      }
      const playerService = SpotifyPlayerService.getInstance();
      playerService.cleanup();
    };
  }, [unsubscribePlayer]);

  const checkAuthStatus = async () => {
    try {
      // Check Firebase auth state
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          console.log('User authenticated in home screen');
          setIsAuthenticated(true);
          
          // Check if Spotify is connected
          const spotifyToken = await AsyncStorage.getItem('spotifyAccessToken');
          if (spotifyToken) {
            console.log('Spotify connected, loading data');
            setSpotifyConnected(true);
            await loadUserData();
          } else {
            console.log('Spotify not connected, redirecting to login');
            setSpotifyConnected(false);
            router.replace('/login');
          }
        } else {
          console.log('User not authenticated, redirecting to email login');
          setIsAuthenticated(false);
          router.replace('/email-login');
        }
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      router.replace('/email-login');
    }
  };

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      
      // Load basic user data
      const name = await AsyncStorage.getItem('firstName');
      const profileImage = await AsyncStorage.getItem('spotifyProfileImage');
      
      if (name) {
        setFirstName(name);
      }
      if (profileImage) {
        setUserProfileImage(profileImage);
      }

      // Load Spotify data
      await loadSpotifyData();
    } catch (error) {
      console.error('Error loading user data:', error);
      setHasError(true);
      setErrorMessage('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSpotifyData = async () => {
    try {
      // Get user's top tracks with error handling
      try {
        const topTracksData = await SpotifyApiService.getTopTracks();
        if (topTracksData?.items && Array.isArray(topTracksData.items)) {
          setTopTracks(topTracksData.items.slice(0, 6));
        } else {
          console.log('No top tracks data available');
          setTopTracks([]);
        }
      } catch (topTracksError) {
        console.log('Could not load top tracks:', topTracksError);
        setTopTracks([]);
      }

      // Get user's playlists with error handling
      try {
        const playlistsData = await SpotifyApiService.getUserPlaylists();
        if (playlistsData?.items && Array.isArray(playlistsData.items)) {
          setUserPlaylists(playlistsData.items.slice(0, 6));
        } else {
          console.log('No playlists data available');
          setUserPlaylists([]);
        }
      } catch (playlistsError) {
        console.log('Could not load playlists:', playlistsError);
        setUserPlaylists([]);
      }

      // Get recently played tracks with comprehensive error handling
      try {
        const recentData = await SpotifyApiService.getRecentlyPlayed();
        console.log('Recent data response:', recentData);
        
        if (recentData && recentData.items && Array.isArray(recentData.items)) {
          const validTracks = recentData.items
            .filter((item: any) => item && item.track && item.track.id && item.track.name)
            .map((item: any) => item.track);
          console.log('Valid tracks found:', validTracks.length);
          setRecentTracks(validTracks.slice(0, 4));
        } else {
          console.log('No recent tracks data available or invalid format');
          setRecentTracks([]);
        }
      } catch (recentError) {
        console.log('Could not load recently played tracks:', recentError);
        setRecentTracks([]);
      }
    } catch (error) {
      console.error('General error in loadSpotifyData:', error);
      // Set empty arrays as fallback
      setTopTracks([]);
      setUserPlaylists([]);
      setRecentTracks([]);
    }
  };

  const handleLogout = async () => {
    try {
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
        'spotifyProfileImage'
      ]);
      
      await SpotifyAuthService.logout();
      router.replace('/signup');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getMoodFromTrack = (track: SpotifyTrack) => {
    try {
      // Simple mood detection based on track name and artist
      const trackName = track?.name?.toLowerCase() || '';
      const artistName = track?.artists?.[0]?.name?.toLowerCase() || '';
      
      if (trackName.includes('sad') || trackName.includes('melancholy') || trackName.includes('blue')) {
        return { mood: 'sad', color: ['#000000', '#333333'] as const };
      } else if (trackName.includes('happy') || trackName.includes('joy') || trackName.includes('sun')) {
        return { mood: 'happy', color: ['#FF69B4', '#FF1493'] as const };
      } else if (trackName.includes('chill') || trackName.includes('calm') || trackName.includes('peace')) {
        return { mood: 'chilling', color: ['#00BFFF', '#1E90FF'] as const };
      } else if (trackName.includes('energy') || trackName.includes('pump') || trackName.includes('fire')) {
        return { mood: 'energetic', color: ['#FF4500', '#FF6347'] as const };
      } else {
        return { mood: 'neutral', color: ['#808080', '#A9A9A9'] as const };
      }
    } catch (error) {
      console.log('Error in getMoodFromTrack:', error);
      return { mood: 'neutral', color: ['#808080', '#A9A9A9'] as const };
    }
  };

  const getUserTopMoods = () => {
    try {
      if (!topTracks || topTracks.length === 0) return [];
      
      // Count mood occurrences
      const moodCounts: { [key: string]: { count: number; tracks: SpotifyTrack[]; color: readonly [string, string] } } = {};
      
      topTracks.forEach(track => {
        const moodInfo = getMoodFromTrack(track);
        if (!moodCounts[moodInfo.mood]) {
          moodCounts[moodInfo.mood] = { count: 0, tracks: [], color: moodInfo.color };
        }
        moodCounts[moodInfo.mood].count++;
        moodCounts[moodInfo.mood].tracks.push(track);
      });
      
      // Sort by count and return top 3 moods
      return Object.entries(moodCounts)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 3)
        .map(([mood, data]) => ({
          mood,
          count: data.count,
          tracks: data.tracks,
          color: data.color,
          image: data.tracks[0]?.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=140&h=180&fit=crop'
        }));
    } catch (error) {
      console.log('Error in getUserTopMoods:', error);
      return [];
    }
  };

  const getGenreFromTrack = (track: SpotifyTrack) => {
    try {
      // Simple genre detection based on track name
      const trackName = track?.name?.toLowerCase() || '';
      
      if (trackName.includes('jazz') || trackName.includes('blues')) {
        return { genre: 'Jazz & Blues', icon: 'musical-notes', color: '#8B4513' };
      } else if (trackName.includes('rock') || trackName.includes('metal')) {
        return { genre: 'Rock & Metal', icon: 'flame', color: '#FF6347' };
      } else if (trackName.includes('pop') || trackName.includes('dance')) {
        return { genre: 'Pop & Dance', icon: 'star', color: '#FFD700' };
      } else if (trackName.includes('hip') || trackName.includes('rap')) {
        return { genre: 'Hip Hop', icon: 'mic', color: '#FF1493' };
      } else if (trackName.includes('classical') || trackName.includes('orchestra')) {
        return { genre: 'Classical', icon: 'musical-note', color: '#8A2BE2' };
      } else {
        return { genre: 'Mixed', icon: 'shuffle', color: '#00CAFE' };
      }
    } catch (error) {
      console.log('Error in getGenreFromTrack:', error);
      return { genre: 'Mixed', icon: 'shuffle', color: '#00CAFE' };
    }
  };

  // Music Player Functions
  const openMusicPlayer = async (track: SpotifyTrack) => {
    try {
      setCurrentTrack(track);
      setShowPlayer(true);
      
      // Initialize player service
      const playerService = SpotifyPlayerService.getInstance();
      
      // Get current playback state
      await playerService.getCurrentPlayback();
      
      // Add listener for playback updates
      const unsubscribe = playerService.addListener((playbackState) => {
        setIsPlaying(playbackState.isPlaying);
        setProgress(playbackState.progress);
        setCurrentTime(Math.floor(playbackState.progress * playbackState.duration / 100));
      });
      
      // Store unsubscribe function for cleanup
      setUnsubscribePlayer(unsubscribe);
      
    } catch (error) {
      console.error('Error opening music player:', error);
    }
  };

  const closeMusicPlayer = () => {
    setShowPlayer(false);
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setProgress(0);
    
    // Cleanup player listener
    if (unsubscribePlayer) {
      unsubscribePlayer();
      setUnsubscribePlayer(null);
    }
  };

  const openMoodPlaylist = async (moodData: { mood: string; tracks: SpotifyTrack[]; color: readonly [string, string] }) => {
    try {
      if (!moodData || !moodData.tracks || moodData.tracks.length === 0) {
        Alert.alert('No Songs', `No songs found for ${moodData.mood} mood`);
        return;
      }

      console.log(`Opening ${moodData.mood} mood playlist with ${moodData.tracks.length} tracks`);
      
      // Store the mood playlist data in AsyncStorage
      await AsyncStorage.setItem('moodPlaylist', JSON.stringify({
        mood: moodData.mood,
        tracks: moodData.tracks,
        color: moodData.color,
        title: `${moodData.mood.charAt(0).toUpperCase() + moodData.mood.slice(1)} Mood Playlist`
      }));
      
      // Navigate to the songs list with mood playlist
      router.push('/songs-list');
    } catch (error) {
      console.error('Error opening mood playlist:', error);
      Alert.alert('Error', 'Failed to open mood playlist');
    }
  };

  const togglePlayPause = async () => {
    if (!currentTrack) return;
    
    try {
      // For Spotify Free accounts, open the track in Spotify app instead
      const spotifyUrl = `https://open.spotify.com/track/${currentTrack.id}`;
      
      // Check if we can open Spotify app
      const canOpen = await Linking.canOpenURL(spotifyUrl);
      
      if (canOpen) {
        await Linking.openURL(spotifyUrl);
        Alert.alert(
          '🎵 Opening in Spotify',
          'Track opened in Spotify app! For full control, consider upgrading to Premium.',
          [
            { text: 'OK', style: 'default' },
            { text: 'Upgrade to Premium', onPress: () => Linking.openURL('https://www.spotify.com/premium/') }
          ]
        );
      } else {
        // Fallback to web
        await Linking.openURL(spotifyUrl);
        Alert.alert(
          '🎵 Opening in Browser',
          'Track opened in browser! For full control, consider upgrading to Spotify Premium.',
          [
            { text: 'OK', style: 'default' },
            { text: 'Upgrade to Premium', onPress: () => Linking.openURL('https://www.spotify.com/premium/') }
          ]
        );
      }
      
      // Update local state to show "playing" (even though it's in Spotify app)
      setIsPlaying(true);
      
    } catch (error: any) {
      console.error('Error opening track in Spotify:', error);
      
      Alert.alert(
        '❌ Error',
        'Failed to open track in Spotify. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
      
      // Fallback to local state if API fails
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = async () => {
    try {
      const playerService = SpotifyPlayerService.getInstance();
      await playerService.nextTrack();
    } catch (error) {
      console.error('Error skipping to next track:', error);
    }
  };

  const previousTrack = async () => {
    try {
      const playerService = SpotifyPlayerService.getInstance();
      await playerService.previousTrack();
    } catch (error) {
      console.error('Error skipping to previous track:', error);
    }
  };

  const seekTo = async (event: any) => {
    if (!currentTrack) return;
    
    try {
      const { locationX } = event.nativeEvent;
      const progressBarWidth = width - 80;
      const seekPercentage = locationX / progressBarWidth;
      const newTime = Math.floor(seekPercentage * 30); // Assuming 30 seconds for demo
      
      const playerService = SpotifyPlayerService.getInstance();
      await playerService.seekToPosition(newTime * 1000); // Convert to milliseconds
      
      setCurrentTime(newTime);
      setProgress(seekPercentage * 100);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const toggleLike = async () => {
    if (!currentTrack) return;
    
    try {
      if (isLiked) {
        await SpotifyApiService.removeFromSavedTracks([currentTrack.id]);
      } else {
        await SpotifyApiService.addToSavedTracks([currentTrack.id]);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
      // Fallback to local state if API fails
      setIsLiked(!isLiked);
    }
  };

  const clearSpotifyTokens = async () => {
    try {
      await AsyncStorage.multiRemove([
        'spotifyAccessToken',
        'spotifyRefreshToken',
        'spotifyTokenExpiry',
        'spotifyUserId',
        'spotifyUserEmail',
        'spotifyDisplayName',
        'spotifyProfileImage'
      ]);
      alert('Spotify tokens cleared. Please re-authenticate to fix playback.');
      handleLogout(); // Log out to force re-authentication
    } catch (error) {
      console.error('Error clearing Spotify tokens:', error);
      alert('Failed to clear Spotify tokens.');
    }
  };

  // Detect if user has Spotify Premium
  const detectPremiumStatus = async () => {
    try {
      const response = await SpotifyApiService.testConnection();
      // If we can control playback, user likely has Premium
      // For now, we'll assume Premium if basic API works
      setIsPremiumUser(true);
      console.log('✅ Premium user detected');
    } catch (error: any) {
      if (error.message.includes('403') || error.message.includes('Playback control not allowed')) {
        setIsPremiumUser(false);
        console.log('ℹ️ Free user detected');
      } else {
        setIsPremiumUser(null);
        console.log('❓ User status unknown');
      }
    }
  };

  // Smart playback function that detects Premium vs Free
  const smartPlayback = async () => {
    if (!currentTrack) return;
    
    try {
      if (isPremiumUser === null) {
        // First time, try to detect
        await detectPremiumStatus();
      }
      
      if (isPremiumUser === true) {
        // Premium user - play in app
        await playInApp();
      } else {
        // Free user - open in Spotify app
        await openInSpotifyApp();
      }
    } catch (error) {
      console.error('Error in smart playback:', error);
      // Fallback to opening in Spotify app
      await openInSpotifyApp();
    }
  };

  // Premium user: Play in app with full controls
  const playInApp = async () => {
    if (!currentTrack) return;
    
    try {
      const playerService = SpotifyPlayerService.getInstance();
      
      if (isPlaying) {
        await playerService.pausePlayback();
        setIsPlaying(false);
      } else {
        const trackUri = `spotify:track:${currentTrack.id}`;
        await playerService.playTrack(trackUri);
        setIsPlaying(true);
      }
      
      Alert.alert(
        '🎵 Premium Playback',
        'Playing with full controls in your app!',
        [{ text: 'Awesome!', style: 'default' }]
      );
    } catch (error: any) {
      console.error('Premium playback failed:', error);
      Alert.alert(
        '⚠️ Premium Playback Failed',
        'Falling back to Spotify app...',
        [{ text: 'OK', style: 'default' }]
      );
      await openInSpotifyApp();
    }
  };

  // Free user: Open in Spotify app
  const openInSpotifyApp = async () => {
    if (!currentTrack) return;
    
    try {
      const spotifyUrl = `https://open.spotify.com/track/${currentTrack.id}`;
      
      // Check if we can open Spotify app
      const canOpen = await Linking.canOpenURL(spotifyUrl);
      
      if (canOpen) {
        await Linking.openURL(spotifyUrl);
        Alert.alert(
          '🎵 Free Account - Opened in Spotify',
          'Your track is now playing in the Spotify app! Upgrade to Premium for full control in this app.',
          [
            { text: 'OK', style: 'default' },
            { text: 'Upgrade to Premium', onPress: () => Linking.openURL('https://www.spotify.com/premium/') }
          ]
        );
      } else {
        // Fallback to web
        await Linking.openURL(spotifyUrl);
        Alert.alert(
          '🎵 Free Account - Opened in Browser',
          'Your track is now playing in the browser! Upgrade to Premium for full control in this app.',
          [
            { text: 'OK', style: 'default' },
            { text: 'Upgrade to Premium', onPress: () => Linking.openURL('https://www.spotify.com/premium/') }
          ]
        );
      }
      
      // Update local state to show "playing" (even though it's in Spotify app)
      setIsPlaying(true);
      
    } catch (error: any) {
      console.error('Error opening track in Spotify:', error);
      
      Alert.alert(
        '❌ Error',
        'Failed to open track in Spotify. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
      
      // Fallback to local state if API fails
      setIsPlaying(!isPlaying);
    }
  };



  // Show loading while checking authentication
  if (isAuthenticated === null || spotifyConnected === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00CAFE" />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  // Show loading while loading user data
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00CAFE" />
        <Text style={styles.loadingText}>Loading your music...</Text>
      </View>
    );
  }

  // If not authenticated, don't show content
  if (!isAuthenticated || !spotifyConnected) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00CAFE" />
        <Text style={styles.loadingText}>Redirecting...</Text>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#FF6B6B" />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUserData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              source={{ 
                uri: userProfileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' 
              }}
              style={styles.avatar}
            />
            <View style={styles.headerText}>
              <Text style={styles.welcomeText}>Welcome back!</Text>
              <Text style={styles.userName}>{firstName || 'chandrama'}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="options" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/notifications')}
            >
              <View style={styles.notificationContainer}>
                <Ionicons name="notifications" size={24} color="#FFFFFF" />
                <View style={styles.notificationDot} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>



        {/* Top Listening Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Listening</Text>
          <View style={styles.topListeningGrid}>
            {topTracks.length > 0 ? (
              topTracks.slice(0, 6).map((track, index) => {
                try {
                  if (!track || !track.id || !track.name) return null;
                  const albumImage = track.album?.images?.[0]?.url;
                  return (
                    <TouchableOpacity 
                      key={track.id} 
                      style={styles.musicCard}
                      onPress={() => openMusicPlayer(track)}
                    >
                      <View style={styles.musicCardContent}>
                        <Image 
                          source={albumImage ? { uri: albumImage } : require('../../assets/images/home/TL-Cards.png')} 
                          style={styles.musicCardImage}
                          resizeMode="cover"
                        />
                        <LinearGradient
                          colors={['#1e3a8a', '#7c3aed', '#1e1b4b']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.musicCardTextContainer}
                        >
                          <Text style={styles.musicCardText} numberOfLines={1}>
                            {track.name.length > 15 ? track.name.substring(0, 15) + '...' : track.name}
                          </Text>
                          <Text style={styles.musicCardArtist} numberOfLines={1}>
                            {track.artists?.[0]?.name || 'Unknown Artist'}
                          </Text>
                        </LinearGradient>
                      </View>
                    </TouchableOpacity>
                  );
                } catch (error) {
                  console.log('Error rendering track:', error);
                  return null;
                }
              }).filter(Boolean)
            ) : (
              // Fallback static content when no tracks are available
              <>
                <TouchableOpacity 
                  style={styles.musicCard}
                  onPress={() => openMusicPlayer({ id: 'static-1', name: 'Coffee & Jazz', artists: [{ name: 'Chill Vibes' }], album: { name: 'Coffee & Jazz', images: [{ url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop' }] } })}
                >
                  <View style={styles.musicCardContent}>
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop' }} 
                      style={styles.musicCardImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['#1e3a8a', '#7c3aed', '#1e1b4b']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.musicCardTextContainer}
                    >
                      <Text style={styles.musicCardText}>Coffee & Jazz</Text>
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.musicCard}
                  onPress={() => openMusicPlayer({ id: 'static-2', name: 'RELEASED', artists: [{ name: 'New Releases' }], album: { name: 'RELEASED', images: [{ url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop' }] } })}
                >
                  <View style={styles.musicCardContent}>
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop' }} 
                      style={styles.musicCardImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['#1e3a8a', '#7c3aed', '#1e1b4b']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.musicCardTextContainer}
                    >
                      <Text style={styles.musicCardText}>RELEASED</Text>
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.musicCard}
                  onPress={() => openMusicPlayer({ id: 'static-3', name: 'Anything Goes', artists: [{ name: 'Pop Mix' }], album: { name: 'Anything Goes', images: [{ url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=150&h=150&fit=crop' }] } })}
                >
                  <View style={styles.musicCardContent}>
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=150&h=150&fit=crop' }} 
                      style={styles.musicCardImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['#1e3a8a', '#7c3aed', '#1e1b4b']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.musicCardTextContainer}
                    >
                      <Text style={styles.musicCardText}>Anything Goes</Text>
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.musicCard}
                  onPress={() => openMusicPlayer({ id: 'static-4', name: 'Anime OSTs', artists: [{ name: 'Soundtrack' }], album: { name: 'Anime OSTs', images: [{ url: 'https://images.unsplash.com/photo-1511379938547-c1f6c2b4b8b0?w=150&h=150&fit=crop' }] } })}
                >
                  <View style={styles.musicCardContent}>
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1511379938547-c1f6c2b4b8b0?w=150&h=150&fit=crop' }} 
                      style={styles.musicCardImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['#1e3a8a', '#7c3aed', '#1e1b4b']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.musicCardTextContainer}
                    >
                      <Text style={styles.musicCardText}>Anime OSTs</Text>
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.musicCard}
                  onPress={() => openMusicPlayer({ id: 'static-5', name: 'Harry\'s House', artists: [{ name: 'Pop Artist' }], album: { name: 'Harry\'s House', images: [{ url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop' }] } })}
                >
                  <View style={styles.musicCardContent}>
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop' }} 
                      style={styles.musicCardImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['#1e3a8a', '#7c3aed', '#1e1b4b']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.musicCardTextContainer}
                    >
                      <Text style={styles.musicCardText}>Harry's House</Text>
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.musicCard}
                  onPress={() => openMusicPlayer({ id: 'static-6', name: 'Lo-Fi Beats', artists: [{ name: 'Chill Music' }], album: { name: 'Lo-Fi Beats', images: [{ url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=150&h=150&fit=crop' }] } })}
                >
                  <View style={styles.musicCardContent}>
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=150&h=150&fit=crop' }} 
                      style={styles.musicCardImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['#1e3a8a', '#7c3aed', '#1e1b4b']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.musicCardTextContainer}
                    >
                      <Text style={styles.musicCardText}>Lo-Fi Beats</Text>
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Your Top Moods Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Top Moods</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodsContainer}>
            {topTracks.length > 0 ? (
              getUserTopMoods().map((moodData, index) => {
                try {
                  if (!moodData || !moodData.mood) return null;
                  return (
                    <TouchableOpacity 
                      key={`mood-${moodData.mood}-${index}`} 
                      style={styles.moodCard}
                      onPress={() => openMoodPlaylist(moodData)}
                    >
                      <Image
                        source={{ uri: moodData.image }}
                        style={styles.moodCardImage}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={moodData.color}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.moodCardOverlay}
                      >
                        <Text style={styles.moodCardText}>
                          {moodData.mood.charAt(0).toUpperCase() + moodData.mood.slice(1)} Mood
                        </Text>
                        <Text style={styles.moodCardCount}>
                          {moodData.count} tracks
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                } catch (error) {
                  console.log('Error rendering mood card:', error);
                  return null;
                }
              }).filter(Boolean)
            ) : (
              // Fallback static content when no tracks are available
              <>
                <TouchableOpacity 
                  style={styles.moodCard}
                  onPress={() => openMusicPlayer({ id: 'static-mood-1', name: 'sad Mood', artists: [{ name: 'Static Artist' }], album: { name: 'Static Album', images: [{ url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=140&h=180&fit=crop' }] } })}
                >
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=140&h=180&fit=crop' }}
                    style={styles.moodCardImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['#000000', '#333333']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.moodCardOverlay}
                  >
                    <Text style={styles.moodCardText}>Sad Mood</Text>
                    <Text style={styles.moodCardCount}>0 tracks</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.moodCard}
                  onPress={() => openMusicPlayer({ id: 'static-mood-2', name: 'chilling Mood', artists: [{ name: 'Static Artist' }], album: { name: 'Static Album', images: [{ url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=140&h=180&fit=crop' }] } })}
                >
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=140&h=180&fit=crop' }}
                    style={styles.moodCardImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['#00BFFF', '#1E90FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.moodCardOverlay}
                  >
                    <Text style={styles.moodCardText}>Chilling Mood</Text>
                    <Text style={styles.moodCardCount}>0 tracks</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.moodCard}
                  onPress={() => openMusicPlayer({ id: 'static-mood-3', name: 'Happy Mood', artists: [{ name: 'Static Artist' }], album: { name: 'Static Album', images: [{ url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=140&h=180&fit=crop' }] } })}
                >
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=140&h=180&fit=crop' }}
                    style={styles.moodCardImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['#FF69B4', '#FF1493']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.moodCardOverlay}
                  >
                    <Text style={styles.moodCardText}>Happy Mood</Text>
                    <Text style={styles.moodCardCount}>0 tracks</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>

        {/* Based on your recent listening */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Based on your recent listening</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentListeningContainer}>
            {recentTracks.length > 0 ? (
              recentTracks.slice(0, 4).map((track, index) => {
                try {
                  if (!track || !track.id || !track.name) return null;
                  const moodInfo = getMoodFromTrack(track);
                  return (
                    <TouchableOpacity 
                      key={`recent-${track.id}`} 
                      style={styles.recentCard}
                      onPress={() => openMusicPlayer(track)}
                    >
                      <Image
                        source={{ 
                          uri: track.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=160&h=160&fit=crop'
                        }}
                        style={styles.recentCardImage}
                        resizeMode="cover"
                      />
                      <View style={styles.recentCardImageOverlay}>
                        <Ionicons name="star" size={20} color="#FFFFFF" />
                        <Ionicons name="heart" size={16} color="#FFFFFF" />
                      </View>
                      <Text style={styles.recentCardTitle} numberOfLines={1}>
                        {track.name.length > 20 ? track.name.substring(0, 20) + '...' : track.name}
                      </Text>
                      <Text style={styles.recentCardArtist} numberOfLines={1}>
                        {track.artists?.[0]?.name || 'Unknown Artist'}
                      </Text>
                    </TouchableOpacity>
                  );
                } catch (error) {
                  console.log('Error rendering recent track:', error);
                  return null;
                }
              }).filter(Boolean)
            ) : (
              // Fallback static content when no tracks are available
              <>
                <TouchableOpacity 
                  style={styles.recentCard}
                  onPress={() => openMusicPlayer({ id: 'static-recent-1', name: 'Klink the joy', artists: [{ name: 'Juliet Sasha' }], album: { name: 'Static Album', images: [{ url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=160&h=160&fit=crop' }] } })}
                >
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=160&h=160&fit=crop' }}
                    style={styles.recentCardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.recentCardImageOverlay}>
                    <Ionicons name="star" size={20} color="#FFFFFF" />
                    <Ionicons name="heart" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.recentCardTitle}>Klink the joy</Text>
                  <Text style={styles.recentCardArtist}>Juliet Sasha</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.recentCard}
                  onPress={() => openMusicPlayer({ id: 'static-recent-2', name: 'Klink the joy', artists: [{ name: 'Juliet Sasha' }], album: { name: 'Static Album', images: [{ url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=160&h=160&fit=crop' }] } })}
                >
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=160&h=160&fit=crop' }}
                    style={styles.recentCardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.recentCardImageOverlay}>
                    <Ionicons name="star" size={20} color="#FFFFFF" />
                    <Ionicons name="cloud" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.recentCardTitle}>Klink the joy</Text>
                  <Text style={styles.recentCardArtist}>Juliet Sasha</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>

        {/* User Playlists Section */}
        {userPlaylists.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Playlists</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playlistsContainer}>
              {userPlaylists.slice(0, 4).map((playlist) => {
                try {
                  if (!playlist || !playlist.id || !playlist.name) return null;
                  return (
                    <TouchableOpacity key={playlist.id} style={styles.playlistCard}>
                      <Image 
                        source={{ 
                          uri: playlist.images?.[0]?.url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop' 
                        }}
                        style={styles.playlistImage}
                      />
                      <Text style={styles.playlistTitle} numberOfLines={1}>
                        {playlist.name.length > 15 ? playlist.name.substring(0, 15) + '...' : playlist.name}
                      </Text>
                      <Text style={styles.playlistTracks}>{playlist.tracks?.total || 0} tracks</Text>
                    </TouchableOpacity>
                  );
                } catch (error) {
                  console.log('Error rendering playlist:', error);
                  return null;
                }
              }).filter(Boolean)}
            </ScrollView>
          </View>
        )}


      </ScrollView>

      {/* Music Player Modal */}
      {showPlayer && currentTrack && (
        <View style={styles.musicPlayerOverlay}>
          <View style={styles.musicPlayerContent}>
            {/* Spotify Instructions */}
            <View style={styles.spotifyInstructions}>
              <Ionicons name="information-circle" size={20} color="#00CAFE" />
              <Text style={styles.spotifyInstructionsText}>
                Make sure Spotify app is running and you're logged in
              </Text>
            </View>
            
            <View style={styles.musicPlayerHeader}>
              <TouchableOpacity onPress={closeMusicPlayer}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.musicPlayerTitle}>{currentTrack.name}</Text>
              <TouchableOpacity onPress={toggleLike}>
                <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.musicPlayerAlbumArt}>
        <Image
                source={{ uri: currentTrack.album.images[0].url }} 
                style={styles.musicPlayerAlbumArtImage}
              />
            </View>
            <View style={styles.musicPlayerControls}>
                             <TouchableOpacity onPress={previousTrack}>
                 <Ionicons name="play-skip-back" size={36} color="#FFFFFF" />
               </TouchableOpacity>
               <TouchableOpacity onPress={togglePlayPause}>
                 <Ionicons name={isPlaying ? 'pause' : 'play'} size={60} color="#FFFFFF" />
               </TouchableOpacity>
               <TouchableOpacity onPress={nextTrack}>
                 <Ionicons name="play-skip-forward" size={36} color="#FFFFFF" />
               </TouchableOpacity>
            </View>
            <View style={styles.musicPlayerProgressBar}>
              <Text style={styles.musicPlayerTime}>{currentTime}s</Text>
              <TouchableOpacity onPress={seekTo}>
                <View style={[styles.musicPlayerProgressBarFill, { width: `${progress}%` }]} />
              </TouchableOpacity>
              <Text style={styles.musicPlayerTime}>30s</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070031',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#070031',
  },
  loadingText: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#070031',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 30,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#00CAFE',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00CAFE',
  },
  headerText: {
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    fontWeight: '400',
  },
  userName: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    backgroundColor: '#00CAFE',
    borderRadius: 4,
  },

  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  topListeningGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  musicCard: {
    width: '48%',
    backgroundColor: 'transparent',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  musicCardContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 80,
  },
  musicCardImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  musicCardTextContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  musicCardText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  musicCardArtist: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 2,
  },
  musicCardSubtext: {
    fontSize: 10,
    color: '#00CAFE',
    fontWeight: '600',
    marginTop: 2,
  },
  moodsContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  moodCard: {
    width: 140,
    height: 180,
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  moodCardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  moodCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  moodCardText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  moodCardCount: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '400',
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 2,
  },
  recentListeningContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  recentCard: {
    width: 160,
    marginRight: 16,
  },
  recentCardImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    marginBottom: 12,
  },
  recentCardImageOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 4,
  },
  recentCardTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  recentCardArtist: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  playlistsContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  playlistCard: {
    width: 150,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  playlistImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  playlistTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  playlistTracks: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'center',
  },
  musicPlayerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  musicPlayerContent: {
    width: '90%',
    height: '70%',
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  musicPlayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  musicPlayerTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  musicPlayerAlbumArt: {
    width: 200,
    height: 200,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
  },
  musicPlayerAlbumArtImage: {
    width: '100%',
    height: '100%',
  },
  musicPlayerControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  musicPlayerProgressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  musicPlayerTime: {
    fontSize: 14,
    color: '#FFFFFF',
    width: 40,
    textAlign: 'center',
  },
     musicPlayerProgressBarFill: {
     flex: 1,
     height: 8,
     backgroundColor: '#00CAFE',
     borderRadius: 4,
     marginHorizontal: 10,
   },
   spotifyInstructions: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: 'rgba(0, 202, 254, 0.1)',
     padding: 10,
     borderRadius: 8,
     marginBottom: 15,
     width: '100%',
   },
   spotifyInstructionsText: {
     fontSize: 12,
     color: '#00CAFE',
     marginLeft: 8,
     textAlign: 'center',
     flex: 1,
   },

});

