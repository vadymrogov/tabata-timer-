import React, { useEffect } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import Colors from "@/constants/colors";
import { IntervalType } from "@/context/TimerContext";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  progress: number;
  timeRemaining: number;
  intervalType: IntervalType;
  size?: number;
}

function getColor(type: IntervalType) {
  switch (type) {
    case "work":
      return Colors.work;
    case "rest":
      return Colors.rest;
    case "prepare":
      return Colors.prepare;
  }
}

function getGlow(type: IntervalType) {
  switch (type) {
    case "work":
      return Colors.workGlow;
    case "rest":
      return Colors.restGlow;
    case "prepare":
      return Colors.prepareGlow;
  }
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m > 0) return `${m}:${String(s).padStart(2, "0")}`;
  return String(s);
}

export function CircularProgress({
  progress,
  timeRemaining,
  intervalType,
  size = 280,
}: Props) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProgress = useSharedValue(progress);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 900,
      easing: Easing.out(Easing.quad),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const color = getColor(intervalType);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {Platform.OS !== "web" && (
        <View
          style={[
            styles.glow,
            {
              width: size * 0.85,
              height: size * 0.85,
              borderRadius: (size * 0.85) / 2,
              backgroundColor: getGlow(intervalType),
              top: size * 0.075,
              left: size * 0.075,
            },
          ]}
        />
      )}
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={Colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.time, { color }]}>{formatTime(timeRemaining)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  glow: {
    position: "absolute",
    opacity: 0.35,
  },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  time: {
    fontSize: 62,
    fontFamily: "Inter_700Bold",
    letterSpacing: -2,
  },
});
