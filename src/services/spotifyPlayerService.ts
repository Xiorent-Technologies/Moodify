import { SpotifyAuthService } from './spotifyAuth';

interface PlaybackState {
  isPlaying: boolean;
  currentTrack: any;
  progress: number;
  duration: number;
  isShuffled: boolean;
  repeatMode: 'off' | 'track' | 'playlist';
}

class SpotifyPlayerService {
  private static instance: SpotifyPlayerService;
  private playbackState: PlaybackState = {
    isPlaying: false,
    currentTrack: null,
    progress: 0,
    duration: 0,
    isShuffled: false,
    repeatMode: 'off'
  };

  private progressInterval: any = null;
  private listeners: ((state: PlaybackState) => void)[] = [];

  static getInstance(): SpotifyPlayerService {
    if (!SpotifyPlayerService.instance) {
      SpotifyPlayerService.instance = new SpotifyPlayerService();
    }
    return SpotifyPlayerService.instance;
  }

  // Add listener for playback state changes
  addListener(callback: (state: PlaybackState) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners of state changes
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.playbackState));
  }

  // Start playback of a track
  async playTrack(trackUri: string) {
    try {
      let accessToken = await SpotifyAuthService.getAccessToken();
      
      // Try to play the track
      let response = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [trackUri]
        }),
      });

      // If we get 401, try to refresh token and retry
      if (response.status === 401) {
        console.log('🔄 Token expired, refreshing...');
        await SpotifyAuthService.refreshAccessToken();
        accessToken = await SpotifyAuthService.getAccessToken();
        
        response = await fetch('https://api.spotify.com/v1/me/player/play', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: [trackUri]
          }),
        });
      }

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Playback control not allowed. Make sure you have Spotify Premium and the app is running.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      this.playbackState.isPlaying = true;
      this.playbackState.currentTrack = { uri: trackUri };
      this.startProgressTracking();
      
      console.log('✅ Track started playing:', trackUri);
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('❌ Error playing track:', error);
      throw error;
    }
  }

  // Pause playback
  async pausePlayback() {
    try {
      const accessToken = await SpotifyAuthService.getAccessToken();
      
      const response = await fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      this.playbackState.isPlaying = false;
      this.stopProgressTracking();
      
      console.log('✅ Playback paused');
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('❌ Error pausing playback:', error);
      throw error;
    }
  }

  // Resume playback
  async resumePlayback() {
    try {
      const accessToken = await SpotifyAuthService.getAccessToken();
      
      const response = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      this.playbackState.isPlaying = true;
      this.startProgressTracking();
      
      console.log('✅ Playback resumed');
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('❌ Error resuming playback:', error);
      throw error;
    }
  }

  // Skip to next track
  async nextTrack() {
    try {
      const accessToken = await SpotifyAuthService.getAccessToken();
      
      const response = await fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Reset progress for new track
      this.playbackState.progress = 0;
      this.playbackState.isPlaying = true;
      this.startProgressTracking();
      
      console.log('✅ Skipped to next track');
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('❌ Error skipping to next track:', error);
      throw error;
    }
  }

  // Skip to previous track
  async previousTrack() {
    try {
      const accessToken = await SpotifyAuthService.getAccessToken();
      
      const response = await fetch('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Reset progress for new track
      this.playbackState.progress = 0;
      this.playbackState.isPlaying = true;
      this.startProgressTracking();
      
      console.log('✅ Skipped to previous track');
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('❌ Error skipping to previous track:', error);
      throw error;
    }
  }

  // Seek to position in track
  async seekToPosition(positionMs: number) {
    try {
      const accessToken = await SpotifyAuthService.getAccessToken();
      
      const response = await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local progress
      this.playbackState.progress = (positionMs / (this.playbackState.duration * 1000)) * 100;
      
      console.log('✅ Seeked to position:', positionMs);
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('❌ Error seeking to position:', error);
      throw error;
    }
  }

  // Toggle shuffle
  async toggleShuffle() {
    try {
      const accessToken = await SpotifyAuthService.getAccessToken();
      const newShuffleState = !this.playbackState.isShuffled;
      
      const response = await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${newShuffleState}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      this.playbackState.isShuffled = newShuffleState;
      
      console.log('✅ Shuffle toggled:', newShuffleState);
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('❌ Error toggling shuffle:', error);
      throw error;
    }
  }

  // Set repeat mode
  async setRepeatMode(mode: 'off' | 'track' | 'playlist') {
    try {
      const accessToken = await SpotifyAuthService.getAccessToken();
      
      const response = await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${mode}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      this.playbackState.repeatMode = mode;
      
      console.log('✅ Repeat mode set to:', mode);
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('❌ Error setting repeat mode:', error);
      throw error;
    }
  }

  // Get current playback state
  async getCurrentPlayback() {
    try {
      const accessToken = await SpotifyAuthService.getAccessToken();
      console.log('🔑 Using access token:', accessToken.substring(0, 20) + '...');
      
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('🔄 Token expired, trying to refresh...');
          try {
            await SpotifyAuthService.refreshAccessToken();
            const newAccessToken = await SpotifyAuthService.getAccessToken();
            
            const retryResponse = await fetch('https://api.spotify.com/v1/me/player', {
              headers: {
                'Authorization': `Bearer ${newAccessToken}`,
              },
            });
            
            if (!retryResponse.ok) {
              throw new Error(`HTTP error! status: ${retryResponse.status}`);
            }
            
            const retryData = await retryResponse.text();
            console.log('📡 Retry response text:', retryData);
            
            if (!retryData || retryData.trim() === '') {
              console.log('📡 Empty response, no active playback');
              return null;
            }
            
            const data = JSON.parse(retryData);
            this.updatePlaybackState(data);
            return data;
          } catch (refreshError) {
            console.error('❌ Error refreshing token:', refreshError);
            throw new Error('Authentication failed. Please log in again.');
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('📡 Response text:', responseText);
      
      if (!responseText || responseText.trim() === '') {
        console.log('📡 Empty response, no active playback');
        return null;
      }

      const data = JSON.parse(responseText);
      
      // Update local state with real data
      this.updatePlaybackState(data);
      
      console.log('✅ Current playback state retrieved');
      this.notifyListeners();
      return data;
    } catch (error) {
      console.error('❌ Error getting current playback:', error);
      
      // If it's a JSON parse error, return null instead of throwing
      if (error instanceof SyntaxError) {
        console.log('📡 JSON parse error, no active playback');
        return null;
      }
      
      throw error;
    }
  }

  // Helper method to update playback state
  private updatePlaybackState(data: any) {
    if (data && data.item) {
      this.playbackState.currentTrack = data.item;
      this.playbackState.isPlaying = data.is_playing || false;
      this.playbackState.progress = data.progress_ms ? (data.progress_ms / (data.item.duration_ms)) * 100 : 0;
      this.playbackState.duration = data.item.duration_ms / 1000;
      this.playbackState.isShuffled = data.shuffle_state || false;
      this.playbackState.repeatMode = data.repeat_state || 'off';
      
      // Start/stop progress tracking based on playback state
      if (this.playbackState.isPlaying) {
        this.startProgressTracking();
      } else {
        this.stopProgressTracking();
      }
    } else {
      // No active playback
      this.playbackState.currentTrack = null;
      this.playbackState.isPlaying = false;
      this.playbackState.progress = 0;
      this.playbackState.duration = 0;
      this.stopProgressTracking();
    }
  }

  // Start progress tracking
  private startProgressTracking() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    
    this.progressInterval = setInterval(() => {
      if (this.playbackState.isPlaying && this.playbackState.duration > 0) {
        this.playbackState.progress += (100 / this.playbackState.duration);
        
        if (this.playbackState.progress >= 100) {
          this.playbackState.progress = 0;
          this.playbackState.isPlaying = false;
          this.stopProgressTracking();
        }
        
        this.notifyListeners();
      }
    }, 1000);
  }

  // Stop progress tracking
  private stopProgressTracking() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  // Get current playback state
  getPlaybackState(): PlaybackState {
    return { ...this.playbackState };
  }

  // Cleanup
  cleanup() {
    this.stopProgressTracking();
    this.listeners = [];
  }
}

export default SpotifyPlayerService;
