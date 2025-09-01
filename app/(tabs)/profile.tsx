import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../../src/components/ThemedText';
import { SpotifyApiService } from '../../src/services/spotifyApi';

const { width } = Dimensions.get('window');

interface Playlist {
  id: string;
  name: string;
  description: string;
  image: string;
  trackCount: number;
}

export default function ProfileScreen() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Playlist[]>([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Get user profile
      const profile = await SpotifyApiService.getUserProfile();
      setUserProfile(profile);

      // Get user playlists
      const playlists = await SpotifyApiService.getUserPlaylists();
      if (playlists?.items) {
        const formattedPlaylists = playlists.items.slice(0, 10).map((playlist: any) => ({
          id: playlist.id,
          name: playlist.name,
          description: playlist.description || 'Playlist',
          image: playlist.images?.[0]?.url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=160&h=160&fit=crop',
          trackCount: playlist.tracks?.total || 0
        }));
        setUserPlaylists(formattedPlaylists);
      }

      // Get recently played tracks (convert to playlist format)
      const recentTracks = await SpotifyApiService.getRecentlyPlayed();
      if (recentTracks?.items) {
        const formattedRecent = recentTracks.items.slice(0, 10).map((item: any, index: number) => ({
          id: `recent-${index}`,
          name: item.track?.name || 'Unknown Track',
          description: item.track?.artists?.[0]?.name || 'Unknown Artist',
          image: item.track?.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=160&h=160&fit=crop',
          trackCount: 1
        }));
        setRecentlyPlayed(formattedRecent);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const renderPlaylistCard = (playlist: Playlist) => (
    <TouchableOpacity key={playlist.id} style={styles.playlistCard}>
      <Image
        source={{ uri: playlist.image }}
        style={styles.playlistImage}
        contentFit="cover"
      />
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
      <View style={styles.backgroundDecorations}>
        <View style={[styles.orb, styles.orb1]} />
        <View style={[styles.orb, styles.orb2]} />
        <View style={[styles.orb, styles.orb3]} />
        <View style={[styles.orb, styles.orb4]} />
      </View>

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
                {userProfile?.display_name || 'User'}
              </ThemedText>
              <ThemedText style={styles.username}>
                @{userProfile?.id || 'username'}
              </ThemedText>
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
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="create-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* My Playlists Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>My playlists</ThemedText>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {userPlaylists.map(renderPlaylistCard)}
          </ScrollView>
        </View>

        {/* Recently Listened Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Recently listened</ThemedText>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {recentlyPlayed.map(renderPlaylistCard)}
          </ScrollView>
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
    width: 100,
    height: 100,
    borderRadius: 50,
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
    paddingHorizontal: 20,
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
  },
  playlistImage: {
    width: 160,
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
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
});