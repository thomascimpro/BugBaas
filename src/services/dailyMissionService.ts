import { doc, getDoc, runTransaction } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";
import { BugDexInventoryItem, BugSmashDuel, User } from "../types";
import { BugDexDropResult, pickBugDexRewardEntry } from "./bugDexService";
import { localDayId, SoloCampaignBossProgress } from "./missionProgressService";
import { badgesForUser, titleForPoints } from "./pointsService";
import { starterBoostedXp } from "./starterBoostService";

export type DailyMission = {
  id: string;
  title: string;
  target: number;
  progress: number;
  reward: string;
  rewardXp: number;
};

type DailyMissionTemplate = {
  id: string;
  title: string;
  target: number;
  reward: string;
  rewardXp: number;
  progressFor: (user: User, context: DailyMissionContext, day: string) => number;
};

type DailyMissionContext = {
  bossProgress: SoloCampaignBossProgress;
  duels: BugSmashDuel[];
};

const dailyMissionXp = 10;
const demoDailyClaims = new Set<string>();

const dailyMissionTemplates: DailyMissionTemplate[] = [
  {
    id: "duel-play",
    title: "mission.dailyDuel",
    target: 1,
    reward: "mission.rewardXp10",
    rewardXp: dailyMissionXp,
    progressFor: (user, { duels }, day) => duels.filter((duel) => isUserDuel(duel, user) && isThisDay(duel.scores?.[user.uid]?.submittedAt ?? "", day)).length
  },
  {
    id: "walk-1k",
    title: "mission.dailyWalk1",
    target: 1,
    reward: "mission.rewardXp10",
    rewardXp: dailyMissionXp,
    progressFor: (user, _context, day) => user.movementRegisteredDay === day ? Math.floor(((user.movementRegisteredDayKm ?? 0) + 0.0001) * 10) / 10 : 0
  },
  {
    id: "solo-boss",
    title: "mission.dailySoloBoss",
    target: 1,
    reward: "mission.rewardXp10",
    rewardXp: dailyMissionXp,
    progressFor: (_user, { bossProgress }) => bossProgress.dayCount
  }
];

export function dailyMissionSet(user: User, options: { bossProgress: SoloCampaignBossProgress; duels?: BugSmashDuel[]; now?: Date }): DailyMission[] {
  const day = localDayId(options.now);
  const context: DailyMissionContext = {
    bossProgress: options.bossProgress,
    duels: options.duels ?? []
  };
  return dailyMissionTemplates.map((template) => {
    const progress = Math.min(template.target, template.progressFor(user, context, day));
    return {
      id: `daily-v1-${template.id}-${day}`,
      title: template.title,
      target: template.target,
      progress,
      reward: template.reward,
      rewardXp: template.rewardXp
    };
  });
}

export async function claimedDailyMissionIds(user: User, missionIds: string[]): Promise<Set<string>> {
  if (!missionIds.length) return new Set();
  if (!isFirebaseConfigured) return new Set(missionIds.filter((id) => demoDailyClaims.has(`${user.uid}:${id}`)));
  const snapshots = await Promise.all(missionIds.map((id) => getDoc(doc(db, "users", user.uid, "dailyMissionClaims", id))));
  return new Set(snapshots.map((snapshot, index) => snapshot.exists() ? missionIds[index] : "").filter(Boolean));
}

export function dailyMissionSetComplete(missions: DailyMission[]): boolean {
  return missions.length > 0 && missions.every((mission) => mission.progress >= mission.target);
}

export function dailyMissionBonusId(now = new Date()): string {
  return `daily-bonus-${localDayId(now)}`;
}

export async function isDailyMissionBonusClaimed(user: User): Promise<boolean> {
  const bonusId = dailyMissionBonusId();
  if (!isFirebaseConfigured) return demoDailyClaims.has(`${user.uid}:${bonusId}`);
  return (await getDoc(doc(db, "users", user.uid, "dailyMissionClaims", bonusId))).exists();
}

export async function claimDailyMissionReward(user: User, mission: DailyMission): Promise<User | null> {
  if (mission.progress < mission.target) return null;
  const now = new Date().toISOString();
  const day = localDayId();
  const claimKey = `${user.uid}:${mission.id}`;

  if (!isFirebaseConfigured) {
    if (demoDailyClaims.has(claimKey)) return null;
    demoDailyClaims.add(claimKey);
    const totalPoints = Math.max(0, user.totalPoints + starterBoostedXp(user, mission.rewardXp));
    const updated = { ...user, totalPoints, title: titleForPoints(totalPoints) };
    updated.badges = badgesForUser(updated);
    return updated;
  }

  const userRef = doc(db, "users", user.uid);
  const claimRef = doc(db, "users", user.uid, "dailyMissionClaims", mission.id);
  return runTransaction(db, async (transaction) => {
    const userSnapshot = await transaction.get(userRef);
    const claimSnapshot = await transaction.get(claimRef);
    if (!userSnapshot.exists() || claimSnapshot.exists()) return null;
    const current = userSnapshot.data() as User;
    const totalPoints = Math.max(0, current.totalPoints + starterBoostedXp(current, mission.rewardXp));
    const updated = { ...current, totalPoints, title: titleForPoints(totalPoints) };
    updated.badges = badgesForUser(updated);
    transaction.update(userRef, {
      badges: updated.badges,
      title: updated.title,
      totalPoints: updated.totalPoints
    });
    transaction.set(claimRef, {
      id: mission.id,
      claimedAt: now,
      localDay: day,
      missionTitle: mission.title,
      rewardType: "xp",
      rewardXp: mission.rewardXp
    });
    return updated;
  });
}

export async function claimDailyMissionBonusWithReward(user: User, missions: DailyMission[]): Promise<{ drop: BugDexDropResult; user: User } | null> {
  if (!dailyMissionSetComplete(missions)) return null;
  const bonusId = dailyMissionBonusId();
  const now = new Date().toISOString();
  const day = localDayId();
  const claimKey = `${user.uid}:${bonusId}`;

  if (!isFirebaseConfigured) {
    if (demoDailyClaims.has(claimKey)) return null;
    demoDailyClaims.add(claimKey);
    const entry = pickBugDexRewardEntry(user, "daily_mission_bonus");
    const item: BugDexInventoryItem = { bugId: entry.id, count: 1, firstUnlockedAt: now, lastUnlockedAt: now, rarity: entry.rarity, sources: ["daily_mission_bonus"] };
    return { drop: { rewardType: "bug", entry, item, isNew: true, source: "daily_mission_bonus" }, user };
  }

  const claimRef = doc(db, "users", user.uid, "dailyMissionClaims", bonusId);
  const rewardEntry = pickBugDexRewardEntry(user, "daily_mission_bonus");
  const rewardRef = doc(db, "users", user.uid, "bugdex", rewardEntry.id);
  return runTransaction(db, async (transaction) => {
    const claimSnapshot = await transaction.get(claimRef);
    const rewardSnapshot = await transaction.get(rewardRef);
    if (claimSnapshot.exists()) return null;
    const existingReward = rewardSnapshot.exists() ? rewardSnapshot.data() as BugDexInventoryItem : null;
    const item: BugDexInventoryItem = existingReward
      ? { ...existingReward, count: existingReward.count + 1, lastUnlockedAt: now, sources: Array.from(new Set([...existingReward.sources, "daily_mission_bonus"])) }
      : { bugId: rewardEntry.id, count: 1, firstUnlockedAt: now, lastUnlockedAt: now, rarity: rewardEntry.rarity, sources: ["daily_mission_bonus"] };
    transaction.set(rewardRef, item);
    transaction.set(claimRef, {
      id: bonusId,
      claimedAt: now,
      localDay: day,
      missionIds: missions.map((mission) => mission.id),
      rewardBugId: rewardEntry.id,
      rewardGrantedAt: now,
      rewardRarity: rewardEntry.rarity,
      rewardSource: "daily_mission_bonus",
      rewardType: "bug",
      rewardXp: 0
    });
    return { drop: { rewardType: "bug", entry: rewardEntry, item, isNew: !existingReward, source: "daily_mission_bonus" }, user };
  });
}

function isUserDuel(duel: BugSmashDuel, user: User): boolean {
  return duel.fromUserId === user.uid || duel.toUserId === user.uid;
}

function isThisDay(value: string, day: string): boolean {
  return Boolean(value && localDayId(new Date(value)) === day);
}
