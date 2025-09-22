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

// --- ENDPOINT #1: DOAR PENTRU MOBIL (fără full page, rămâne neschimbat) ---
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

// ====================================================================
// === ENDPOINT #2: PENTRU DESKTOP - CU ÎNĂLȚIME MAXIMĂ LIMITATĂ     ===
// ====================================================================
app.get("/desktop-only", async (req, res) => {
    if (req.query.token !== API_SECRET) return res.status(403).send('Acces neautorizat.');

  let browser = null;
  try {
    const url = req.query.url;
    if (!url) return res.status(400).send('URL lipsă.');
    
    browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();
    
    const viewportWidth = 1280;
    // Setăm o înălțime de viewport inițială standard
    await page.setViewport({ width: viewportWidth, height: 800 }); 
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
    
    // --- AICI ESTE MAGIA ---
    
    // Definim o înălțime maximă pentru screenshot.
    // Poți ajusta această valoare. 3000px este un echilibru bun.
    const maxHeight = 3000;
    
    // Facem screenshot-ul folosind opțiunea "clip"
    const imageBuffer = await page.screenshot({
        type: 'jpeg',
        quality: 85,
        // "clip" definește o zonă exactă de captură:
        clip: {
            x: 0, // Începe de la marginea din stânga
            y: 0, // Începe de la marginea de sus
            width: viewportWidth, // Lățimea este cea a viewport-ului
            height: maxHeight   // Înălțimea este limitată la valoarea noastră maximă
        }
    });
    
    res.setHeader("Content-Type", "image/jpeg");
    res.send(imageBuffer);
  } catch (error) {
    console.error("[DESKTOP-ONLY] Eroare:", error);
    res.status(500).send(`A apărut o eroare la generarea imaginii desktop.`);
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`Serverul ascultă pe portul ${PORT}`);
});
