import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl, Linking } from 'react-native';
import { ThemedText } from '../../src/components/ThemedText';
import { SpotifyApiService } from '../../src/services/spotifyApi';
import { AuthService } from '../../src/services/authService';
import { SpotifyAuthService } from '../../src/services/spotifyAuth';
import SpotifyPlayerService from '../../src/services/spotifyPlayerService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface Playlist {
  id: string;
  name: string;
  description: string;
  image: string;
  trackCount: number;
  trackUri?: string; // For recent tracks
  artistName?: string; // For recent tracks
}

export default function ProfileScreen() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Playlist[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  
  // Music Player State (same as home page)
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [unsubscribePlayer, setUnsubscribePlayer] = useState<(() => void) | null>(null);
  
  // Premium User Status (same as home page)
  const [isPremiumUser, setIsPremiumUser] = useState<boolean | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  // Cleanup player on unmount
  useEffect(() => {
    return () => {
      if (unsubscribePlayer) {
        unsubscribePlayer();
      }
    };
  }, [unsubscribePlayer]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      setPlaylistError(null);

      // Get Firebase user data
      const firebaseUserData = AuthService.getCurrentUser();
      setFirebaseUser(firebaseUserData);

      // Get user profile
      try {
        const profile = await SpotifyApiService.getUserProfile();
        setUserProfile(profile);
      } catch (error) {
        // Silent error handling
      }

      // Get user playlists
      try {
        const playlists = await SpotifyApiService.getUserPlaylists();
        
        if (playlists?.items && playlists.items.length > 0) {
          // Get track counts for each playlist
          const playlistsWithTracks = await Promise.all(
            playlists.items.map(async (playlist: any) => {
              try {
                const tracks = await SpotifyApiService.getPlaylistTracks(playlist.id, 1, 0);
                const trackCount = tracks?.total || 0;
                
                return {
                  id: playlist.id,
                  name: playlist.name,
                  description: playlist.description || `${trackCount} songs`,
                  image: playlist.images?.[0]?.url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=160&h=160&fit=crop',
                  trackCount: trackCount
                };
              } catch (trackError) {
                return {
                  id: playlist.id,
                  name: playlist.name,
                  description: playlist.description || '0 songs',
                  image: playlist.images?.[0]?.url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=160&h=160&fit=crop',
                  trackCount: 0
                };
              }
            })
          );
          
          setUserPlaylists(playlistsWithTracks);
        } else {
          setUserPlaylists([]);
        }
      } catch (error) {
        setPlaylistError('Failed to load playlists');
        setUserPlaylists([]);
      }

      // Get recently played tracks (convert to playlist format)
      try {
        const recentTracks = await SpotifyApiService.getRecentlyPlayed();
        
        if (recentTracks?.items && recentTracks.items.length > 0) {
          const formattedRecent = recentTracks.items.map((item: any, index: number) => ({
            id: `recent-${index}`,
            name: item.track?.name || 'Unknown Track',
            description: item.track?.artists?.[0]?.name || 'Unknown Artist',
            image: item.track?.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=160&h=160&fit=crop',
            trackCount: 1,
            trackUri: item.track?.uri || null,
            artistName: item.track?.artists?.[0]?.name || 'Unknown Artist'
          }));
          setRecentlyPlayed(formattedRecent);
        } else {
          setRecentlyPlayed([]);
        }
      } catch (error) {
        setRecentlyPlayed([]);
      }
    } catch (error) {
      setPlaylistError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutPress = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    if (isLoggingOut) return; // Prevent multiple calls
    
    setShowLogoutConfirm(false);
    setIsLoggingOut(true);
    
    try {
      // 1. Logout from Firebase Auth
      await AuthService.signOut();
      
      // 2. Logout from Spotify
      await SpotifyAuthService.logout();
      
      // 3. Clear ALL AsyncStorage data
      await AsyncStorage.clear();
      
      // 4. Navigate to email login screen
      router.replace('/email-login');
      
    } catch (error: any) {
      setIsLoggingOut(false);
      // Use a simple alert without complex navigation
      setTimeout(() => {
        Alert.alert('Error', `Failed to logout: ${error.message}`);
      }, 100);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const handlePlaylistPress = (playlist: Playlist) => {
    // Navigate to playlist details or songs list
    router.push({
      pathname: '/songs-list',
      params: {
        playlistId: playlist.id,
        playlistName: playlist.name,
        playlistImage: playlist.image,
        trackCount: playlist.trackCount
      }
    });
  };

  // Music Player Functions (exact same as home page)
  const openMusicPlayer = async (track: any) => {
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

  // Detect if user has Spotify Premium (exact same as home page)
  const detectPremiumStatus = async () => {
    try {
      const response = await SpotifyApiService.testConnection();
      // If we can control playback, user likely has Premium
      // For now, we'll assume Premium if basic API works
      setIsPremiumUser(true);
    } catch (error: any) {
      if (error.message.includes('403') || error.message.includes('Playback control not allowed')) {
        setIsPremiumUser(false);
      } else {
        setIsPremiumUser(null);
      }
    }
  };

  // Smart playback function that detects Premium vs Free (exact same as home page)
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
      // Fallback to opening in Spotify app
      await openInSpotifyApp();
    }
  };

  // Premium user: Play in app with full controls (exact same as home page)
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
      Alert.alert(
        '⚠️ Premium Playback Failed',
        'Falling back to Spotify app...',
        [{ text: 'OK', style: 'default' }]
      );
      await openInSpotifyApp();
    }
  };

  // Free user: Open in Spotify app (exact same as home page)
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
      
      Alert.alert(
        '❌ Error',
        'Failed to open track in Spotify. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
      
      // Fallback to local state if API fails
      setIsPlaying(!isPlaying);
    }
  };

  const handleRecentTrackPress = async (track: Playlist) => {
    if (!track.trackUri) {
      Alert.alert('Error', 'Track URI not available for playback');
      return;
    }

    // Convert to the format expected by openMusicPlayer
    const trackData = {
      id: track.id.replace('recent-', ''),
      name: track.name,
      artists: [{ name: track.artistName || track.description }],
      album: { 
        name: track.name, 
        images: [{ url: track.image }] 
      },
      uri: track.trackUri
    };

    await openMusicPlayer(trackData);
  };

  // Player Control Functions (exact same as home page)
  const togglePlayPause = async () => {
    await smartPlayback();
  };

  const nextTrack = async () => {
    try {
      const playerService = SpotifyPlayerService.getInstance();
      await playerService.nextTrack();
    } catch (error) {
      console.error('Error playing next track:', error);
    }
  };

  const previousTrack = async () => {
    try {
      const playerService = SpotifyPlayerService.getInstance();
      await playerService.previousTrack();
    } catch (error) {
      console.error('Error playing previous track:', error);
    }
  };

  const toggleLike = async () => {
    // Like functionality can be implemented later with Spotify Web API
    setIsLiked(!isLiked);
  };

  const renderPlaylistCard = (playlist: Playlist, isRecentTrack: boolean = false) => (
    <TouchableOpacity 
      key={playlist.id} 
      style={styles.playlistCard}
      onPress={() => isRecentTrack ? handleRecentTrackPress(playlist) : handlePlaylistPress(playlist)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
                <Image
                  source={{ uri: playlist.image }}
                  style={styles.playlistImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  recyclingKey={playlist.id}
                />
        {isRecentTrack && (
          <View style={styles.playButton}>
            {playingTrackId === playlist.id ? (
              <Ionicons name="hourglass-outline" size={24} color="#FFFFFF" />
            ) : (
              <Ionicons name="play" size={24} color="#FFFFFF" />
            )}
          </View>
        )}
      </View>
      <ThemedText style={styles.playlistTitle} numberOfLines={1}>
        {playlist.name}
      </ThemedText>
      <ThemedText style={styles.playlistSubtitle} numberOfLines={1}>
        {playlist.description}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Background Decorations */}
      {/* <View style={styles.backgroundDecorations}>
        <View style={[styles.orb, styles.orb1]} />
        <View style={[styles.orb, styles.orb2]} />
        <View style={[styles.orb, styles.orb3]} />
        <View style={[styles.orb, styles.orb4]} />
      </View> */}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Profile</ThemedText>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadUserData}
            tintColor="#00CAFE"
            colors={["#00CAFE"]}
          />
        }
      >
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{ 
                  uri: userProfile?.images?.[0]?.url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
                }}
                style={styles.profileImage}
                contentFit="cover"
              />
            </View>
            <View style={styles.profileDetails}>
              <ThemedText style={styles.displayName}>
                {userProfile?.display_name || firebaseUser?.displayName || 'User'}
              </ThemedText>
              <ThemedText style={styles.username}>
                {firebaseUser?.email || 'No email'}
              </ThemedText>
              {/* <ThemedText style={styles.username}>
                @{userProfile?.id || 'username'}
              </ThemedText> */}
              <ThemedText style={styles.stats}>
                {userProfile?.followers?.total || 0} followers · {userPlaylists.length} playlists
              </ThemedText>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.manageButton}>
              <ThemedText style={styles.manageButtonText}>Manage playlists</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
              onPress={handleLogoutPress}
              disabled={isLoggingOut}
            >
              <Ionicons 
                name={isLoggingOut ? "hourglass-outline" : "log-out-outline"} 
                size={24} 
                color={isLoggingOut ? "#999" : "#FF6B6B"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* My Playlists Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>My playlists</ThemedText>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ThemedText style={styles.loadingText}>Loading playlists...</ThemedText>
            </View>
          ) : playlistError ? (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{playlistError}</ThemedText>
              <TouchableOpacity style={styles.retryButton} onPress={loadUserData}>
                <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
          ) : userPlaylists.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {userPlaylists.map(playlist => renderPlaylistCard(playlist, false))}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>No playlists found</ThemedText>
              <ThemedText style={styles.emptySubtext}>Create your first playlist to get started</ThemedText>
            </View>
          )}
        </View>

        {/* Recently Listened Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Recently listened</ThemedText>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ThemedText style={styles.loadingText}>Loading recent tracks...</ThemedText>
            </View>
          ) : recentlyPlayed.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {recentlyPlayed.map(track => renderPlaylistCard(track, true))}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>No recent tracks</ThemedText>
              <ThemedText style={styles.emptySubtext}>Start listening to music to see your recent activity</ThemedText>
            </View>
          )}
        </View>
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
                source={{ uri: currentTrack.album?.images?.[0]?.url || currentTrack.image }} 
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
              <TouchableOpacity onPress={() => {}}>
                <View style={[styles.musicPlayerProgressBarFill, { width: `${progress}%` }]} />
              </TouchableOpacity>
              <Text style={styles.musicPlayerTime}>30s</Text>
            </View>
          </View>
        </View>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to logout? This will clear all your data and you'll need to sign in again.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={handleLogoutCancel}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmButton} 
                onPress={handleLogoutConfirm}
              >
                <Text style={styles.modalConfirmText}>Logout</Text>
              </TouchableOpacity>
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
    backgroundColor: '#03021F',
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageContainer: {
    marginRight: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileDetails: {
    flex: 1,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#00CAFE',
    marginBottom: 4,
    fontWeight: '500',
  },
  username: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  stats: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 80,
    paddingVertical: 12,
    marginRight: 16,
  },
  manageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  iconButton: {
    padding: 12,
    marginHorizontal: 8,
  },
  logoutButton: {
    padding: 12,
    marginHorizontal: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
  },
  logoutButtonDisabled: {
    backgroundColor: 'rgba(153, 153, 153, 0.1)',
    opacity: 0.6,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 25,
    margin: 20,
    maxWidth: 350,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginLeft: 10,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  horizontalScroll: {
    paddingLeft: 20,
  },
  horizontalScrollContent: {
    paddingRight: 20,
  },
  playlistCard: {
    width: 160,
    marginRight: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  playlistImage: {
    width: 144,
    height: 144,
    borderRadius: 8,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  playlistSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginBottom: 5,
  },
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    textAlign: 'center',
  },
  // Music Player Styles (exact same as home page)
  musicPlayerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    zIndex: 1000,
  },
  musicPlayerContent: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  spotifyInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 202, 254, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  spotifyInstructionsText: {
    color: '#00CAFE',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  musicPlayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  musicPlayerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  musicPlayerAlbumArt: {
    alignItems: 'center',
    marginBottom: 30,
  },
  musicPlayerAlbumArtImage: {
    width: 300,
    height: 300,
    borderRadius: 20,
  },
  musicPlayerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    marginBottom: 30,
  },
  musicPlayerProgressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  musicPlayerTime: {
    color: '#FFFFFF',
    fontSize: 14,
    minWidth: 40,
  },
  musicPlayerProgressBarFill: {
    flex: 1,
    height: 4,
    backgroundColor: '#00CAFE',
    borderRadius: 2,
  },
});
