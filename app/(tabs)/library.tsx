import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../../src/components/ThemedText';
import { SpotifyApiService } from '../../src/services/spotifyApi';

const { width } = Dimensions.get('window');

interface LibraryItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  type: 'playlist' | 'album' | 'artist' | 'folder';
  count?: number;
}

export default function LibraryScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [selectedTab, setSelectedTab] = useState('playlists');
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState<LibraryItem[]>([]);
  const [userAlbums, setUserAlbums] = useState<LibraryItem[]>([]);
  const [userArtists, setUserArtists] = useState<LibraryItem[]>([]);
  const [moodPlaylists, setMoodPlaylists] = useState<LibraryItem[]>([]);

  const tabs = [
    { id: 'playlists', label: 'All Playlists' },
    { id: 'mood', label: 'Mood Playlist' },
    { id: 'albums', label: 'Albums' },
    { id: 'artists', label: 'Artists' }
  ];

  // Sample library data
  const allItems: LibraryItem[] = [
    {
      id: '1',
      title: 'Your Mood Playlist',
      subtitle: '11 playlists',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      type: 'playlist',
      count: 11
    },
    {
      id: '2',
      title: 'Top Tracks',
      subtitle: '8 playlists',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      type: 'playlist',
      count: 8
    },
    {
      id: '3',
      title: 'Your Liked Songs',
      subtitle: '110 songs',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      type: 'playlist',
      count: 110
    },
    {
      id: '4',
      title: 'random?',
      subtitle: '10 playlists',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      type: 'folder',
      count: 10
    }
  ];

  const playlistsItems: LibraryItem[] = allItems.filter(item => item.type === 'playlist');
  const moodItems: LibraryItem[] = [
    {
      id: '1',
      title: 'Your Mood Playlist',
      subtitle: '11 playlists',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      type: 'playlist',
      count: 11
    },
    {
      id: '9',
      title: 'Happy Vibes',
      subtitle: '5 playlists',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      type: 'playlist',
      count: 5
    },
    {
      id: '10',
      title: 'Chill Mood',
      subtitle: '3 playlists',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      type: 'playlist',
      count: 3
    }
  ];
  const albumsItems: LibraryItem[] = [
    {
      id: '5',
      title: 'Midnights',
      subtitle: 'Taylor Swift',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      type: 'album'
    },
    {
      id: '6',
      title: 'Sour',
      subtitle: 'Olivia Rodrigo',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      type: 'album'
    },
    {
      id: '11',
      title: 'Folklore',
      subtitle: 'Taylor Swift',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      type: 'album'
    }
  ];
  const artistsItems: LibraryItem[] = [
    {
      id: '7',
      title: 'Taylor Swift',
      subtitle: 'Artist',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      type: 'artist'
    },
    {
      id: '8',
      title: 'Drake',
      subtitle: 'Artist',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      type: 'artist'
    },
    {
      id: '12',
      title: 'Olivia Rodrigo',
      subtitle: 'Artist',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      type: 'artist'
    }
  ];

  // Load user's Spotify data
  const loadUserData = async () => {
    try {
      setIsLoading(true);
      setHasError(false);

      // Get user's playlists
      const playlists = await SpotifyApiService.getUserPlaylists();
      if (playlists?.items) {
        const formattedPlaylists = playlists.items.map((playlist: any) => ({
          id: playlist.id,
          title: playlist.name,
          subtitle: `${playlist.tracks?.total || 0} songs`,
          image: playlist.images?.[0]?.url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
          type: 'playlist' as const,
          count: playlist.tracks?.total || 0
        }));
        setUserPlaylists(formattedPlaylists);
      }



      // Get user's top artists
      const topArtists = await SpotifyApiService.getTopArtists();
      if (topArtists?.items) {
        const formattedArtists = topArtists.items.map((artist: any) => ({
          id: artist.id,
          title: artist.name,
          subtitle: 'Artist',
          image: artist.images?.[0]?.url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
          type: 'artist' as const
        }));
        setUserArtists(formattedArtists);
      }

      // Filter mood-related playlists
      let moodPlaylists = userPlaylists.filter(playlist => 
        playlist.title.toLowerCase().includes('mood') || 
        playlist.title.toLowerCase().includes('happy') ||
        playlist.title.toLowerCase().includes('chill') ||
        playlist.title.toLowerCase().includes('sad') ||
        playlist.title.toLowerCase().includes('energetic')
      );

      // Check for newly generated AI playlists
      try {
        const lastGeneratedPlaylist = await AsyncStorage.getItem('lastGeneratedPlaylist');
        if (lastGeneratedPlaylist) {
          const playlistData = JSON.parse(lastGeneratedPlaylist);
          const aiPlaylist = {
            id: playlistData.id,
            title: playlistData.name,
            subtitle: `${playlistData.trackCount} songs`,
            image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
            type: 'playlist' as const,
            count: playlistData.trackCount,
            isAIGenerated: true
          };
          
          // Add AI playlist to mood playlists if not already there
          if (!moodPlaylists.find(p => p.id === aiPlaylist.id)) {
            moodPlaylists = [aiPlaylist, ...moodPlaylists];
          }
        }
      } catch (error) {
        console.error('Error loading AI playlist:', error);
      }

      setMoodPlaylists(moodPlaylists);

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setHasError(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Handle URL parameter to automatically select tab
  useEffect(() => {
    if (tab === 'mood-playlist') {
      setSelectedTab('mood');
      // Set the library items for mood tab
      setLibraryItems(moodPlaylists);
    }
  }, [tab, moodPlaylists]);

  const handleTabPress = (tabId: string) => {
    setSelectedTab(tabId);
    
    // Filter items based on selected tab
    switch (tabId) {
      case 'playlists':
        setLibraryItems(userPlaylists);
        break;
      case 'mood':
        setLibraryItems(moodPlaylists);
        break;
      case 'albums':
        setLibraryItems(userAlbums);
        break;
      case 'artists':
        setLibraryItems(userArtists);
        break;
      default:
        setLibraryItems(userPlaylists);
    }
  };

  const getItemsForTab = () => {
    return libraryItems;
  };

  const renderLibraryItem = (item: LibraryItem) => (
    <TouchableOpacity key={item.id} style={styles.libraryItem}>
      <View style={styles.itemImageContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.itemImage}
          contentFit="cover"
        />
        {item.type === 'playlist' && (
          <View style={styles.playlistIcon}>
            <Ionicons name="musical-notes" size={16} color="#FFFFFF" />
          </View>
        )}
      </View>
      <View style={styles.itemContent}>
        <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.itemSubtitle}>{item.subtitle}</ThemedText>
      </View>
      <TouchableOpacity style={styles.moreButton}>
        <Ionicons name="ellipsis-vertical" size={20} color="rgba(255, 255, 255, 0.6)" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.musicNoteIcon}>
            <Ionicons name="musical-note" size={24} color="#00CAFE" />
          </View>
          <ThemedText style={styles.headerTitle}>Your Library</ThemedText>
        </View>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

    

      {/* Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              selectedTab === tab.id && styles.tabButtonActive
            ]}
            onPress={() => handleTabPress(tab.id)}
          >
            <ThemedText style={[
              styles.tabText,
              selectedTab === tab.id && styles.tabTextActive
            ]}>
              {tab.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Content Label */}
      <View style={styles.tabContentLabel}>
        <View style={styles.tabContentLabelBackground}>
          <ThemedText style={styles.tabContentLabelText}>
            {selectedTab === 'playlists' && 'Your Playlists'}
            {selectedTab === 'mood' && 'PlayList For your Mood'}
            {selectedTab === 'albums' && 'Your Albums'}
            {selectedTab === 'artists' && 'Your Artists'}
          </ThemedText>
        </View>
      </View>

      {/* Loading State */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00CAFE" />
          <ThemedText style={styles.loadingText}>Loading your library...</ThemedText>
        </View>
      )}

      {/* Error State */}
      {hasError && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Failed to load library</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={loadUserData}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Library Content */}
      {!isLoading && !hasError && (
        <ScrollView 
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContent}
        >
          {getItemsForTab().map(renderLibraryItem)}
        </ScrollView>
      )}
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
    paddingTop: 45,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  musicNoteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 202, 254, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  likedSongsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    marginBottom: 10,
  },
  likedSongsIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  likedSongsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 2,
  },
    sortText: {
    fontSize: 14,
    color: '#00CAFE',
    marginLeft: 8,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 2, // reduce vertical space (was 4)
  },
  tabsContent: {
    alignItems: 'center',
  },
  tabButton: {
    paddingHorizontal: 10,
    paddingVertical: 2, // reduce button height (was 4)
    borderRadius: 12,   // smaller radius
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 6,     // smaller spacing
  },
  tabButtonActive: {
    backgroundColor: 'rgba(0, 202, 254, 0.2)',
    borderColor: 'rgba(0, 202, 254, 0.5)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  tabTextActive: {
    color: '#00CAFE',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContent: {
    paddingTop: 0,
    paddingBottom: 10,
  },
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  itemImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  playlistIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 202, 254, 0.5)',
    borderRadius: 10,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  moreButton: {
    padding: 5,
  },
  tabContentLabel: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabContentLabelBackground: {
    backgroundColor: 'rgba(0, 202, 254, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 202, 254, 0.3)',
  },
  tabContentLabelText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 202, 254, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
    opacity: 0.8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#00CAFE',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
