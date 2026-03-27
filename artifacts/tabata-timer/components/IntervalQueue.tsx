import React, { useEffect, useRef } from "react";
import { LayoutChangeEvent, ScrollView, StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";
import { useI18n } from "@/context/I18nContext";
import { Interval, IntervalType } from "@/context/TimerContext";

interface Props {
  intervals: Interval[];
  currentIndex: number;
}

function getColor(type: IntervalType) {
  switch (type) {
    case "work":    return Colors.work;
    case "rest":    return Colors.rest;
    case "prepare": return Colors.prepare;
  }
}

function formatDur(s: number) {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m${s % 60 > 0 ? ` ${s % 60}s` : ""}`;
}

const GENERIC_WORK_LABELS = ["Work", "Trabajo", "Travail", "Arbeit"];
const GENERIC_REST_LABELS = ["Rest", "Descanso", "Repos", "Ruhe"];

function useDisplayLabel(interval: Interval): string {
  const { t } = useI18n();
  if (interval.type === "prepare") return t("getReady");
  if (interval.type === "work" && GENERIC_WORK_LABELS.includes(interval.label)) return t("work");
  if (interval.type === "rest" && GENERIC_REST_LABELS.includes(interval.label)) return t("rest");
  return interval.label;
}

function IntervalPill({
  interval,
  active,
  done,
  onLayout,
}: {
  interval: Interval;
  active: boolean;
  done: boolean;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  const color = getColor(interval.type);
  const label = useDisplayLabel(interval);
  return (
    <View
      onLayout={onLayout}
      style={[
        styles.pill,
        active && { borderColor: color, backgroundColor: `${color}22` },
        done && styles.pillDone,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: done ? Colors.textMuted : color }]} />
      <Text
        style={[
          styles.pillLabel,
          active && { color: color, fontFamily: "Inter_600SemiBold" },
          done && styles.pillLabelDone,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text style={[styles.pillDur, done && styles.pillLabelDone]}>
        {formatDur(interval.duration)}
      </Text>
    </View>
  );
}

export function IntervalQueue({ intervals, currentIndex }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const pillLayouts = useRef<{ x: number; width: number }[]>([]);
  const viewWidth = useRef(0);

  useEffect(() => {
    if (currentIndex < 0 || currentIndex >= intervals.length) return;
    const pill = pillLayouts.current[currentIndex];
    if (!pill || viewWidth.current === 0) return;
    const centerOffset = pill.x + pill.width / 2 - viewWidth.current / 2;
    scrollRef.current?.scrollTo({ x: Math.max(0, centerOffset), animated: true });
  }, [currentIndex]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      onLayout={(e) => { viewWidth.current = e.nativeEvent.layout.width; }}
      scrollEventThrottle={16}
    >
      {intervals.map((iv, idx) => (
        <IntervalPill
          key={`${iv.id}-${idx}`}
          interval={iv}
          active={idx === currentIndex}
          done={idx < currentIndex}
          onLayout={(e) => {
            const { x, width } = e.nativeEvent.layout;
            pillLayouts.current[idx] = { x, width };
          }}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 4,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillDone: {
    opacity: 0.4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  pillLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    maxWidth: 90,
  },
  pillLabelDone: {
    color: Colors.textMuted,
  },
  pillDur: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
});
