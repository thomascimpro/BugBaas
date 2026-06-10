import { doc, getDoc, runTransaction } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";
import { BugDexInventoryItem, BugReport, BugSmashDuel, User } from "../types";
import { badgesForUser, titleForPoints } from "./pointsService";
import { weeklyMissionXp } from "./rewardBalanceService";

export type WeeklyMission = {
  id: string;
  title: string;
  target: number;
  progress: number;
  reward: string;
};

type MissionTemplate = {
  id: string;
  title: string;
  target: number;
  reward: string;
  progressFor: (user: User, context: WeeklyMissionContext, weekStart: Date) => number;
};

type WeeklyMissionContext = {
  bugs: BugReport[];
  duels: BugSmashDuel[];
  inventory: BugDexInventoryItem[];
};

const demoWeeklyClaims = new Set<string>();

const bugMissionPool: MissionTemplate[] = [
  {
    id: "fresh-finds",
    title: "Meld 2 bugs",
    target: 2,
    reward: "+20 missiepunten",
    progressFor: (user, { bugs }, weekStart) => bugs.filter((bug) => isBugReport(bug) && bug.reporterId === user.uid && isThisWeek(bug.createdAt, weekStart)).length
  },
  {
    id: "screenshot-proof",
    title: "Meld bug met screenshot",
    target: 1,
    reward: "Screenshot badge",
    progressFor: (user, { bugs }, weekStart) => bugs.filter((bug) => isBugReport(bug) && bug.reporterId === user.uid && isThisWeek(bug.createdAt, weekStart) && !!bug.screenshotDataUrl).length
  },
  {
    id: "team-votes",
    title: "Krijg 2 upvotes",
    target: 2,
    reward: "+10 bonuspunten",
    progressFor: (user, { bugs }, weekStart) => bugs
      .filter((bug) => isBugReport(bug) && bug.reporterId === user.uid && isThisWeek(bug.updatedAt, weekStart))
      .reduce((total, bug) => total + (bug.upvoteCount ?? 0), 0)
  },
  {
    id: "fix-hunter",
    title: "Laat 1 bug fixen",
    target: 1,
    reward: "Fix streak",
    progressFor: (user, { bugs }, weekStart) => bugs.filter((bug) => isBugReport(bug) && bug.reporterId === user.uid && bug.status === "Gefixt" && isThisWeek(bug.updatedAt, weekStart)).length
  },
  {
    id: "critical-eye",
    title: "Vind hoge urgentie",
    target: 1,
    reward: "Scherp oog",
    progressFor: (user, { bugs }, weekStart) => bugs.filter((bug) => isBugReport(bug) && bug.reporterId === user.uid && isThisWeek(bug.createdAt, weekStart) && (bug.severity === "Hoog" || bug.severity === "Kritiek")).length
  }
];

const featureMissionPool: MissionTemplate[] = [
  {
    id: "duel-player",
    title: "Speel 1 duel",
    target: 1,
    reward: "+15 duelpunten",
    progressFor: (user, { duels }, weekStart) => duels.filter((duel) => isUserDuel(duel, user) && isThisWeek(duel.scores?.[user.uid]?.submittedAt ?? "", weekStart)).length
  },
  {
    id: "duel-winner",
    title: "Win 1 duel",
    target: 1,
    reward: "Winnaarsbonus",
    progressFor: (user, { duels }, weekStart) => duels.filter((duel) => duel.winnerId === user.uid && isThisWeek(duel.updatedAt, weekStart)).length
  },
  {
    id: "bugdex-week",
    title: "Vind 2 BugDex bugs",
    target: 2,
    reward: "BugDex boost",
    progressFor: (_user, { inventory }, weekStart) => inventory.filter((item) => isThisWeek(item.lastUnlockedAt, weekStart)).length
  },
  {
    id: "squad-ready",
    title: "Zet 3 helpers actief",
    target: 3,
    reward: "Helper bonus",
    progressFor: (user) => new Set(user.activeBugSquad ?? []).size
  }
];

export function weeklyMissionSet(user: User, bugs: BugReport[], options: { duels?: BugSmashDuel[]; inventory?: BugDexInventoryItem[]; now?: Date } = {}): WeeklyMission[] {
  const now = options.now ?? new Date();
  const weekStart = startOfIsoWeek(now);
  const seed = weekNumber(now);
  const context: WeeklyMissionContext = {
    bugs,
    duels: options.duels ?? [],
    inventory: options.inventory ?? []
  };
  const templates = [
    bugMissionPool[seed % bugMissionPool.length],
    featureMissionPool[seed % featureMissionPool.length],
    bugMissionPool[(seed + 2) % bugMissionPool.length]
  ];
  return templates.map((template) => {
    const progress = Math.min(template.target, template.progressFor(user, context, weekStart));
    return {
      id: `${template.id}-${seed}`,
      title: template.title,
      target: template.target,
      progress,
      reward: template.reward
    };
  });
}

export function weeklyMissionLabel(now = new Date()): string {
  return `Week ${weekNumber(now)}`;
}

export async function claimedWeeklyMissionIds(user: User, missionIds: string[]): Promise<Set<string>> {
  if (!missionIds.length) return new Set();
  if (!isFirebaseConfigured) {
    return new Set(missionIds.filter((id) => demoWeeklyClaims.has(`${user.uid}:${id}`)));
  }
  const snapshots = await Promise.all(missionIds.map((id) => getDoc(doc(db, "users", user.uid, "weeklyMissionClaims", id))));
  return new Set(snapshots.map((snapshot, index) => snapshot.exists() ? missionIds[index] : "").filter(Boolean));
}

export function weeklyMissionSetComplete(missions: WeeklyMission[]): boolean {
  return missions.length > 0 && missions.every((mission) => mission.progress >= mission.target);
}

export function weeklyMissionBonusId(missions: WeeklyMission[]): string {
  const weekId = missions[0]?.id.split("-").pop() ?? weekNumber(new Date()).toString();
  return `weekly-bonus-${weekId}`;
}

export async function isWeeklyMissionBonusClaimed(user: User, missions: WeeklyMission[]): Promise<boolean> {
  const bonusId = weeklyMissionBonusId(missions);
  if (!isFirebaseConfigured) return demoWeeklyClaims.has(`${user.uid}:${bonusId}`);
  return (await getDoc(doc(db, "users", user.uid, "weeklyMissionClaims", bonusId))).exists();
}

export async function claimWeeklyMissionBonus(user: User, missions: WeeklyMission[]): Promise<boolean> {
  if (!weeklyMissionSetComplete(missions)) return false;
  const bonusId = weeklyMissionBonusId(missions);
  const claimKey = `${user.uid}:${bonusId}`;
  const now = new Date().toISOString();

  if (!isFirebaseConfigured) {
    if (demoWeeklyClaims.has(claimKey)) return false;
    demoWeeklyClaims.add(claimKey);
    return true;
  }

  const claimRef = doc(db, "users", user.uid, "weeklyMissionClaims", bonusId);
  return runTransaction(db, async (transaction) => {
    const claimSnapshot = await transaction.get(claimRef);
    if (claimSnapshot.exists()) return false;
    transaction.set(claimRef, {
      id: bonusId,
      missionIds: missions.map((mission) => mission.id),
      rewardType: "bugdex",
      claimedAt: now
    });
    return true;
  });
}

export async function claimWeeklyMissionXp(user: User, mission: WeeklyMission): Promise<User | null> {
  if (mission.progress < mission.target) return null;
  const claimKey = `${user.uid}:${mission.id}`;
  const now = new Date().toISOString();

  if (!isFirebaseConfigured) {
    if (demoWeeklyClaims.has(claimKey)) return null;
    demoWeeklyClaims.add(claimKey);
    const totalPoints = Math.max(0, user.totalPoints + weeklyMissionXp);
    const updated = { ...user, totalPoints, title: titleForPoints(totalPoints) };
    updated.badges = badgesForUser(updated);
    return updated;
  }

  const userRef = doc(db, "users", user.uid);
  const claimRef = doc(db, "users", user.uid, "weeklyMissionClaims", mission.id);
  return runTransaction(db, async (transaction) => {
    const [userSnapshot, claimSnapshot] = await Promise.all([transaction.get(userRef), transaction.get(claimRef)]);
    if (!userSnapshot.exists() || claimSnapshot.exists()) return null;
    const current = userSnapshot.data() as User;
    const totalPoints = Math.max(0, current.totalPoints + weeklyMissionXp);
    const updated = { ...current, totalPoints, title: titleForPoints(totalPoints) };
    updated.badges = badgesForUser(updated);
    transaction.set(claimRef, {
      id: mission.id,
      missionTitle: mission.title,
      rewardXp: weeklyMissionXp,
      claimedAt: now
    });
    transaction.update(userRef, {
      badges: updated.badges,
      title: updated.title,
      totalPoints: updated.totalPoints
    });
    return updated;
  });
}

function startOfIsoWeek(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  const day = next.getDay() || 7;
  next.setDate(next.getDate() - day + 1);
  return next;
}

function weekNumber(date: Date): number {
  const next = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = next.getUTCDay() || 7;
  next.setUTCDate(next.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(next.getUTCFullYear(), 0, 1));
  return Math.ceil((((next.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function isBugReport(bug: BugReport): boolean {
  return (bug.reportType ?? "bug") === "bug";
}

function isUserDuel(duel: BugSmashDuel, user: User): boolean {
  return duel.fromUserId === user.uid || duel.toUserId === user.uid;
}

function isThisWeek(value: string, weekStart: Date): boolean {
  if (!value) return false;
  const date = new Date(value);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return date >= weekStart && date < weekEnd;
}
