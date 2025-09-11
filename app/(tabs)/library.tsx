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

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      setHasError(false);

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

      let moodPlaylists = userPlaylists.filter(playlist =>
        playlist.title.toLowerCase().includes('mood') ||
        playlist.title.toLowerCase().includes('happy') ||
        playlist.title.toLowerCase().includes('chill') ||
        playlist.title.toLowerCase().includes('sad') ||
        playlist.title.toLowerCase().includes('energetic')
      );

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

  useEffect(() => {
    if (tab === 'mood-playlist') {
      setSelectedTab('mood');
      setLibraryItems(moodPlaylists);
    }
  }, [tab, moodPlaylists]);

  const handleTabPress = (tabId: string) => {
    setSelectedTab(tabId);

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
        <ThemedText style={styles.tabContentLabelText}>
          {selectedTab === 'playlists' && 'Your Playlists'}
          {selectedTab === 'mood' && 'Playlist for Your Mood'}
          {selectedTab === 'albums' && 'Your Albums'}
          {selectedTab === 'artists' && 'Your Artists'}
        </ThemedText>
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
    paddingTop: 60,
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
    fontSize: 30,
    fontWeight: 'bold',
    color: '#00C2CB',
  },
  searchButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 0,
    marginBottom: -4,
  },
  tabsContent: {
    alignItems: 'center',
    paddingVertical: 0,
  },
  tabButton: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 6,
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
  tabContentLabel: {
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 8,
    marginTop: -4,
  },
  tabContentLabelText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'left',
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  contentContent: {
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    minHeight: 200,
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
