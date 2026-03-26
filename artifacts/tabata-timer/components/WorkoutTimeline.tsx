import React, { useEffect, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import Colors from "@/constants/colors";
import { Interval, TimerStatus } from "@/context/TimerContext";

const TRACK_HEIGHT = 14;
const MARKER_WIDTH = 3;
const MARKER_OVERHANG = 5; // extends above + below the track

function segmentColor(type: string): string {
  switch (type) {
    case "work":    return Colors.work;
    case "rest":    return Colors.rest;
    case "prepare": return Colors.prepare;
    default:        return Colors.border;
  }
}

interface Props {
  intervals: Interval[];
  totalDuration: number;
  totalElapsed: number;
  status: TimerStatus;
}

export function WorkoutTimeline({
  intervals,
  totalDuration,
  totalElapsed,
  status,
}: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const markerX = useSharedValue(0);

  const isIdle     = status === "idle";
  const isComplete = status === "complete";

  // Animate marker position
  useEffect(() => {
    if (trackWidth === 0 || totalDuration === 0) return;
    const pct     = isComplete ? 1 : Math.min(1, totalElapsed / totalDuration);
    const targetX = pct * trackWidth;
    markerX.value = withTiming(targetX, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [totalElapsed, trackWidth, isComplete, totalDuration]);

  const markerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: markerX.value - MARKER_WIDTH / 2 }],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  if (totalDuration === 0) return null;

  // Pre-compute cumulative start times
  const segs: (Interval & { startTime: number; endTime: number })[] = [];
  let cursor = 0;
  for (const iv of intervals) {
    if (iv.duration <= 0) continue;
    segs.push({ ...iv, startTime: cursor, endTime: cursor + iv.duration });
    cursor += iv.duration;
  }

  const pct = isIdle ? 0 : isComplete ? 100 : Math.round((totalElapsed / totalDuration) * 100);

  return (
    <View style={styles.wrapper}>
      <View style={styles.track} onLayout={onLayout}>

        {/* Colour segments — flex-based for perfect proportionality */}
        <View style={styles.segRow}>
          {segs.map((seg, idx) => {
            const isPast    = !isIdle && seg.endTime   <= totalElapsed;
            const isCurrent = !isIdle && seg.startTime <= totalElapsed && seg.endTime > totalElapsed;
            const color     = segmentColor(seg.type);

            const opacity = isIdle
              ? 0.45
              : isComplete
              ? 0.22
              : isPast
              ? 0.18
              : isCurrent
              ? 1
              : 0.65;

            const isFirst = idx === 0;
            const isLast  = idx === segs.length - 1;

            return (
              <View
                key={seg.id}
                style={[
                  styles.segment,
                  {
                    flex: seg.duration,
                    backgroundColor: color,
                    opacity,
                    borderTopLeftRadius:     isFirst ? 6 : 0,
                    borderBottomLeftRadius:  isFirst ? 6 : 0,
                    borderTopRightRadius:    isLast  ? 6 : 0,
                    borderBottomRightRadius: isLast  ? 6 : 0,
                    marginLeft: idx === 0 ? 0 : 1,
                  },
                  // Glow on current segment
                  isCurrent && {
                    shadowColor: color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.9,
                    shadowRadius: 6,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Travelling marker */}
        {!isIdle && trackWidth > 0 && (
          <Animated.View
            style={[styles.marker, markerStyle]}
            pointerEvents="none"
          />
        )}
      </View>

      {/* Percentage label */}
      <Text style={styles.pct}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 6,
    gap: 10,
  },
  track: {
    flex: 1,
    height: TRACK_HEIGHT,
    borderRadius: 6,
    backgroundColor: Colors.border,
    overflow: "visible",
    position: "relative",
    justifyContent: "center",
  },
  segRow: {
    flexDirection: "row",
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 6,
    overflow: "hidden",
  },
  segment: {
    height: "100%",
  },
  marker: {
    position: "absolute",
    top: -MARKER_OVERHANG,
    width: MARKER_WIDTH,
    height: TRACK_HEIGHT + MARKER_OVERHANG * 2,
    backgroundColor: "#FFFFFF",
    borderRadius: MARKER_WIDTH / 2,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
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
