// index.js
const express = require("express");
const puppeteer = require("puppeteer");

const PORT = process.env.PORT || 3000;
const API_SECRET = "3732ee153732ee153732ee153732ee153732ee15";

// ---------- Helpers ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const getExecutablePath = () =>
  process.env.PUPPETEER_EXECUTABLE_PATH ||
  process.env.CHROMIUM_PATH ||
  (typeof puppeteer.executablePath === "function" ? puppeteer.executablePath() : undefined);

const BASE_LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--no-zygote",
  "--single-process",
  "--remote-debugging-port=9222",
  "--window-size=1280,812",
];

const PUPPETEER_OPTIONS = {
  headless: true, // use true for cross-version compatibility (instead of 'new')
  args: BASE_LAUNCH_ARGS,
  executablePath: getExecutablePath(),
  ignoreHTTPSErrors: true,
  defaultViewport: null,
};

const UA_GOOGLEBOT_DESKTOP =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const UA_GOOGLEBOT_MOBILE =
  "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.96 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

const app = express();

function requireToken(req, res) {
  if (req.query.token !== API_SECRET) {
    res.status(403).send("Acces neautorizat.");
    return false;
  }
  return true;
}

function normalizeUrl(u) {
  if (!u) return null;
  try {
    return new URL(u.startsWith("http") ? u : `https://${u}`).toString();
  } catch {
    return null;
  }
}

async function makeShot({ url, userAgent, width, height }) {
  const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
  try {
    const page = await browser.newPage();

    // Diagnostics to server logs
    page.on("console", (msg) => console.log("[PAGE LOG]", msg.type(), msg.text()));
    page.on("pageerror", (err) => console.error("[PAGE ERROR]", err && err.stack ? err.stack : err));
    page.on("requestfailed", (req) => {
      const failure = req.failure() || {};
      console.error("[REQ FAILED]", req.url(), failure.errorText || failure.error || "");
    });

    await page.setUserAgent(userAgent);
    await page.setExtraHTTPHeaders({
      "Accept-Language": "ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7",
    });

    await page.setViewport({ width, height, deviceScaleFactor: 1 });

    // Some sites keep connections open; networkidle2 is safer on older versions
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Ensure DOM present
    await page.waitForSelector("body", { timeout: 15000 });

    // Small grace period for late assets (cross-version: use sleep)
    await sleep(800);

    const buf = await page.screenshot({
      type: "jpeg",
      quality: 85,
      fullPage: false,
      captureBeyondViewport: false,
    });

    return buf;
  } finally {
    await browser.close();
  }
}

// --------- Routes ---------

// Mobile (Googlebot mobile UA)
app.get("/mobile-only", async (req, res) => {
  if (!requireToken(req, res)) return;

  const url = normalizeUrl(req.query.url);
  if (!url) return res.status(400).send("URL lipsă sau invalid.");

  try {
    const img = await makeShot({
      url,
      userAgent: UA_GOOGLEBOT_MOBILE,
      width: 375,
      height: 812,
    });
    res.set("Content-Type", "image/jpeg");
    res.send(img);
  } catch (e) {
    console.error("[MOBILE-ONLY] Eroare:", e);
    res.status(500).send(`Eroare MOBIL: ${e && e.message ? e.message : e}`);
  }
});

// Desktop (Googlebot desktop UA)
app.get("/desktop-only", async (req, res) => {
  if (!requireToken(req, res)) return;

  const url = normalizeUrl(req.query.url);
  if (!url) return res.status(400).send("URL lipsă sau invalid.");

  try {
    const img = await makeShot({
      url,
      userAgent: UA_GOOGLEBOT_DESKTOP,
      width: 1280,
      height: 812,
    });
    res.set("Content-Type", "image/jpeg");
    res.send(img);
  } catch (e) {
    console.error("[DESKTOP-ONLY] Eroare:", e);
    res.status(500).send(`Eroare DESKTOP: ${e && e.message ? e.message : e}`);
  }
});

// Health probe
app.get("/health", (_req, res) => res.send("OK"));

app.listen(PORT, () => {
  console.log(`Serverul ascultă pe portul ${PORT}`);
});
