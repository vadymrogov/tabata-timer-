import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CircularProgress } from "@/components/CircularProgress";
import { IntervalQueue } from "@/components/IntervalQueue";
import { StatsBar } from "@/components/StatsBar";
import { TimerControls } from "@/components/TimerControls";
import { WorkoutProgressBar } from "@/components/WorkoutProgressBar";
import Colors from "@/constants/colors";
import { useTimer } from "@/context/TimerContext";
import { useSounds } from "@/hooks/useSounds";

function getIntervalLabel(type: string) {
  switch (type) {
    case "work": return "WORK";
    case "rest": return "REST";
    case "prepare": return "READY";
    default: return "";
  }
}

function getIntervalColor(type: string) {
  switch (type) {
    case "work": return Colors.work;
    case "rest": return Colors.rest;
    case "prepare": return Colors.prepare;
    default: return Colors.text;
  }
}

function CompleteBanner() {
  const scale = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.05, { duration: 350 }),
      withTiming(1, { duration: 200 })
    );
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.completeBanner}>
      <Animated.View style={[styles.completeBadge, style]}>
        <Text style={styles.completeEmoji}>🏆</Text>
        <Text style={styles.completeTitle}>Complete!</Text>
        <Text style={styles.completeSub}>You crushed it.</Text>
      </Animated.View>
    </Animated.View>
  );
}

export default function TimerScreen() {
  const insets = useSafeAreaInsets();
  const {
    timerState,
    currentIntervals,
    totalDuration,
    start,
    pause,
    resume,
    reset,
    skip,
    mode,
    simpleConfig,
    customConfig,
  } = useTimer();

  const { play } = useSounds();

  const { status, currentIntervalIndex, currentCycle, timeRemaining, totalElapsed } =
    timerState;

  const isIdle = status === "idle";
  const isComplete = status === "complete";

  const currentInterval =
    currentIntervalIndex >= 0 && currentIntervalIndex < currentIntervals.length
      ? currentIntervals[currentIntervalIndex]
      : null;

  const intervalDuration = currentInterval?.duration ?? 1;
  const progress = isIdle ? 0 : isComplete ? 1 : 1 - timeRemaining / intervalDuration;
  const totalProgress = isIdle ? 0 : isComplete ? 1 : totalElapsed / Math.max(totalDuration, 1);

  const intervalType = currentInterval?.type ?? "work";
  const totalCycles = mode === "simple" ? simpleConfig.cycles : customConfig.cycles;

  // Sound: countdown beeps (3, 2, 1)
  const prevTimeRef = useRef(timeRemaining);
  useEffect(() => {
    if (status === "running" && currentInterval) {
      const prev = prevTimeRef.current;
      const curr = timeRemaining;
      // Only fire if we've actually decremented
      if (curr < prev && curr <= 3 && curr > 0) {
        play("tick");
      }
    }
    prevTimeRef.current = timeRemaining;
  }, [timeRemaining, status]);

  // Sound: interval changes
  const prevIntervalRef = useRef(currentIntervalIndex);
  useEffect(() => {
    if (
      prevIntervalRef.current !== currentIntervalIndex &&
      currentIntervalIndex >= 0 &&
      status === "running"
    ) {
      const iv = currentIntervals[currentIntervalIndex];
      if (iv) {
        if (iv.type === "work") play("work");
        else if (iv.type === "rest") play("rest");
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    prevIntervalRef.current = currentIntervalIndex;
  }, [currentIntervalIndex]);

  // Sound: complete
  const prevStatusRef = useRef(status);
  useEffect(() => {
    if (prevStatusRef.current !== "complete" && status === "complete") {
      play("complete");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (prevStatusRef.current === "running" && status === "paused") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    prevStatusRef.current = status;
  }, [status]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { paddingTop: topPad, paddingBottom: bottomPad + 90 }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>Tábata</Text>
          {!isIdle && !isComplete && currentInterval && (
            <Animated.Text
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              key={currentIntervalIndex}
              style={[
                styles.intervalBadge,
                { color: getIntervalColor(intervalType) },
              ]}
            >
              {getIntervalLabel(intervalType)}
            </Animated.Text>
          )}
        </View>

        {/* Total progress bar */}
        <WorkoutProgressBar
          progress={totalProgress}
          intervalType={isIdle ? "work" : intervalType}
          isIdle={isIdle}
          isComplete={isComplete}
        />

        {/* Interval name */}
        {!isIdle && !isComplete && currentInterval && (
          <Animated.Text
            key={`label-${currentIntervalIndex}`}
            entering={FadeIn.duration(250)}
            exiting={FadeOut.duration(150)}
            style={styles.intervalName}
          >
            {currentInterval.label}
          </Animated.Text>
        )}
        {isIdle && (
          <Text style={styles.idleHint}>Press play to start</Text>
        )}

        {/* Main circle */}
        <View style={styles.circleWrap}>
          {isComplete ? (
            <CompleteBanner />
          ) : (
            <CircularProgress
              progress={progress}
              timeRemaining={isIdle ? 0 : timeRemaining}
              intervalType={isIdle ? "work" : intervalType}
              size={270}
            />
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsWrap}>
          <StatsBar
            currentCycle={Math.max(currentCycle, isIdle ? 0 : currentCycle)}
            totalCycles={totalCycles}
            totalDuration={totalDuration}
            elapsed={totalElapsed}
          />
        </View>

        {/* Queue */}
        {!isIdle && currentIntervals.length > 0 && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.queueWrap}>
            <IntervalQueue
              intervals={currentIntervals}
              currentIndex={currentIntervalIndex}
            />
          </Animated.View>
        )}

        {/* Controls */}
        <View style={styles.controlsWrap}>
          <TimerControls
            status={status}
            onStart={start}
            onPause={pause}
            onResume={resume}
            onReset={reset}
            onSkip={skip}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 24,
  },
  appTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  intervalBadge: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2.5,
  },
  intervalName: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 2,
    letterSpacing: -0.3,
    paddingHorizontal: 24,
  },
  idleHint: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 2,
  },
  circleWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    minHeight: 270,
  },
  statsWrap: {
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  queueWrap: {
    marginBottom: 20,
  },
  controlsWrap: {
    alignItems: "center",
    paddingBottom: 8,
    paddingHorizontal: 24,
  },
  completeBanner: {
    alignItems: "center",
    justifyContent: "center",
    width: 270,
    height: 270,
  },
  completeBadge: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderRadius: 135,
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: Colors.complete,
  },
  completeEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  completeTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    textAlign: "center",
  },
  completeSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
});
