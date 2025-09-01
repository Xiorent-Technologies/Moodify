import { SpotifyAuthService } from './spotifyAuth';

export class SpotifyApiService {
  static async makeRequest(endpoint: string, options: RequestInit = {}) {
    try {
      const accessToken = await SpotifyAuthService.getAccessToken();
      
      if (!accessToken) {
        throw new Error('No access token available');
      }

      console.log('🔑 Using access token:', accessToken.substring(0, 20) + '...');
      console.log('🌐 Making request to:', `https://api.spotify.com/v1${endpoint}`);

      // Make real API call to Spotify
      const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Spotify API error:', response.status, errorText);
        console.error('Request URL:', `https://api.spotify.com/v1${endpoint}`);
        console.error('Request headers:', options.headers);
        console.error('Response headers:', response.headers);
        
        if (response.status === 403) {
          throw new Error(`Spotify API 403: Check if user is registered in Spotify Dashboard. Error: ${errorText}`);
        }
        
        throw new Error(`Spotify API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Spotify API request error:', error);
      throw error;
    }
  }



  // Get user profile
  static async getUserProfile() {
    return this.makeRequest('/me');
  }

  // Get user's top tracks
  static async getTopTracks(limit = 20, timeRange = 'short_term') {
    return this.makeRequest(`/me/top/tracks?limit=${limit}&time_range=${timeRange}`);
  }

  // Get user's top artists
  static async getTopArtists(limit = 20, timeRange = 'short_term') {
    return this.makeRequest(`/me/top/artists?limit=${limit}&time_range=${timeRange}`);
  }

  // Get user's recently played tracks
  static async getRecentlyPlayed(limit = 50) {
    return this.makeRequest(`/me/player/recently-played?limit=${limit}`);
  }

  // Get user's saved tracks (liked songs)
  static async getSavedTracks(limit = 50, offset = 0) {
    return this.makeRequest(`/me/tracks?limit=${limit}&offset=${offset}`);
  }

  // Search for tracks
  static async searchTracks(query: string, limit = 20) {
    return this.makeRequest(`/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`);
  }

  // Search for tracks with mood parameters
  static async searchTracksByMood(moodParams: {
    energy?: number;      // 0.0 to 1.0
    valence?: number;     // 0.0 to 1.0 (sad to happy)
    tempo?: number;       // BPM
    danceability?: number; // 0.0 to 1.0
    acousticness?: number; // 0.0 to 1.0
    instrumentalness?: number; // 0.0 to 1.0
    recommended_genres?: string[];
    limit?: number;
  }) {
    const { energy = 0.5, valence = 0.5, tempo = 120, danceability = 0.5, acousticness = 0.5, instrumentalness = 0.5, recommended_genres, limit = 20 } = moodParams;
    
    // Build a more effective search query with popular artists and genres
    let searchQuery = '';
    
    // Use genre-based search (most reliable)
    if (recommended_genres && recommended_genres.length > 0) {
      // Take first 2 genres and add popular artists for better results
      const primaryGenres = recommended_genres.slice(0, 2);
      searchQuery += primaryGenres.join(' ');
      
      // Add popular artists for the genre to ensure results
      if (primaryGenres.includes('pop')) searchQuery += ' taylor swift ed sheeran ';
      if (primaryGenres.includes('rock')) searchQuery += ' coldplay imagine dragons ';
      if (primaryGenres.includes('hip hop') || primaryGenres.includes('rap')) searchQuery += ' drake post malone ';
      if (primaryGenres.includes('electronic') || primaryGenres.includes('edm')) searchQuery += ' the chainsmokers calvin harris ';
      if (primaryGenres.includes('r&b') || primaryGenres.includes('soul')) searchQuery += ' bruno mars the weeknd ';
      if (primaryGenres.includes('indie')) searchQuery += ' lorde billie eilish ';
      if (primaryGenres.includes('country')) searchQuery += ' taylor swift luke combs ';
      if (primaryGenres.includes('jazz')) searchQuery += ' norah jones michael bublé ';
      if (primaryGenres.includes('classical')) searchQuery += ' ludovico einaudi yiruma ';
    } else {
      // Fallback to popular music with mood keywords
      searchQuery += ' popular music ';
      if (valence > 0.7) searchQuery += ' happy upbeat positive ';
      if (energy > 0.7) searchQuery += ' energetic high-energy ';
      if (tempo > 120) searchQuery += ' fast fast-paced ';
      if (danceability > 0.7) searchQuery += ' dance danceable ';
      if (acousticness > 0.7) searchQuery += ' acoustic unplugged ';
      if (instrumentalness > 0.7) searchQuery += ' instrumental ';
    }
    
    // Add popular artists to ensure results
    searchQuery += ' taylor swift ed sheeran coldplay drake ';
    
    // Clean up and search
    const cleanQuery = searchQuery.trim().replace(/\s+/g, ' ');
    console.log('🔍 Using enhanced search query:', cleanQuery);
    
    try {
      const response = await this.makeRequest(`/search?q=${encodeURIComponent(cleanQuery)}&type=track&limit=${limit}`);
      
      // If no results, try a simpler search
      if (!response.tracks || response.tracks.items.length === 0) {
        console.log('⚠️ No results with enhanced query, trying simpler search...');
        const simpleQuery = 'popular music';
        return this.makeRequest(`/search?q=${encodeURIComponent(simpleQuery)}&type=track&limit=${limit}`);
      }
      
      return response;
    } catch (error) {
      console.log('⚠️ Enhanced search failed, trying fallback...');
      // Final fallback to popular music
      return this.makeRequest(`/search?q=popular%20music&type=track&limit=${limit}`);
    }
  }

  // Get track audio features
  static async getTrackFeatures(trackId: string) {
    return this.makeRequest(`/audio-features/${trackId}`);
  }

  // Get multiple tracks audio features
  static async getMultipleTrackFeatures(trackIds: string[]) {
    if (trackIds.length === 0) return [];
    if (trackIds.length === 1) {
      const features = await this.getTrackFeatures(trackIds[0]);
      return [features];
    }
    
    const idsParam = trackIds.join(',');
    return this.makeRequest(`/audio-features?ids=${idsParam}`);
  }

  // Get track analysis (detailed audio analysis)
  static async getTrackAnalysis(trackId: string) {
    return this.makeRequest(`/audio-analysis/${trackId}`);
  }

  // Create playlist
  static async createPlaylist(userId: string, name: string, description: string, isPublic = false) {
    const playlistData = {
      name,
      description,
      public: isPublic
    };

    const playlist = await this.makeRequest(`/users/${userId}/playlists`, {
      method: 'POST',
      body: JSON.stringify(playlistData)
    });

    return playlist;
  }

  // Add tracks to playlist
  static async addTracksToPlaylist(playlistId: string, trackUris: string[]) {
    return this.makeRequest(`/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ uris: trackUris })
    });
  }

  // Get user's playlists
  static async getUserPlaylists(limit = 50, offset = 0) {
    return this.makeRequest(`/me/playlists?limit=${limit}&offset=${offset}`);
  }

  // Get playlist tracks
  static async getPlaylistTracks(playlistId: string, limit = 100, offset = 0) {
    return this.makeRequest(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`);
  }

  // Update playlist details
  static async updatePlaylist(playlistId: string, updates: {
    name?: string;
    description?: string;
    public?: boolean;
  }) {
    return this.makeRequest(`/playlists/${playlistId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Delete tracks from playlist
  static async removeTracksFromPlaylist(playlistId: string, trackUris: string[]) {
    return this.makeRequest(`/playlists/${playlistId}/tracks`, {
      method: 'DELETE',
      body: JSON.stringify({ uris: trackUris }),
    });
  }

  // Get available genres
  static async getAvailableGenres() {
    return this.makeRequest('/recommendations/available-genre-seeds');
  }

  // Get track recommendations based on seeds
  static async getTrackRecommendations(seeds: {
    seedArtists?: string[];
    seedTracks?: string[];
    seedGenres?: string[];
    targetEnergy?: number;
    targetValence?: number;
    targetTempo?: number;
    targetDanceability?: number;
    limit?: number;
  }) {
    const { seedArtists, seedTracks, seedGenres, targetEnergy, targetValence, targetTempo, targetDanceability, limit = 20 } = seeds;
    
    let queryParams = `limit=${limit}`;
    
    if (seedArtists && seedArtists.length > 0) {
      queryParams += `&seed_artists=${seedArtists.slice(0, 5).join(',')}`;
    }
    if (seedTracks && seedTracks.length > 0) {
      queryParams += `&seed_tracks=${seedTracks.slice(0, 5).join(',')}`;
    }
    if (seedGenres && seedGenres.length > 0) {
      queryParams += `&seed_genres=${seedGenres.slice(0, 5).join(',')}`;
    }
    if (targetEnergy !== undefined) queryParams += `&target_energy=${targetEnergy}`;
    if (targetValence !== undefined) queryParams += `&target_valence=${targetValence}`;
    if (targetTempo !== undefined) queryParams += `&target_tempo=${targetTempo}`;
    if (targetDanceability !== undefined) queryParams += `&target_danceability=${targetDanceability}`;
    
    return this.makeRequest(`/recommendations?${queryParams}`);
  }

  // Get new releases
  static async getNewReleases(limit = 20, offset = 0) {
    return this.makeRequest(`/browse/new-releases?limit=${limit}&offset=${offset}`);
  }

  // Get featured playlists
  static async getFeaturedPlaylists(limit = 20, offset = 0) {
    return this.makeRequest(`/browse/featured-playlists?limit=${limit}&offset=${offset}`);
  }

  // Fallback search method for mood-based playlists
  static async searchTracksByMoodFallback(moodParams: {
    energy?: number;
    valence?: number;
    tempo?: number;
    recommended_genres?: string[];
    limit?: number;
  }) {
    const { energy = 0.5, valence = 0.5, tempo = 120, recommended_genres, limit = 20 } = moodParams;
    
    // Create a simple, effective search query
    let searchTerms: string[] = [];
    
    // Add genres
    if (recommended_genres && recommended_genres.length > 0) {
      searchTerms.push(...recommended_genres.slice(0, 2));
    }
    
    // Add mood keywords
    if (valence > 0.7) searchTerms.push('happy', 'upbeat', 'positive');
    if (valence < 0.3) searchTerms.push('sad', 'melancholic', 'emotional');
    if (energy > 0.7) searchTerms.push('energetic', 'high-energy', 'powerful');
    if (energy < 0.3) searchTerms.push('calm', 'relaxing', 'peaceful');
    if (tempo > 120) searchTerms.push('fast', 'upbeat', 'dance');
    if (tempo < 80) searchTerms.push('slow', 'chill', 'ambient');
    
    // Create search query
    const searchQuery = searchTerms.slice(0, 5).join(' ');
    console.log('🔍 Fallback search query:', searchQuery);
    
    return this.makeRequest(`/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=${limit}`);
  }

  // Playback Control Methods
  static async startPlayback(trackUris: string[]) {
    try {
      const accessToken = await SpotifyAuthService.getAccessToken();
      console.log('🔑 Using access token:', accessToken.substring(0, 20) + '...');
      
      const response = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: trackUris
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ Playback started successfully');
      return true;
    } catch (error) {
      console.error('❌ Error starting playback:', error);
      throw error;
    }
  }

  static async pausePlayback() {
    try {
      const accessToken = await SpotifyAuthService.getAccessToken();
      console.log('🔑 Using access token:', accessToken.substring(0, 20) + '...');
      
      const response = await fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ Playback paused successfully');
      return true;
    } catch (error) {
      console.error('❌ Error pausing playback:', error);
      throw error;
    }
  }

  static async skipToNext() {
    try {
      const accessToken = await SpotifyAuthService.getAccessToken();
      console.log('🔑 Using access token:', accessToken.substring(0, 20) + '...');
      
      const response = await fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ Skipped to next track');
      return true;
    } catch (error) {
      console.error('❌ Error skipping to next track:', error);
      throw error;
    }
  }

  static async skipToPrevious() {
    try {
      const accessToken = await SpotifyAuthService.getAccessToken();
      console.log('🔑 Using access token:', accessToken.substring(0, 20) + '...');
      
      const response = await fetch('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ Skipped to previous track');
      return true;
    } catch (error) {
      console.error('❌ Error skipping to previous track:', error);
      throw error;
    }
  }

  static async seekToPosition(positionMs: number) {
    try {
      const accessToken = await SpotifyAuthService.getAccessToken();
      console.log('🔑 Using access token:', accessToken.substring(0, 20) + '...');
      
      const response = await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ Seeked to position:', positionMs);
      return true;
    } catch (error) {
      console.error('❌ Error seeking to position:', error);
      throw error;
    }
  }

  static async getCurrentPlayback() {
    try {
      const accessToken = await SpotifyAuthService.getAccessToken();
      console.log('🔑 Using access token:', accessToken.substring(0, 20) + '...');
      
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Current playback data retrieved');
      return data;
    } catch (error) {
      console.error('❌ Error getting current playback:', error);
      throw error;
    }
  }

  static async addToSavedTracks(trackIds: string[]) {
    try {
      const accessToken = await SpotifyAuthService.getAccessToken();
      console.log('🔑 Using access token:', accessToken.substring(0, 20) + '...');
      
      const response = await fetch('https://api.spotify.com/v1/me/tracks', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: trackIds
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ Track added to saved tracks');
      return true;
    } catch (error) {
      console.error('❌ Error adding track to saved tracks:', error);
      throw error;
    }
  }

  static async removeFromSavedTracks(trackIds: string[]) {
    try {
      const accessToken = await SpotifyAuthService.getAccessToken();
      console.log('🔑 Using access token:', accessToken.substring(0, 20) + '...');
      
      const response = await fetch('https://api.spotify.com/v1/me/tracks', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: trackIds
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ Track removed from saved tracks');
      return true;
    } catch (error) {
      console.error('❌ Error removing track from saved tracks:', error);
      throw error;
    }
  }

  // Test Spotify API connection
  static async testConnection() {
    try {
      const accessToken = await SpotifyAuthService.getAccessToken();
      console.log('🔑 Testing connection with token:', accessToken.substring(0, 20) + '...');
      
      // Test a simple API call
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Spotify connection test successful');
      
      return {
        success: true,
        message: `Connected successfully! User: ${data.display_name || 'Unknown'}`,
        user: data
      };
    } catch (error) {
      console.error('❌ Spotify connection test failed:', error);
      throw error;
    }
  }
}