import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';

export function BackgroundDecorations() {
  const glow1 = useSharedValue(0.4);
  const glow2 = useSharedValue(0.5);
  const glow3 = useSharedValue(0.6);
  const glow4 = useSharedValue(0.4);

  useEffect(() => {
    // Animate the glowing circles
    glow1.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ),
      -1,
      true
    );

    glow2.value = withDelay(500, withRepeat(
      withSequence(
        withTiming(0.9, { duration: 2500 }),
        withTiming(0.4, { duration: 2500 })
      ),
      -1,
      true
    ));

    glow3.value = withDelay(1000, withRepeat(
      withSequence(
        withTiming(0.8, { duration: 3000 }),
        withTiming(0.6, { duration: 3000 })
      ),
      -1,
      true
    ));

    glow4.value = withDelay(1500, withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2500 }),
        withTiming(0.4, { duration: 2500 })
      ),
      -1,
      true
    ));
  }, []);

  const glow1Style = useAnimatedStyle(() => ({
    opacity: glow1.value,
  }));

  const glow2Style = useAnimatedStyle(() => ({
    opacity: glow2.value,
  }));

  const glow3Style = useAnimatedStyle(() => ({
    opacity: glow3.value,
  }));

  const glow4Style = useAnimatedStyle(() => ({
    opacity: glow4.value,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Top left glowing circle */}
      <Animated.View style={[styles.glowCircle, styles.glow1, glow1Style]} />
      
      {/* Top right glowing circle */}
      <Animated.View style={[styles.glowCircle, styles.glow2, glow2Style]} />
      
      {/* Bottom center glowing circle */}
      <Animated.View style={[styles.glowCircle, styles.glow3, glow3Style]} />
      
      {/* Additional glowing circle */}
      {/* <Animated.View style={[styles.glowCircle, styles.glow4, glow4Style]} /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  glowCircle: {
    position: 'absolute',
    borderRadius: 100,
  },
  glow1: {
    width: 100,
    height: 100,
    top: 80,
    left: 20,
    backgroundColor: 'rgba(177, 43, 254, 0.4)',
    shadowColor: '#B12BFE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 25,
    elevation: 15,
  },
  glow2: {
    width: 80,
    height: 80,
    top: 120,
    right: 30,
    backgroundColor: 'rgba(0, 202, 254, 0.4)',
    shadowColor: '#00CAFE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 12,
  },
  glow3: {
    width: 120,
    height: 120,
    bottom: 80,
    left: '50%',
    marginLeft: -60,
    backgroundColor: 'rgba(13, 32, 153, 0.4)',
    shadowColor: '#0D2099',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 15,
  },
  glow4: {
    width: 90,
    height: 90,
    top: 200,
    left: '20%',
    backgroundColor: 'rgba(177, 43, 254, 0.3)',
    shadowColor: '#B12BFE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
    elevation: 10,
  },
});
