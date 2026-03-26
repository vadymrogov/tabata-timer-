import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Colors from "@/constants/colors";

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface WheelPickerProps {
  values: number[];
  selectedValue: number;
  onValueChange: (val: number) => void;
  formatValue?: (val: number) => string;
  width?: number;
  color?: string;
}

export function WheelPicker({
  values,
  selectedValue,
  onValueChange,
  formatValue = (v) => String(v),
  width = 110,
  color = Colors.accent,
}: WheelPickerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const lastCommittedIndex = useRef(-1);
  const isMounting = useRef(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const selectedIndex = Math.max(0, values.indexOf(selectedValue));

  // Scroll to selected on mount (and when external value changes)
  useEffect(() => {
    const delay = isMounting.current ? 100 : 50;
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: selectedIndex * ITEM_HEIGHT,
        animated: !isMounting.current,
      });
      isMounting.current = false;
    }, delay);
    return () => clearTimeout(t);
  }, [selectedIndex]);

  // Shared commit logic
  const commitIndex = useCallback(
    (rawY: number, animated = true) => {
      const idx = Math.round(rawY / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(values.length - 1, idx));
      // Snap the scroll position
      scrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated });
      if (clamped !== lastCommittedIndex.current) {
        lastCommittedIndex.current = clamped;
        Haptics.selectionAsync();
        const val = values[clamped];
        if (val !== selectedValue) {
          onValueChange(val);
        }
      }
    },
    [values, selectedValue, onValueChange]
  );

  // Web: debounce onScroll to detect stop
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (Platform.OS !== "web") return;
      const y = e.nativeEvent.contentOffset.y;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        commitIndex(y);
      }, 120);
    },
    [commitIndex]
  );

  // Native: momentum end
  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      commitIndex(e.nativeEvent.contentOffset.y, false);
    },
    [commitIndex]
  );

  // Native: slow drag release
  const onScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      commitIndex(e.nativeEvent.contentOffset.y);
    },
    [commitIndex]
  );

  // Tap an item directly to select it
  const handleTap = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(values.length - 1, idx));
      scrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
      lastCommittedIndex.current = clamped;
      Haptics.selectionAsync();
      const val = values[clamped];
      if (val !== selectedValue) {
        onValueChange(val);
      }
    },
    [values, selectedValue, onValueChange]
  );

  return (
    <View style={[styles.container, { width, height: PICKER_HEIGHT }]}>
      {/* Selection highlight lines */}
      <View
        style={[styles.selectionTop, { top: ITEM_HEIGHT * 2, borderColor: color }]}
        pointerEvents="none"
      />
      <View
        style={[styles.selectionBottom, { top: ITEM_HEIGHT * 3, borderColor: color }]}
        pointerEvents="none"
      />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate={Platform.OS === "ios" ? "fast" : 0.9}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollEndDrag={onScrollEndDrag}
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
        nestedScrollEnabled
      >
        {values.map((val, idx) => {
          const dist = Math.abs(idx - selectedIndex);
          const opacity = dist === 0 ? 1 : dist === 1 ? 0.5 : 0.2;
          const scale = dist === 0 ? 1 : dist === 1 ? 0.85 : 0.72;
          const isSelected = dist === 0;

          return (
            <Pressable key={val} onPress={() => handleTap(idx)} style={styles.item}>
              <Text
                style={[
                  styles.itemText,
                  {
                    opacity,
                    transform: [{ scale }],
                    color: isSelected ? color : Colors.text,
                    fontFamily: isSelected ? "Inter_700Bold" : "Inter_400Regular",
                    fontSize: isSelected ? 22 : 17,
                  },
                ]}
              >
                {formatValue(val)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "relative",
  },
  content: {
    paddingVertical: ITEM_HEIGHT * 2,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    textAlign: "center",
  },
  selectionTop: {
    position: "absolute",
    left: 8,
    right: 8,
    height: 1,
    borderTopWidth: 1,
    zIndex: 10,
    pointerEvents: "none",
  } as any,
  selectionBottom: {
    position: "absolute",
    left: 8,
    right: 8,
    height: 1,
    borderTopWidth: 1,
    zIndex: 10,
    pointerEvents: "none",
  } as any,
});
