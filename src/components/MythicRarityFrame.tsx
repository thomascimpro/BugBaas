import React from "react";
import { Image, ImageStyle, StyleProp, StyleSheet } from "react-native";

type Props = {
  size?: number;
  style?: StyleProp<ImageStyle>;
};

const mythicFrameSource = require("../../assets/generated/bugdex_mythic_frame_hd.png");

export function MythicRarityFrame({ size = 96, style }: Props) {
  return (
    <Image
      accessibilityIgnoresInvertColors
      resizeMode="contain"
      source={mythicFrameSource}
      style={[styles.frame, { height: size, width: size }, style]}
    />
  );
}

const styles = StyleSheet.create({
  frame: {
    position: "absolute"
  }
});
