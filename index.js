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

// --- ENDPOINT VECHI: PENTRU UN SINGUR SCREENSHOT ---
app.get("/", async (req, res) => {
  if (req.query.token !== API_SECRET) {
    return res.status(403).send('Acces neautorizat. Token invalid.');
  }

  let browser = null;
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).send('Eroare: Parametrul "url" este obligatoriu.');
    }
    
    browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();

    const width = req.query.width ? parseInt(req.query.width, 10) : 1280;
    const height = req.query.height ? parseInt(req.query.height, 10) : 800;
    await page.setViewport({ width, height });

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
    
    const screenshot = await page.screenshot({ 
      fullPage: req.query.full !== 'false', 
      type: 'jpeg', 
      quality: 85 
    });

    res.setHeader("Content-Type", "image/jpeg");
    res.send(screenshot);
  } catch (error) {
    console.error("Eroare la screenshot singular:", error);
    res.status(500).send(`A apărut o eroare: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// --- ENDPOINT VECHI: PENTRU AMBELE SCREENSHOT-URI (MOBIL + DESKTOP) ---
app.get("/both", async (req, res) => {
  if (req.query.token !== API_SECRET) {
    return res.status(403).send('Acces neautorizat. Token invalid.');
  }

  let browser = null;
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).send('Eroare: Parametrul "url" este obligatoriu.');
    }
    
    browser = await puppeteer.launch(PUPPETEER_OPTIONS);

    const takeScreenshot = async (viewport, full = true) => {
      const page = await browser.newPage();
      await page.setViewport(viewport);
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });

      const imageBuffer = await page.screenshot({ 
        fullPage: full, 
        type: 'jpeg', 
        quality: 85
      });
      await page.close();
      
      return imageBuffer.toString('base64');
    };

    const desktopViewport = { width: 1280, height: 800 };
    const mobileViewport = { width: 375, height: 812 };

    console.log(`Pornire screenshot-uri în paralel pentru ${url}...`);
    const [desktopImage, mobileImage] = await Promise.all([
      takeScreenshot(desktopViewport, true),
      takeScreenshot(mobileViewport, false)
    ]);
    console.log("Ambele screenshot-uri au fost finalizate.");
    
    res.json({
      desktop: desktopImage,
      mobile: mobileImage
    });

  } catch (error) {
    console.error("Eroare la screenshot-uri paralele:", error);
    res.status(500).send(`A apărut o eroare: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// ====================================================================
// === ENDPOINT NOU ȘI SIMPLU DOAR PENTRU DEBUGGING-UL IMAGINII MOBILE ===
// ====================================================================
app.get("/test-mobile", async (req, res) => {
  if (req.query.token !== API_SECRET) {
    return res.status(403).send('Acces neautorizat.');
  }

  let browser = null;
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).send('URL lipsă.');
    }
    
    console.log('[TEST-MOBILE] Pornire pentru URL:', url);
    browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();
    
    // Setăm viewport-ul specific pentru mobil
    await page.setViewport({ width: 375, height: 812 });
    
    // Navigăm la pagină
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });

    // Facem screenshot DOAR "above the fold" (fullPage: false)
    const imageBuffer = await page.screenshot({ 
      fullPage: false, // Aceasta este setarea crucială pe care o testăm
      type: 'jpeg', 
      quality: 85
    });

    // Trimitem imaginea direct, FĂRĂ Base64, ca să o vedem în browser
    console.log('[TEST-MOBILE] Screenshot realizat. Trimitere imagine...');
    res.setHeader("Content-Type", "image/jpeg");
    res.send(imageBuffer);

  } catch (error) {
    console.error("[TEST-MOBILE] Eroare:", error);
    res.status(500).send(`A apărut o eroare: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});


app.listen(PORT, () => {
  console.log(`Serverul ascultă pe portul ${PORT}`);
});
