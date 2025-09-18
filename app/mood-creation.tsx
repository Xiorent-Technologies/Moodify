import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState, memo } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Slider from '@react-native-community/slider';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { BackgroundDecorations, ThemedText, GradientNeedle } from '../src/components';
import { GeminiService } from '../src/services/geminiService';
import { SpotifyApiService } from '../src/services/spotifyApi';

const { width } = Dimensions.get('window');

const MoodCreationScreen = memo(() => {
  const [selectedMood, setSelectedMood] = useState('');
  const [customMood, setCustomMood] = useState('');
  const [moodDescription, setMoodDescription] = useState('');
  const [showHappinessMeter, setShowHappinessMeter] = useState(false);
  const [happinessLevel, setHappinessLevel] = useState(5); // 1-10 scale
  const [isFromOnboarding, setIsFromOnboarding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Check if user is coming from onboarding
  React.useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const isFirstTimeUser = await AsyncStorage.getItem('isFirstTimeUser');
        setIsFromOnboarding(isFirstTimeUser === 'true');
      } catch (error) {
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
      Alert.alert('Error', 'Failed to save mood. Please try again.');
    }
  };

  const generateAIPlaylist = async (mood: string, happinessLevel: number) => {
    try {
      setIsGeneratingPlaylist(true);

      // Step 1: Get AI mood analysis and musical parameters
      const moodAnalysis = await GeminiService.analyzeMood(mood);
      
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
      
      // Extract tracks from the response
      const tracks = searchResponse?.tracks?.items || searchResponse?.items || [];
      
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
        <View style={styles.moodGrid} key={refreshKey}>
          {moodOptions.map((mood, index) => (
            <TouchableOpacity
              key={`${mood.id}-${index}`}
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
                onError={() => {
                  // Silent error handling
                }}
                onLoad={() => {
                  // Silent success handling
                }}
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
        onRequestClose={() => {
          setShowHappinessMeter(false);
          setRefreshKey(prev => prev + 1);
        }}
      >
        <View style={styles.happinessModalOverlay}>
          <View style={styles.happinessModalContent}>
            {/* Happiness Meter Design */}
            <View style={styles.happinessMeterContainer}>
              {/* Arc Container */}
              <View style={styles.arcContainer}>
                <Svg width={280} height={140} viewBox="0 0 280 140">
                  <Defs>
                    <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <Stop offset="0%" stopColor="#8B5CF6" />
                      <Stop offset="50%" stopColor="#3B82F6" />
                      <Stop offset="100%" stopColor="#06B6D4" />
                    </LinearGradient>
                  </Defs>

                  {/* Grey background arc */}
                  <Path
                    d="M20,140 A120,120 0 0,1 260,140"
                    stroke="#e5e5e5"
                    strokeWidth={20}
                    fill="none"
                    strokeLinecap="round"
                  />

                  {/* Gradient arc */}
                  <Path
                    d="M20,140 A120,120 0 0,1 260,140"
                    stroke="url(#grad)"
                    strokeWidth={20}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="377"
                    strokeDashoffset={377 - (happinessLevel / 10) * 377}
                  />
                </Svg>

                {/* Needle */}
                <View style={styles.needleContainer}>
                  <GradientNeedle 
                    angle={-180 + (happinessLevel / 10) * 180}
                  />
                </View>
              </View>

              {/* Emojis */}
              <View style={styles.emojiContainer}>
                <Image
                  source={require("../assets/images/mood_creation/left_emo.png")}
                  style={styles.emojiImage}
                />
                <Image
                  source={require("../assets/images/mood_creation/right_emo.png")}
                  style={styles.emojiImage}
                />
              </View>

              {/* Label */}
              <Text style={styles.happinessMeterTitle}>Happiness Meter</Text>

              {/* Slider */}
              <Slider
                style={{ width: 250, height: 40, marginTop: 20 }}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={happinessLevel}
                onValueChange={(val: number) => {
                  setHappinessLevel(val);
                }}
                minimumTrackTintColor="#3B82F6"
                maximumTrackTintColor="#e5e5e5"
                thumbTintColor="#06B6D4"
              />
              
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowHappinessMeter(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleHappinessMeterSubmit}
              >
                <Text style={styles.submitButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    </View>
  );
});

export default MoodCreationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#03021F',
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
    backgroundColor: '#03021F',
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
    backgroundColor: '#03021F',
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
  // New Happiness Meter Styles
  happinessModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  happinessModalContent: {
    backgroundColor: '#03021F',
    borderRadius: 50,
    padding: 30,
    width: width * 0.9,
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  happinessMeterContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  arcContainer: {
    width: 280,
    height: 140,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  arcBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 220,
    height: 110,
    borderTopLeftRadius: 110,
    borderTopRightRadius: 110,
    borderWidth: 6,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 0,
  },
  arcFillContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 220,
    height: 110,
    overflow: 'hidden',
  },
  arcFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 110,
    borderTopLeftRadius: 110,
    borderTopRightRadius: 110,
    borderWidth: 6,
    borderColor: '#00CAFE',
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
  },
  needleContainer: {
    position: 'absolute',
    bottom: 90,
    left: '15%',
    marginLeft: -100,
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  needleBase: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00CAFE',
    zIndex: 3,
  },
  needlePivot: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    marginLeft: -27,
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  needleArrow: {
    width: 54,
    height: 54,
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  professionalNeedle: {
    position: 'absolute',
    top: 5,
    left: 20,
    width: 14,
    height: 40,
    borderRadius: 7,
    // Create arrow shape using border radius
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    // Add shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  needleLine: {
    width: 2,
    height: 80,
    backgroundColor: '#00CAFE',
    borderRadius: 1,
  },
  needle: {
    width: 2,
    height: 70,
    backgroundColor: '#00CAFE',
    borderRadius: 1,
    transformOrigin: 'bottom center',
  },
  needlePivot: {
    position: 'absolute',
    bottom: 0,
    width: 10,
    height: 10,
    backgroundColor: '#00CAFE',
    borderRadius: 5,
  },
  emojiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 280,
    paddingHorizontal: 0,
  },
  emojiImage: {
    width: 40,
    height: 40,
  },
  emojiLeft: {
    alignItems: 'center',
  },
  emojiRight: {
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 40,
  },
  happinessMeterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 10,
  },
  levelDisplay: {
    alignItems: 'center',
    marginBottom: 30,
  },
  levelText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  moodText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  sliderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sliderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    position: 'relative',
    marginHorizontal: 8,
  },
  sliderTrackBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
  },
  sliderTrackFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 6,
    backgroundColor: '#00CAFE',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -7,
    width: 20,
    height: 20,
    backgroundColor: '#00CAFE',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#00CAFE',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginLeft: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
