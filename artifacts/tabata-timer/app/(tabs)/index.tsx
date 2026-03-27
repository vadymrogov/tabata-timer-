import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
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

import { Ionicons } from "@expo/vector-icons";

import { CircularProgress } from "@/components/CircularProgress";
import { IntervalQueue } from "@/components/IntervalQueue";
import { StatsBar } from "@/components/StatsBar";
import { TimerControls } from "@/components/TimerControls";
import { WorkoutTimeline } from "@/components/WorkoutTimeline";
import Colors from "@/constants/colors";
import { useI18n } from "@/context/I18nContext";
import { useTimer } from "@/context/TimerContext";
import { useWorkouts } from "@/context/WorkoutsContext";
import { useSounds } from "@/hooks/useSounds";

function getIntervalLabel(type: string, t: (k: string) => string) {
  switch (type) {
    case "work": return t("labelWork");
    case "rest": return t("labelRest");
    case "prepare": return t("labelReady");
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
  const { t } = useI18n();
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
        <Text style={styles.completeTitle}>{t("complete")}</Text>
        <Text style={styles.completeSub}>{t("crushedIt")}</Text>
      </Animated.View>
    </Animated.View>
  );
}

export default function TimerScreen() {
  const insets = useSafeAreaInsets();
  const { t, language, setLanguage } = useI18n();
  const [accountModalVisible, setAccountModalVisible] = useState(false);
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
    soundEnabled,
    toggleSound,
  } = useTimer();

  const { play } = useSounds(soundEnabled);
  const { completedWorkouts, logCompletedWorkout } = useWorkouts();
  const [historySaved, setHistorySaved] = useState(false);

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
  const totalCycles =
    mode === "simple"
      ? simpleConfig.cycles
      : currentIntervals.filter((iv) => iv.type === "work").length || 1;

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

  // Reset save flag when workout resets to idle
  useEffect(() => {
    if (status === "idle") setHistorySaved(false);
  }, [status]);

  const handleSaveHistory = useCallback(async () => {
    await logCompletedWorkout({
      durationSeconds: totalDuration,
      rounds: totalCycles,
      mode,
    });
    setHistorySaved(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [logCompletedWorkout, totalDuration, totalCycles, mode]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { paddingTop: topPad, paddingBottom: bottomPad + 90 }]}>
      {/* Account / Language Modal */}
      <Modal
        visible={accountModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAccountModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setAccountModalVisible(false)}
        >
          <Pressable style={styles.accountModal} onPress={() => {}}>
            <View style={styles.accountModalHeader}>
              <Ionicons name="person-circle-outline" size={28} color={Colors.text} />
              <Text style={styles.accountModalTitle}>{t("account")}</Text>
            </View>
            <View style={styles.accountDivider} />
            <Text style={styles.accountSectionLabel}>{t("language")}</Text>
            <Pressable
              style={styles.langOption}
              onPress={() => {
                setLanguage("en");
                Haptics.selectionAsync();
              }}
            >
              <Text style={[styles.langOptionText, language === "en" && styles.langOptionActive]}>
                {t("english")}
              </Text>
              {language === "en" && (
                <Ionicons name="checkmark" size={20} color={Colors.accent} />
              )}
            </Pressable>
            <Pressable
              style={styles.langOption}
              onPress={() => {
                setLanguage("es");
                Haptics.selectionAsync();
              }}
            >
              <Text style={[styles.langOptionText, language === "es" && styles.langOptionActive]}>
                {t("spanish")}
              </Text>
              {language === "es" && (
                <Ionicons name="checkmark" size={20} color={Colors.accent} />
              )}
            </Pressable>
            <View style={styles.accountDivider} />
            <Text style={styles.accountSectionLabel}>{t("completedRoutines")}</Text>
            {completedWorkouts.length === 0 ? (
              <Text style={styles.historyEmpty}>{t("historyEmpty")}</Text>
            ) : (
              <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
                {completedWorkouts.slice(0, 30).map((w) => {
                  const date = new Date(w.completedAt).toLocaleDateString(undefined, {
                    month: "short", day: "numeric",
                  });
                  const mins = Math.round(w.durationSeconds / 60);
                  return (
                    <View key={w.id} style={styles.historyRow}>
                      <View style={[styles.historyDot, { backgroundColor: w.mode === "simple" ? Colors.work : Colors.rest }]} />
                      <View style={styles.historyInfo}>
                        <Text style={styles.historyMeta}>
                          {w.rounds} {t("historyRounds")} · {mins}m
                        </Text>
                        <Text style={styles.historyDate}>{date}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
            <Pressable
              style={styles.accountCloseBtn}
              onPress={() => setAccountModalVisible(false)}
            >
              <Text style={styles.accountCloseBtnText}>{t("cancel")}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Top action bar: sound + account icons */}
        <View style={styles.topBar}>
          <Pressable
            onPress={toggleSound}
            style={styles.muteBtn}
            hitSlop={12}
          >
            <Ionicons
              name={soundEnabled ? "volume-high" : "volume-mute"}
              size={22}
              color={soundEnabled ? Colors.textSecondary : Colors.textMuted}
            />
          </Pressable>
          <Pressable
            onPress={() => setAccountModalVisible(true)}
            style={styles.muteBtn}
            hitSlop={12}
          >
            <Ionicons
              name="person-circle-outline"
              size={24}
              color={Colors.textSecondary}
            />
          </Pressable>
        </View>

        {/* Header: title + interval badge */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>{t("appTitle")}</Text>
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
              {getIntervalLabel(intervalType, t)}
            </Animated.Text>
          )}
        </View>

        {/* Segmented workout timeline */}
        <WorkoutTimeline
          intervals={currentIntervals}
          totalDuration={totalDuration}
          totalElapsed={totalElapsed}
          status={status}
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
          <Text style={styles.idleHint}>{t("pressToStart")}</Text>
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

        {/* Save to History (complete state) */}
        {isComplete && (
          <View style={styles.saveHistoryWrap}>
            {historySaved ? (
              <Text style={styles.savedToHistoryText}>{t("savedToHistory")}</Text>
            ) : (
              <Pressable style={styles.saveHistoryBtn} onPress={handleSaveHistory}>
                <Ionicons name="bookmark-outline" size={16} color={Colors.background} />
                <Text style={styles.saveHistoryBtnText}>{t("saveToHistory")}</Text>
              </Pressable>
            )}
          </View>
        )}

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
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 0,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
    paddingBottom: 6,
    paddingHorizontal: 24,
  },
  appTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  muteBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  accountModal: {
    width: "100%",
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  accountModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  accountModalTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  accountDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },
  accountSectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginBottom: 8,
  },
  langOptionText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  langOptionActive: {
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  accountCloseBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  accountCloseBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
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
  saveHistoryWrap: {
    alignItems: "center",
    marginBottom: 10,
    marginTop: -10,
  },
  saveHistoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.accent,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 24,
  },
  saveHistoryBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.background,
  },
  savedToHistoryText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.rest,
    letterSpacing: 0.2,
  },
  historyList: {
    maxHeight: 160,
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyMeta: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  historyDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  historyEmpty: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginBottom: 14,
    fontStyle: "italic",
  },
});
