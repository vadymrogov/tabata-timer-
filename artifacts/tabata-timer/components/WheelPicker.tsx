import * as Haptics from "expo-haptics";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";

import Colors from "@/constants/colors";

const ITEM_HEIGHT = 46;
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
  width = 100,
  color = Colors.accent,
}: WheelPickerProps) {
  const listRef = useRef<FlatList>(null);
  const isScrolling = useRef(false);
  const lastHapticIdx = useRef(-1);
  const initialScrollDone = useRef(false);

  const selectedIndex = values.indexOf(selectedValue);
  const effectiveIndex = selectedIndex >= 0 ? selectedIndex : 0;

  // Scroll to selected index on mount
  useEffect(() => {
    if (!initialScrollDone.current && values.length > 0) {
      const timer = setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: effectiveIndex,
          animated: false,
        });
        initialScrollDone.current = true;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!isScrolling.current) return;
      // Middle item is selected
      const mid = Math.floor(VISIBLE_ITEMS / 2);
      const midItem = viewableItems.find((v) => v.index === v.index);
      // Use center-most viewable item
      if (viewableItems.length > 0) {
        const sorted = viewableItems
          .filter((v) => v.index !== null)
          .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
        const center = sorted[Math.floor(sorted.length / 2)];
        if (center?.index !== null && center?.index !== undefined) {
          if (center.index !== lastHapticIdx.current) {
            lastHapticIdx.current = center.index;
            Haptics.selectionAsync();
          }
        }
      }
    },
    []
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70,
  });

  const onMomentumScrollEnd = useCallback(
    (e: any) => {
      isScrolling.current = false;
      const offsetY = e.nativeEvent.contentOffset.y;
      const idx = Math.round(offsetY / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(values.length - 1, idx));
      const val = values[clamped];
      if (val !== selectedValue) {
        onValueChange(val);
      }
    },
    [values, selectedValue, onValueChange]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: number; index: number }) => {
      const isSelected = item === selectedValue;
      const dist = Math.abs(index - effectiveIndex);
      const opacity = dist === 0 ? 1 : dist === 1 ? 0.55 : 0.2;
      const scale = dist === 0 ? 1 : dist === 1 ? 0.88 : 0.75;

      return (
        <View style={[styles.item, { height: ITEM_HEIGHT }]}>
          <Text
            style={[
              styles.itemText,
              {
                opacity,
                transform: [{ scale }],
                color: isSelected ? color : Colors.text,
                fontFamily: isSelected ? "Inter_700Bold" : "Inter_400Regular",
                fontSize: isSelected ? 22 : 18,
              },
            ]}
          >
            {formatValue(item)}
          </Text>
        </View>
      );
    },
    [selectedValue, effectiveIndex, color, formatValue]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  return (
    <View style={[styles.container, { width, height: PICKER_HEIGHT }]}>
      {/* Selection highlight */}
      <View
        style={[
          styles.highlight,
          {
            top: ITEM_HEIGHT * 2,
            borderColor: color,
          },
        ]}
        pointerEvents="none"
      />

      <FlatList
        ref={listRef}
        data={values}
        keyExtractor={(item) => String(item)}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate={Platform.OS === "ios" ? "fast" : 0.85}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: ITEM_HEIGHT * 2,
        }}
        onScrollBeginDrag={() => {
          isScrolling.current = true;
        }}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        scrollEnabled
        nestedScrollEnabled
        style={styles.list}
        initialScrollIndex={effectiveIndex}
        onScrollToIndexFailed={() => {
          listRef.current?.scrollToOffset({
            offset: effectiveIndex * ITEM_HEIGHT,
            animated: false,
          });
        }}
      />

      {/* Top and bottom fades */}
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
  list: {
    flex: 1,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    textAlign: "center",
  },
  highlight: {
    position: "absolute",
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.accent,
    zIndex: 1,
  },
  fadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2,
    backgroundColor: "transparent",
  },
  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2,
    backgroundColor: "transparent",
  },
});
