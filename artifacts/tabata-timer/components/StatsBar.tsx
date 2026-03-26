import React from "react";
import { StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";
import { useI18n } from "@/context/I18nContext";

interface Props {
  currentCycle: number;
  totalCycles: number;
  totalDuration: number;
  elapsed: number;
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function StatsBar({
  currentCycle,
  totalCycles,
  totalDuration,
  elapsed,
}: Props) {
  const { t } = useI18n();
  return (
    <View style={styles.container}>
      <Stat label={t("statRound")} value={`${currentCycle} / ${totalCycles}`} />
      <Divider />
      <Stat label={t("statElapsed")} value={formatTime(elapsed)} />
      <Divider />
      <Stat label={t("statTotal")} value={formatTime(totalDuration)} />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  value: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
});
