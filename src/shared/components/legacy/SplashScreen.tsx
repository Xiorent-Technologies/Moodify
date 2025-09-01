import { Image } from 'expo-image';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // Animate logo entrance
    logoScale.value = withSequence(
      withTiming(1.2, { duration: 800 }),
      withTiming(1, { duration: 400 })
    );
    
    logoOpacity.value = withTiming(1, { duration: 600 });
    
    // Animate text entrance
    textOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    
    // Redirect after 3 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <Image
          source={require('../../assets/logo/logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <Animated.View style={[styles.shadowLine, textAnimatedStyle]} />
      </Animated.View>
{/*       
      <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
        <Animated.Text style={styles.appName}>Moodify</Animated.Text>
        <Animated.Text style={styles.tagline}>Feel the Music</Animated.Text>
      </Animated.View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070031',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 0, // Reduced margin since we're adding the line
  },
  logo: {
    width: 200,
    height: 200,
  },
  shadowLine: {
    width: 120,
    height: 3,
    backgroundColor: 'rgba(0, 202, 254, 0.3)', // More transparent cyan
    borderRadius: 2,
    marginTop: 20,
    shadowColor: '#00CAFE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10, // Enhanced Android shadow
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 8,
    textShadowColor: 'rgba(74, 144, 226, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 18,
    color: '#8E8E93',
    fontWeight: '500',
  },
});
