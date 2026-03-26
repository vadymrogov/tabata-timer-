import * as Haptics from "expo-haptics";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { SimpleConfig, TimerMode, useTimer } from "@/context/TimerContext";

interface DurationPickerProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  color?: string;
}

function DurationPicker({
  label,
  value,
  onChange,
  min = 1,
  max = 3600,
  color = Colors.accent,
}: DurationPickerProps) {
  const adjust = (delta: number) => {
    Haptics.selectionAsync();
    const next = Math.max(min, Math.min(max, value + delta));
    onChange(next);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m === 0) return `${sec}s`;
    if (sec === 0) return `${m}m`;
    return `${m}m ${sec}s`;
  };

  const STEPS = [5, 15, 30, 60];

  return (
    <View style={pickerStyles.wrap}>
      <Text style={pickerStyles.label}>{label}</Text>
      <View style={pickerStyles.row}>
        <View style={pickerStyles.stepsLeft}>
          {STEPS.map((s) => (
            <Pressable
              key={`-${s}`}
              onPress={() => adjust(-s)}
              style={pickerStyles.stepBtn}
            >
              <Text style={pickerStyles.stepText}>-{s < 60 ? `${s}s` : `${s / 60}m`}</Text>
            </Pressable>
          ))}
        </View>
        <View style={[pickerStyles.valueBox, { borderColor: color }]}>
          <Text style={[pickerStyles.value, { color }]}>{fmt(value)}</Text>
        </View>
        <View style={pickerStyles.stepsRight}>
          {STEPS.map((s) => (
            <Pressable
              key={`+${s}`}
              onPress={() => adjust(s)}
              style={pickerStyles.stepBtn}
            >
              <Text style={pickerStyles.stepText}>+{s < 60 ? `${s}s` : `${s / 60}m`}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function CyclePicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const adjust = (d: number) => {
    Haptics.selectionAsync();
    onChange(Math.max(1, Math.min(99, value + d)));
  };

  return (
    <View style={pickerStyles.cycleWrap}>
      <Text style={pickerStyles.label}>Cycles</Text>
      <View style={pickerStyles.cycleRow}>
        <Pressable onPress={() => adjust(-1)} style={pickerStyles.cycleBtn}>
          <Feather name="minus" size={20} color={Colors.text} />
        </Pressable>
        <Text style={pickerStyles.cycleValue}>{value}</Text>
        <Pressable onPress={() => adjust(1)} style={pickerStyles.cycleBtn}>
          <Feather name="plus" size={20} color={Colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

function ModeToggle({
  mode,
  onSelect,
}: {
  mode: TimerMode;
  onSelect: (m: TimerMode) => void;
}) {
  return (
    <View style={modeStyles.container}>
      {(["simple", "custom"] as TimerMode[]).map((m) => (
        <Pressable
          key={m}
          onPress={() => {
            Haptics.selectionAsync();
            onSelect(m);
          }}
          style={[modeStyles.tab, mode === m && modeStyles.tabActive]}
        >
          <Text
            style={[modeStyles.tabText, mode === m && modeStyles.tabTextActive]}
          >
            {m === "simple" ? "Simple" : "Custom"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { mode, setMode, simpleConfig, setSimpleConfig, reset } = useTimer();
  const [local, setLocal] = useState<SimpleConfig>(simpleConfig);

  const update = (patch: Partial<SimpleConfig>) => {
    setLocal((prev) => {
      const next = { ...prev, ...patch };
      setSimpleConfig(next);
      return next;
    });
    reset();
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { paddingBottom: bottomPad + 90 }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Configure</Text>

        <ModeToggle mode={mode} onSelect={(m) => { setMode(m); reset(); }} />

        {mode === "simple" ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Simple Mode</Text>
            <Text style={styles.sectionSub}>Set work, rest and repeat count</Text>

            <CyclePicker value={local.cycles} onChange={(v) => update({ cycles: v })} />

            <DurationPicker
              label="Prepare Duration"
              value={local.prepareDuration}
              onChange={(v) => update({ prepareDuration: v })}
              color={Colors.prepare}
            />

            <DurationPicker
              label="Work Duration"
              value={local.workDuration}
              onChange={(v) => update({ workDuration: v })}
              color={Colors.work}
            />

            <DurationPicker
              label="Rest Duration"
              value={local.restDuration}
              onChange={(v) => update({ restDuration: v })}
              color={Colors.rest}
            />

            <View style={styles.summaryBox}>
              <Feather name="info" size={14} color={Colors.textMuted} />
              <Text style={styles.summaryText}>
                {local.cycles} rounds × ({local.workDuration}s work + {local.restDuration}s rest)
                {" "}= ~{Math.round((local.workDuration * local.cycles + local.restDuration * (local.cycles - 1) + local.prepareDuration) / 60 * 10) / 10} min
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Custom Mode</Text>
            <Text style={styles.sectionSub}>Design each interval independently</Text>
            <Pressable
              style={styles.customBtn}
              onPress={() => router.push("/custom-config")}
            >
              <View style={styles.customBtnInner}>
                <Ionicons name="construct-outline" size={20} color={Colors.accent} />
                <Text style={styles.customBtnText}>Edit Custom Intervals</Text>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.textMuted} />
            </Pressable>
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginBottom: 20,
  },
  summaryBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  summaryText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  customBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  customBtnText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
});

const pickerStyles = StyleSheet.create({
  wrap: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepsLeft: {
    flexDirection: "column",
    gap: 4,
    flex: 1,
  },
  stepsRight: {
    flexDirection: "column",
    gap: 4,
    flex: 1,
  },
  stepBtn: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  valueBox: {
    width: 90,
    height: 72,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  value: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  cycleWrap: {
    marginBottom: 20,
  },
  cycleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
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
});

const modeStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 9,
  },
  tabActive: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
    fontFamily: "Inter_600SemiBold",
  },
});
