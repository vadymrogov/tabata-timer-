import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type IntervalType = "work" | "rest" | "prepare";

export interface Interval {
  id: string;
  type: IntervalType;
  label: string;
  duration: number;
}

export type TimerMode = "simple" | "custom";

export interface SimpleConfig {
  workDuration: number;
  restDuration: number;
  cycles: number;
  prepareDuration: number;
}

export interface CustomConfig {
  cycles: number;
  intervals: Interval[];
  prepareDuration: number;
}

export type TimerStatus = "idle" | "running" | "paused" | "complete";

interface TimerState {
  status: TimerStatus;
  currentIntervalIndex: number;
  currentCycle: number;
  timeRemaining: number;
  totalElapsed: number;
}

interface TimerContextValue {
  mode: TimerMode;
  setMode: (m: TimerMode) => void;
  simpleConfig: SimpleConfig;
  setSimpleConfig: (c: SimpleConfig) => void;
  customConfig: CustomConfig;
  setCustomConfig: (c: CustomConfig) => void;
  timerState: TimerState;
  currentIntervals: Interval[];
  totalDuration: number;
  soundEnabled: boolean;
  toggleSound: () => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
}

const DEFAULT_SIMPLE: SimpleConfig = {
  workDuration: 20,
  restDuration: 10,
  cycles: 8,
  prepareDuration: 5,
};

const DEFAULT_CUSTOM: CustomConfig = {
  cycles: 3,
  prepareDuration: 5,
  intervals: [
    { id: "1", type: "work", label: "Squat Jumps", duration: 30 },
    { id: "2", type: "rest", label: "Rest", duration: 10 },
    { id: "3", type: "work", label: "Push-ups", duration: 25 },
    { id: "4", type: "rest", label: "Rest", duration: 15 },
  ],
};

const IDLE_STATE: TimerState = {
  status: "idle",
  currentIntervalIndex: -1,
  currentCycle: 0,
  timeRemaining: 0,
  totalElapsed: 0,
};

const TimerContext = createContext<TimerContextValue | null>(null);

function buildSimpleIntervals(cfg: SimpleConfig): Interval[] {
  const intervals: Interval[] = [];
  intervals.push({
    id: "prepare",
    type: "prepare",
    label: "Get Ready",
    duration: cfg.prepareDuration,
  });
  for (let i = 0; i < cfg.cycles; i++) {
    intervals.push({
      id: `work-${i}`,
      type: "work",
      label: "Work",
      duration: cfg.workDuration,
    });
    if (i < cfg.cycles - 1) {
      intervals.push({
        id: `rest-${i}`,
        type: "rest",
        label: "Rest",
        duration: cfg.restDuration,
      });
    }
  }
  return intervals;
}

function buildCustomIntervals(cfg: CustomConfig): Interval[] {
  if (cfg.intervals.length === 0) return [];
  const base: Interval[] = [];
  base.push({
    id: "prepare",
    type: "prepare",
    label: "Get Ready",
    duration: cfg.prepareDuration,
  });
  for (let c = 0; c < cfg.cycles; c++) {
    cfg.intervals.forEach((iv) => {
      base.push({ ...iv, id: `${iv.id}-cycle${c}` });
    });
  }
  return base;
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<TimerMode>("simple");
  const [simpleConfig, setSimpleConfigState] = useState<SimpleConfig>(DEFAULT_SIMPLE);
  const [customConfig, setCustomConfigState] = useState<CustomConfig>(DEFAULT_CUSTOM);
  const [timerState, setTimerState] = useState<TimerState>(IDLE_STATE);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(timerState);
  stateRef.current = timerState;

  useEffect(() => {
    AsyncStorage.getItem("tabata_simple").then((v) => {
      if (v) setSimpleConfigState(JSON.parse(v));
    });
    AsyncStorage.getItem("tabata_custom").then((v) => {
      if (v) setCustomConfigState(JSON.parse(v));
    });
    AsyncStorage.getItem("tabata_mode").then((v) => {
      if (v) setMode(v as TimerMode);
    });
    AsyncStorage.getItem("tabata_sound").then((v) => {
      if (v !== null) setSoundEnabled(v === "1");
    });
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      AsyncStorage.setItem("tabata_sound", next ? "1" : "0");
      return next;
    });
  }, []);

  const setSimpleConfig = useCallback((c: SimpleConfig) => {
    setSimpleConfigState(c);
    AsyncStorage.setItem("tabata_simple", JSON.stringify(c));
  }, []);

  const setCustomConfig = useCallback((c: CustomConfig) => {
    setCustomConfigState(c);
    AsyncStorage.setItem("tabata_custom", JSON.stringify(c));
  }, []);

  const handleSetMode = useCallback((m: TimerMode) => {
    setMode(m);
    AsyncStorage.setItem("tabata_mode", m);
  }, []);

  const currentIntervals =
    mode === "simple"
      ? buildSimpleIntervals(simpleConfig)
      : buildCustomIntervals(customConfig);

  const totalDuration = currentIntervals.reduce((s, iv) => s + iv.duration, 0);

  const stopTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const advanceInterval = useCallback(
    (state: TimerState, intervals: Interval[]): TimerState => {
      const next = state.currentIntervalIndex + 1;
      if (next >= intervals.length) {
        return {
          ...state,
          status: "complete",
          currentIntervalIndex: intervals.length - 1,
          timeRemaining: 0,
          totalElapsed: intervals.reduce((s, iv) => s + iv.duration, 0),
        };
      }
      const nextIv = intervals[next];
      const cycleIdx = intervals
        .slice(0, next + 1)
        .filter((iv) => iv.type === "work").length;
      const cumulativeElapsed = intervals
        .slice(0, next)
        .reduce((s, iv) => s + iv.duration, 0);
      return {
        ...state,
        status: "running",
        currentIntervalIndex: next,
        currentCycle: cycleIdx,
        timeRemaining: nextIv.duration,
        totalElapsed: cumulativeElapsed,
      };
    },
    []
  );

  const startTick = useCallback(
    (intervals: Interval[]) => {
      stopTick();
      intervalRef.current = setInterval(() => {
        setTimerState((prev) => {
          if (prev.status !== "running") return prev;
          if (prev.timeRemaining > 1) {
            return {
              ...prev,
              timeRemaining: prev.timeRemaining - 1,
              totalElapsed: prev.totalElapsed + 1,
            };
          }
          const next = advanceInterval(
            { ...prev, timeRemaining: 0, totalElapsed: prev.totalElapsed + 1 },
            intervals
          );
          if (next.status === "complete") {
            stopTick();
          }
          return next;
        });
      }, 1000);
    },
    [stopTick, advanceInterval]
  );

  const start = useCallback(() => {
    const intervals = currentIntervals;
    if (intervals.length === 0) return;
    const first = intervals[0];
    const newState: TimerState = {
      status: "running",
      currentIntervalIndex: 0,
      currentCycle: first.type === "work" ? 1 : 0,
      timeRemaining: first.duration,
      totalElapsed: 0,
    };
    setTimerState(newState);
    startTick(intervals);
  }, [currentIntervals, startTick]);

  const pause = useCallback(() => {
    stopTick();
    setTimerState((prev) => ({ ...prev, status: "paused" }));
  }, [stopTick]);

  const resume = useCallback(() => {
    setTimerState((prev) => {
      if (prev.status !== "paused") return prev;
      return { ...prev, status: "running" };
    });
    startTick(currentIntervals);
  }, [currentIntervals, startTick]);

  const reset = useCallback(() => {
    stopTick();
    setTimerState(IDLE_STATE);
  }, [stopTick]);

  const skip = useCallback(() => {
    setTimerState((prev) => {
      const next = advanceInterval(prev, currentIntervals);
      if (next.status === "complete") stopTick();
      return next;
    });
  }, [currentIntervals, advanceInterval, stopTick]);

  useEffect(() => {
    return () => stopTick();
  }, [stopTick]);

  return (
    <TimerContext.Provider
      value={{
        mode,
        setMode: handleSetMode,
        simpleConfig,
        setSimpleConfig,
        customConfig,
        setCustomConfig,
        timerState,
        currentIntervals,
        totalDuration,
        soundEnabled,
        toggleSound,
        start,
        pause,
        resume,
        reset,
        skip,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within TimerProvider");
  return ctx;
}
