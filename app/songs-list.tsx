import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SpotifyApiService } from '../src/services/spotifyApi';

const { width } = Dimensions.get('window');

interface Song {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: string;
  uri: string;
}

export default function SongsListScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlayingSong, setCurrentPlayingSong] = useState<string | null>(null);

  const { type, name, description, image, query } = params;

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      setIsLoading(true);
      let songsData: Song[] = [];

      if (type === 'mood') {
        // Load mood-based songs
        songsData = await loadMoodBasedSongs(name as string);
      } else if (type === 'category') {
        // Load category-based songs
        songsData = await loadCategoryBasedSongs(name as string);
      } else if (type === 'search') {
        // Load search results
        songsData = await loadSearchResults(query as string);
      }

      setSongs(songsData);
    } catch (error) {
      console.error('Error loading songs:', error);
      // Fallback to sample songs
      setSongs(getSampleSongs());
    } finally {
      setIsLoading(false);
    }
  };

  const loadSearchResults = async (searchQuery: string): Promise<Song[]> => {
    try {
      // Use Spotify API to search for tracks by text query
      const response = await SpotifyApiService.searchTracks(searchQuery, 20);
      
      if (response && response.tracks && response.tracks.items) {
        return response.tracks.items.map((track: any) => ({
          id: track.id,
          name: track.name,
          artist: track.artists?.[0]?.name || 'Unknown Artist',
          album: track.album?.name || 'Unknown Album',
          albumArt: track.album?.images?.[0]?.url || '',
          duration: formatDuration(track.duration_ms),
          uri: track.uri
        }));
      }
    } catch (error) {
      console.error('Error loading search results:', error);
    }
    
    return getSampleSongs();
  };

  const loadMoodBasedSongs = async (mood: string): Promise<Song[]> => {
    try {
      // Analyze user preferences to provide localized content
      const { userLanguage, userRegion, userGenres } = await analyzeUserPreferences();
      
      // Build localized search query based on mood and user preferences
      let localizedQuery = '';
      
      switch (mood.toLowerCase()) {
        case 'happy':
          if (userLanguage === 'hindi') localizedQuery = 'happy bollywood songs upbeat';
          else if (userLanguage === 'spanish') localizedQuery = 'feliz canciones latinas alegres';
          else if (userLanguage === 'french') localizedQuery = 'heureux chansons françaises joyeuses';
          else localizedQuery = 'happy upbeat songs';
          break;
        case 'sassy':
          if (userLanguage === 'hindi') localizedQuery = 'sassy bollywood item songs';
          else if (userLanguage === 'spanish') localizedQuery = 'atrevidas canciones latinas';
          else if (userLanguage === 'french') localizedQuery = 'audacieuses chansons françaises';
          else localizedQuery = 'sassy confident songs';
          break;
        case 'vibes':
          if (userLanguage === 'hindi') localizedQuery = 'cool bollywood vibes songs';
          else if (userLanguage === 'spanish') localizedQuery = 'vibra canciones latinas';
          else if (userLanguage === 'french') localizedQuery = 'ambiance chansons françaises';
          else localizedQuery = 'cool vibes songs';
          break;
        case 'melancholy':
          if (userLanguage === 'hindi') localizedQuery = 'sad bollywood songs emotional';
          else if (userLanguage === 'spanish') localizedQuery = 'tristes canciones latinas emocionales';
          else if (userLanguage === 'french') localizedQuery = 'tristes chansons françaises émotionnelles';
          else localizedQuery = 'sad emotional songs';
          break;
        default:
          localizedQuery = mood;
      }

      // Use localized search instead of mood parameters
      const response = await SpotifyApiService.searchTracks(localizedQuery, 20);
      
      if (response && response.tracks && response.tracks.items) {
        return response.tracks.items.map((track: any) => ({
          id: track.id,
          name: track.name,
          artist: track.artists?.[0]?.name || 'Unknown Artist',
          album: track.album?.name || 'Unknown Album',
          albumArt: track.album?.images?.[0]?.url || '',
          duration: formatDuration(track.duration_ms),
          uri: track.uri
        }));
      }
    } catch (error) {
      console.error('Error loading mood songs:', error);
    }
    
    return getSampleSongs();
  };

  const loadCategoryBasedSongs = async (category: string): Promise<Song[]> => {
    try {
      // Analyze user preferences to provide localized content
      const { userLanguage, userRegion, userGenres } = await analyzeUserPreferences();
      
      let searchQuery = category;
      
      // Map categories to localized search terms based on user preferences
      switch (category.toLowerCase()) {
        case 'made for you':
          if (userLanguage === 'hindi') searchQuery = 'popular bollywood hits 2024';
          else if (userLanguage === 'spanish') searchQuery = 'populares canciones latinas 2024';
          else if (userLanguage === 'french') searchQuery = 'populaires chansons françaises 2024';
          else searchQuery = 'popular hits 2024';
          break;
        case 'released':
          if (userLanguage === 'hindi') searchQuery = 'new bollywood releases 2024';
          else if (userLanguage === 'spanish') searchQuery = 'nuevas canciones latinas 2024';
          else if (userLanguage === 'french') searchQuery = 'nouvelles chansons françaises 2024';
          else searchQuery = 'new releases 2024';
          break;
        case 'music charts':
          if (userLanguage === 'hindi') searchQuery = 'top bollywood chart hits';
          else if (userLanguage === 'spanish') searchQuery = 'top canciones latinas chart';
          else if (userLanguage === 'french') searchQuery = 'top chansons françaises chart';
          else searchQuery = 'top hits chart';
          break;
        case 'podcasts':
          if (userLanguage === 'hindi') searchQuery = 'trending hindi podcasts';
          else if (userLanguage === 'spanish') searchQuery = 'tendencias podcasts latinos';
          else if (userLanguage === 'french') searchQuery = 'tendances podcasts français';
          else searchQuery = 'trending podcasts';
          break;
        case 'bollywood':
          searchQuery = 'bollywood hits songs';
          break;
        case 'pop - fusion':
          if (userLanguage === 'hindi') searchQuery = 'bollywood pop fusion hits';
          else if (userLanguage === 'spanish') searchQuery = 'pop latino fusion hits';
          else if (userLanguage === 'french') searchQuery = 'pop français fusion hits';
          else searchQuery = 'pop fusion hits';
          break;
      }

      // Use localized search
      const response = await SpotifyApiService.searchTracks(searchQuery, 20);
      
      if (response && response.tracks && response.tracks.items) {
        return response.tracks.items.map((track: any) => ({
          id: track.id,
          name: track.name,
          artist: track.artists?.[0]?.name || 'Unknown Artist',
          album: track.album?.name || 'Unknown Album',
          albumArt: track.album?.images?.[0]?.url || '',
          duration: formatDuration(track.duration_ms),
          uri: track.uri
        }));
      }
    } catch (error) {
      console.error('Error loading category songs:', error);
    }
    
    return getSampleSongs();
  };

  const getSampleSongs = (): Song[] => {
    return [
      {
        id: '1',
        name: 'Blinding Lights',
        artist: 'The Weeknd',
        album: 'After Hours',
        albumArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
        duration: '3:20',
        uri: 'spotify:track:1'
      },
      {
        id: '2',
        name: 'Dance Monkey',
        artist: 'Tones and I',
        album: 'The Kids Are Coming',
        albumArt: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop',
        duration: '3:29',
        uri: 'spotify:track:2'
      },
      {
        id: '3',
        name: 'Shape of You',
        artist: 'Ed Sheeran',
        album: '÷ (Divide)',
        albumArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
        duration: '3:53',
        uri: 'spotify:track:3'
      },
      {
        id: '4',
        name: 'Uptown Funk',
        artist: 'Mark Ronson ft. Bruno Mars',
        album: 'Uptown Special',
        albumArt: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop',
        duration: '4:29',
        uri: 'spotify:track:4'
      },
      {
        id: '5',
        name: 'Despacito',
        artist: 'Luis Fonsi ft. Daddy Yankee',
        album: 'Vida',
        albumArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
        duration: '4:41',
        uri: 'spotify:track:5'
      }
    ];
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSongPress = async (song: Song) => {
    try {
      // For now, open in Spotify app (you can integrate with your player later)
      const spotifyUrl = `https://open.spotify.com/track/${song.id}`;
      await Linking.openURL(spotifyUrl);
      
      Alert.alert(
        '🎵 Song Opened',
        `${song.name} is now playing in Spotify!`,
        [{ text: 'Awesome!', style: 'default' }]
      );
    } catch (error) {
      console.error('Error opening song:', error);
      Alert.alert('Error', 'Failed to open song in Spotify');
    }
  };

  const handlePlayAll = async () => {
    try {
      // Create a playlist with all songs and play it
      Alert.alert(
        '🎵 Play All',
        'Creating playlist and starting playback...',
        [{ text: 'OK', style: 'default' }]
      );
      
      // TODO: Implement playlist creation and playback
    } catch (error) {
      console.error('Error playing all songs:', error);
    }
  };

  const analyzeUserPreferences = async () => {
    try {
      let userLanguage = 'english';
      let userRegion = 'global';
      let userGenres: string[] = [];

      // Get user's top artists to understand their music taste
      const topArtists = await SpotifyApiService.getTopArtists(20, 'short_term');
      
      if (topArtists && topArtists.items && topArtists.items.length > 0) {
        const artistNames = topArtists.items.map((artist: any) => artist.name).join(' ');
        const artistGenres = topArtists.items.flatMap((artist: any) => artist.genres || []);
        
        userGenres = [...new Set(artistGenres)].map(genre => String(genre)); // Remove duplicates and convert to strings
        
        // Detect language/region from top artists
        if (artistNames.includes('Arijit Singh') || artistNames.includes('Shreya Ghoshal') || 
            artistNames.includes('A.R. Rahman') || artistNames.includes('Pritam') ||
            artistGenres.some((genre: any) => String(genre).includes('bollywood') || String(genre).includes('indian'))) {
          userLanguage = 'hindi';
          userRegion = 'india';
        } else if (artistNames.includes('Bad Bunny') || artistNames.includes('Shakira') || 
                   artistNames.includes('J Balvin') || artistNames.includes('Maluma') ||
                   artistGenres.some((genre: any) => String(genre).includes('latin') || String(genre).includes('reggaeton'))) {
          userLanguage = 'spanish';
          userRegion = 'latin';
        } else if (artistNames.includes('Stromae') || artistNames.includes('Angèle') ||
                   artistGenres.some((genre: any) => String(genre).includes('french'))) {
          userLanguage = 'french';
          userRegion = 'france';
        } else if (artistNames.includes('BTS') || artistNames.includes('BLACKPINK') ||
                   artistGenres.some((genre: any) => String(genre).includes('k-pop'))) {
          userLanguage = 'korean';
          userRegion = 'korea';
        } else if (artistNames.includes('One Direction') || artistNames.includes('Ed Sheeran') ||
                   artistNames.includes('Taylor Swift') || artistNames.includes('The Weeknd')) {
          userLanguage = 'english';
          userRegion = 'global';
        }
      }

      // Also check recent tracks as backup
      const recentTracks = await SpotifyApiService.getRecentlyPlayed(20);
      if (recentTracks && recentTracks.items && recentTracks.items.length > 0) {
        const trackNames = recentTracks.items.map((item: any) => item.track?.name || '').join(' ');
        const artistNames = recentTracks.items.map((item: any) => 
          item.track?.artists?.map((artist: any) => artist.name).join(' ') || ''
        ).join(' ');
        
        // Override with recent listening if it's more specific
        if (trackNames.includes('हिंदी') || artistNames.includes('हिंदी') || 
            trackNames.includes('Bollywood') || artistNames.includes('Bollywood')) {
          userLanguage = 'hindi';
          userRegion = 'india';
        } else if (trackNames.includes('Español') || artistNames.includes('Español') ||
                   trackNames.includes('Latino') || artistNames.includes('Latino')) {
          userLanguage = 'spanish';
          userRegion = 'latin';
        }
      }

      return { userLanguage, userRegion, userGenres };
    } catch (error) {
      console.error('Error analyzing user preferences:', error);
      return { userLanguage: 'english', userRegion: 'global', userGenres: [] };
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00CAFE" />
        <Text style={styles.loadingText}>Loading songs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Image 
            source={{ 
              uri: (image as string) || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop'
            }} 
            style={styles.headerImage}
            resizeMode="cover"
            onError={() => console.log('Failed to load header image')}
          />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{name}</Text>
            <Text style={styles.headerSubtitle}>{description}</Text>
            <Text style={styles.songCount}>{songs.length} songs</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.playAllButton} onPress={handlePlayAll}>
          <Ionicons name="play" size={24} color="#FFFFFF" />
          <Text style={styles.playAllText}>Play All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.shuffleButton}>
          <Ionicons name="shuffle" size={20} color="#00CAFE" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Songs List */}
      <ScrollView style={styles.songsList} showsVerticalScrollIndicator={false}>
        {songs.map((song, index) => (
          <TouchableOpacity
            key={song.id}
            style={styles.songItem}
            onPress={() => handleSongPress(song)}
          >
            <View style={styles.songInfo}>
              <Text style={styles.songNumber}>{index + 1}</Text>
              <Image 
                source={{ 
                  uri: song.albumArt || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=48&h=48&fit=crop'
                }} 
                style={styles.songArt}
                resizeMode="cover"
                onError={() => console.log('Failed to load song art:', song.name)}
              />
              <View style={styles.songDetails}>
                <Text style={styles.songName} numberOfLines={1}>
                  {song.name}
                </Text>
                <Text style={styles.songArtist} numberOfLines={1}>
                  {song.artist} • {song.album}
                </Text>
              </View>
            </View>
            
            <View style={styles.songActions}>
              <Text style={styles.songDuration}>{song.duration}</Text>
              <TouchableOpacity style={styles.likeButton}>
                <Ionicons name="heart-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070031',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#070031',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#999',
    fontSize: 16,
    marginBottom: 8,
  },
  songCount: {
    color: '#00CAFE',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00CAFE',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    justifyContent: 'center',
  },
  playAllText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  shuffleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 202, 254, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  songsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  songInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  songNumber: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
    width: 30,
    textAlign: 'center',
  },
  songArt: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 16,
  },
  songDetails: {
    flex: 1,
  },
  songName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  songArtist: {
    color: '#999',
    fontSize: 14,
  },
  songActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  songDuration: {
    color: '#999',
    fontSize: 14,
  },
  likeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
