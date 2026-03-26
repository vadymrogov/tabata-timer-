import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
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
  const lastIndex = useRef(-1);
  const isMounting = useRef(true);
  const selectedIndex = Math.max(0, values.indexOf(selectedValue));

  // Scroll to selected value on mount and when selectedValue changes externally
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: selectedIndex * ITEM_HEIGHT,
        animated: !isMounting.current,
      });
      isMounting.current = false;
    }, isMounting.current ? 80 : 0);
    return () => clearTimeout(timer);
  }, [selectedIndex]);

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const idx = Math.round(y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(values.length - 1, idx));
      if (clamped !== lastIndex.current) {
        lastIndex.current = clamped;
        Haptics.selectionAsync();
        const val = values[clamped];
        if (val !== selectedValue) {
          onValueChange(val);
        }
      }
    },
    [values, selectedValue, onValueChange]
  );

  return (
    <View style={[styles.container, { width, height: PICKER_HEIGHT }]}>
      {/* Selection highlight lines */}
      <View style={[styles.selectionTop, { top: ITEM_HEIGHT * 2, borderColor: color }]} pointerEvents="none" />
      <View style={[styles.selectionBottom, { top: ITEM_HEIGHT * 3, borderColor: color }]} pointerEvents="none" />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate={Platform.OS === "ios" ? "fast" : 0.9}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        contentContainerStyle={styles.content}
        scrollEventThrottle={16}
        nestedScrollEnabled
      >
        {values.map((val, idx) => {
          const dist = Math.abs(idx - selectedIndex);
          const opacity = dist === 0 ? 1 : dist === 1 ? 0.5 : 0.2;
          const scale = dist === 0 ? 1 : dist === 1 ? 0.85 : 0.72;
          const isSelected = dist === 0;

          return (
            <View key={val} style={styles.item}>
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
            </View>
          );
        })}
      </ScrollView>

      {/* Gradient overlays */}
      <View style={styles.fadeTop} pointerEvents="none" />
      <View style={styles.fadeBottom} pointerEvents="none" />
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
  },
  selectionBottom: {
    position: "absolute",
    left: 8,
    right: 8,
    height: 1,
    borderTopWidth: 1,
    zIndex: 10,
  },
  fadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2,
    backgroundColor: "transparent",
    pointerEvents: "none",
  } as any,
  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2,
    backgroundColor: "transparent",
    pointerEvents: "none",
  } as any,
});
