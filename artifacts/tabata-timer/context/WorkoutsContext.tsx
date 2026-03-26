import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { CustomConfig, SimpleConfig } from "@/context/TimerContext";

export type WorkoutType = "simple" | "custom";

export interface SavedWorkout {
  id: string;
  name: string;
  createdAt: number;
  type: WorkoutType;
  simpleConfig?: SimpleConfig;
  customConfig?: CustomConfig;
  estimatedMinutes: number;
}

export interface PresetWorkout {
  id: string;
  name: string;
  description: string;
  type: WorkoutType;
  simpleConfig?: SimpleConfig;
  estimatedMinutes: number;
  tag: string;
}

function estimateMinutes(cfg: SimpleConfig): number {
  const secs =
    cfg.prepareDuration +
    cfg.workDuration * cfg.cycles +
    cfg.restDuration * (cfg.cycles - 1);
  return Math.round(secs / 60);
}

export const PRESETS: PresetWorkout[] = [
  {
    id: "preset-tabata-classic",
    name: "Classic Tabata",
    description: "The original protocol",
    type: "simple",
    tag: "4 min",
    simpleConfig: { workDuration: 20, restDuration: 10, cycles: 8, prepareDuration: 5 },
    estimatedMinutes: 4,
  },
  {
    id: "preset-quick-burn",
    name: "Quick Burn",
    description: "Fast & effective",
    type: "simple",
    tag: "7 min",
    simpleConfig: { workDuration: 30, restDuration: 10, cycles: 12, prepareDuration: 5 },
    estimatedMinutes: 7,
  },
  {
    id: "preset-sprint",
    name: "Sprint HIIT",
    description: "Short but brutal",
    type: "simple",
    tag: "8 min",
    simpleConfig: { workDuration: 15, restDuration: 45, cycles: 8, prepareDuration: 5 },
    estimatedMinutes: 8,
  },
  {
    id: "preset-10min",
    name: "10 Minute Grind",
    description: "Steady & strong",
    type: "simple",
    tag: "10 min",
    simpleConfig: { workDuration: 40, restDuration: 20, cycles: 10, prepareDuration: 10 },
    estimatedMinutes: 10,
  },
  {
    id: "preset-12min",
    name: "Circuit 12",
    description: "Full body circuit",
    type: "simple",
    tag: "12 min",
    simpleConfig: { workDuration: 45, restDuration: 15, cycles: 12, prepareDuration: 10 },
    estimatedMinutes: 12,
  },
  {
    id: "preset-15min",
    name: "Cardio Blast",
    description: "Get your heart pumping",
    type: "simple",
    tag: "15 min",
    simpleConfig: { workDuration: 50, restDuration: 10, cycles: 15, prepareDuration: 10 },
    estimatedMinutes: 15,
  },
  {
    id: "preset-endurance",
    name: "Endurance Builder",
    description: "Longer rests, higher output",
    type: "simple",
    tag: "15 min",
    simpleConfig: { workDuration: 60, restDuration: 30, cycles: 10, prepareDuration: 10 },
    estimatedMinutes: 15,
  },
  {
    id: "preset-20min",
    name: "20 Minute Blaster",
    description: "Medium-long burn",
    type: "simple",
    tag: "20 min",
    simpleConfig: { workDuration: 50, restDuration: 20, cycles: 17, prepareDuration: 10 },
    estimatedMinutes: 20,
  },
  {
    id: "preset-25min",
    name: "25 Min Crusher",
    description: "Advanced endurance",
    type: "simple",
    tag: "25 min",
    simpleConfig: { workDuration: 45, restDuration: 15, cycles: 25, prepareDuration: 10 },
    estimatedMinutes: 25,
  },
  {
    id: "preset-30min",
    name: "30 Min Warrior",
    description: "Full session, no shortcuts",
    type: "simple",
    tag: "30 min",
    simpleConfig: { workDuration: 50, restDuration: 10, cycles: 30, prepareDuration: 10 },
    estimatedMinutes: 30,
  },
];

const STORAGE_KEY = "tabata_saved_workouts";

interface WorkoutsContextValue {
  savedWorkouts: SavedWorkout[];
  presets: PresetWorkout[];
  saveWorkout: (name: string, customConfig: CustomConfig) => Promise<SavedWorkout>;
  deleteWorkout: (id: string) => Promise<void>;
}

const WorkoutsContext = createContext<WorkoutsContextValue | null>(null);

export function WorkoutsProvider({ children }: { children: React.ReactNode }) {
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setSavedWorkouts(JSON.parse(raw));
        } catch {}
      }
    });
  }, []);

  const saveWorkout = useCallback(
    async (name: string, customConfig: CustomConfig): Promise<SavedWorkout> => {
      const totalSecs =
        customConfig.prepareDuration +
        customConfig.intervals.reduce((s, iv) => s + iv.duration, 0) * customConfig.cycles;
      const workout: SavedWorkout = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
        name,
        createdAt: Date.now(),
        type: "custom",
        customConfig,
        estimatedMinutes: Math.round(totalSecs / 60),
      };
      setSavedWorkouts((prev) => {
        const next = [workout, ...prev];
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      return workout;
    },
    []
  );

  const deleteWorkout = useCallback(async (id: string) => {
    setSavedWorkouts((prev) => {
      const next = prev.filter((w) => w.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <WorkoutsContext.Provider
      value={{ savedWorkouts, presets: PRESETS, saveWorkout, deleteWorkout }}
    >
      {children}
    </WorkoutsContext.Provider>
  );
}

export function useWorkouts(): WorkoutsContextValue {
  const ctx = useContext(WorkoutsContext);
  if (!ctx) throw new Error("useWorkouts must be used within WorkoutsProvider");
  return ctx;
}
