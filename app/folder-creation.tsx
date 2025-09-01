import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function FolderCreationScreen() {
  const [folderName, setFolderName] = useState('');

  const handleNext = async () => {
    try {
      if (folderName.trim()) {
        await AsyncStorage.setItem('userFolder', folderName.trim());
      }
      
      // Mark as not first time user anymore
      await AsyncStorage.setItem('isFirstTimeUser', 'false');
      
      // Navigate to home tabs
      router.replace('/(tabs)' as any);
    } catch (error) {
      console.error('Error saving folder:', error);
      router.replace('/(tabs)' as any);
    }
  };

  const handleSkip = async () => {
    try {
      // Mark as not first time user anymore
      await AsyncStorage.setItem('isFirstTimeUser', 'false');
      router.replace('/(tabs)' as any);
    } catch (error) {
      console.error('Error skipping:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Create Folder</Text>
          <Text style={styles.subtitle}>Organize your playlists</Text>
        </View>

        {/* Folder Input */}
        <View style={styles.inputSection}>
          <View style={styles.folderPreview}>
            <Ionicons name="folder" size={60} color="#00CAFE" />
            <Text style={styles.folderLabel}>
              {folderName || 'My Music Folder'}
            </Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Enter folder name"
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={folderName}
            onChangeText={setFolderName}
            maxLength={50}
          />

          <Text style={styles.description}>
            Create a folder to keep your mood-based playlists organized. You can always create more folders later.
          </Text>
        </View>

        {/* Suggested Names */}
        <View style={styles.suggestionsSection}>
          <Text style={styles.suggestionsTitle}>Suggestions</Text>
          <View style={styles.suggestionsList}>
            {['My Moods', 'Daily Vibes', 'Mood Mix', 'Feelings'].map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionChip}
                onPress={() => setFolderName(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Next Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {folderName.trim() ? 'Create & Continue' : 'Skip for Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070031',
  },
  scrollView: {
    flex: 1,
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
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  folderPreview: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },
  folderLabel: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  suggestionsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  suggestionChip: {
    backgroundColor: 'rgba(0, 202, 254, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 202, 254, 0.3)',
  },
  suggestionText: {
    color: '#00CAFE',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  nextButton: {
    backgroundColor: '#00CAFE',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#00CAFE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});