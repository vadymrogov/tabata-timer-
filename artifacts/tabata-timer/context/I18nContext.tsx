import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Language = "en" | "es";

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    appTitle: "Tábata",
    pressToStart: "Press play to start",
    complete: "Complete!",
    crushedIt: "You crushed it.",
    labelWork: "WORK",
    labelRest: "REST",
    labelReady: "READY",
    statRound: "Round",
    statElapsed: "Elapsed",
    statTotal: "Total",
    configure: "Configure",
    simple: "Simple",
    custom: "Custom",
    cycles: "Cycles",
    prepare: "Prepare",
    work: "Work",
    rest: "Rest",
    select: "Select",
    savedWorkouts: "Saved Workouts",
    workoutPresets: "Workout Presets",
    presetsSubtitle: "Tap any preset to load it instantly",
    editCustom: "Edit Custom Intervals",
    customHint: "Design each interval independently with custom labels, types and durations.",
    toastLoaded: `✓ "{name}" loaded — go to Timer to start`,
    toastSet: "✓ Workout set — go to Timer to start",
    customIntervals: "Custom Intervals",
    editWorkout: "Edit Workout",
    saveWorkout: "Save Workout",
    updateWorkout: "Update Workout",
    saveModalTitle: "Save Workout",
    updateModalTitle: "Update Workout",
    saveModalSub: "Give your workout a name",
    editModalSub: "Edit the workout name",
    namePlaceholder: "e.g. Morning HIIT",
    cancel: "Cancel",
    save: "Save",
    update: "Update",
    saving: "Saving…",
    addWork: "Work",
    addRest: "Rest",
    nameRequired: "Name required",
    nameRequiredMsg: "Give your workout a name to save it.",
    noIntervals: "No intervals",
    noIntervalsMsg: "Add at least one interval before saving.",
    savedBang: "Saved!",
    savedMsg: `"{name}" has been saved to your workouts.`,
    error: "Error",
    errorMsg: "Failed to save workout.",
    deleteTitle: "Delete workout?",
    deleteMsg: "This cannot be undone.",
    confirmDelete: "Delete",
    deleteConfirmWeb: "Delete workout? This cannot be undone.",
    language: "Language",
    english: "English",
    spanish: "Spanish",
    account: "Account",
    getReady: "Get Ready",
    saved: "Saved",
    fieldLabel: "Label",
    fieldType: "Type",
    fieldDuration: "Duration",
    removeInterval: "Remove Interval",
    intervals: "Intervals",
    prepareDuration: "Prepare Duration",
    none: "None",
    noIntervalsYet: "No intervals yet",
    noIntervalsYetSub: "Add work and rest blocks below",
    cycleSuffix: "cycle",
    cycleSuffixPlural: "cycles",
    intervalSuffix: "interval",
    intervalSuffixPlural: "intervals",
    saveToHistory: "Save to History",
    savedToHistory: "✓ Saved to History",
    completedRoutines: "Completed Routines",
    historyEmpty: "No completed routines yet",
    historyRounds: "rounds",
    presetTabataClassicName: "Classic Tabata",
    presetTabataClassicDesc: "The original protocol",
    presetQuickBurnName: "Quick Burn",
    presetQuickBurnDesc: "Fast & effective",
    presetSprintName: "Sprint HIIT",
    presetSprintDesc: "Short but brutal",
    preset10minName: "10 Minute Grind",
    preset10minDesc: "Steady & strong",
    preset12minName: "Circuit 12",
    preset12minDesc: "Full body circuit",
    preset15minName: "Cardio Blast",
    preset15minDesc: "Get your heart pumping",
    presetEnduranceName: "Endurance Builder",
    presetEnduranceDesc: "Longer rests, higher output",
    preset20minName: "20 Minute Blaster",
    preset20minDesc: "Medium-long burn",
    preset25minName: "25 Min Crusher",
    preset25minDesc: "Advanced endurance",
    preset30minName: "30 Min Warrior",
    preset30minDesc: "Full session, no shortcuts",
  },
  es: {
    appTitle: "Tábata",
    pressToStart: "Presiona play para iniciar",
    complete: "¡Completado!",
    crushedIt: "Lo lograste.",
    labelWork: "TRABAJO",
    labelRest: "DESCANSO",
    labelReady: "LISTO",
    statRound: "Ronda",
    statElapsed: "Tiempo",
    statTotal: "Total",
    configure: "Configurar",
    simple: "Simple",
    custom: "Personalizado",
    cycles: "Ciclos",
    prepare: "Preparar",
    work: "Trabajo",
    rest: "Descanso",
    select: "Seleccionar",
    savedWorkouts: "Rutinas Guardadas",
    workoutPresets: "Rutinas Predefinidas",
    presetsSubtitle: "Toca una rutina para cargarla al instante",
    editCustom: "Editar Intervalos",
    customHint: "Diseña cada intervalo con etiquetas, tipos y duraciones personalizadas.",
    toastLoaded: `✓ "{name}" cargada — ve al Temporizador`,
    toastSet: "✓ Rutina configurada — ve al Temporizador",
    customIntervals: "Intervalos Personalizados",
    editWorkout: "Editar Rutina",
    saveWorkout: "Guardar Rutina",
    updateWorkout: "Actualizar Rutina",
    saveModalTitle: "Guardar Rutina",
    updateModalTitle: "Actualizar Rutina",
    saveModalSub: "Dale un nombre a tu rutina",
    editModalSub: "Edita el nombre de la rutina",
    namePlaceholder: "ej. HIIT Mañanero",
    cancel: "Cancelar",
    save: "Guardar",
    update: "Actualizar",
    saving: "Guardando…",
    addWork: "Trabajo",
    addRest: "Descanso",
    nameRequired: "Nombre requerido",
    nameRequiredMsg: "Dale un nombre a tu rutina para guardarla.",
    noIntervals: "Sin intervalos",
    noIntervalsMsg: "Agrega al menos un intervalo antes de guardar.",
    savedBang: "¡Guardado!",
    savedMsg: `"{name}" ha sido guardada en tus rutinas.`,
    error: "Error",
    errorMsg: "No se pudo guardar la rutina.",
    deleteTitle: "¿Eliminar rutina?",
    deleteMsg: "Esta acción no se puede deshacer.",
    confirmDelete: "Eliminar",
    deleteConfirmWeb: "¿Eliminar rutina? Esta acción no se puede deshacer.",
    language: "Idioma",
    english: "Inglés",
    spanish: "Español",
    account: "Cuenta",
    getReady: "Prepárate",
    saved: "Guardado",
    fieldLabel: "Etiqueta",
    fieldType: "Tipo",
    fieldDuration: "Duración",
    removeInterval: "Eliminar Intervalo",
    intervals: "Intervalos",
    prepareDuration: "Duración de Preparación",
    none: "Ninguno",
    noIntervalsYet: "Sin intervalos aún",
    noIntervalsYetSub: "Agrega bloques de trabajo y descanso abajo",
    cycleSuffix: "ciclo",
    cycleSuffixPlural: "ciclos",
    intervalSuffix: "intervalo",
    intervalSuffixPlural: "intervalos",
    saveToHistory: "Guardar en Historial",
    savedToHistory: "✓ Guardado en Historial",
    completedRoutines: "Rutinas Completadas",
    historyEmpty: "Aún no hay rutinas completadas",
    historyRounds: "rondas",
    presetTabataClassicName: "Tábata Clásico",
    presetTabataClassicDesc: "El protocolo original",
    presetQuickBurnName: "Quema Rápida",
    presetQuickBurnDesc: "Rápido y efectivo",
    presetSprintName: "Sprint HIIT",
    presetSprintDesc: "Corto pero intenso",
    preset10minName: "Triturador de 10 min",
    preset10minDesc: "Constante y fuerte",
    preset12minName: "Circuito 12",
    preset12minDesc: "Circuito de cuerpo completo",
    preset15minName: "Explosión Cardio",
    preset15minDesc: "Acelera tu corazón",
    presetEnduranceName: "Constructor de Resistencia",
    presetEnduranceDesc: "Más descanso, mayor rendimiento",
    preset20minName: "Explosión de 20 min",
    preset20minDesc: "Quema media-larga",
    preset25minName: "Trituradora de 25 min",
    preset25minDesc: "Resistencia avanzada",
    preset30minName: "Guerrero de 30 min",
    preset30minDesc: "Sesión completa, sin atajos",
  },
};

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    AsyncStorage.getItem("tabata_language").then((v) => {
      if (v === "en" || v === "es") setLanguageState(v as Language);
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem("tabata_language", lang);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string>): string => {
      let str = TRANSLATIONS[language][key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          str = str.replace(`{${k}}`, v);
        });
      }
      return str;
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
