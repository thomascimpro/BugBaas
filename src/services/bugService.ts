import { collection, doc, getDoc, getDocs, orderBy, query, runTransaction, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../firebase";
import { BugComment, BugReport, BugStatus, NewBugInput, ReportType, User } from "../types";
import { defaultOrganizationId, defaultOrganizationName, isPublicOrganization, organizationIdsForUser, organizationNamesForUser } from "./organizationService";
import { badgesForUser, titleForPoints } from "./pointsService";
import { starterBoostedXp } from "./starterBoostService";
import { applyUserPoints, commentPointValue, syncEngagementPoints, upvoteGivenPointValue } from "./userService";

const demoBugs: BugReport[] = [];
const demoComments: BugComment[] = [];

function normalizeBug(bug: BugReport, fallbackId = bug.id): BugReport {
  const upvoteUserIds = Array.isArray(bug.upvoteUserIds) ? bug.upvoteUserIds : [];
  return {
    ...bug,
    id: bug.id || fallbackId,
    collectionName: bug.collectionName ?? (bug.organizationId && bug.organizationId !== defaultOrganizationId ? "organizationBugs" : "bugs"),
    reportType: bug.reportType ?? "bug",
    organizationId: bug.organizationId || defaultOrganizationId,
    organizationName: bug.organizationName || defaultOrganizationName,
    upvoteUserIds,
    upvoteCount: typeof bug.upvoteCount === "number" ? bug.upvoteCount : upvoteUserIds.length
  };
}

function bugCollectionName(bug: BugReport): "bugs" | "organizationBugs" {
  const current = normalizeBug(bug);
  return current.collectionName ?? (current.organizationId === defaultOrganizationId ? "bugs" : "organizationBugs");
}

function localDayId(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateReportPoints(reportType: ReportType, severity: NewBugInput["severity"]): number {
  if (reportType === "bug") {
    if (severity === "Kritiek") return 15;
    if (severity === "Hoog") return 12;
    if (severity === "Normaal") return 8;
    return 5;
  }
  return 5;
}

async function currentUserIsTestAccount(): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() && Boolean((snapshot.data() as User).testAccount);
}

async function currentUserOrganizationIds(): Promise<string[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? organizationIdsForUser(snapshot.data() as User) : [];
}

async function filterBugsForCurrentUser(bugs: BugReport[]): Promise<BugReport[]> {
  if (!isFirebaseConfigured) {
    const currentOrgIds = new Set<string>();
    return bugs
      .map((bug) => normalizeBug(bug))
      .filter((bug) => bug.organizationId === defaultOrganizationId || currentOrgIds.has(bug.organizationId ?? ""))
      .filter((bug) => bug.reporterTestAccount !== true);
  }

  const [currentIsTest, currentOrgIds] = await Promise.all([
    currentUserIsTestAccount(),
    currentUserOrganizationIds()
  ]);
  const currentOrgIdSet = new Set(currentOrgIds);
  const userSnapshot = await getDocs(collection(db, "users"));
  const usersById = new Map(userSnapshot.docs.map((item) => [item.id, item.data() as User]));

  return bugs.filter((bug) => {
    const current = normalizeBug(bug);
    if (current.organizationId !== defaultOrganizationId && !currentOrgIdSet.has(current.organizationId ?? "")) return false;
    if (current.organizationId === defaultOrganizationId) {
      return currentIsTest ? current.reporterTestAccount === true : current.reporterTestAccount !== true;
    }
    const reporter = usersById.get(current.reporterId);
    const reporterIsTest = bug.reporterTestAccount === true || reporter?.testAccount === true;
    const reporterIsActiveRealUser = Boolean(reporter) && reporter?.active !== false && reporter?.testAccount !== true && bug.reporterTestAccount !== true;
    return currentIsTest ? reporterIsTest || !reporter : reporterIsActiveRealUser;
  });
}

export async function createBug(input: NewBugInput, user: User): Promise<BugReport> {
  if (!input.title.trim() || !input.project.trim() || !input.description.trim()) {
    throw new Error("Titel, systeem/project en beschrijving zijn verplicht.");
  }
  if (input.screenshotDataUrl && input.screenshotDataUrl.length > 900_000) {
    throw new Error("Screenshot is te groot. Kies een kleinere afbeelding.");
  }

  const now = new Date().toISOString();
  const reportType = input.reportType ?? "bug";
  const basePoints = calculateReportPoints(reportType, input.severity);
  const today = localDayId();
  const userOrganizationIds = organizationIdsForUser(user);
  const userOrganizationNames = organizationNamesForUser(user);
  const inputOrganizationId = input.organizationId ?? defaultOrganizationId;
  const requestedOrganizationId = inputOrganizationId === defaultOrganizationId
    ? defaultOrganizationId
    : userOrganizationIds.includes(inputOrganizationId)
      ? inputOrganizationId
      : userOrganizationIds[0] ?? defaultOrganizationId;
  const requestedOrganizationName = isPublicOrganization(requestedOrganizationId) ? defaultOrganizationName : (userOrganizationNames[requestedOrganizationId] ?? requestedOrganizationId);
  const baseBug: BugReport = {
    id: `bug-${Date.now()}`,
    reportType,
    title: input.title.trim(),
    project: input.project.trim(),
    severity: input.severity,
    description: input.description.trim(),
    steps: input.steps.trim(),
    status: "Nieuw",
    reporterId: user.uid,
    reporterName: user.displayName,
    reporterTestAccount: user.testAccount === true,
    organizationId: requestedOrganizationId,
    organizationName: requestedOrganizationName,
    points: basePoints,
    upvoteCount: 0,
    upvoteUserIds: [],
    createdAt: now,
    updatedAt: now
  };

  if (!isFirebaseConfigured) {
    const alreadyRewardedToday = user.lastReportRewardDay === today;
    const awardedPoints = alreadyRewardedToday ? 0 : basePoints;
    const bugCountDelta = reportType === "bug" ? 1 : 0;
    const bug = { ...baseBug, points: awardedPoints, screenshotDataUrl: input.screenshotDataUrl };
    demoBugs.unshift(bug);
    if (awardedPoints > 0) user.lastReportRewardDay = today;
    if (awardedPoints > 0 || bugCountDelta > 0) {
      await applyUserPoints(user.uid, awardedPoints, bugCountDelta);
    }
    return bug;
  }

  const collectionName = requestedOrganizationId === defaultOrganizationId ? "bugs" : "organizationBugs";
  const docRef = doc(collection(db, collectionName));
  const bug: BugReport = { ...baseBug, collectionName, id: docRef.id };
  if (input.screenshotDataUrl) bug.screenshotDataUrl = input.screenshotDataUrl;
  const userRef = doc(db, "users", user.uid);
  return runTransaction(db, async (transaction) => {
    const userSnapshot = await transaction.get(userRef);
    if (!userSnapshot.exists()) throw new Error("Gebruiker niet gevonden.");
    const currentUser = userSnapshot.data() as User;
    const alreadyRewardedToday = currentUser.lastReportRewardDay === today;
    const awardedPoints = alreadyRewardedToday ? 0 : basePoints;
    const bugCountDelta = reportType === "bug" ? 1 : 0;
    const nextBug = { ...bug, points: awardedPoints };
    transaction.set(docRef, nextBug);
    if (awardedPoints > 0 || bugCountDelta > 0) {
      const totalPoints = Math.max(0, currentUser.totalPoints + starterBoostedXp(currentUser, awardedPoints));
      const bugCount = currentUser.bugCount + bugCountDelta;
      const updatedUser = { ...currentUser, totalPoints, bugCount, lastReportRewardDay: awardedPoints > 0 ? today : currentUser.lastReportRewardDay, title: titleForPoints(totalPoints) };
      updatedUser.badges = badgesForUser(updatedUser);
      const userUpdate: Partial<User> = {
        badges: updatedUser.badges,
        bugCount,
        title: updatedUser.title,
        totalPoints
      };
      if (awardedPoints > 0) userUpdate.lastReportRewardDay = today;
      transaction.update(userRef, userUpdate);
    }
    return nextBug;
  });
}

export async function listBugs(status?: BugStatus): Promise<BugReport[]> {
  if (!isFirebaseConfigured) {
    const visibleBugs = await filterBugsForCurrentUser(demoBugs);
    return visibleBugs.filter((bug) => !status || bug.status === status);
  }
  const orgIds = await currentUserOrganizationIds();
  const publicSnapshot = await getDocs(query(collection(db, "bugs"), orderBy("createdAt", "desc")));
  const orgSnapshots = await Promise.all(orgIds.map((orgId) => getDocs(query(collection(db, "organizationBugs"), where("organizationId", "==", orgId), orderBy("createdAt", "desc")))));
  const bugs = [
    ...publicSnapshot.docs.map((item) => normalizeBug({ ...(item.data() as BugReport), collectionName: "bugs" }, item.id)),
    ...orgSnapshots.flatMap((snapshot) => snapshot.docs.map((item) => normalizeBug({ ...(item.data() as BugReport), collectionName: "organizationBugs" }, item.id)))
  ];
  const visibleBugs = await filterBugsForCurrentUser(bugs);
  return visibleBugs
    .filter((bug) => !status || bug.status === status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateBugStatus(bug: BugReport, status: BugStatus): Promise<BugReport> {
  const current = normalizeBug(bug);
  if (current.status === "Gefixt" && status !== "Gefixt") {
    throw new Error("Deze melding is al gefixt.");
  }
  const fixPointDelta = status === "Gefixt" && current.status !== "Gefixt"
    ? 10
    : 0;
  const nextPoints = Math.max(0, current.points + fixPointDelta);
  const updated = { ...current, status, points: nextPoints, updatedAt: new Date().toISOString() };
  await applyUserPoints(current.reporterId, nextPoints - current.points, 0);

  if (!isFirebaseConfigured) {
    const index = demoBugs.findIndex((item) => item.id === current.id);
    if (index >= 0) demoBugs[index] = updated;
    return updated;
  }

  await updateDoc(doc(db, bugCollectionName(current), current.id), {
    status: updated.status,
    points: updated.points,
    updatedAt: updated.updatedAt
  });
  return updated;
}

export async function updateOwnBug(
  bug: BugReport,
  user: User,
  changes: Pick<BugReport, "description" | "project" | "severity" | "steps" | "title">
): Promise<BugReport> {
  const current = normalizeBug(bug);
  if (current.reporterId !== user.uid) throw new Error("Je kunt alleen je eigen melding wijzigen.");

  const nextSeverity = (current.reportType ?? "bug") === "bug" ? changes.severity : "Laag";
  const nextPoints = current.points;
  const updated = {
    ...current,
    description: changes.description.trim(),
    project: changes.project.trim(),
    severity: nextSeverity,
    steps: changes.steps.trim(),
    title: changes.title.trim(),
    points: nextPoints,
    updatedAt: new Date().toISOString()
  };
  if (!updated.title || !updated.project || !updated.description) throw new Error("Titel, systeem/project en beschrijving zijn verplicht.");

  if (!isFirebaseConfigured) {
    const index = demoBugs.findIndex((item) => item.id === current.id);
    if (index >= 0) demoBugs[index] = updated;
    await applyUserPoints(user.uid, nextPoints - current.points, 0);
    return updated;
  }

  const bugRef = doc(db, bugCollectionName(current), current.id);
  const userRef = doc(db, "users", user.uid);
  return runTransaction(db, async (transaction) => {
    const [bugSnapshot, userSnapshot] = await Promise.all([transaction.get(bugRef), transaction.get(userRef)]);
    if (!bugSnapshot.exists()) throw new Error("Melding niet gevonden.");
    if (!userSnapshot.exists()) throw new Error("Gebruiker niet gevonden.");
    const fresh = normalizeBug(bugSnapshot.data() as BugReport, bugSnapshot.id);
    if (fresh.reporterId !== user.uid) throw new Error("Je kunt alleen je eigen melding wijzigen.");
    const freshSeverity = (fresh.reportType ?? "bug") === "bug" ? changes.severity : "Laag";
    const freshPoints = fresh.points;
    const next = {
      ...fresh,
      description: changes.description.trim(),
      project: changes.project.trim(),
      severity: freshSeverity,
      steps: changes.steps.trim(),
      title: changes.title.trim(),
      points: freshPoints,
      updatedAt: new Date().toISOString()
    };
    const currentUser = userSnapshot.data() as User;
    const totalPoints = Math.max(0, currentUser.totalPoints + starterBoostedXp(currentUser, freshPoints - fresh.points));
    const updatedUser = { ...currentUser, totalPoints, title: titleForPoints(totalPoints) };
    updatedUser.badges = badgesForUser(updatedUser);
    transaction.update(bugRef, {
      description: next.description,
      points: next.points,
      project: next.project,
      severity: next.severity,
      steps: next.steps,
      title: next.title,
      updatedAt: next.updatedAt
    });
    transaction.update(userRef, {
      badges: updatedUser.badges,
      title: updatedUser.title,
      totalPoints
    });
    return next;
  });
}

export async function toggleBugUpvote(bug: BugReport, user: User): Promise<BugReport> {
  const current = normalizeBug(bug);
  if (current.reporterId === user.uid) throw new Error("Je kunt je eigen bug niet upvoten.");
  const hasVoted = current.upvoteUserIds.includes(user.uid);
  const upvoteUserIds = hasVoted
    ? current.upvoteUserIds.filter((uid) => uid !== user.uid)
    : [...current.upvoteUserIds, user.uid];
  const updated = {
    ...current,
    upvoteUserIds,
    upvoteCount: upvoteUserIds.length,
    updatedAt: new Date().toISOString()
  };

  if (!isFirebaseConfigured) {
    const index = demoBugs.findIndex((item) => item.id === current.id);
    if (index >= 0) demoBugs[index] = updated;
    await applyUserPoints(user.uid, hasVoted ? -upvoteGivenPointValue : upvoteGivenPointValue, 0);
    return updated;
  }

  const bugRef = doc(db, bugCollectionName(current), current.id);
  const nextBug = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(bugRef);
    if (!snapshot.exists()) throw new Error("Bug niet gevonden.");
    const fresh = normalizeBug(snapshot.data() as BugReport, snapshot.id);
    if (fresh.reporterId === user.uid) throw new Error("Je kunt je eigen bug niet upvoten.");
    const voted = fresh.upvoteUserIds.includes(user.uid);
    const nextUserIds = voted
      ? fresh.upvoteUserIds.filter((uid) => uid !== user.uid)
      : [...fresh.upvoteUserIds, user.uid];
    const next = {
      ...fresh,
      upvoteUserIds: nextUserIds,
      upvoteCount: nextUserIds.length,
      updatedAt: new Date().toISOString()
    };
    transaction.update(bugRef, {
      upvoteUserIds: next.upvoteUserIds,
      upvoteCount: next.upvoteCount,
      updatedAt: next.updatedAt
    });
    return next;
  });
  await syncEngagementPoints(user);
  return nextBug;
}

export async function deleteOwnBug(bug: BugReport, user: User): Promise<void> {
  const current = normalizeBug(bug);
  if (current.reporterId !== user.uid) throw new Error("Je kunt alleen je eigen bugs verwijderen.");

  if (!isFirebaseConfigured) {
    const index = demoBugs.findIndex((item) => item.id === current.id);
    if (index >= 0) demoBugs.splice(index, 1);
    for (let i = demoComments.length - 1; i >= 0; i -= 1) {
      if (demoComments[i].bugId === current.id) demoComments.splice(i, 1);
    }
    await applyUserPoints(user.uid, -current.points, current.reportType === "bug" ? -1 : 0);
    return;
  }

  const collectionName = bugCollectionName(current);
  const bugRef = doc(db, collectionName, current.id);
  const userRef = doc(db, "users", user.uid);
  const commentSnapshot = await getDocs(collection(db, collectionName, current.id, "comments"));
  for (let index = 0; index < commentSnapshot.docs.length; index += 450) {
    const batch = writeBatch(db);
    commentSnapshot.docs.slice(index, index + 450).forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }

  await runTransaction(db, async (transaction) => {
    const bugSnapshot = await transaction.get(bugRef);
    if (!bugSnapshot.exists()) throw new Error("Bug niet gevonden.");
    const fresh = normalizeBug(bugSnapshot.data() as BugReport, bugSnapshot.id);
    if (fresh.reporterId !== user.uid) throw new Error("Je kunt alleen je eigen bugs verwijderen.");

    const userSnapshot = await transaction.get(userRef);
    if (!userSnapshot.exists()) throw new Error("Gebruiker niet gevonden.");
    const currentUser = userSnapshot.data() as User;
    const totalPoints = Math.max(0, currentUser.totalPoints - fresh.points);
    const bugCount = Math.max(0, currentUser.bugCount - (fresh.reportType === "bug" ? 1 : 0));
    const updatedUser = { ...currentUser, totalPoints, bugCount, title: titleForPoints(totalPoints) };
    updatedUser.badges = badgesForUser(updatedUser);

    transaction.update(userRef, {
      totalPoints,
      bugCount,
      title: updatedUser.title,
      badges: updatedUser.badges
    });
    transaction.delete(bugRef);
  });
}

export async function listBugComments(bugId: string): Promise<BugComment[]> {
  if (!isFirebaseConfigured) {
    return demoComments.filter((comment) => comment.bugId === bugId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  const publicRef = doc(db, "bugs", bugId);
  const publicSnapshot = await getDoc(publicRef);
  const collectionName = publicSnapshot.exists() ? "bugs" : "organizationBugs";
  const snapshot = await getDocs(query(collection(db, collectionName, bugId, "comments"), orderBy("createdAt", "asc")));
  return snapshot.docs.map((item) => ({ ...(item.data() as BugComment), id: item.id, bugId }));
}

export async function addBugComment(bug: BugReport, user: User, text: string, reaction: string): Promise<BugComment> {
  const current = normalizeBug(bug);
  const trimmed = text.trim();
  if (!trimmed && !reaction) throw new Error("Kies een reactie of typ commentaar.");
  if (trimmed.length > 500) throw new Error("Commentaar mag maximaal 500 tekens zijn.");

  const now = new Date().toISOString();
  const baseComment: BugComment = {
    id: `comment-${Date.now()}`,
    bugId: current.id,
    authorId: user.uid,
    authorName: user.displayName,
    organizationId: current.organizationId,
    organizationName: current.organizationName,
    text: trimmed,
    reaction,
    createdAt: now
  };

  if (!isFirebaseConfigured) {
    demoComments.push(baseComment);
    await applyUserPoints(user.uid, commentPointValue, 0);
    return baseComment;
  }

  const ref = doc(collection(db, bugCollectionName(current), current.id, "comments"));
  const comment = { ...baseComment, id: ref.id };
  await setDoc(ref, comment);
  await syncEngagementPoints(user);
  return comment;
}
