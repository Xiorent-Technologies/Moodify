import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Circle, Rect, Polygon } from "react-native-svg";

export default function GradientNeedle({ angle = 0 }) {
  return (
    <View style={styles.container}>
      {/* Fixed Base Circle - Never rotates */}
      <Svg
        width={200}
        height={200}
        viewBox="0 0 200 200"
        style={styles.fixedBase}
      >
        <Defs>
          <LinearGradient id="baseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#8B5CF6" />
            <Stop offset="50%" stopColor="#3B82F6" />
            <Stop offset="100%" stopColor="#06B6D4" />
          </LinearGradient>
        </Defs>
        <Circle cx="100" cy="100" r="20" fill="url(#baseGrad)" />
      </Svg>

      {/* Rotating Needle - Only this part rotates */}
      <Svg
        width={200}
        height={200}
        viewBox="0 0 200 200"
        style={[
          styles.rotatingNeedle,
          {
            transform: [{ rotate: `${angle}deg` }],
          },
        ]}
      >
        <Defs>
          <LinearGradient id="needleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#8B5CF6" />
            <Stop offset="50%" stopColor="#3B82F6" />
            <Stop offset="100%" stopColor="#06B6D4" />
          </LinearGradient>
        </Defs>

        {/* Tapered Needle - wider at base, narrow at tip */}
        <Polygon
          points="100,88 100,112 190,100"
          fill="url(#needleGrad)"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  fixedBase: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 2,
  },
  rotatingNeedle: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
  },
});
