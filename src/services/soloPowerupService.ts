import AsyncStorage from "@react-native-async-storage/async-storage";

export type SoloPowerupId = "lamp_focus" | "bug_bomb";

export type SoloPowerupInventory = {
  bugBombCharges: number;
  lampFocusActiveUntil: string | null;
  lampFocusCharges: number;
  updatedAt: string;
};

const storageKey = (uid: string) => `bugbaas:soloPowerups:${uid}`;
const hourMs = 60 * 60 * 1000;

export function emptySoloPowerupInventory(): SoloPowerupInventory {
  return {
    bugBombCharges: 0,
    lampFocusActiveUntil: null,
    lampFocusCharges: 0,
    updatedAt: new Date(0).toISOString()
  };
}

export async function loadSoloPowerupInventory(uid: string): Promise<SoloPowerupInventory> {
  const raw = await AsyncStorage.getItem(storageKey(uid));
  if (!raw) return emptySoloPowerupInventory();
  try {
    return normalize(JSON.parse(raw));
  } catch {
    return emptySoloPowerupInventory();
  }
}

export async function grantSoloBossReward(uid: string, bossLevel: number): Promise<{ inventory: SoloPowerupInventory; rewards: SoloPowerupId[] }> {
  const current = await loadSoloPowerupInventory(uid);
  const rewards: SoloPowerupId[] = ["lamp_focus"];
  if (bossLevel % 2 === 0 || bossLevel >= 5) rewards.push("bug_bomb");
  const next = normalize({
    ...current,
    bugBombCharges: current.bugBombCharges + rewards.filter((item) => item === "bug_bomb").length,
    lampFocusCharges: current.lampFocusCharges + 1,
    updatedAt: new Date().toISOString()
  });
  await saveSoloPowerupInventory(uid, next);
  return { inventory: next, rewards };
}

export async function activateSoloLampFocus(uid: string): Promise<{ activated: boolean; inventory: SoloPowerupInventory }> {
  const current = await loadSoloPowerupInventory(uid);
  if (current.lampFocusCharges <= 0) return { activated: false, inventory: current };
  const now = Date.now();
  const currentUntil = current.lampFocusActiveUntil ? Date.parse(current.lampFocusActiveUntil) : 0;
  const next = normalize({
    ...current,
    lampFocusActiveUntil: new Date(Math.max(now, currentUntil) + hourMs).toISOString(),
    lampFocusCharges: current.lampFocusCharges - 1,
    updatedAt: new Date(now).toISOString()
  });
  await saveSoloPowerupInventory(uid, next);
  return { activated: true, inventory: next };
}

export async function consumeSoloBugBomb(uid: string): Promise<{ consumed: boolean; inventory: SoloPowerupInventory }> {
  const current = await loadSoloPowerupInventory(uid);
  if (current.bugBombCharges <= 0) return { consumed: false, inventory: current };
  const next = normalize({
    ...current,
    bugBombCharges: current.bugBombCharges - 1,
    updatedAt: new Date().toISOString()
  });
  await saveSoloPowerupInventory(uid, next);
  return { consumed: true, inventory: next };
}

export function soloLampFocusActive(inventory: SoloPowerupInventory, now = Date.now()): boolean {
  return Boolean(inventory.lampFocusActiveUntil && Date.parse(inventory.lampFocusActiveUntil) > now);
}

export function soloLampFocusRemainingMinutes(inventory: SoloPowerupInventory, now = Date.now()): number {
  if (!inventory.lampFocusActiveUntil) return 0;
  return Math.max(0, Math.ceil((Date.parse(inventory.lampFocusActiveUntil) - now) / 60000));
}

async function saveSoloPowerupInventory(uid: string, inventory: SoloPowerupInventory): Promise<void> {
  await AsyncStorage.setItem(storageKey(uid), JSON.stringify(normalize(inventory)));
}

function normalize(value: Partial<SoloPowerupInventory>): SoloPowerupInventory {
  const activeUntil = typeof value.lampFocusActiveUntil === "string" && Number.isFinite(Date.parse(value.lampFocusActiveUntil)) ? value.lampFocusActiveUntil : null;
  return {
    bugBombCharges: Math.max(0, Math.floor(Number(value.bugBombCharges) || 0)),
    lampFocusActiveUntil: activeUntil,
    lampFocusCharges: Math.max(0, Math.floor(Number(value.lampFocusCharges) || 0)),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString()
  };
}
