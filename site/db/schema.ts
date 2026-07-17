import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const stravaConnections = sqliteTable("strava_connections", {
  uid: text("uid").primaryKey(),
  athleteId: text("athlete_id").notNull(),
  athleteName: text("athlete_name"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: integer("expires_at").notNull(),
  lastSyncAt: text("last_sync_at"),
  updatedAt: text("updated_at").notNull(),
});

export const stravaOauthStates = sqliteTable("strava_oauth_states", {
  state: text("state").primaryKey(),
  uid: text("uid").notNull(),
  expiresAt: integer("expires_at").notNull(),
});

export const stravaActivities = sqliteTable(
  "strava_activities",
  {
    uid: text("uid").notNull(),
    activityId: text("activity_id").notNull(),
    sportType: text("sport_type").notNull(),
    distanceMeters: integer("distance_meters").notNull(),
    startDateLocal: text("start_date_local").notNull(),
  },
  (table) => [primaryKey({ columns: [table.uid, table.activityId] })],
);
