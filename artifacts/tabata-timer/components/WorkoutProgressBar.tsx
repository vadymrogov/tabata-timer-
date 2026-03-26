import React, { useEffect, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import Colors from "@/constants/colors";
import { IntervalType } from "@/context/TimerContext";

interface Props {
  progress: number;
  intervalType: IntervalType;
  isIdle: boolean;
  isComplete: boolean;
}

function getBarColor(type: IntervalType) {
  switch (type) {
    case "work":
      return Colors.work;
    case "rest":
      return Colors.rest;
    case "prepare":
      return Colors.prepare;
  }
}

export function WorkoutProgressBar({
  progress,
  intervalType,
  isIdle,
  isComplete,
}: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const animatedWidth = useSharedValue(0);

  const targetPct = isIdle ? 0 : isComplete ? 1 : progress;

  useEffect(() => {
    animatedWidth.value = withTiming(targetPct * trackWidth, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetPct, trackWidth]);

  const barStyle = useAnimatedStyle(() => ({
    width: animatedWidth.value,
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const color = isComplete ? Colors.complete : getBarColor(intervalType);
  const displayPct = isIdle ? 0 : isComplete ? 100 : Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <View style={styles.track} onLayout={onLayout}>
        <Animated.View
          style={[
            styles.fill,
            barStyle,
            { backgroundColor: color, shadowColor: color },
          ]}
        />
      </View>
      <Text style={styles.pct}>{displayPct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  track: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  pct: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    width: 32,
    textAlign: "right",
    letterSpacing: 0.3,
  },
});
