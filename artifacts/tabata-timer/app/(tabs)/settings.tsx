import * as Haptics from "expo-haptics";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WheelPicker } from "@/components/WheelPicker";
import Colors from "@/constants/colors";
import { SimpleConfig, TimerMode, useTimer } from "@/context/TimerContext";

// Generate arrays for the wheel pickers
function range(from: number, to: number, step = 1): number[] {
  const arr: number[] = [];
  for (let i = from; i <= to; i += step) arr.push(i);
  return arr;
}

const SECONDS_VALUES = range(0, 59);
const MINUTES_VALUES = range(0, 59);
const CYCLES_VALUES = range(1, 40);
const PREPARE_VALUES = [0, 3, 5, 10, 15, 20, 30];

function formatSec(v: number) {
  return `${v}s`;
}
function formatMin(v: number) {
  return `${v}m`;
}
function formatCycles(v: number) {
  return String(v);
}
function formatPrepare(v: number) {
  return v === 0 ? "off" : `${v}s`;
}

interface DurationWheelProps {
  label: string;
  totalSeconds: number;
  onChange: (secs: number) => void;
  color?: string;
}

function DurationWheel({
  label,
  totalSeconds,
  onChange,
  color = Colors.accent,
}: DurationWheelProps) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  const handleMinsChange = useCallback(
    (m: number) => {
      onChange(m * 60 + secs);
    },
    [secs, onChange]
  );

  const handleSecsChange = useCallback(
    (s: number) => {
      onChange(mins * 60 + s);
    },
    [mins, onChange]
  );

  const displayTotal = () => {
    if (totalSeconds === 0) return "—";
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  };

  return (
    <View style={wheelStyles.container}>
      <View style={wheelStyles.topRow}>
        <View style={[wheelStyles.colorBar, { backgroundColor: color }]} />
        <Text style={wheelStyles.label}>{label}</Text>
        <Text style={[wheelStyles.total, { color }]}>{displayTotal()}</Text>
      </View>
      <View style={wheelStyles.wheelsRow}>
        <View style={wheelStyles.wheelWrap}>
          <Text style={wheelStyles.wheelLabel}>min</Text>
          <WheelPicker
            values={MINUTES_VALUES}
            selectedValue={mins}
            onValueChange={handleMinsChange}
            formatValue={formatMin}
            width={90}
            color={color}
          />
        </View>
        <Text style={wheelStyles.colon}>:</Text>
        <View style={wheelStyles.wheelWrap}>
          <Text style={wheelStyles.wheelLabel}>sec</Text>
          <WheelPicker
            values={SECONDS_VALUES}
            selectedValue={secs}
            onValueChange={handleSecsChange}
            formatValue={formatSec}
            width={90}
            color={color}
          />
        </View>
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

function SummaryCard({ config }: { config: SimpleConfig }) {
  const totalSecs =
    config.prepareDuration +
    config.workDuration * config.cycles +
    config.restDuration * (config.cycles - 1);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const durStr = mins > 0 ? `${mins}m ${secs > 0 ? `${secs}s` : ""}` : `${secs}s`;

  return (
    <View style={summaryStyles.box}>
      <View style={summaryStyles.item}>
        <View style={[summaryStyles.dot, { backgroundColor: Colors.work }]} />
        <Text style={summaryStyles.text}>
          {config.cycles} × {config.workDuration}s work
        </Text>
      </View>
      <View style={summaryStyles.item}>
        <View style={[summaryStyles.dot, { backgroundColor: Colors.rest }]} />
        <Text style={summaryStyles.text}>
          {config.cycles - 1} × {config.restDuration}s rest
        </Text>
      </View>
      <View style={summaryStyles.divider} />
      <View style={summaryStyles.item}>
        <Feather name="clock" size={12} color={Colors.accent} />
        <Text style={[summaryStyles.text, { color: Colors.accent }]}>
          ~{durStr.trim()} total
        </Text>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { mode, setMode, simpleConfig, setSimpleConfig, reset } = useTimer();
  const [local, setLocal] = useState<SimpleConfig>(simpleConfig);

  const update = useCallback(
    (patch: Partial<SimpleConfig>) => {
      setLocal((prev) => {
        const next = { ...prev, ...patch };
        setSimpleConfig(next);
        return next;
      });
      reset();
    },
    [setSimpleConfig, reset]
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { paddingBottom: bottomPad + 90 }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <Text style={styles.title}>Configure</Text>

        <ModeToggle
          mode={mode}
          onSelect={(m) => {
            setMode(m);
            reset();
          }}
        />

        {mode === "simple" ? (
          <View style={styles.section}>
            {/* Cycles */}
            <View style={styles.field}>
              <View style={styles.fieldHeader}>
                <View style={[styles.colorBar, { backgroundColor: Colors.accent }]} />
                <Text style={styles.fieldLabel}>Cycles</Text>
                <Text style={[styles.fieldValue, { color: Colors.accent }]}>
                  {local.cycles}
                </Text>
              </View>
              <View style={styles.wheelCentered}>
                <WheelPicker
                  values={CYCLES_VALUES}
                  selectedValue={local.cycles}
                  onValueChange={(v) => update({ cycles: v })}
                  formatValue={formatCycles}
                  width={100}
                  color={Colors.accent}
                />
              </View>
            </View>

            {/* Prepare */}
            <View style={styles.field}>
              <View style={styles.fieldHeader}>
                <View style={[styles.colorBar, { backgroundColor: Colors.prepare }]} />
                <Text style={styles.fieldLabel}>Prepare</Text>
                <Text style={[styles.fieldValue, { color: Colors.prepare }]}>
                  {formatPrepare(local.prepareDuration)}
                </Text>
              </View>
              <View style={styles.wheelCentered}>
                <WheelPicker
                  values={PREPARE_VALUES}
                  selectedValue={local.prepareDuration}
                  onValueChange={(v) => update({ prepareDuration: v })}
                  formatValue={formatPrepare}
                  width={100}
                  color={Colors.prepare}
                />
              </View>
            </View>

            {/* Work duration */}
            <DurationWheel
              label="Work"
              totalSeconds={local.workDuration}
              onChange={(v) => update({ workDuration: Math.max(1, v) })}
              color={Colors.work}
            />

            {/* Rest duration */}
            <DurationWheel
              label="Rest"
              totalSeconds={local.restDuration}
              onChange={(v) => update({ restDuration: Math.max(1, v) })}
              color={Colors.rest}
            />

            <SummaryCard config={local} />
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.customHint}>
              Design each interval independently with custom labels, types and durations.
            </Text>
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
    gap: 16,
  },
  field: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    paddingBottom: 8,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingBottom: 10,
    gap: 8,
  },
  colorBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  fieldLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  fieldValue: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  wheelCentered: {
    alignItems: "center",
    paddingHorizontal: 12,
  },
  customHint: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
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

const wheelStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingBottom: 10,
    gap: 8,
  },
  colorBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  total: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  wheelsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    gap: 4,
  },
  wheelWrap: {
    alignItems: "center",
    gap: 4,
  },
  wheelLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  colon: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.textMuted,
    marginTop: 20,
    paddingHorizontal: 4,
  },
});

const modeStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
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

const summaryStyles = StyleSheet.create({
  box: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
});
