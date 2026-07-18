import React from "react";
import { Image, ImageSourcePropType, StyleProp, View, ViewProps, ViewStyle } from "react-native";
import { SpriteRect } from "../../services/minigameAssets";

type Props = {
  pointerEvents?: ViewProps["pointerEvents"];
  rect: SpriteRect;
  sheetHeight: number;
  sheetWidth: number;
  source: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
};

export function SpriteCrop({ pointerEvents, rect, sheetHeight, sheetWidth, source, style }: Props) {
  return (
    <View pointerEvents={pointerEvents} style={[{ height: rect.height, overflow: "hidden", width: rect.width }, style]}>
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="stretch"
        source={source}
        style={{
          height: sheetHeight,
          left: -rect.x,
          position: "absolute",
          top: -rect.y,
          width: sheetWidth
        }}
      />
    </View>
  );
}
