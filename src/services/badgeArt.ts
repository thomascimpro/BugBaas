import { ImageSourcePropType } from "react-native";

export const badgeArt = {
  "first-catch": require("../../assets/badges/first-catch.png"),
  "scout": require("../../assets/badges/scout.png"),
  "bugstorm": require("../../assets/badges/bugstorm.png"),
  "bug-marathon": require("../../assets/badges/bug-marathon.png"),
  "points": require("../../assets/badges/points.png"),
  "status": require("../../assets/badges/status.png"),
  "colony": require("../../assets/badges/colony.png"),
  "walker": require("../../assets/badges/walker.png"),
  "kilometer-colony": require("../../assets/badges/kilometer-colony.png"),
  "marathon-hunter": require("../../assets/badges/marathon-hunter.png"),
  "long-range-tracker": require("../../assets/badges/long-range-tracker.png"),
  "bugdex-starter": require("../../assets/badges/bugdex-starter.png"),
  "dex-collector": require("../../assets/badges/dex-collector.png"),
  "dex-master": require("../../assets/badges/dex-master.png"),
  "legendary-catch": require("../../assets/badges/legendary-catch.png"),
  "legendary-collector": require("../../assets/badges/legendary-collector.png"),
  "mythic-catch": require("../../assets/badges/mythic-catch.png"),
  "mythic-master": require("../../assets/badges/mythic-master.png"),
  "trader": require("../../assets/badges/trader.png"),
  "upgrade-smith": require("../../assets/badges/upgrade-smith.png"),
  "splat-hunter": require("../../assets/badges/splat-hunter.png"),
  "comment-helper": require("../../assets/badges/comment-helper.png"),
  "discussion-pro": require("../../assets/badges/discussion-pro.png"),
  "upvote-ally": require("../../assets/badges/upvote-ally.png")
} as const satisfies Record<string, ImageSourcePropType>;

export type BadgeArtId = keyof typeof badgeArt;

export function getBadgeArtSource(id: string): ImageSourcePropType | null {
  return (badgeArt as Record<string, ImageSourcePropType>)[id] ?? null;
}
