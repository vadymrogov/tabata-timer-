import { Audio } from "expo-av";
import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";

type SoundName = "tick" | "work" | "rest" | "complete";

const SOUND_SOURCES: Record<SoundName, ReturnType<typeof require>> = {
  tick: require("../assets/sounds/tick.wav"),
  work: require("../assets/sounds/work.wav"),
  rest: require("../assets/sounds/rest.wav"),
  complete: require("../assets/sounds/complete.wav"),
};

export function useSounds() {
  const soundsRef = useRef<Partial<Record<SoundName, Audio.Sound>>>({});
  const loadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const entries = Object.entries(SOUND_SOURCES) as [SoundName, any][];
        await Promise.all(
          entries.map(async ([name, source]) => {
            const { sound } = await Audio.Sound.createAsync(source, {
              shouldPlay: false,
              volume: 1.0,
            });
            if (!cancelled) {
              soundsRef.current[name] = sound;
            } else {
              await sound.unloadAsync();
            }
          })
        );
        if (!cancelled) loadedRef.current = true;
      } catch (_e) {
        // Audio unavailable (e.g. web without AudioContext)
      }
    }

    load();

    return () => {
      cancelled = true;
      Object.values(soundsRef.current).forEach((s) => {
        s?.unloadAsync().catch(() => {});
      });
      soundsRef.current = {};
      loadedRef.current = false;
    };
  }, []);

  const play = useCallback(async (name: SoundName) => {
    try {
      const sound = soundsRef.current[name];
      if (!sound) return;
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch (_e) {}
  }, []);

  return { play };
}
