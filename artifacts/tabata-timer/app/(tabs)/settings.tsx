import * as Haptics from "expo-haptics";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Animated,
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
import { useI18n } from "@/context/I18nContext";
import { CustomConfig, SimpleConfig, TimerMode, useTimer } from "@/context/TimerContext";
import { PresetWorkout, SavedWorkout, useWorkouts } from "@/context/WorkoutsContext";

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
  const { t } = useI18n();
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
            {m === "simple" ? t("simple") : t("custom")}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function SummaryCard({ config }: { config: SimpleConfig }) {
  const { t } = useI18n();
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
          {config.cycles} × {config.workDuration}s {t("work").toLowerCase()}
        </Text>
      </View>
      <View style={summaryStyles.item}>
        <View style={[summaryStyles.dot, { backgroundColor: Colors.rest }]} />
        <Text style={summaryStyles.text}>
          {config.cycles - 1} × {config.restDuration}s {t("rest").toLowerCase()}
        </Text>
      </View>
      <View style={summaryStyles.divider} />
      <View style={summaryStyles.item}>
        <Feather name="clock" size={12} color={Colors.accent} />
        <Text style={[summaryStyles.text, { color: Colors.accent }]}>
          ~{durStr.trim()} {t("statTotal").toLowerCase()}
        </Text>
      </View>
    </View>
  );
}

function presetTranslationKey(id: string, suffix: "Name" | "Desc"): string {
  const base = id
    .replace(/^preset-/, "")
    .replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
  const capitalized = base.charAt(0).toUpperCase() + base.slice(1);
  return `preset${capitalized}${suffix}`;
}

function PresetCard({
  preset,
  onLoad,
}: {
  preset: PresetWorkout;
  onLoad: (p: PresetWorkout) => void;
}) {
  const { t } = useI18n();
  const nameKey = presetTranslationKey(preset.id, "Name");
  const descKey = presetTranslationKey(preset.id, "Desc");
  const name = t(nameKey) !== nameKey ? t(nameKey) : preset.name;
  const desc = t(descKey) !== descKey ? t(descKey) : preset.description;
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onLoad(preset);
      }}
      style={presetStyles.card}
    >
      <View style={presetStyles.tagPill}>
        <Text style={presetStyles.tagText}>{preset.tag}</Text>
      </View>
      <View style={presetStyles.info}>
        <Text style={presetStyles.name}>{name}</Text>
        <Text style={presetStyles.desc}>{desc}</Text>
        {preset.simpleConfig && (
          <Text style={presetStyles.meta}>
            {preset.simpleConfig.workDuration}s {t("work").toLowerCase()} · {preset.simpleConfig.restDuration}s {t("rest").toLowerCase()} · {preset.simpleConfig.cycles} {t("cycleSuffixPlural")}
          </Text>
        )}
      </View>
      <Feather name="play-circle" size={24} color={Colors.accent} />
    </Pressable>
  );
}

function SavedCard({
  workout,
  onLoad,
  onEdit,
  onDelete,
}: {
  workout: SavedWorkout;
  onLoad: (w: SavedWorkout) => void;
  onEdit: (w: SavedWorkout) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useI18n();
  const date = new Date(workout.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return (
    <View style={presetStyles.savedCard}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onLoad(workout);
        }}
        style={presetStyles.savedLeft}
      >
        <View>
          <Text style={presetStyles.name}>{workout.name}</Text>
          <Text style={presetStyles.meta}>
            {workout.customConfig
              ? `${workout.customConfig.intervals.length} ${t("intervalSuffixPlural")} · ${workout.customConfig.intervals.filter(iv => iv.type === "work").length} ${t("cycleSuffixPlural")}`
              : ""}{" "}
            · ~{workout.estimatedMinutes}m · {t("saved")} {date}
          </Text>
        </View>
      </Pressable>
      <View style={presetStyles.savedActions}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onLoad(workout);
          }}
          style={presetStyles.loadBtn}
        >
          <Feather name="play" size={14} color={Colors.accent} />
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onEdit(workout);
          }}
          style={presetStyles.editBtn}
        >
          <Feather name="edit-2" size={14} color={Colors.textSecondary} />
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onDelete(workout.id);
          }}
          style={presetStyles.deleteBtn}
        >
          <Feather name="trash-2" size={14} color="#FF453A" />
        </Pressable>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { mode, setMode, simpleConfig, setSimpleConfig, setCustomConfig, reset } = useTimer();
  const { presets, savedWorkouts, deleteWorkout, setEditingWorkoutId } = useWorkouts();
  const [local, setLocal] = useState<SimpleConfig>(simpleConfig);
  const [toastText, setToastText] = useState("");
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback(
    (text: string) => {
      setToastText(text);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      Animated.sequence([
        Animated.timing(toastAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.delay(1800),
        Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    },
    [toastAnim]
  );

  const update = useCallback((patch: Partial<SimpleConfig>) => {
    setLocal((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSelect = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSimpleConfig(local);
    setMode("simple");
    reset();
    showToast(t("toastSet"));
  }, [local, setSimpleConfig, setMode, reset, showToast, t]);

  const loadPreset = useCallback(
    (p: PresetWorkout) => {
      if (p.simpleConfig) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSimpleConfig(p.simpleConfig);
        setLocal(p.simpleConfig);
        setMode("simple");
        reset();
        showToast(t("toastLoaded", { name: p.name }));
      }
    },
    [setSimpleConfig, setMode, reset, showToast, t]
  );

  const loadSavedWorkout = useCallback(
    (w: SavedWorkout) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (w.customConfig) {
        setCustomConfig(w.customConfig);
        setMode("custom");
        reset();
      } else if (w.simpleConfig) {
        setSimpleConfig(w.simpleConfig);
        setLocal(w.simpleConfig);
        setMode("simple");
        reset();
      }
      showToast(t("toastLoaded", { name: w.name }));
    },
    [setCustomConfig, setSimpleConfig, setMode, reset, showToast, t]
  );

  const handleDeleteWorkout = useCallback(
    (id: string) => {
      if (Platform.OS === "web") {
        if (window.confirm(t("deleteConfirmWeb"))) {
          deleteWorkout(id);
        }
        return;
      }
      Alert.alert(
        t("deleteTitle"),
        t("deleteMsg"),
        [
          { text: t("cancel"), style: "cancel" },
          {
            text: t("confirmDelete"),
            style: "destructive",
            onPress: () => deleteWorkout(id),
          },
        ]
      );
    },
    [deleteWorkout, t]
  );

  const handleEditWorkout = useCallback(
    (w: SavedWorkout) => {
      if (!w.customConfig) return;
      setEditingWorkoutId(w.id);
      setCustomConfig(w.customConfig);
      router.push("/custom-config");
    },
    [setEditingWorkoutId, setCustomConfig]
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { paddingBottom: bottomPad + 90 }]}>
      {/* Toast banner */}
      <Animated.View
        style={[
          styles.toast,
          {
            top: topPad + 8,
            opacity: toastAnim,
            transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
          },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.toastText}>{toastText}</Text>
      </Animated.View>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <Text style={styles.title}>{t("configure")}</Text>

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
                <Text style={styles.fieldLabel}>{t("cycles")}</Text>
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
                <Text style={styles.fieldLabel}>{t("prepare")}</Text>
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
              label={t("work")}
              totalSeconds={local.workDuration}
              onChange={(v) => update({ workDuration: Math.max(1, v) })}
              color={Colors.work}
            />

            {/* Rest duration */}
            <DurationWheel
              label={t("rest")}
              totalSeconds={local.restDuration}
              onChange={(v) => update({ restDuration: Math.max(1, v) })}
              color={Colors.rest}
            />

            <SummaryCard config={local} />

            <Pressable onPress={handleSelect} style={styles.selectBtn}>
              <Text style={styles.selectBtnText}>{t("select")}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.customHint}>
              {t("customHint")}
            </Text>
            <Pressable
              style={styles.customBtn}
              onPress={() => router.push("/custom-config")}
            >
              <View style={styles.customBtnInner}>
                <Ionicons name="construct-outline" size={20} color={Colors.accent} />
                <Text style={styles.customBtnText}>{t("editCustom")}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.textMuted} />
            </Pressable>
          </View>
        )}

        {/* ─── Saved Workouts ─── */}
        {savedWorkouts.length > 0 && (
          <View style={styles.workoutsSection}>
            <Text style={styles.sectionHeader}>{t("savedWorkouts")}</Text>
            {savedWorkouts.map((w) => (
              <SavedCard
                key={w.id}
                workout={w}
                onLoad={loadSavedWorkout}
                onEdit={handleEditWorkout}
                onDelete={handleDeleteWorkout}
              />
            ))}
          </View>
        )}

        {/* ─── Presets ─── */}
        <View style={styles.workoutsSection}>
          <Text style={styles.sectionHeader}>{t("workoutPresets")}</Text>
          <Text style={styles.sectionSub}>{t("presetsSubtitle")}</Text>
          {presets.map((p) => (
            <PresetCard key={p.id} preset={p} onLoad={loadPreset} />
          ))}
        </View>

        <View style={{ height: 20 }} />
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
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 100,
    backgroundColor: Colors.rest,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: Colors.rest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  toastText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    textAlign: "center",
  },
  workoutsSection: {
    marginTop: 28,
    gap: 10,
  },
  sectionHeader: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginBottom: 4,
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
  selectBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  selectBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.3,
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

const presetStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 12,
  },
  tagPill: {
    backgroundColor: Colors.accentMuted,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 52,
    alignItems: "center",
  },
  tagText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: Colors.accent,
    letterSpacing: 0.3,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  desc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  meta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: 1,
  },
  savedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 10,
  },
  savedLeft: {
    flex: 1,
  },
  savedActions: {
    flexDirection: "row",
    gap: 8,
  },
  loadBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,69,58,0.1)",
    alignItems: "center",
    justifyContent: "center",
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
