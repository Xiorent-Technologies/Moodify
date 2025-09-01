import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { BackgroundDecorations, ThemedText } from '../src/components';

export default function PlaylistCreationScreen() {
  const [playlistName, setPlaylistName] = useState('');
  const [userMood, setUserMood] = useState('');
  const [userGenre, setUserGenre] = useState('');
  const [userTempo, setUserTempo] = useState('');

  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      const mood = await AsyncStorage.getItem('userMood');
      const genre = await AsyncStorage.getItem('userGenre');
      const tempo = await AsyncStorage.getItem('userTempo');
      
      if (mood) setUserMood(mood);
      if (genre) setUserGenre(genre);
      if (tempo) setUserTempo(tempo);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }

    try {
      // Save playlist info
      await AsyncStorage.setItem('firstPlaylistName', playlistName);
      await AsyncStorage.setItem('firstPlaylistCreated', 'true');
      
      // Navigate to folder creation
      router.push('/folder-creation');
    } catch (error) {
      console.error('Error creating playlist:', error);
      Alert.alert('Error', 'Failed to create playlist. Please try again.');
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('firstPlaylistCreated', 'true');
      router.push('/folder-creation');
    } catch (error) {
      console.error('Error skipping:', error);
    }
  };

  return (
    <View style={styles.container}>
      <BackgroundDecorations />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <ThemedText style={styles.skipText}>Skip</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleSection}>
          <ThemedText style={styles.title}>Create Your First Playlist</ThemedText>
          <ThemedText style={styles.subtitle}>
            Based on your mood: {userMood}
          </ThemedText>
        </View>

        {/* Playlist Name Input */}
        <View style={styles.inputSection}>
          <ThemedText style={styles.inputLabel}>What should we call your playlist?</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="e.g., My Happy Vibes, Chill Evening, Workout Energy..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={playlistName}
            onChangeText={setPlaylistName}
          />
        </View>

        {/* Preferences Summary */}
        <View style={styles.preferencesSection}>
          <ThemedText style={styles.preferencesTitle}>Your Preferences:</ThemedText>
          
          <View style={styles.preferenceItem}>
            <Ionicons name="heart" size={20} color="#00CAFE" />
            <ThemedText style={styles.preferenceText}>Mood: {userMood}</ThemedText>
          </View>
          
          <View style={styles.preferenceItem}>
            <Ionicons name="musical-notes" size={20} color="#00CAFE" />
            <ThemedText style={styles.preferenceText}>Genre: {userGenre}</ThemedText>
          </View>
          
          <View style={styles.preferenceItem}>
            <Ionicons name="speedometer" size={20} color="#00CAFE" />
            <ThemedText style={styles.preferenceText}>Tempo: {userTempo}</ThemedText>
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity 
          style={[styles.createButton, !playlistName.trim() && styles.createButtonDisabled]} 
          onPress={handleCreatePlaylist}
          disabled={!playlistName.trim()}
        >
          <ThemedText style={styles.createButtonText}>Create Playlist</ThemedText>
        </TouchableOpacity>
      </ScrollView>
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
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#00CAFE',
    textAlign: 'center',
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 202, 254, 0.3)',
    minHeight: 60,
  },
  preferencesSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(0, 202, 254, 0.2)',
  },
  preferencesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  preferenceText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  createButton: {
    backgroundColor: '#00CAFE',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#00CAFE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  createButtonDisabled: {
    backgroundColor: 'rgba(0, 202, 254, 0.3)',
    shadowOpacity: 0.2,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
