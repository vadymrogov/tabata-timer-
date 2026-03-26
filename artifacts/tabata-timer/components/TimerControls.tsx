import * as Haptics from "expo-haptics";
import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import Colors from "@/constants/colors";
import { TimerStatus } from "@/context/TimerContext";

interface Props {
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkip: () => void;
}

function ActionButton({
  onPress,
  children,
  primary,
  disabled,
}: {
  onPress: () => void;
  children: React.ReactNode;
  primary?: boolean;
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.88);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      onPress={() => {
        if (disabled) return;
        Haptics.impactAsync(
          primary
            ? Haptics.ImpactFeedbackStyle.Heavy
            : Haptics.ImpactFeedbackStyle.Light
        );
        onPress();
      }}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.btn,
          primary ? styles.btnPrimary : styles.btnSecondary,
          disabled && styles.btnDisabled,
          animStyle,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

export function TimerControls({
  status,
  onStart,
  onPause,
  onResume,
  onReset,
  onSkip,
}: Props) {
  const isIdle = status === "idle";
  const isRunning = status === "running";
  const isPaused = status === "paused";
  const isComplete = status === "complete";

  return (
    <View style={styles.container}>
      <ActionButton
        onPress={onReset}
        disabled={isIdle}
      >
        <Ionicons name="refresh" size={22} color={isIdle ? Colors.textMuted : Colors.textSecondary} />
      </ActionButton>

      <ActionButton
        primary
        onPress={
          isIdle || isComplete
            ? onStart
            : isRunning
            ? onPause
            : onResume
        }
      >
        {isRunning ? (
          <Feather name="pause" size={30} color={Colors.white} />
        ) : (
          <Feather name="play" size={30} color={Colors.white} />
        )}
      </ActionButton>

      <ActionButton
        onPress={onSkip}
        disabled={isIdle || isComplete}
      >
        <Feather
          name="skip-forward"
          size={22}
          color={isIdle || isComplete ? Colors.textMuted : Colors.textSecondary}
        />
      </ActionButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  btn: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
  },
  btnPrimary: {
    width: 80,
    height: 80,
    backgroundColor: Colors.accent,
    shadowColor: Colors.work,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  btnSecondary: {
    width: 52,
    height: 52,
    backgroundColor: Colors.surfaceElevated,
  },
  btnDisabled: {
    opacity: 0.35,
  },
});
