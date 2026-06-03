import React from "react";
import { Image, ImageSourcePropType, StyleSheet, Text, View } from "react-native";

declare const require: (path: string) => ImageSourcePropType;

const medalAssets: ImageSourcePropType[] = [
  require("../../assets/leaderboard/medal-gold.png"),
  require("../../assets/leaderboard/medal-silver.png"),
  require("../../assets/leaderboard/medal-bronze.png")
];

type Props = {
  index: number;
  size?: number;
};

export function MedalIcon({ index, size = 48 }: Props) {
  const asset = medalAssets[index];

  if (!asset) {
    return (
      <View style={[styles.rankBadge, { height: size, width: size }]}>
        <Text style={styles.rank}>{index + 1}</Text>
      </View>
    );
  }

  return <Image source={asset} style={{ height: size, width: size }} resizeMode="contain" />;
}

const styles = StyleSheet.create({
  rankBadge: {
    alignItems: "center",
    backgroundColor: "#e8f1e6",
    borderColor: "#cbd8cf",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center"
  },
  rank: {
    color: "#17211c",
    fontSize: 16,
    fontWeight: "900"
  }
});
