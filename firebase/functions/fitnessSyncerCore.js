const { createHash } = require("node:crypto");

const supportedActivities = ["walk", "walking", "hike", "hiking", "run", "running", "cycle", "cycling", "bike", "biking"];

function activityItem(value) {
  return value && typeof value === "object" && value.item && typeof value.item === "object" ? value.item : value;
}

function activityDistanceKm(value) {
  const item = activityItem(value);
  if (!item || item.type !== "Activity" || item.summary === true || item.manual === true) return 0;
  const activity = String(item.fitnessSyncerActivity || item.activity || "").trim().toLowerCase();
  if (!supportedActivities.some((candidate) => activity === candidate || activity.includes(candidate))) return 0;
  const distance = Number(item.distanceKM);
  return Number.isFinite(distance) && distance > 0 ? Math.round(distance * 1000) / 1000 : 0;
}

function activityTimestamp(value) {
  const item = activityItem(value);
  const timestamp = Number(item?.date);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : 0;
}

function activityImportId(sourceId, value) {
  const item = activityItem(value);
  const providerId = String(item?.itemId || `${activityTimestamp(item)}:${item?.distanceKM || 0}:${item?.activity || "activity"}`);
  return createHash("sha256").update(`${sourceId}:${providerId}`).digest("hex");
}

function tokenExpiryMs(expiresIn, now = Date.now()) {
  const value = Number(expiresIn);
  if (!Number.isFinite(value) || value <= 0) return now + 3600000;
  return value > Math.floor(now / 2000) ? value * 1000 : now + value * 1000;
}

module.exports = { activityDistanceKm, activityImportId, activityTimestamp, tokenExpiryMs };
