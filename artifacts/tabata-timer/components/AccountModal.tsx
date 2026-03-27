import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Colors from "@/constants/colors";
import { useI18n } from "@/context/I18nContext";
import { useWorkouts } from "@/context/WorkoutsContext";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AccountModal({ visible, onClose }: Props) {
  const { t, language, setLanguage } = useI18n();
  const { completedWorkouts } = useWorkouts();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Ionicons name="person-circle-outline" size={28} color={Colors.text} />
            <Text style={styles.title}>{t("account")}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>{t("language")}</Text>
          <Pressable
            style={styles.langOption}
            onPress={() => { setLanguage("en"); Haptics.selectionAsync(); }}
          >
            <Text style={[styles.langText, language === "en" && styles.langActive]}>
              {t("english")}
            </Text>
            {language === "en" && (
              <Ionicons name="checkmark" size={20} color={Colors.accent} />
            )}
          </Pressable>
          <Pressable
            style={styles.langOption}
            onPress={() => { setLanguage("es"); Haptics.selectionAsync(); }}
          >
            <Text style={[styles.langText, language === "es" && styles.langActive]}>
              {t("spanish")}
            </Text>
            {language === "es" && (
              <Ionicons name="checkmark" size={20} color={Colors.accent} />
            )}
          </Pressable>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>{t("completedRoutines")}</Text>
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
                    <View
                      style={[
                        styles.historyDot,
                        { backgroundColor: w.mode === "simple" ? Colors.work : Colors.rest },
                      ]}
                    />
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

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{t("cancel")}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },
  sectionLabel: {
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
  langText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  langActive: {
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
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
  closeBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
});
