import { arrayRemove, arrayUnion, collection, deleteDoc, deleteField, doc, getDoc, getDocs, query, runTransaction, setDoc, updateDoc, where } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";
import { Organization, OrganizationInvite, OrganizationMember, User } from "../types";

export const defaultOrganizationId = "public";
export const defaultOrganizationName = "Public";
export const cimproOrganizationId = "cimpro";
export const cimproOrganizationName = "Cimpro";

export function organizationIdForUser(user?: Pick<User, "organizationId"> | null): string {
  return user?.organizationId || defaultOrganizationId;
}

export function organizationNameForUser(user?: Pick<User, "organizationName"> | null): string {
  return user?.organizationName || defaultOrganizationName;
}

export function organizationIdsForUser(user?: Pick<User, "organizationId" | "organizationIds"> | null): string[] {
  const ids = new Set((user?.organizationIds ?? []).filter((id) => !isPublicOrganization(id)));
  if (!isPublicOrganization(user?.organizationId)) ids.add(user?.organizationId as string);
  return Array.from(ids);
}

export function organizationNamesForUser(user?: Pick<User, "organizationId" | "organizationIds" | "organizationName" | "organizationNames"> | null): Record<string, string> {
  const names: Record<string, string> = { ...(user?.organizationNames ?? {}) };
  if (!isPublicOrganization(user?.organizationId)) names[user?.organizationId as string] = organizationNameForUser(user);
  for (const id of organizationIdsForUser(user)) {
    if (!names[id]) names[id] = id;
  }
  return names;
}

export function isPublicOrganization(organizationId?: string): boolean {
  return !organizationId || organizationId === defaultOrganizationId;
}

export function cleanOrganizationName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, 40);
}

export function organizationSlug(name: string): string {
  const normalized = cleanOrganizationName(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || defaultOrganizationId;
}

export function cleanInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isOrganizationAdmin(user: User, organization: Organization | null): boolean {
  return Boolean(organization && organization.createdBy === user.uid);
}

export async function getOrganizationForUser(user: User): Promise<Organization | null> {
  const organizationId = organizationIdsForUser(user)[0] ?? organizationIdForUser(user);
  if (isPublicOrganization(organizationId)) return null;
  const organizationName = organizationNamesForUser(user)[organizationId] ?? organizationNameForUser(user);
  if (!isFirebaseConfigured) {
    return {
      id: organizationId,
      name: organizationName,
      createdBy: user.uid,
      createdByName: user.displayName,
      createdAt: new Date().toISOString()
    };
  }
  const snapshot = await getDoc(doc(db, "organizations", organizationId));
  return snapshot.exists() ? snapshot.data() as Organization : null;
}

export async function getOrganizationById(organizationId: string, user?: User): Promise<Organization | null> {
  if (isPublicOrganization(organizationId)) return null;
  const fallbackName = user ? organizationNamesForUser(user)[organizationId] : organizationId;
  if (!isFirebaseConfigured) {
    return user ? {
      id: organizationId,
      name: fallbackName,
      createdBy: user.uid,
      createdByName: user.displayName,
      createdAt: new Date().toISOString()
    } : null;
  }
  const snapshot = await getDoc(doc(db, "organizations", organizationId));
  return snapshot.exists() ? snapshot.data() as Organization : null;
}

function withOrganizationMembership(user: User, organizationId: string, organizationName: string): User {
  const organizationIds = organizationIdsForUser(user);
  const nextIds = organizationIds.includes(organizationId) ? organizationIds : [...organizationIds, organizationId];
  const organizationNames = { ...organizationNamesForUser(user), [organizationId]: organizationName };
  const shouldSetDefault = isPublicOrganization(user.organizationId);
  return {
    ...user,
    organizationId: shouldSetDefault ? organizationId : organizationIdForUser(user),
    organizationName: shouldSetDefault ? organizationName : organizationNameForUser(user),
    organizationIds: nextIds,
    organizationNames
  };
}

export async function createOrganizationInvite(user: User, email: string, organizationId?: string): Promise<OrganizationInvite> {
  const invitedEmail = cleanInviteEmail(email);
  if (!invitedEmail.includes("@")) throw new Error("Vul een geldig e-mailadres in.");
  const organization = organizationId ? await getOrganizationById(organizationId, user) : await getOrganizationForUser(user);
  if (!organization) throw new Error("Maak eerst een organisatie aan.");
  if (!isOrganizationAdmin(user, organization)) throw new Error("Alleen de organisatiebeheerder kan uitnodigen.");

  const now = new Date().toISOString();
  const baseInvite: OrganizationInvite = {
    id: `invite-${Date.now()}`,
    organizationId: organization.id,
    organizationName: organization.name,
    invitedEmail,
    invitedById: user.uid,
    invitedByName: user.displayName,
    status: "open",
    createdAt: now
  };

  if (!isFirebaseConfigured) return baseInvite;

  const duplicateSnapshot = await getDocs(query(collection(db, "organizationInvites"), where("invitedEmail", "==", invitedEmail)));
  const duplicate = duplicateSnapshot.docs
    .map((item) => item.data() as OrganizationInvite)
    .find((invite) => invite.organizationId === organization.id && invite.status === "open");
  if (duplicate) throw new Error("Deze gebruiker heeft al een open uitnodiging.");

  const ref = doc(collection(db, "organizationInvites"));
  const invite = { ...baseInvite, id: ref.id };
  await setDoc(ref, invite);
  return invite;
}

export async function listOrganizationInvites(user: User, organizationId?: string): Promise<OrganizationInvite[]> {
  const organization = organizationId ? await getOrganizationById(organizationId, user) : await getOrganizationForUser(user);
  if (!organization || !isOrganizationAdmin(user, organization) || !isFirebaseConfigured) return [];
  const snapshot = await getDocs(query(collection(db, "organizationInvites"), where("organizationId", "==", organization.id)));
  return snapshot.docs
    .map((item) => item.data() as OrganizationInvite)
    .filter((invite) => invite.status === "open")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listIncomingOrganizationInvites(user: User): Promise<OrganizationInvite[]> {
  const invitedEmail = cleanInviteEmail(user.email);
  if (!invitedEmail || !isFirebaseConfigured) return [];
  const snapshot = await getDocs(query(collection(db, "organizationInvites"), where("invitedEmail", "==", invitedEmail)));
  return snapshot.docs
    .map((item) => item.data() as OrganizationInvite)
    .filter((invite) => invite.status === "open")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function acceptOrganizationInvite(user: User, invite: OrganizationInvite): Promise<User> {
  if (cleanInviteEmail(user.email) !== invite.invitedEmail) throw new Error("Deze uitnodiging is niet voor jouw account.");
  const updated: User = { ...withOrganizationMembership(user, invite.organizationId, invite.organizationName), organizationInviteId: invite.id };
  if (!isFirebaseConfigured) return updated;

  const inviteRef = doc(db, "organizationInvites", invite.id);
  const userRef = doc(db, "users", user.uid);
  const memberRef = doc(db, "organizations", invite.organizationId, "members", user.uid);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(inviteRef);
    if (!snapshot.exists()) throw new Error("Uitnodiging niet gevonden.");
    const fresh = snapshot.data() as OrganizationInvite;
    if (fresh.status !== "open") throw new Error("Uitnodiging is niet meer geldig.");
    if (fresh.invitedEmail !== cleanInviteEmail(user.email)) throw new Error("Deze uitnodiging is niet voor jouw account.");
    const now = new Date().toISOString();
    const member: OrganizationMember = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      role: "member",
      organizationId: fresh.organizationId,
      organizationName: fresh.organizationName,
      joinedAt: now,
      invitedById: fresh.invitedById,
      inviteId: fresh.id
    };
    transaction.update(inviteRef, {
      acceptedAt: now,
      acceptedById: user.uid,
      status: "accepted"
    });
    const shouldSetDefault = isPublicOrganization(user.organizationId);
    transaction.update(userRef, {
      ...(shouldSetDefault ? { organizationId: fresh.organizationId, organizationName: fresh.organizationName } : {}),
      organizationInviteId: fresh.id,
      organizationIds: arrayUnion(fresh.organizationId),
      [`organizationNames.${fresh.organizationId}`]: fresh.organizationName
    });
    transaction.set(memberRef, member);
  });
  return updated;
}

export async function cancelOrganizationInvite(invite: OrganizationInvite): Promise<void> {
  if (!isFirebaseConfigured) return;
  await updateDoc(doc(db, "organizationInvites", invite.id), {
    cancelledAt: new Date().toISOString(),
    status: "cancelled"
  });
}

export async function removeOrganizationMember(manager: User, member: User, organizationId?: string): Promise<void> {
  if (manager.uid === member.uid) throw new Error("Je kunt jezelf niet verwijderen.");
  const targetOrganizationId = organizationId ?? organizationIdForUser(member);
  if (isPublicOrganization(targetOrganizationId)) return;
  if (!isFirebaseConfigured) return;
  const remainingIds = organizationIdsForUser(member).filter((id) => id !== targetOrganizationId);
  const memberNames = organizationNamesForUser(member);
  const nextDefaultId = member.organizationId === targetOrganizationId ? (remainingIds[0] ?? defaultOrganizationId) : organizationIdForUser(member);
  const nextDefaultName = nextDefaultId === defaultOrganizationId ? defaultOrganizationName : (memberNames[nextDefaultId] ?? nextDefaultId);
  await updateDoc(doc(db, "users", member.uid), {
    organizationId: nextDefaultId,
    organizationName: nextDefaultName,
    organizationIds: arrayRemove(targetOrganizationId),
    [`organizationNames.${targetOrganizationId}`]: deleteField()
  });
  await deleteDoc(doc(db, "organizations", targetOrganizationId, "members", member.uid));
}
