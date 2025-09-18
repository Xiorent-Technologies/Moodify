import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useState, useCallback, memo } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Urbanist_400Regular, Urbanist_600SemiBold, Urbanist_700Bold } from '@expo-google-fonts/urbanist';
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

const LibraryScreen = memo(() => {
  // Load Urbanist fonts
  const [fontsLoaded] = useFonts({
    Urbanist_400Regular,
    Urbanist_600SemiBold,
    Urbanist_700Bold,
  });

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
      }

      setMoodPlaylists(moodPlaylists);

      setIsLoading(false);
    } catch (error) {
      setHasError(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!fontsLoaded) {
      return;
    }
    loadUserData();
  }, [fontsLoaded]);

  useEffect(() => {
    if (tab === 'mood-playlist') {
      setSelectedTab('mood');
      setLibraryItems(moodPlaylists);
    }
  }, [tab, moodPlaylists]);

  useEffect(() => {
    const items = getItemsForTab();
  }, [selectedTab]);

  const handleTabPress = useCallback((tabId: string) => {
    setSelectedTab(tabId);
  }, []);

  const getItemsForTab = () => {
    let items = [];
    switch (selectedTab) {
      case 'playlists':
        items = userPlaylists;
        break;
      case 'mood':
        items = moodPlaylists;
        break;
      case 'albums':
        items = userAlbums;
        break;
      case 'artists':
        items = userArtists;
        break;
      default:
        items = userPlaylists;
    }
    
    return items;
  };

  const handleItemPress = (item: LibraryItem) => {
    if (item.type === 'playlist') {
      // Navigate to songs list with playlist data
      router.push({
        pathname: '/songs-list',
        params: {
          playlistId: item.id,
          playlistName: item.title,
          playlistImage: item.image,
          trackCount: item.count || 0
        }
      });
    } else if (item.type === 'album') {
      // Navigate to album details
      router.push({
        pathname: '/songs-list',
        params: {
          albumId: item.id,
          albumName: item.title,
          albumImage: item.image,
          trackCount: item.count || 0
        }
      });
    } else if (item.type === 'artist') {
      // Navigate to artist details
      router.push({
        pathname: '/songs-list',
        params: {
          artistId: item.id,
          artistName: item.title,
          artistImage: item.image
        }
      });
    }
  };

  const renderLibraryItem = useCallback((item: LibraryItem) => (
    <TouchableOpacity 
      key={item.id} 
      style={styles.libraryItem}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.itemImageContainer}>
              <Image
                source={{ uri: item.image }}
                style={styles.itemImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                recyclingKey={item.id}
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
  ), [handleItemPress]);

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00CAFE" />
          <ThemedText style={styles.loadingText}>Loading fonts...</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
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
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabButton}
              onPress={() => handleTabPress(tab.id)}
            >
              {selectedTab === tab.id ? (
                <LinearGradient
                  colors={['#00DEFF', '#0043F7', '#0E1D92', '#001C89', '#B22CFF']}
                  locations={[0.0185, 0.3205, 0.5181, 0.6465, 0.9599]}
                  style={styles.tabButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <ThemedText style={styles.tabTextActive}>
                    {tab.label}
                  </ThemedText>
                </LinearGradient>
              ) : (
                <ThemedText style={styles.tabText}>
                  {tab.label}
                </ThemedText>
              )}
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
      </View>

      {/* Scrollable Content */}
      <View style={styles.scrollableContent}>
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
            {(() => {
              const items = getItemsForTab();
              return items.map(renderLibraryItem);
            })()}
          </ScrollView>
        )}
      </View>
    </View>
  );
});

export default LibraryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#03021F',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#03021F',
  },
  scrollableContent: {
    flex: 1,
    paddingTop: 250, // Space for header + tabs + content label + extra spacing
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 70,
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
    fontFamily: 'Urbanist_700Bold',
    color: '#00C2CB',
    lineHeight: 36,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 4,
    marginTop: 8,
  },
  tabsContent: {
    alignItems: 'flex-start',
    paddingVertical: 0,
    gap: 6,
    paddingHorizontal: 0,
  },
  tabButton: {
    marginRight: 8,
    marginLeft: 0,
    width: 100,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 30,
  },
  tabButtonGradient: {
    width: 100,
    height: 28,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    // borderColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Urbanist_400Regular',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tabTextActive: {
    fontSize: 16,
    fontFamily: 'Urbanist_600SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tabContentLabel: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    marginTop: 8,
    marginLeft: 0,
    alignSelf: 'flex-start',
  },
  tabContentLabelText: {
    fontSize: 28,
    fontFamily: 'Urbanist_700Bold',
    color: '#FFFFFF',
    textAlign: 'left',
    lineHeight: 36,
  },
  contentContainer: {
    paddingHorizontal: 0,
  },
  contentContent: {
    paddingBottom: 10,
  },
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical:20,
    paddingHorizontal: 20,
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
