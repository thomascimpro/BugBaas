import { BugSeverity, BugStatus, User } from "../types";

export type InsectVariant = "larva" | "beetle" | "grasshopper" | "dragonfly" | "ladybug" | "crawler";

export type UserTier = {
  minPoints: number;
  title: string;
  description: string;
  color: string;
  insect: InsectVariant;
  bugSize: number;
  evolutionLevel: number;
};

export type BugDexRarity = "Gewoon" | "Zeldzaam" | "Episch" | "Legendarisch";

export type BugDexEntry = {
  id: string;
  name: string;
  title: string;
  minPoints: number;
  minBugs: number;
  rarity: BugDexRarity;
  insect: InsectVariant;
  evolutionLevel: number;
  note: string;
};

export const userTiers: UserTier[] = [
  {
    minPoints: 0,
    title: "Larve",
    description: "Net uit het test-ei, klaar voor de eerste vondst.",
    color: "#6f7f5f",
    insect: "larva",
    bugSize: 46,
    evolutionLevel: 1
  },
  {
    minPoints: 25,
    title: "Keverscout",
    description: "Ziet kleine foutjes voordat ze groter worden.",
    color: "#2f6b4f",
    insect: "beetle",
    bugSize: 56,
    evolutionLevel: 2
  },
  {
    minPoints: 75,
    title: "Sprinkhaan Specialist",
    description: "Springt snel naar reproduceerbare bugs.",
    color: "#587c2d",
    insect: "grasshopper",
    bugSize: 66,
    evolutionLevel: 3
  },
  {
    minPoints: 150,
    title: "Libelle Leider",
    description: "Houdt overzicht over status, prioriteit en fix.",
    color: "#356d7c",
    insect: "dragonfly",
    bugSize: 76,
    evolutionLevel: 4
  },
  {
    minPoints: 300,
    title: "Opperbugmeister",
    description: "De baas van de bugjacht.",
    color: "#b83227",
    insect: "ladybug",
    bugSize: 88,
    evolutionLevel: 5
  }
];

export const bugDexEntries: BugDexEntry[] = [
  { id: "zilvervisje", name: "Zilvervisje", title: "Stille Starter", minPoints: 0, minBugs: 0, rarity: "Gewoon", insect: "larva", evolutionLevel: 1, note: "Glipt door kleine randgevallen." },
  { id: "fruitvlieg", name: "Fruitvlieg", title: "Snelle Spotter", minPoints: 5, minBugs: 1, rarity: "Gewoon", insect: "crawler", evolutionLevel: 1, note: "Vindt bugs voordat koffie koud is." },
  { id: "bladluis", name: "Bladluis", title: "Detailknager", minPoints: 10, minBugs: 1, rarity: "Gewoon", insect: "larva", evolutionLevel: 1, note: "Knaagt aan kleine UI-foutjes." },
  { id: "mug", name: "Mug", title: "Irritatie Detector", minPoints: 20, minBugs: 2, rarity: "Gewoon", insect: "dragonfly", evolutionLevel: 1, note: "Hoort precies waar het zoemt." },
  { id: "mot", name: "Mot", title: "Nachttester", minPoints: 30, minBugs: 2, rarity: "Gewoon", insect: "crawler", evolutionLevel: 2, note: "Komt af op schermlicht en regressies." },
  { id: "mier", name: "Mier", title: "Teamdrager", minPoints: 45, minBugs: 3, rarity: "Gewoon", insect: "beetle", evolutionLevel: 2, note: "Sleept reproduceerstappen netjes mee." },
  { id: "vlo", name: "Vlo", title: "Sprongtester", minPoints: 60, minBugs: 4, rarity: "Zeldzaam", insect: "grasshopper", evolutionLevel: 2, note: "Springt razendsnel tussen flows." },
  { id: "pissebed", name: "Pissebed", title: "Randgevalroller", minPoints: 75, minBugs: 5, rarity: "Zeldzaam", insect: "crawler", evolutionLevel: 2, note: "Rolt elk hoekje van de app af." },
  { id: "stinkwants", name: "Stinkwants", title: "Codegeur Vinder", minPoints: 95, minBugs: 6, rarity: "Zeldzaam", insect: "beetle", evolutionLevel: 3, note: "Ruikt rare states op afstand." },
  { id: "snuitkever", name: "Snuitkever", title: "Diepgraver", minPoints: 115, minBugs: 7, rarity: "Zeldzaam", insect: "beetle", evolutionLevel: 3, note: "Steekt zijn neus in verborgen bugs." },
  { id: "lieveheersbeestje", name: "Lieveheersbeestje", title: "Fixvriend", minPoints: 135, minBugs: 8, rarity: "Zeldzaam", insect: "ladybug", evolutionLevel: 3, note: "Maakt bugjacht bijna schattig." },
  { id: "kakkerlak", name: "Kakkerlak", title: "Survivor Bug", minPoints: 160, minBugs: 9, rarity: "Episch", insect: "crawler", evolutionLevel: 3, note: "Overleeft elke hotfix." },
  { id: "oorworm", name: "Oorworm", title: "Feedbackfluisteraar", minPoints: 185, minBugs: 10, rarity: "Episch", insect: "larva", evolutionLevel: 3, note: "Hoort wat gebruikers niet zeggen." },
  { id: "boktor", name: "Boktor", title: "Houtgreep Tester", minPoints: 215, minBugs: 12, rarity: "Episch", insect: "beetle", evolutionLevel: 4, note: "Bijt door taaie legacy schermen." },
  { id: "tapijtkever", name: "Tapijtkever", title: "Pixelpluizer", minPoints: 245, minBugs: 13, rarity: "Episch", insect: "ladybug", evolutionLevel: 4, note: "Ziet elke scheve spacing." },
  { id: "roofwants", name: "Roofwants", title: "Bugjager", minPoints: 275, minBugs: 14, rarity: "Episch", insect: "beetle", evolutionLevel: 4, note: "Jaagt actief op de lastigste cases." },
  { id: "duizendpoot", name: "Duizendpoot", title: "Multitask Master", minPoints: 310, minBugs: 16, rarity: "Episch", insect: "crawler", evolutionLevel: 4, note: "Test alles tegelijk, bijna." },
  { id: "sprinkhaan", name: "Sprinkhaan", title: "Flow Springer", minPoints: 350, minBugs: 18, rarity: "Episch", insect: "grasshopper", evolutionLevel: 4, note: "Springt door onboarding, lijst en detail." },
  { id: "wesp", name: "Wesp", title: "Scherpe Prikker", minPoints: 395, minBugs: 20, rarity: "Legendarisch", insect: "dragonfly", evolutionLevel: 4, note: "Prikt precies in pijnpunten." },
  { id: "hoornaar", name: "Hoornaar", title: "Escalatiebaas", minPoints: 445, minBugs: 22, rarity: "Legendarisch", insect: "dragonfly", evolutionLevel: 5, note: "Laat kritieke bugs niet ontsnappen." },
  { id: "schorpioen", name: "Schorpioen", title: "Regressiesteker", minPoints: 500, minBugs: 24, rarity: "Legendarisch", insect: "crawler", evolutionLevel: 5, note: "Steekt terug bij terugkerende bugs." },
  { id: "termiet", name: "Termiet", title: "Structuurvreter", minPoints: 560, minBugs: 26, rarity: "Legendarisch", insect: "beetle", evolutionLevel: 5, note: "Vindt wat onder de vloer zit." },
  { id: "mestkever", name: "Mestkever", title: "Cleanup Kampioen", minPoints: 625, minBugs: 28, rarity: "Legendarisch", insect: "beetle", evolutionLevel: 5, note: "Ruimt oude rommelbugs op." },
  { id: "wandelende-tak", name: "Wandelende tak", title: "Camouflage Case", minPoints: 695, minBugs: 30, rarity: "Legendarisch", insect: "grasshopper", evolutionLevel: 5, note: "Vindt bugs die zich verstoppen." },
  { id: "vogelspin", name: "Vogelspin", title: "Sprintbaas", minPoints: 770, minBugs: 33, rarity: "Legendarisch", insect: "crawler", evolutionLevel: 5, note: "Groot, duidelijk, niet te negeren." },
  { id: "reuzenkakkerlak", name: "Reuzenkakkerlak", title: "Incident Survivor", minPoints: 850, minBugs: 36, rarity: "Legendarisch", insect: "ladybug", evolutionLevel: 5, note: "Heeft productiepaniek gezien." },
  { id: "reuzen-duizendpoot", name: "Reuzenduizendpoot", title: "Flow Monster", minPoints: 935, minBugs: 39, rarity: "Legendarisch", insect: "crawler", evolutionLevel: 5, note: "Heeft voor elke tab een poot." },
  { id: "neushoornkever", name: "Neushoornkever", title: "Heavy Hitter", minPoints: 1025, minBugs: 42, rarity: "Legendarisch", insect: "beetle", evolutionLevel: 5, note: "Duwt blokkades uit de weg." },
  { id: "atlaskever", name: "Atlaskever", title: "Werelddrager", minPoints: 1120, minBugs: 45, rarity: "Legendarisch", insect: "beetle", evolutionLevel: 5, note: "Draagt de hele backlog." },
  { id: "herculeskever", name: "Herculeskever", title: "Krachtpatser", minPoints: 1225, minBugs: 48, rarity: "Legendarisch", insect: "beetle", evolutionLevel: 5, note: "Tilt zelfs kritieke releases." },
  { id: "goliathkever", name: "Goliathkever", title: "BugDex Legende", minPoints: 1350, minBugs: 50, rarity: "Legendarisch", insect: "ladybug", evolutionLevel: 5, note: "Alleen de fanatiekste jagers komen hier." }
];

const severityBase: Record<BugSeverity, number> = {
  Laag: 5,
  Normaal: 10,
  Hoog: 20,
  Kritiek: 35
};

export function calculateBugPoints(severity: BugSeverity, status: BugStatus): number {
  if (status === "Afgekeurd" || status === "Dubbel") {
    return 0;
  }
  if (status === "Gefixt") {
    return severityBase[severity] + 15;
  }
  if (status === "Bevestigd" || status === "In behandeling") {
    return severityBase[severity] + 5;
  }
  return severityBase[severity];
}

export function titleForPoints(points: number): string {
  return getTierForPoints(points).title;
}

export function getTierForPoints(points: number): UserTier {
  return [...userTiers].reverse().find((tier) => points >= tier.minPoints) ?? userTiers[0];
}

export function pointsUntilNextTier(points: number): number | null {
  const nextTier = userTiers.find((tier) => tier.minPoints > points);
  return nextTier ? nextTier.minPoints - points : null;
}

export function badgesForUser(user: Pick<User, "totalPoints" | "bugCount">): string[] {
  const badges = [];
  if (user.bugCount >= 1) badges.push("Eerste vangst");
  if (user.bugCount >= 5) badges.push("Speurneus");
  if (user.totalPoints >= 100) badges.push("Puntenslijper");
  if (user.totalPoints >= 150) badges.push("Statusstrijder");
  if (user.totalPoints >= 300) badges.push("Meesterkolonie");
  return badges;
}

export function isBugDexEntryUnlocked(entry: BugDexEntry, user: Pick<User, "totalPoints" | "bugCount">): boolean {
  return user.totalPoints >= entry.minPoints && user.bugCount >= entry.minBugs;
}

export function unlockedBugDexCount(user: Pick<User, "totalPoints" | "bugCount">): number {
  return bugDexEntries.filter((entry) => isBugDexEntryUnlocked(entry, user)).length;
}
