import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { SPOTIFY_CONFIG } from '../config/spotify';

WebBrowser.maybeCompleteAuthSession();

// Helper function for base64 encoding (React Native compatible)
const base64Encode = (str: string): string => {
  return btoa(str);
};

export class SpotifyAuthService {
    static async authenticate(retryCount = 0): Promise<any> {
    try {
      console.log(`Starting Spotify authentication... (attempt ${retryCount + 1})`);

      // Check if we already have an auth code from deep link
      const existingAuthCode = await AsyncStorage.getItem('spotifyAuthCode');
      const existingState = await AsyncStorage.getItem('spotifyAuthState');
      
      if (existingAuthCode && existingState) {
        console.log('✅ Found existing auth code from deep link, using it directly');
        
        // Clear the stored auth code
        await AsyncStorage.multiRemove(['spotifyAuthCode', 'spotifyAuthState']);
        
        // Exchange the code for tokens
        const tokens = await this.exchangeCodeForTokens(existingAuthCode);
        
        // Save tokens to AsyncStorage
        await AsyncStorage.setItem('spotifyAccessToken', tokens.access_token);
        await AsyncStorage.setItem('spotifyRefreshToken', tokens.refresh_token);
        await AsyncStorage.setItem('spotifyTokenExpiry', (Date.now() + (tokens.expires_in * 1000)).toString());
        
        console.log('✅ Tokens obtained from stored auth code');
        return tokens;
      }

      // Generate a random state parameter for security
      const state = Math.random().toString(36).substring(7);

      // Build the authorization URL with the custom scheme
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CONFIG.CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(SPOTIFY_CONFIG.REDIRECT_URI)}&scope=${encodeURIComponent(SPOTIFY_CONFIG.SCOPES)}&state=${state}&show_dialog=true`;

      console.log('Opening Spotify OAuth URL:', authUrl);

      // Open the OAuth URL in a web browser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        SPOTIFY_CONFIG.REDIRECT_URI
      );
      
            console.log('WebBrowser result:', result);
      console.log('Result type:', result.type);

      if (result.type === 'success') {
        console.log('✅ OAuth completed successfully');
        
        // The deep link handler should have captured the auth code
        // Let's check if we have it and proceed with token exchange
        
        console.log('🔍 Checking for stored auth code...');
        
        // Check if we received the auth code via deep link
        const authCode = await AsyncStorage.getItem('spotifyAuthCode');
        const authState = await AsyncStorage.getItem('spotifyAuthState');
        
        console.log('📱 Stored auth code:', authCode ? 'Found' : 'Not found');
        console.log('📱 Stored auth state:', authState ? 'Found' : 'Not found');
        
        if (authCode && authState) {
          console.log('✅ Auth code received via deep link, exchanging for tokens...');
          
          // Clear the stored auth code
          await AsyncStorage.multiRemove(['spotifyAuthCode', 'spotifyAuthState']);
          
          // Exchange the code for tokens
          const tokens = await this.exchangeCodeForTokens(authCode);
          
          // Save tokens to AsyncStorage
          await AsyncStorage.setItem('spotifyAccessToken', tokens.access_token);
          await AsyncStorage.setItem('spotifyRefreshToken', tokens.refresh_token);
          await AsyncStorage.setItem('spotifyTokenExpiry', (Date.now() + (tokens.expires_in * 1000)).toString());
          
          console.log('✅ Tokens obtained successfully');
          return tokens;
        } else {
          throw new Error('OAuth completed but no auth code received. The deep link may not have been captured. Please try again.');
        }
      } else if (result.type === 'cancel') {
        console.log('Authentication cancelled by user');
        throw new Error('Authentication cancelled by user');
      } else {
        console.log('Authentication failed, result type:', result.type);
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Spotify authentication error:', error);
      
      // Retry logic for certain errors
      if (retryCount < 2 && (
        error instanceof Error && (
          error.message.includes('timeout') ||
          error.message.includes('Authentication failed') ||
          error.message.includes('OAuth')
        )
      )) {
        console.log(`Retrying authentication... (${retryCount + 1}/2)`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        return this.authenticate(retryCount + 1);
      }
      
      throw error;
    }
  }

  static async exchangeCodeForTokens(code: string) {
    try {
      console.log('Exchanging authorization code for tokens...');
      
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${base64Encode(`${SPOTIFY_CONFIG.CLIENT_ID}:${SPOTIFY_CONFIG.CLIENT_SECRET}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
        }).toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange failed:', response.status, errorText);
        throw new Error(`Failed to exchange code for tokens: ${response.status}`);
      }

      const tokens = await response.json();
      console.log('Token exchange successful');
      return tokens;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  static async getAccessToken() {
    try {
      const token = await AsyncStorage.getItem('spotifyAccessToken');
      const expiry = await AsyncStorage.getItem('spotifyTokenExpiry');
      
      if (!token || !expiry) {
        return null;
      }

      // Check if token is expired
      const expiryTime = parseInt(expiry);
      if (Date.now() >= expiryTime) {
        console.log('Access token expired, refreshing...');
        return await this.refreshAccessToken();
      }

      return token;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  static async refreshAccessToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('spotifyRefreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('Refreshing access token...');
      
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${base64Encode(`${SPOTIFY_CONFIG.CLIENT_ID}:${SPOTIFY_CONFIG.CLIENT_SECRET}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }).toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token refresh failed:', response.status, errorText);
        throw new Error(`Failed to refresh token: ${response.status}`);
      }

      const tokens = await response.json();
      
      // Save new access token and expiry
      await AsyncStorage.setItem('spotifyAccessToken', tokens.access_token);
      if (tokens.refresh_token) {
        await AsyncStorage.setItem('spotifyRefreshToken', tokens.refresh_token);
      }
      await AsyncStorage.setItem('spotifyTokenExpiry', (Date.now() + (tokens.expires_in * 1000)).toString());
      
      console.log('Access token refreshed successfully');
      return tokens.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, clear tokens and force re-authentication
      await this.logout();
      throw error;
    }
  }

  static async getUserProfile() {
    try {
      const accessToken = await this.getAccessToken();
      
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get user profile: ${response.status}`);
      }

      const profile = await response.json();
      console.log('User profile fetched:', profile.display_name);
      
      // Save user info to AsyncStorage
      await AsyncStorage.setItem('spotifyUserId', profile.id);
      await AsyncStorage.setItem('spotifyUserEmail', profile.email);
      await AsyncStorage.setItem('spotifyDisplayName', profile.display_name);
      
      // Save profile image if available
      if (profile.images && profile.images.length > 0) {
        await AsyncStorage.setItem('spotifyProfileImage', profile.images[0].url);
      }
      
      return profile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  static async logout() {
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
      console.log('Spotify logout successful');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  static async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('spotifyAccessToken');
      const expiry = await AsyncStorage.getItem('spotifyTokenExpiry');
      
      if (!token || !expiry) {
        return false;
      }

      // Check if token is expired
      const expiryTime = parseInt(expiry);
      return Date.now() < expiryTime;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }
}