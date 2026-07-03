const admin = require("firebase-admin");

const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!rawServiceAccount) {
  throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON secret.");
}

const serviceAccount = JSON.parse(rawServiceAccount);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const gameIds = ["bug_glide", "nest_defense", "web_runner"];
const dryRun = process.argv.includes("--dry-run");
const hours = Number(process.env.HOURS || 48);
const batchSize = Math.min(Math.max(Number(process.env.BATCH_SIZE || 400), 1), 400);

if (!Number.isFinite(hours) || hours <= 0) {
  throw new Error(`Invalid HOURS value: ${process.env.HOURS}`);
}

const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
const cutoffIso = cutoff.toISOString();

async function deleteOldRunsForGame(gameId) {
  const runsRef = db
    .collection("arcadeGameResults")
    .doc(gameId)
    .collection("runs");

  let total = 0;

  while (true) {
    const snapshot = await runsRef
      .where("timestamp", "<", cutoffIso)
      .orderBy("timestamp", "asc")
      .limit(batchSize)
      .get();

    if (snapshot.empty) break;

    total += snapshot.size;
    console.log(`[arcade:${gameId}] batch=${snapshot.size}`);

    if (dryRun) {
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        console.log(`[DRY RUN] would delete ${doc.ref.path} timestamp=${String(data.timestamp)}`);
      });
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      console.log(`[DELETE] ${doc.ref.path}`);
    });
    await batch.commit();
  }

  console.log(`[arcade:${gameId}] ${dryRun ? "would delete at least" : "deleted"} ${total}`);
  return total;
}

async function deleteOldBugSmashDuels() {
  const duelsRef = db.collection("bugSmashDuels");
  let total = 0;

  while (true) {
    const snapshot = await duelsRef
      .where("createdAt", "<", cutoffIso)
      .orderBy("createdAt", "asc")
      .limit(batchSize)
      .get();

    if (snapshot.empty) break;

    total += snapshot.size;
    console.log(`[bugSmashDuels] batch=${snapshot.size}`);

    if (dryRun) {
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        console.log(`[DRY RUN] would delete ${doc.ref.path} createdAt=${String(data.createdAt)}`);
      });
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      console.log(`[DELETE] ${doc.ref.path}`);
    });
    await batch.commit();
  }

  console.log(`[bugSmashDuels] ${dryRun ? "would delete at least" : "deleted"} ${total}`);
  return total;
}

async function main() {
  console.log(`Cleanup old game data older than ${hours} hours`);
  console.log(`Cutoff: ${cutoffIso}`);
  console.log("Timestamp mode: ISO string");
  console.log(`Mode: ${dryRun ? "DRY RUN" : "DELETE"}`);
  console.log(`Arcade games: ${gameIds.join(", ")}`);
  console.log("Collections: arcadeGameResults/*/runs, bugSmashDuels");

  let grandTotal = 0;
  for (const gameId of gameIds) {
    grandTotal += await deleteOldRunsForGame(gameId);
  }
  grandTotal += await deleteOldBugSmashDuels();

  console.log(`${dryRun ? "Would delete at least" : "Deleted"}: ${grandTotal}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
