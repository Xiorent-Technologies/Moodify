import React from 'react';
import { View } from 'react-native';

interface IconSymbolProps {
  name: string;
  size?: number;
  color?: string;
}

export function IconSymbol({ name, size = 24, color = '#000' }: IconSymbolProps) {
  // This is a placeholder component - you can replace with actual icon implementation
  return (
    <View style={{ width: size, height: size, backgroundColor: color, borderRadius: size / 2 }} />
  );
}
