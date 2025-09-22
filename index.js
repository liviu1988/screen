// Fișier: index.js
const express = require("express");
const puppeteer = require("puppeteer");
const PORT = process.env.PORT || 3000;

const API_SECRET = '3732ee153732ee153732ee153732ee153732ee15';

const app = express();

const PUPPETEER_OPTIONS = {
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--single-process'
  ],
  headless: true
};

// --- AICI DEFINIM USER AGENT-URILE PE CARE LE VOM FOLOSI ---
const GOOGLEBOT_DESKTOP_USER_AGENT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const GOOGLEBOT_MOBILE_USER_AGENT = 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.96 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';


// --- ENDPOINT #1: PENTRU MOBIL ---
app.get("/mobile-only", async (req, res) => {
  if (req.query.token !== API_SECRET) return res.status(403).send('Acces neautorizat.');
  let browser = null;
  try {
    const url = req.query.url;
    if (!url) return res.status(400).send('URL lipsă.');
    
    browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();

    // --- AICI ESTE MODIFICAREA PENTRU GOOGLEBOT MOBIL ---
    await page.setUserAgent(GOOGLEBOT_MOBILE_USER_AGENT);
    
    await page.setViewport({ width: 375, height: 812 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
    const imageBuffer = await page.screenshot({ fullPage: false, type: 'jpeg', quality: 85 });
    
    res.setHeader("Content-Type", "image/jpeg");
    res.send(imageBuffer);
  } catch (error) {
    console.error("[MOBILE-ONLY] Eroare:", error.message);
    res.status(500).send(`A apărut o eroare la generarea imaginii mobile.`);
  } finally {
    if (browser) await browser.close();
  }
});

// --- ENDPOINT #2: PENTRU DESKTOP ---
app.get("/desktop-only", async (req, res) => {
    if (req.query.token !== API_SECRET) return res.status(403).send('Acces neautorizat.');
  let browser = null;
  try {
    const url = req.query.url;
    if (!url) return res.status(400).send('URL lipsă.');
    
    browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();
    
    // --- AICI ESTE MODIFICAREA PENTRU GOOGLEBOT DESKTOP ---
    await page.setUserAgent(GOOGLEBOT_DESKTOP_USER_AGENT);
    
    const viewportWidth = 1280;
    const viewportHeight = 812;
    
    await page.setViewport({ width: viewportWidth, height: viewportHeight }); 
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
    
    const imageBuffer = await page.screenshot({
        fullPage: false,
        type: 'jpeg',
        quality: 85
    });
    
    res.setHeader("Content-Type", "image/jpeg");
    res.send(imageBuffer);
  } catch (error) {
    console.error("[DESKTOP-ONLY] Eroare:", error.message);
    res.status(500).send(`A apărut o eroare la generarea imaginii desktop.`);
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`Serverul ascultă pe portul ${PORT}`);
});
