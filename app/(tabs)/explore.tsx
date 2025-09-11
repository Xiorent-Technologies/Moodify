import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SpotifyApiService } from '../../src/services/spotifyApi';

const { width } = Dimensions.get('window');

interface SearchResult {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  type: 'track';
}

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  // Mood playlist data
  const moodPlaylists = [
    {
      id: '1',
      name: 'Happy',
      image: require('../../assets/images/mood_creation/happy.jpg'),
      description: 'Uplifting and joyful tunes'
    },
    {
      id: '2',
      name: 'Sassy',
      image: require('../../assets/images/mood_creation/sassy.jpg'),
      description: 'Confident and bold vibes'
    },
    {
      id: '3',
      name: 'Vibes',
      image: require('../../assets/images/mood_creation/vibes.jpg'),
      description: 'Cool and energetic beats'
    },
    {
      id: '4',
      name: 'Melancholy',
      image: require('../../assets/images/mood_creation/melancholy.jpg'),
      description: 'Deep and emotional tunes'
    },
    {
      id: '5',
      name: 'Create Playlist',
      image: require('../../assets/images/mood_creation/chooseYourMood.jpg'),
      description: 'Build your own custom playlist',
      isCreatePlaylist: true
    }
  ];

  // Browse categories data
  const browseCategories = [
    {
      id: '1',
      name: 'Made for You',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      description: 'Personalized recommendations'
    },
    {
      id: '2',
      name: 'RELEASED',
      image: 'https://images.unsplash.com/photo-1511379938547-c1f6c2b4b8b0?w=400&h=400&fit=crop',
      description: 'Top new songs',
      badge: 'Top New So'
    },
    {
      id: '3',
      name: 'Music Charts',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop',
      description: 'Trending hits',
      badge: 'TOP 1 MUSIC CHARTS'
    },
    {
      id: '4',
      name: 'Podcasts',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      description: 'Audio stories and talks'
    },
    {
      id: '5',
      name: 'Bollywood',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      description: 'Indian cinema music'
    },
    {
      id: '6',
      name: 'Pop - Fusion',
      image: 'https://images.unsplash.com/photo-1511379938547-c1f6c2b4b8b0?w=400&h=400&fit=crop',
      description: 'Modern pop blends'
    }
  ];

  // Live search as user types
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Set new timeout for live search (300ms delay)
      searchTimeoutRef.current = setTimeout(() => {
        performLiveSearch(searchQuery);
      }, 300);
      
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSearchResults([]);
    }

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const performLiveSearch = async (query: string) => {
    try {
      setIsLoading(true);
      
      // Search for tracks only (since that's what's available)
      const tracksResponse = await SpotifyApiService.searchTracks(query, 15);

      const results: SearchResult[] = [];

      // Add tracks
      if (tracksResponse?.tracks?.items) {
        tracksResponse.tracks.items.forEach((track: any) => {
          results.push({
            id: track.id,
            name: track.name,
            artist: track.artists?.[0]?.name || 'Unknown Artist',
            album: track.album?.name || 'Unknown Album',
            albumArt: track.album?.images?.[0]?.url || '',
            type: 'track'
          });
        });
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Error performing live search:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoodPlaylistPress = (mood: any) => {
    console.log('Mood playlist pressed:', mood.name);
    
    if (mood.isCreatePlaylist) {
      // Navigate to mood creation screen
      router.push('/mood-creation');
    } else {
      // Navigate to songs list with mood type
      router.push({
        pathname: '/songs-list',
        params: {
          type: 'mood',
          name: mood.name,
          description: mood.description,
          image: mood.image
        }
      });
    }
  };

  const handleBrowseCategoryPress = (category: any) => {
    console.log('Browse category pressed:', category.name);
    // Navigate to songs list with category type
    router.push({
      pathname: '/songs-list',
      params: {
        type: 'category',
        name: category.name,
        description: category.description,
        image: category.image
      }
    });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      // Navigate to search results
      router.push({
        pathname: '/songs-list',
        params: {
          type: 'search',
          name: `Search: ${searchQuery}`,
          description: `Results for "${searchQuery}"`,
          image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
          query: searchQuery
        }
      });
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = () => {
    handleSearch();
  };

  const handleSearchResultPress = (result: SearchResult) => {
    // Navigate to song details or play the track
    router.push({
      pathname: '/songs-list',
      params: {
        type: 'search',
        name: result.name,
        description: `${result.artist} • ${result.album}`,
        image: result.albumArt,
        query: result.name
      }
    });
    
    setShowSuggestions(false);
    setSearchQuery(result.name);
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleSearchResultPress(item)}
    >
      <Image 
        source={{ 
          uri: item.albumArt || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=50&h=50&fit=crop'
        }} 
        style={styles.searchResultImage}
        resizeMode="cover"
        onError={() => console.log('Failed to load search result image:', item.name)}
      />
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.searchResultSubtitle} numberOfLines={1}>
          {item.artist} • {item.album}
        </Text>
      </View>
      <View style={styles.searchResultType}>
        <Text style={styles.searchResultTypeText}>
          🎵
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Status Bar */}
     
      {/* Header and Search */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="musical-notes" size={24} color="#00CAFE" />
          <Text style={styles.headerTitle}>Search</Text>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Songs, Artists, Podcasts & More"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            onFocus={() => {
              if (searchQuery.trim().length >= 2) {
                setShowSuggestions(true);
              }
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                setShowSuggestions(false);
                setSearchResults([]);
              }}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Live Search Results */}
      {showSuggestions && (
        <View style={styles.searchSuggestions}>
          <View style={styles.searchSuggestionsHeader}>
            <Text style={styles.searchSuggestionsTitle}>Search Results</Text>
            {isLoading && <ActivityIndicator size="small" color="#00CAFE" />}
          </View>
          
          {searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              style={styles.searchResultsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          ) : !isLoading ? (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No results found</Text>
              <Text style={styles.noResultsSubtext}>Try a different search term</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Main Content - Only show when not searching */}
      {!showSuggestions && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Your Top Mood Playlist Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Top Mood Playlist</Text>
            <View style={styles.moodGrid}>
              {moodPlaylists.slice(0, 4).map((mood) => (
                <TouchableOpacity
                  key={mood.id}
                  style={styles.moodCard}
                  onPress={() => handleMoodPlaylistPress(mood)}
                  activeOpacity={0.8}
                >
                  <Image 
                    source={mood.image} 
                    style={styles.moodImage}
                    resizeMode="cover"
                  />
                  <View style={styles.moodOverlay}>
                    <Text style={styles.moodName}>{mood.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            {/* Create Playlist Card - Centered */}
            <View style={styles.createPlaylistContainer}>
              <TouchableOpacity
                style={styles.createPlaylistCard}
                onPress={() => handleMoodPlaylistPress(moodPlaylists[4])}
                activeOpacity={0.8}
              >
                <Image 
                  source={moodPlaylists[4].image} 
                  style={styles.createPlaylistImage}
                  resizeMode="cover"
                />
                <View style={styles.createPlaylistOverlay}>
                  <Text style={styles.createPlaylistName}>{moodPlaylists[4].name}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Browse All Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Browse All</Text>
            <View style={styles.browseGrid}>
              {browseCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.browseCard}
                  onPress={() => handleBrowseCategoryPress(category)}
                  activeOpacity={0.8}
                >
                  <Image 
                    source={{ uri: category.image }} 
                    style={styles.browseImage}
                    resizeMode="cover"
                    onError={() => {
                      console.log('Failed to load browse image:', category.name);
                      console.log('Image URL:', category.image);
                    }}
                    onLoad={() => console.log('Successfully loaded browse image:', category.name)}
                  />
                  <View style={styles.browseOverlay}>
                    <Text style={styles.browseName}>{category.name}</Text>
                    {category.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{category.badge}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070031',
    paddingTop: 50,
    paddingBottom: 10,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    
  },
  statusBarTime: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusBarIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#00CAFE',
    fontSize: 28,
    fontWeight: '700',
    marginLeft: 12,
  },
  searchContainer: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: 12,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: '#1A1A2E',
    borderRadius: 25,
    paddingHorizontal: 50,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  clearButton: {
    position: 'absolute',
    right: 16,
    top: 12,
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moodCard: {
    width: (width - 64) / 2,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  moodImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  moodOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  moodName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  createPlaylistContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  createPlaylistCard: {
    width: (width - 64) / 2,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  createPlaylistImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  createPlaylistOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  createPlaylistName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  browseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  browseCard: {
    width: (width - 64) / 2,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  browseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  browseOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  browseName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#00CAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  searchSuggestions: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  searchSuggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchSuggestionsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  searchResultImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  searchResultSubtitle: {
    color: '#999',
    fontSize: 14,
  },
  searchResultType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#2A2A3E',
    borderRadius: 12,
  },
  searchResultTypeText: {
    fontSize: 14,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noResultsText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  noResultsSubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 5,
  },
});
