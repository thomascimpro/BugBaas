import React from "react";
import { Image, ImageSourcePropType, StyleProp, View, ViewStyle } from "react-native";
import { SpriteRect } from "../../services/minigameAssets";

type Props = {
  rect: SpriteRect;
  sheetHeight: number;
  sheetWidth: number;
  source: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
};

export function SpriteCrop({ rect, sheetHeight, sheetWidth, source, style }: Props) {
  return (
    <View style={[{ height: rect.height, overflow: "hidden", width: rect.width }, style]}>
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
