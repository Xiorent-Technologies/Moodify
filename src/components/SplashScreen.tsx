import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  useEffect(() => {
    // Redirect after 3 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/logo/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.shadowLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#03021F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 300,
    height: 300,
  },
  shadowLine: {
    width: 120,
    height: 3,
    backgroundColor: 'rgba(0, 202, 254, 0.3)',
    borderRadius: 2,
    marginTop: 20,
    shadowColor: '#00CAFE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
});
