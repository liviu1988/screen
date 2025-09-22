// Fișier: index.js
const express = require("express");
const puppeteer = require("puppeteer");
const PORT = process.env.PORT || 3000;

const API_SECRET = '3732ee153732ee153732ee153732ee153732ee15';
const app = express();

const PUPPETEER_OPTIONS = {
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process'],
  headless: true
};

// ENDPOINT SINGULAR
app.get("/", async (req, res) => { /* codul vechi */ });
// ENDPOINT BOTH
app.get("/both", async (req, res) => { /* codul vechi */ });

// ENDPOINT NOU DE TEST
app.get("/test-mobile", async (req, res) => {
  if (req.query.token !== API_SECRET) return res.status(403).send('Acces neautorizat.');

  let browser = null;
  try {
    const url = req.query.url;
    if (!url) return res.status(400).send('URL lipsă.');
    
    console.log('[TEST-MOBILE] Pornire pentru URL:', url);
    browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
    const imageBuffer = await page.screenshot({ fullPage: false, type: 'jpeg', quality: 85 });
    console.log('[TEST-MOBILE] Screenshot realizat. Trimitere imagine...');
    res.setHeader("Content-Type", "image/jpeg");
    res.send(imageBuffer);

  } catch (error) {
    console.error("[TEST-MOBILE] Eroare:", error);
    res.status(500).send(`A apărut o eroare: ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`Serverul ascultă pe portul ${PORT}`);
});
