import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const playwrightPath = process.env.BUGBAAS_PLAYWRIGHT_PATH;
if (!playwrightPath) throw new Error("Set BUGBAAS_PLAYWRIGHT_PATH to an isolated playwright-core module.");
const require = createRequire(import.meta.url);
const { chromium } = require(playwrightPath);
const baseUrl = process.env.BUGBAAS_PLAYTEST_URL ?? "http://127.0.0.1:4173/game/";
const sitesBypassToken = process.env.BUGBAAS_SITES_BYPASS_TOKEN;
const outputDir = path.resolve("dist", "playtest-2.10.4");
await mkdir(outputDir, { recursive: true });
const browserErrors = [];

function watchPage(page, label) {
  page.on("console", (message) => {
    const url = message.location().url;
    const expectedStaticMiss = baseUrl.startsWith("http://127.0.0.1") && (url.endsWith("/favicon.ico") || url.endsWith("/api/strava/status"));
    const unrelatedExternalFailure = message.text().startsWith("Failed to load resource") && (url.startsWith("https://api.github.com/") || url.startsWith("https://firestore.googleapis.com/"));
    if (message.type() === "error" && !expectedStaticMiss && !unrelatedExternalFailure) browserErrors.push(`${label}: ${message.text()} (${url})`);
  });
  page.on("pageerror", (error) => browserErrors.push(`${label}: ${error.message}`));
  return page;
}

async function newTestPage(browser, viewport, label) {
  const page = await browser.newPage({ viewport });
  if (sitesBypassToken) {
    const sitesOrigin = new URL(baseUrl).origin;
    await page.route("**/*", (route) => {
      const request = route.request();
      if (new URL(request.url()).origin !== sitesOrigin) return route.continue();
      return route.continue({ headers: { ...request.headers(), "OAI-Sites-Authorization": `Bearer ${sitesBypassToken}` } });
    });
  }
  return watchPage(page, label);
}

async function login(page, suffix) {
  await page.goto(baseUrl);
  if (await page.getByText("Arena", { exact: true }).count()) return;
  await page.getByText("Met e-mail inloggen").click();
  await page.locator("input").nth(0).fill("playtest-1784358571780-tower@example.com");
  await page.locator("input").nth(1).fill("test1234");
  await page.getByText("E-mail login", { exact: true }).click();
  await page.waitForTimeout(2000);
  for (let step = 0; step < 12; step += 1) {
    let progressed = false;
    for (const label of ["Opslaan", "Overslaan", "Klaar", "Doorgaan"]) {
      const dismiss = page.getByText(label, { exact: true }).last();
      if (await dismiss.count() && await dismiss.isVisible()) {
        await dismiss.click({ timeout: 2000 }).catch(() => undefined);
        await page.waitForTimeout(180);
        progressed = true;
        break;
      }
    }
    if (!progressed) await page.waitForTimeout(250);
  }
  await page.waitForTimeout(350);
}

async function openArena(page, suffix) {
  await login(page, suffix);
  const arena = page.getByText("Arena", { exact: true });
  if (!await arena.count()) {
    await page.screenshot({ path: path.join(outputDir, `login-blocked-${suffix}.png`), fullPage: true });
    throw new Error(`Arena unavailable after demo login (${suffix}): ${await page.locator("body").innerText()}`);
  }
  await page.screenshot({ path: path.join(outputDir, `before-arena-${suffix}.png`), fullPage: true });
  await arena.last().click();
  await page.getByText("Bubble Swarm", { exact: true }).waitFor();
}

function arcadeCard(page, title) {
  return page.getByText(title, { exact: true }).locator("xpath=../..");
}

async function openTraining(page, suffix, title, rankedLabel = "Start") {
  await openArena(page, suffix);
  const card = arcadeCard(page, title);
  assert.equal(await card.getByText(rankedLabel, { exact: true }).count(), 1, `${title} needs a ranked button`);
  assert.equal(await card.getByText("Train", { exact: true }).count(), 1, `${title} needs a Train button`);
  await card.getByText("Train", { exact: true }).click();
}

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true
});

try {
  const towerPage = await newTestPage(browser, { height: 844, width: 390 }, "tower");
  await openTraining(towerPage, "tower", "Bug Tower");
  await towerPage.getByText("Start climb", { exact: true }).click();
  const towerText = await towerPage.locator("body").innerText();
  assert.ok(!towerText.includes("Tilt"), "Bug Tower must not advertise tilt controls");
  assert.ok(!towerText.includes("JUMP"), "Bug Tower must not render a separate jump button");
  assert.ok(towerText.includes("Ice Citadel"), "Tower must show the active 100-floor background zone");
  assert.ok(towerText.includes("#1"), "Tower platforms must display floor numbers");
  assert.ok(towerText.includes("←") && towerText.includes("→"), "Tower must visibly mark both touch directions");
  assert.ok(towerText.includes("HOLD LEFT") && towerText.includes("HOLD RIGHT"), "Tower touch zones must explain their hold action");
  const rightControl = towerPage.getByLabel("Run right and charge jump");
  const rightBox = await rightControl.boundingBox();
  assert.ok(rightBox && rightBox.width >= 180, "right input must cover half the mobile playfield");
  await towerPage.mouse.move(rightBox.x + rightBox.width / 2, rightBox.y + rightBox.height / 2);
  await towerPage.mouse.down();
  await towerPage.waitForTimeout(560);
  await towerPage.screenshot({ path: path.join(outputDir, "bug-tower-charged-mobile.png") });
  await towerPage.mouse.up();
  await towerPage.waitForTimeout(260);
  await towerPage.screenshot({ path: path.join(outputDir, "bug-tower-jump-mobile.png") });

  const bubblePage = await newTestPage(browser, { height: 844, width: 390 }, "bubble");
  await openTraining(bubblePage, "bubble", "Bubble Swarm", "Ranked");
  await bubblePage.getByText("Start training", { exact: true }).click();
  const bubbleField = bubblePage.getByLabel("Bubble Swarm playfield");
  const bubbleBox = await bubbleField.boundingBox();
  assert.ok(bubbleBox && bubbleBox.height > 400, "bubble playfield must have useful mobile height");
  const bombPowerup = bubblePage.getByLabel("Arm bubble bomb");
  const freezePowerup = bubblePage.getByLabel("Freeze swarm pressure");
  assert.equal(await bombPowerup.count(), 1, "Bubble Swarm must expose a bomb power-up");
  assert.equal(await freezePowerup.count(), 1, "Bubble Swarm must expose a freeze power-up");
  await freezePowerup.click();
  assert.ok((await freezePowerup.innerText()).includes("x0"), "Freeze must consume one charge");
  await bombPowerup.click();
  assert.ok((await bombPowerup.innerText()).includes("ARMED"), "Bomb must visibly arm the next shot");
  const visibleBubbleImages = await bubblePage.locator("img").evaluateAll((images) => images
    .filter((image) => image.src.includes("bug-bubble") && image.getBoundingClientRect().width > 0)
    .map((image) => ({ height: image.getBoundingClientRect().height, width: image.getBoundingClientRect().width })));
  assert.ok(visibleBubbleImages.length >= 34, "bubble board must render a full nine-column bubble grid");
  assert.ok(visibleBubbleImages.every((bubble) => Math.abs(bubble.width - bubble.height) <= 1.5), "bubbles must be round, not stretched bars");
  assert.ok(visibleBubbleImages[0].width < 42, "mobile bubbles must be smaller than the old 11% layout");
  await bubblePage.mouse.move(bubbleBox.x + bubbleBox.width * 0.72, bubbleBox.y + bubbleBox.height * 0.72);
  await bubblePage.mouse.down();
  await bubblePage.mouse.move(bubbleBox.x + bubbleBox.width * 0.05, bubbleBox.y + bubbleBox.height * 0.52, { steps: 8 });
  const trajectoryDots = bubblePage.getByTestId("bubble-trajectory-guide").locator("div");
  assert.ok(await trajectoryDots.count() >= 15, "aiming must render a dotted wall-bounce trajectory");
  const visibleDots = await trajectoryDots.evaluateAll((dots) => dots.filter((dot) => {
    const box = dot.getBoundingClientRect();
    const style = getComputedStyle(dot);
    return box.width >= 7 && box.height >= 7 && style.backgroundColor !== "rgba(0, 0, 0, 0)";
  }).length);
  assert.ok(visibleDots >= 15, "trajectory dots must be visibly sized and colored");
  const dotBoxes = await trajectoryDots.evaluateAll((dots) => dots.map((dot) => {
    const box = dot.getBoundingClientRect();
    return { x: box.x, y: box.y };
  }));
  const dotsInField = dotBoxes.filter((dot) => dot.x >= bubbleBox.x && dot.x <= bubbleBox.x + bubbleBox.width && dot.y >= bubbleBox.y && dot.y <= bubbleBox.y + bubbleBox.height);
  assert.ok(dotsInField.length >= 12, `trajectory dots must fall inside the playfield: ${JSON.stringify(dotBoxes)}`);
  await bubblePage.screenshot({ path: path.join(outputDir, "bubble-swarm-bounce-aim-mobile.png") });
  await bubblePage.mouse.up();
  await bubblePage.waitForTimeout(150);
  assert.equal(await bubblePage.getByLabel("Bubble projectile").count(), 1, "the projectile must animate visibly instead of appearing at its target");
  await bubblePage.screenshot({ path: path.join(outputDir, "bubble-swarm-shot-mobile.png") });
  const flightFrames = await bubblePage.evaluate(() => new Promise((resolve, reject) => {
    const frames = [];
    const startedAt = performance.now();
    function sample(now) {
      const projectile = document.querySelector('[aria-label="Bubble projectile"]');
      if (projectile) {
        const box = projectile.getBoundingClientRect();
        frames.push({ t: now, x: box.x, y: box.y });
      } else if (frames.length) {
        resolve(frames);
        return;
      }
      if (now - startedAt > 1800) {
        reject(new Error("Bubble projectile did not finish within 1.8 seconds"));
        return;
      }
      requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  }));
  const lastFlightFrame = flightFrames.at(-1);
  assert.ok(Math.hypot(lastFlightFrame.x - flightFrames[0].x, lastFlightFrame.y - flightFrames[0].y) > 100, "the bubble projectile must visibly travel across the field");
  const finalPositionFrames = flightFrames.filter((frame) => Math.abs(frame.x - lastFlightFrame.x) < 0.5 && Math.abs(frame.y - lastFlightFrame.y) < 0.5);
  assert.ok(finalPositionFrames.length >= 4, "the projectile must visibly complete its final impact frames before joining the board");

  const glidePage = await newTestPage(browser, { height: 844, width: 390 }, "glide");
  await openTraining(glidePage, "glide", "Bug Glide");
  await glidePage.getByText("Start", { exact: true }).click();
  const glideField = glidePage.getByLabel("Bug Glide playfield");
  const glideBox = await glideField.boundingBox();
  assert.ok(glideBox, "Bug Glide playfield must render");
  await glidePage.mouse.click(glideBox.x + 5, glideBox.y + glideBox.height * 0.5);
  await glidePage.waitForTimeout(450);
  const characterBox = await glidePage.getByLabel("Bug Glide character").boundingBox();
  assert.ok(characterBox && characterBox.x >= glideBox.x + 31, "character must stay outside the clickable left strip");
  await glidePage.screenshot({ path: path.join(outputDir, "bug-glide-left-strip-mobile.png") });

  const desktopPage = await newTestPage(browser, { height: 800, width: 1280 }, "desktop");
  await openTraining(desktopPage, "desktop", "Bubble Swarm", "Ranked");
  await desktopPage.getByText("Start training", { exact: true }).click();
  const desktopField = desktopPage.getByLabel("Bubble Swarm playfield");
  const desktopBox = await desktopField.boundingBox();
  assert.ok(desktopBox && desktopBox.width >= 600, "bubble playfield must expand on desktop");
  await desktopPage.screenshot({ path: path.join(outputDir, "bubble-swarm-desktop.png") });

  assert.deepEqual(browserErrors, [], `browser console must remain clean:\n${browserErrors.join("\n")}`);
  console.log("Browser playtest passed: Tower controls/zone/floor labels, Bubble dotted bounce/smooth shot/smaller grid, Glide, mobile and desktop.");
} finally {
  await browser.close();
}
