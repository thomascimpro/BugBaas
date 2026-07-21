import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/screens/HomeScreen.tsx", import.meta.url), "utf8");
const start = source.indexOf("async function handleBuddyCare");
const end = source.indexOf("async function rotateBuddy", start);
const handler = source.slice(start, end);

test("buddy task is persisted before optional notification scheduling", () => {
  const firstSave = handler.indexOf("await saveBuddyState");
  const notification = handler.indexOf("await scheduleBuddyTaskNotification");
  assert.ok(firstSave >= 0, "handleBuddyCare must persist the task");
  assert.ok(notification >= 0, "handleBuddyCare must schedule the optional notification");
  assert.ok(firstSave < notification, "persist before notification APIs so closing the web page cannot lose the timer");
});
