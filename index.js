// Fișier: index.js
const express = require("express");
const puppeteer = require("puppeteer");
const PORT = process.env.PORT || 3000;

// Parola ta secretă
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

// --- ENDPOINT VECHI, PENTRU UN SINGUR SCREENSHOT ---
app.get("/", async (req, res) => {
  // Verificare de securitate
  if (req.query.token !== API_SECRET) {
      return res.status(403).send('Acces neautorizat. Token invalid.');
  }

  let browser = null;
  try {
    const url = req.query.url;
    if (!url) return res.status(400).send('Eroare: Parametrul "url" este obligatoriu.');
    
    browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();
    const width = req.query.width ? parseInt(req.query.width, 10) : 1280;
    const height = req.query.height ? parseInt(req.query.height, 10) : 800;
    await page.setViewport({ width, height });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
    
    const screenshot = await page.screenshot({ fullPage: req.query.full === 'true', type: 'jpeg', quality: 85 });
    res.setHeader("Content-Type", "image/jpeg");
    res.send(screenshot);
  } catch (error) {
    console.error("Eroare la screenshot singular:", error);
    res.status(500).send(`A apărut o eroare: ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }
});


// --- ENDPOINT NOU, PENTRU AMBELE SCREENSHOT-URI (MOBIL ȘI DESKTOP) ---
app.get("/both", async (req, res) => {
  // Verificare de securitate
  if (req.query.token !== API_SECRET) {
      return res.status(403).send('Acces neautorizat. Token invalid.');
  }

  let browser = null;
  try {
    const url = req.query.url;
    if (!url) return res.status(400).send('Eroare: Parametrul "url" este obligatoriu.');
    
    // Lansăm browser-ul O SINGURĂ DATĂ
    browser = await puppeteer.launch(PUPPETEER_OPTIONS);

    // Funcție ajutătoare pentru a face un screenshot
    const takeScreenshot = async (viewport) => {
      const page = await browser.newPage();
      await page.setViewport(viewport);
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
      const imageBuffer = await page.screenshot({ fullPage: true, type: 'jpeg', quality: 85, encoding: 'base64' });
      await page.close();
      return imageBuffer;
    };

    // Definim viewport-urile
    const desktopViewport = { width: 1280, height: 800 };
    const mobileViewport = { width: 375, height: 812 };

    // Rulăm ambele task-uri ÎN PARALEL
    console.log(`Pornire screenshot-uri în paralel pentru ${url}...`);
    const [desktopImage, mobileImage] = await Promise.all([
      takeScreenshot(desktopViewport),
      takeScreenshot(mobileViewport)
    ]);
    console.log("Ambele screenshot-uri au fost finalizate.");
    
    // Trimitem rezultatul ca JSON
    res.json({
      desktop: desktopImage,
      mobile: mobileImage
    });

  } catch (error) {
    console.error("Eroare la screenshot-uri paralele:", error);
    res.status(500).send(`A apărut o eroare: ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }
});


app.listen(PORT, () => {
  console.log(`Serverul ascultă pe portul ${PORT}`);
});
