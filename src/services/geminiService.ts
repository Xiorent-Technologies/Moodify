import { GEMINI_CONFIG, MOOD_PROMPTS } from '../config/gemini';

export interface MoodAnalysis {
  mood: string;
  intensity: number;
  valence: number;
  energy: number;
  tempo: 'slow' | 'medium' | 'fast';
  genres: string[];
  context: string;
  description: string;
}

export interface MusicParameters {
  target_energy: number;
  target_valence: number;
  target_tempo: number;
  target_danceability: number;
  target_acousticness: number;
  target_instrumentalness: number;
  recommended_genres: string[];
  mood_description: string;
  playlist_theme: string;
}

export class GeminiService {
  private static async makeGeminiRequest(prompt: string): Promise<any> {
    try {
      const url = `${GEMINI_CONFIG.BASE_URL}/${GEMINI_CONFIG.MODEL}:generateContent?key=${GEMINI_CONFIG.API_KEY}`;
      
      const requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: GEMINI_CONFIG.TEMPERATURE,
          maxOutputTokens: GEMINI_CONFIG.MAX_TOKENS,
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Gemini API request error:', error);
      throw error;
    }
  }

  private static parseGeminiResponse(response: any): string {
    try {
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('No text content in Gemini response');
      }
      return text;
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      throw new Error('Failed to parse Gemini response');
    }
  }

  private static parseJsonFromText(text: string): any {
    try {
      // Find JSON in the text (sometimes Gemini adds extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const jsonString = jsonMatch[0];
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error parsing JSON from Gemini response:', error);
      console.error('Raw response text:', text);
      throw new Error('Failed to parse JSON from Gemini response');
    }
  }

  // Analyze user's text input for mood
  static async analyzeMood(userText: string): Promise<MoodAnalysis> {
    try {
      console.log('🧠 Analyzing mood for text:', userText);
      
      const prompt = MOOD_PROMPTS.SENTIMENT_ANALYSIS + userText;
      const response = await this.makeGeminiRequest(prompt);
      const responseText = this.parseGeminiResponse(response);
      
      console.log('🤖 Gemini response:', responseText);
      
      const moodData = this.parseJsonFromText(responseText);
      
      // Validate and normalize the response
      const validatedMood: MoodAnalysis = {
        mood: moodData.mood || 'neutral',
        intensity: Math.min(Math.max(moodData.intensity || 5, 1), 10),
        valence: Math.min(Math.max(moodData.valence || 0.5, 0), 1),
        energy: Math.min(Math.max(moodData.energy || 0.5, 0), 1),
        tempo: moodData.tempo || 'medium',
        genres: Array.isArray(moodData.genres) ? moodData.genres : ['pop'],
        context: moodData.context || 'general',
        description: moodData.description || 'No description provided',
      };

      console.log('✅ Mood analysis completed:', validatedMood);
      return validatedMood;
      
    } catch (error) {
      console.error('❌ Mood analysis failed:', error);
      throw new Error(`Mood analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Convert mood to music parameters
  static async moodToMusicParameters(mood: MoodAnalysis): Promise<MusicParameters> {
    try {
      console.log('🎵 Converting mood to music parameters:', mood);
      
      const prompt = MOOD_PROMPTS.MOOD_TO_MUSIC + JSON.stringify(mood);
      const response = await this.makeGeminiRequest(prompt);
      const responseText = this.parseGeminiResponse(response);
      
      console.log('🤖 Gemini music response:', responseText);
      
      const musicData = this.parseJsonFromText(responseText);
      
      // Validate and normalize the response
      const validatedMusic: MusicParameters = {
        target_energy: Math.min(Math.max(musicData.target_energy || 0.5, 0), 1),
        target_valence: Math.min(Math.max(musicData.target_valence || 0.5, 0), 1),
        target_tempo: Math.min(Math.max(musicData.target_tempo || 120, 60), 200),
        target_danceability: Math.min(Math.max(musicData.target_danceability || 0.5, 0), 1),
        target_acousticness: Math.min(Math.max(musicData.target_acousticness || 0.5, 0), 1),
        target_instrumentalness: Math.min(Math.max(musicData.target_instrumentalness || 0.5, 0), 1),
        recommended_genres: Array.isArray(musicData.recommended_genres) ? musicData.recommended_genres : ['pop'],
        mood_description: musicData.mood_description || 'No description provided',
        playlist_theme: musicData.playlist_theme || 'Mood-based Playlist',
      };

      console.log('✅ Music parameters generated:', validatedMusic);
      return validatedMusic;
      
    } catch (error) {
      console.error('❌ Music parameter generation failed:', error);
      throw new Error(`Music parameter generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Combined method: analyze mood and get music parameters
  static async analyzeMoodAndGetMusic(userText: string): Promise<{
    mood: MoodAnalysis;
    music: MusicParameters;
  }> {
    try {
      console.log('🚀 Starting complete mood-to-music analysis');
      
      const mood = await this.analyzeMood(userText);
      const music = await this.moodToMusicParameters(mood);
      
      return { mood, music };
      
    } catch (error) {
      console.error('❌ Complete analysis failed:', error);
      throw error;
    }
  }
}
