import * as Haptics from "expo-haptics";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeOutUp,
  Layout,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import {
  CustomConfig,
  Interval,
  IntervalType,
  useTimer,
} from "@/context/TimerContext";

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 6);
}

type IntervalColor = { bg: string; text: string; border: string };

function getTypeColors(type: IntervalType): IntervalColor {
  switch (type) {
    case "work":
      return { bg: Colors.workGlow, text: Colors.work, border: Colors.work };
    case "rest":
      return { bg: Colors.restGlow, text: Colors.rest, border: Colors.rest };
    case "prepare":
      return {
        bg: Colors.prepareGlow,
        text: Colors.prepare,
        border: Colors.prepare,
      };
  }
}

function formatDur(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m === 0) return `${sec}s`;
  if (sec === 0) return `${m}m`;
  return `${m}m ${sec}s`;
}

interface IntervalCardProps {
  interval: Interval;
  index: number;
  onUpdate: (id: string, patch: Partial<Interval>) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

function IntervalCard({
  interval,
  index,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: IntervalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const colors = getTypeColors(interval.type);
  const types: IntervalType[] = ["work", "rest"];

  const adjustDuration = (delta: number) => {
    Haptics.selectionAsync();
    onUpdate(interval.id, {
      duration: Math.max(1, Math.min(3600, interval.duration + delta)),
    });
  };

  return (
    <Animated.View
      layout={Layout.springify()}
      entering={FadeInDown.duration(250)}
      exiting={FadeOutUp.duration(200)}
      style={[styles.card, { borderLeftColor: colors.border }]}
    >
      <Pressable
        onPress={() => setExpanded((e) => !e)}
        style={styles.cardHeader}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.indexBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.indexText, { color: colors.text }]}>
              {index + 1}
            </Text>
          </View>
          <View>
            <Text style={styles.cardName}>{interval.label}</Text>
            <Text style={[styles.cardType, { color: colors.text }]}>
              {interval.type.toUpperCase()} · {formatDur(interval.duration)}
            </Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onMoveUp(interval.id);
            }}
            disabled={isFirst}
            style={styles.reorderBtn}
          >
            <Feather
              name="chevron-up"
              size={18}
              color={isFirst ? Colors.textMuted : Colors.textSecondary}
            />
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onMoveDown(interval.id);
            }}
            disabled={isLast}
            style={styles.reorderBtn}
          >
            <Feather
              name="chevron-down"
              size={18}
              color={isLast ? Colors.textMuted : Colors.textSecondary}
            />
          </Pressable>
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={Colors.textSecondary}
          />
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.cardBody}>
          {/* Label */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Label</Text>
            <TextInput
              style={styles.input}
              value={interval.label}
              onChangeText={(t) => onUpdate(interval.id, { label: t })}
              placeholderTextColor={Colors.textMuted}
              selectionColor={Colors.accent}
            />
          </View>

          {/* Type */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              {types.map((t) => {
                const tc = getTypeColors(t);
                const active = interval.type === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => {
                      Haptics.selectionAsync();
                      onUpdate(interval.id, { type: t });
                    }}
                    style={[
                      styles.typeChip,
                      active && {
                        backgroundColor: tc.bg,
                        borderColor: tc.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        active && { color: tc.text },
                      ]}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Duration */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Duration</Text>
            <View style={styles.durationRow}>
              <Pressable
                onPress={() => adjustDuration(-5)}
                style={styles.durBtn}
              >
                <Text style={styles.durBtnText}>-5s</Text>
              </Pressable>
              <Pressable
                onPress={() => adjustDuration(-15)}
                style={styles.durBtn}
              >
                <Text style={styles.durBtnText}>-15s</Text>
              </Pressable>
              <View style={[styles.durValue, { borderColor: colors.border }]}>
                <Text style={[styles.durValueText, { color: colors.text }]}>
                  {formatDur(interval.duration)}
                </Text>
              </View>
              <Pressable
                onPress={() => adjustDuration(15)}
                style={styles.durBtn}
              >
                <Text style={styles.durBtnText}>+15s</Text>
              </Pressable>
              <Pressable
                onPress={() => adjustDuration(30)}
                style={styles.durBtn}
              >
                <Text style={styles.durBtnText}>+30s</Text>
              </Pressable>
            </View>
          </View>

          {/* Delete */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onDelete(interval.id);
            }}
            style={styles.deleteBtn}
          >
            <Feather name="trash-2" size={15} color="#FF453A" />
            <Text style={styles.deleteBtnText}>Remove Interval</Text>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}

export default function CustomConfigScreen() {
  const insets = useSafeAreaInsets();
  const { customConfig, setCustomConfig, reset } = useTimer();
  const [intervals, setIntervals] = useState<Interval[]>(
    customConfig.intervals
  );
  const [cycles, setCycles] = useState(customConfig.cycles);
  const [prepareDuration, setPrepareDuration] = useState(
    customConfig.prepareDuration
  );

  const save = (newIntervals: Interval[], newCycles?: number, newPrep?: number) => {
    const cfg: CustomConfig = {
      cycles: newCycles ?? cycles,
      prepareDuration: newPrep ?? prepareDuration,
      intervals: newIntervals,
    };
    setCustomConfig(cfg);
    reset();
  };

  const updateInterval = (id: string, patch: Partial<Interval>) => {
    setIntervals((prev) => {
      const next = prev.map((iv) => (iv.id === id ? { ...iv, ...patch } : iv));
      save(next);
      return next;
    });
  };

  const deleteInterval = (id: string) => {
    setIntervals((prev) => {
      const next = prev.filter((iv) => iv.id !== id);
      save(next);
      return next;
    });
  };

  const moveUp = (id: string) => {
    setIntervals((prev) => {
      const idx = prev.findIndex((iv) => iv.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      save(next);
      return next;
    });
  };

  const moveDown = (id: string) => {
    setIntervals((prev) => {
      const idx = prev.findIndex((iv) => iv.id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
      save(next);
      return next;
    });
  };

  const addInterval = (type: IntervalType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newIv: Interval = {
      id: genId(),
      type,
      label: type === "work" ? "Work" : "Rest",
      duration: type === "work" ? 30 : 10,
    };
    setIntervals((prev) => {
      const next = [...prev, newIv];
      save(next);
      return next;
    });
  };

  const adjustCycles = (delta: number) => {
    Haptics.selectionAsync();
    const next = Math.max(1, Math.min(99, cycles + delta));
    setCycles(next);
    save(intervals, next);
  };

  const adjustPrep = (delta: number) => {
    Haptics.selectionAsync();
    const next = Math.max(0, Math.min(60, prepareDuration + delta));
    setPrepareDuration(next);
    save(intervals, undefined, next);
  };

  const totalSecs =
    intervals.reduce((s, iv) => s + iv.duration, 0) * cycles + prepareDuration;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { paddingBottom: bottomPad }]}>
      <View style={[styles.navHeader, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>Custom Intervals</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cycles */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Cycles</Text>
          <View style={styles.cycleRow}>
            <Pressable onPress={() => adjustCycles(-1)} style={styles.cycleBtn}>
              <Feather name="minus" size={20} color={Colors.text} />
            </Pressable>
            <Text style={styles.cycleValue}>{cycles}</Text>
            <Pressable onPress={() => adjustCycles(1)} style={styles.cycleBtn}>
              <Feather name="plus" size={20} color={Colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Prepare */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Prepare Duration</Text>
          <View style={styles.prepRow}>
            {[0, 3, 5, 10].map((v) => (
              <Pressable
                key={v}
                onPress={() => {
                  Haptics.selectionAsync();
                  setPrepareDuration(v);
                  save(intervals, undefined, v);
                }}
                style={[
                  styles.prepChip,
                  prepareDuration === v && styles.prepChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.prepChipText,
                    prepareDuration === v && styles.prepChipTextActive,
                  ]}
                >
                  {v === 0 ? "None" : `${v}s`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalBox}>
          <Feather name="clock" size={14} color={Colors.textMuted} />
          <Text style={styles.totalText}>
            {cycles} cycle{cycles > 1 ? "s" : ""} of {intervals.length} interval{intervals.length !== 1 ? "s" : ""}
            {" "}= ~{totalSecs < 60 ? `${totalSecs}s` : `${(totalSecs / 60).toFixed(1)}m`}
          </Text>
        </View>

        {/* Intervals */}
        <View style={styles.intervalsSection}>
          <Text style={styles.sectionLabel}>Intervals</Text>
          {intervals.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons
                name="timer-sand-empty"
                size={36}
                color={Colors.textMuted}
              />
              <Text style={styles.emptyText}>No intervals yet</Text>
              <Text style={styles.emptySub}>Add work and rest blocks below</Text>
            </View>
          ) : (
            intervals.map((iv, idx) => (
              <IntervalCard
                key={iv.id}
                interval={iv}
                index={idx}
                onUpdate={updateInterval}
                onDelete={deleteInterval}
                onMoveUp={moveUp}
                onMoveDown={moveDown}
                isFirst={idx === 0}
                isLast={idx === intervals.length - 1}
              />
            ))
          )}
        </View>

        {/* Add buttons */}
        <View style={styles.addRow}>
          <Pressable
            onPress={() => addInterval("work")}
            style={[styles.addBtn, styles.addBtnWork]}
          >
            <Feather name="plus" size={16} color={Colors.work} />
            <Text style={[styles.addBtnText, { color: Colors.work }]}>Work</Text>
          </Pressable>
          <Pressable
            onPress={() => addInterval("rest")}
            style={[styles.addBtn, styles.addBtnRest]}
          >
            <Feather name="plus" size={16} color={Colors.rest} />
            <Text style={[styles.addBtnText, { color: Colors.rest }]}>Rest</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  cycleRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  cycleBtn: {
    flex: 1,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceElevated,
  },
  cycleValue: {
    width: 80,
    textAlign: "center",
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  prepRow: {
    flexDirection: "row",
    gap: 8,
  },
  prepChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  prepChipActive: {
    backgroundColor: Colors.accentMuted,
    borderColor: Colors.accent,
  },
  prepChipText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  prepChipTextActive: {
    color: Colors.accent,
    fontFamily: "Inter_600SemiBold",
  },
  totalBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
  },
  totalText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  intervalsSection: {
    marginBottom: 16,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  indexBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  indexText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  cardName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  cardType: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 1,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reorderBtn: {
    padding: 6,
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 14,
    gap: 16,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  durBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  durBtnText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  durValue: {
    flex: 1.5,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 2,
  },
  durValueText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "rgba(255, 69, 58, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 69, 58, 0.2)",
  },
  deleteBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#FF453A",
  },
  addRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  addBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  addBtnWork: {
    backgroundColor: Colors.workGlow,
    borderColor: Colors.work,
  },
  addBtnRest: {
    backgroundColor: Colors.restGlow,
    borderColor: Colors.rest,
  },
  addBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
