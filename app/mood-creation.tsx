import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BackgroundDecorations, ThemedText } from '../src/components';
import { GeminiService } from '../src/services/geminiService';
import { SpotifyApiService } from '../src/services/spotifyApi';

const { width } = Dimensions.get('window');

export default function MoodCreationScreen() {
  const [selectedMood, setSelectedMood] = useState('');
  const [customMood, setCustomMood] = useState('');
  const [moodDescription, setMoodDescription] = useState('');
  const [showHappinessMeter, setShowHappinessMeter] = useState(false);
  const [happinessLevel, setHappinessLevel] = useState(5); // 1-10 scale
  const [isFromOnboarding, setIsFromOnboarding] = useState(false);

  // Check if user is coming from onboarding
  React.useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const isFirstTimeUser = await AsyncStorage.getItem('isFirstTimeUser');
        setIsFromOnboarding(isFirstTimeUser === 'true');
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setIsFromOnboarding(false);
      }
    };
    
    checkOnboardingStatus();
  }, []);

  const moodOptions = [
    { id: 'happy', label: 'Happy', image: require('../assets/images/mood_creation/happy.jpg') },
    { id: 'soulful', label: 'Soulful', image: require('../assets/images/mood_creation/soulFul.jpg') },
    { id: 'sassy', label: 'Sassy', image: require('../assets/images/mood_creation/sassy.jpg') },
    { id: 'vibes', label: 'Vibes', image: require('../assets/images/mood_creation/vibes.jpg') },
    { id: 'inspiring', label: 'Inspiring', image: require('../assets/images/mood_creation/inspiring.jpg') },
    { id: 'melancholy', label: 'Melancholy', image: require('../assets/images/mood_creation/melancholy.jpg') },
    { id: 'sad', label: 'sad', image: require('../assets/images/mood_creation/sad.jpg') },
    { id: 'custom', label: 'Choose your mood', image: require('../assets/images/mood_creation/chooseYourMood.jpg') },
  ];

  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId);
    
    // Show happiness meter popup immediately when a mood card is clicked
    if (moodId !== 'custom') {
      setShowHappinessMeter(true);
    }
  };

  const handleNext = async () => {
    // Check if user has either selected a mood card OR entered custom text
    if (!selectedMood && !customMood.trim()) {
      // Show error message - user must select or enter something
      Alert.alert(
        'Select Your Mood',
        'Please either select a mood from the cards above or write your mood in the text field below.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // Show happiness meter popup
    setShowHappinessMeter(true);
  };

  const [isGeneratingPlaylist, setIsGeneratingPlaylist] = useState(false);
  const [showPlaylistGeneration, setShowPlaylistGeneration] = useState(false);

  const handleHappinessMeterSubmit = async () => {
    try {
      // Save user mood preference, description, and happiness level
      const finalMood = selectedMood === 'custom' ? customMood : selectedMood;
      await AsyncStorage.setItem('userMood', finalMood);
      await AsyncStorage.setItem('userMoodDescription', moodDescription);
      await AsyncStorage.setItem('userHappinessLevel', happinessLevel.toString());
      
      // Close happiness meter and show playlist generation
      setShowHappinessMeter(false);
      setShowPlaylistGeneration(true);
      
      // Generate AI playlist
      await generateAIPlaylist(finalMood, happinessLevel);
    } catch (error) {
      console.error('Error saving mood:', error);
      Alert.alert('Error', 'Failed to save mood. Please try again.');
    }
  };

  const generateAIPlaylist = async (mood: string, happinessLevel: number) => {
    try {
      setIsGeneratingPlaylist(true);

      // Step 1: Get AI mood analysis and musical parameters
      const moodAnalysis = await GeminiService.analyzeMood(mood);
      console.log('🧠 Mood analysis result:', JSON.stringify(moodAnalysis, null, 2));
      
      // Step 2: Convert mood analysis to music parameters
      const musicParams = {
        energy: moodAnalysis.energy,
        valence: moodAnalysis.valence,
        tempo: moodAnalysis.tempo === 'slow' ? 80 : moodAnalysis.tempo === 'medium' ? 120 : 160,
        danceability: moodAnalysis.energy * 0.8,
        acousticness: moodAnalysis.tempo === 'slow' ? 0.7 : 0.3,
        instrumentalness: 0.2,
        recommended_genres: moodAnalysis.genres,
        limit: 20
      };
      
      // Step 3: Search for tracks based on AI parameters
      const searchResponse = await SpotifyApiService.searchTracksByMood(musicParams);
      console.log('🔍 Search response:', JSON.stringify(searchResponse, null, 2));
      
      // Extract tracks from the response
      const tracks = searchResponse?.tracks?.items || searchResponse?.items || [];
      console.log('🎵 Found tracks:', tracks.length);
      
      if (tracks && tracks.length > 0) {
        // Step 4: Get user profile for playlist creation
        const userProfile = await SpotifyApiService.getUserProfile();
        const userId = userProfile.id;
        
        // Step 5: Create playlist on Spotify
        const playlistName = `${mood.charAt(0).toUpperCase() + mood.slice(1)} Mood Mix`;
        const playlistDescription = `AI-generated playlist based on your ${mood} mood (Happiness Level: ${happinessLevel}/10)`;
        
        const playlist = await SpotifyApiService.createPlaylist(userId, playlistName, playlistDescription);
        
        if (playlist?.id) {
          // Step 6: Add tracks to playlist
          const trackUris = tracks.slice(0, 20).map((track: any) => track.uri);
          await SpotifyApiService.addTracksToPlaylist(playlist.id, trackUris);
          
          // Step 7: Save playlist info locally for library display
          const playlistInfo = {
            id: playlist.id,
            name: playlistName,
            description: playlistDescription,
            trackCount: trackUris.length,
            mood: mood,
            happinessLevel: happinessLevel,
            createdAt: new Date().toISOString()
          };
          
          await AsyncStorage.setItem('lastGeneratedPlaylist', JSON.stringify(playlistInfo));
          
          // Step 8: Redirect to library with success message
          setTimeout(() => {
            setShowPlaylistGeneration(false);
            router.replace('/(tabs)/library?tab=mood-playlist');
          }, 2000);
        }
      } else {
        throw new Error('No tracks found for the given mood');
      }
    } catch (error) {
      console.error('Error generating playlist:', error);
      Alert.alert(
        'Playlist Generation Failed',
        'We couldn\'t create your playlist. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
      setShowPlaylistGeneration(false);
    } finally {
      setIsGeneratingPlaylist(false);
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



  const getHappinessEmoji = (level: number) => {
    if (level <= 2) return '😢';
    if (level <= 4) return '😐';
    if (level <= 6) return '🙂';
    if (level <= 8) return '😊';
    return '😄⭐';
  };

  const getHappinessColor = (level: number) => {
    if (level <= 2) return '#FF6B6B'; // Red
    if (level <= 4) return '#FFA500'; // Orange
    if (level <= 6) return '#FFD700'; // Yellow
    if (level <= 8) return '#90EE90'; // Light Green
    return '#00FF00'; // Green
  };

  const getHappinessMoodText = (level: number) => {
    if (level <= 2) return 'Feeling down?';
    if (level <= 4) return 'Just okay.';
    if (level <= 6) return 'Feeling good!';
    if (level <= 8) return 'Absolutely amazing!';
    return 'Absolutely amazing!';
  };

  return (
    <View style={styles.container}>
      <BackgroundDecorations />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        {isFromOnboarding && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <ThemedText style={styles.skipText}>Skip</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <ThemedText style={styles.title}>Mood</ThemedText>
        </View>

        {/* Mood Grid */}
        <View style={styles.moodGrid}>
          {moodOptions.map((mood) => (
            <TouchableOpacity
              key={mood.id}
              style={[
                styles.moodCard,
                selectedMood === mood.id && styles.moodCardSelected
              ]}
              onPress={() => handleMoodSelect(mood.id)}
            >
              <Image
                source={mood.image}
                style={styles.moodImage}
                contentFit="cover"
              />
              <View style={styles.moodOverlay}>
                <ThemedText style={styles.moodLabel}>{mood.label}</ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Mood Input */}
        <View style={styles.customMoodSection}>
          <TextInput
            style={styles.customMoodInput}
            placeholder="Write it down if you cant find your mood in the above list"
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={customMood}
            onChangeText={setCustomMood}
            multiline
          />
        </View>

        {/* Next Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.nextButton, (!selectedMood && !customMood.trim()) && styles.nextButtonDisabled]} 
            onPress={handleNext}
            disabled={!selectedMood && !customMood.trim()}
          >
            <ThemedText style={styles.nextButtonText}>Next</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Happiness Meter Modal */}
      <Modal
        visible={showHappinessMeter}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowHappinessMeter(false)}
      >

      {/* Playlist Generation Modal */}
      <Modal
        visible={showPlaylistGeneration}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPlaylistGeneration(false)}
      >
        <View style={styles.generationModalOverlay}>
          <View style={styles.generationModalContent}>
            {/* Custom Loading Image */}
            <Image
              source={require('../assets/images/creating.png')}
              style={styles.loadingImage}
              contentFit="contain"
            />
            
            <ThemedText style={styles.generatingText}>
              {isGeneratingPlaylist ? 'Generating your playlist...' : 'Playlist created successfully!'}
            </ThemedText>
            
            {isGeneratingPlaylist && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00CAFE" />
              </View>
            )}
          </View>
        </View>
      </Modal>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Happiness Meter</ThemedText>
              <TouchableOpacity 
                onPress={() => setShowHappinessMeter(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Happiness Gauge */}
            <View style={styles.happinessGaugeContainer}>
              <View style={styles.happinessGauge}>
                {/* Semi-circular gauge background */}
                <View style={styles.gaugeBackground} />
                
                {/* Semi-circular gauge fill */}
                <View 
                  style={[
                    styles.gaugeFill,
                    { 
                      width: `${(happinessLevel / 10) * 100}%`,
                      backgroundColor: getHappinessColor(happinessLevel)
                    }
                  ]} 
                />
                
                {/* Happiness emoji indicator with enhanced styling */}
                <View style={styles.happinessEmoji}>
                  <View style={[
                    styles.emojiContainer,
                    { 
                      backgroundColor: getHappinessColor(happinessLevel),
                      borderColor: getHappinessColor(happinessLevel)
                    }
                  ]}>
                    <Text style={styles.emojiText}>{getHappinessEmoji(happinessLevel)}</Text>
                  </View>
                </View>
              </View>
              
              {/* Happiness level text with enhanced styling */}
              <View style={styles.happinessLevelContainer}>
                <ThemedText style={styles.happinessLevelText}>
                  Level {happinessLevel}/10
                </ThemedText>
                <ThemedText style={styles.happinessMoodText}>
                  {getHappinessMoodText(happinessLevel)}
                </ThemedText>
              </View>
            </View>

            {/* Slider */}
            <View style={styles.sliderContainer}>
              <ThemedText style={styles.sliderLabel}>Adjust your happiness level:</ThemedText>
              <View style={styles.sliderTrack}>
                <TouchableOpacity
                  style={styles.sliderThumb}
                  onPress={() => setHappinessLevel(Math.max(1, happinessLevel - 1))}
                >
                  <Ionicons name="remove" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                

                
                <TouchableOpacity
                  style={styles.sliderThumb}
                  onPress={() => setHappinessLevel(Math.min(10, happinessLevel + 1))}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleHappinessMeterSubmit}
            >
              <ThemedText style={styles.submitButtonText}>Create Playlist</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070031',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  moodCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  moodCardSelected: {
    borderColor: '#00CAFE',
    borderWidth: 2,
    shadowColor: '#00CAFE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  moodImage: {
    width: '100%',
    height: '100%',
  },
  moodOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    alignItems: 'center',
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  customMoodSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  customMoodInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 5,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 202, 254, 0.3)',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  moodDescriptionSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  descriptionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  moodDescriptionInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 202, 254, 0.3)',
    minHeight: 100,
    textAlignVertical: 'top',
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
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(0, 202, 254, 0.3)',
    shadowOpacity: 0.2,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#070031',
    borderRadius: 20,
    padding: 30,
    width: width * 0.8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
  },
  happinessGaugeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  happinessGauge: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 10,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gaugeBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 100,
    borderWidth: 10,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gaugeFill: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 100,
    borderWidth: 10,
    borderColor: 'transparent',
  },
  happinessEmoji: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emojiText: {
    fontSize: 60,
    color: '#FFFFFF',
  },
  happinessLevelContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  happinessLevelText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  happinessMoodText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
    textAlign: 'center',
  },
  sliderContainer: {
    width: '100%',
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  sliderTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 10,
  },
  sliderThumb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00CAFE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  submitButton: {
    backgroundColor: '#00CAFE',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#00CAFE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  musicVisualization: {
    alignItems: 'center',
    marginVertical: 20,
  },
  speakerContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerCone: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00CAFE',
    borderWidth: 2,
    borderColor: '#000000',
  },
  speakerRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  speakerOuterRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: '#00CAFE',
    borderStyle: 'dotted',
  },
  musicalNotes: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  note: {
    position: 'absolute',
    fontSize: 24,
    color: '#00CAFE',
    textShadowColor: '#00CAFE',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  generatingText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '600',
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  generationModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  generationModalContent: {
    backgroundColor: '#070031',
    borderRadius: 20,
    padding: 30,
    width: width * 0.9,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 15,
  },
  loadingImage: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
});
