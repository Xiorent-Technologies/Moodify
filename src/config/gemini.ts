export const GEMINI_CONFIG = {
  API_KEY: 'AIzaSyASe-vesxgtK2Tbl0W__ZvRTZu1heFurso', // Replace with your actual Gemini API key
  MODEL: 'gemini-1.5-flash', // Changed to flash model for better free tier usage
  BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models',
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7,
};

// Mood analysis prompts
export const MOOD_PROMPTS = {
  SENTIMENT_ANALYSIS: `Analyze the following text and determine the user's mood and emotional state. 
  Return a JSON response with the following structure:
  {
    "mood": "primary_mood",
    "intensity": 1-10,
    "valence": 0.0-1.0,
    "energy": 0.0-1.0,
    "tempo": "slow|medium|fast",
    "genres": ["genre1", "genre2"],
    "context": "context_tag",
    "description": "brief_mood_description"
  }
  
  Mood categories: happy, sad, energetic, relaxed, romantic, nostalgic, focused, party, workout, study, chill, excited, calm, angry, melancholic, upbeat, dreamy, powerful, gentle, mysterious
  
  Context tags: workout, study, party, chill, work, travel, cooking, cleaning, meditation, social, alone, morning, night, weekend
  
  Text to analyze:`,
  
  MOOD_TO_MUSIC: `Based on the mood analysis, suggest musical parameters and track recommendations.
  Return a JSON response with:
  {
    "target_energy": 0.0-1.0,
    "target_valence": 0.0-1.0,
    "target_tempo": 60-200,
    "target_danceability": 0.0-1.0,
    "target_acousticness": 0.0-1.0,
    "target_instrumentalness": 0.0-1.0,
    "recommended_genres": ["genre1", "genre2"],
    "mood_description": "how this mood translates to music",
    "playlist_theme": "suggested playlist name/theme"
  }
  
  Mood:`,
};
