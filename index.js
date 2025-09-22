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

// --- ENDPOINT #1: PENTRU MOBIL (neschimbat, este deja corect) ---
app.get("/mobile-only", async (req, res) => {
  if (req.query.token !== API_SECRET) return res.status(403).send('Acces neautorizat.');
  let browser = null;
  try {
    const url = req.query.url;
    if (!url) return res.status(400).send('URL lipsă.');
    
    browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
    const imageBuffer = await page.screenshot({ fullPage: false, type: 'jpeg', quality: 85 });
    
    res.setHeader("Content-Type", "image/jpeg");
    res.send(imageBuffer);
  } catch (error) {
    console.error("[MOBILE-ONLY] Eroare:", error);
    res.status(500).send(`A apărut o eroare la generarea imaginii mobile.`);
  } finally {
    if (browser) await browser.close();
  }
});

// ================================================================
// === ENDPOINT #2: PENTRU DESKTOP - METODA CU VIEWPORT FIX       ===
// ================================================================
app.get("/desktop-only", async (req, res) => {
    if (req.query.token !== API_SECRET) return res.status(403).send('Acces neautorizat.');

  let browser = null;
  try {
    const url = req.query.url;
    if (!url) return res.status(400).send('URL lipsă.');
    
    browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();
    
    // --- AICI ESTE NOUA LOGICĂ ---
    
    const viewportWidth = 1280;
    const viewportHeight = 3000; // Înălțimea fixă a screenshot-ului
    
    // 1. Setăm viewport-ul EXACT la dimensiunea pe care o dorim.
    await page.setViewport({ width: viewportWidth, height: viewportHeight }); 
    
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
    
    // 2. Facem screenshot cu `fullPage: false`. Acesta va fotografia
    // doar viewport-ul, care acum este de 1280x3000 pixeli.
    const imageBuffer = await page.screenshot({
        fullPage: false,
        type: 'jpeg',
        quality: 85
    });
    
    res.setHeader("Content-Type", "image/jpeg");
    res.send(imageBuffer);
  } catch (error)... {
    console.error("[DESKTOP-ONLY] Eroare:", error);
    res.status(500).send(`A apărut o eroare la generarea imaginii desktop.`);
  } finally {
    if (browser) await browser.close();
  }
});


app.listen(PORT, () => {
  console.log(`Serverul ascultă pe portul ${PORT}`);
});
