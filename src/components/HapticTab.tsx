import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface HapticTabProps {
  children: React.ReactNode;
  onPress?: () => void;
  active?: boolean;
}

export function HapticTab({ children, onPress, active = false }: HapticTabProps) {
  return (
    <TouchableOpacity
      style={[styles.tab, active && styles.activeTab]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {children}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: 'rgba(0, 202, 254, 0.2)',
    borderColor: '#00CAFE',
    borderWidth: 1,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
