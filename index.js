// Fișier: index.js
const express = require("express");
const puppeteer = require("puppeteer"); // Folosim pachetul complet
const PORT = process.env.PORT || 3000;

const app = express();

// Setarea argumentelor necesare pentru a rula într-un mediu ca Railway/Docker
const PUPPETEER_OPTIONS = {
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--single-process'
  ],
  headless: true
};

app.get("/", async (req, res) => {
  let browser = null;
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).send('Eroare: Parametrul "url" este obligatoriu.');
    }
    console.log(`URL solicitat: ${url}`);

    // Lansăm browser-ul care a fost instalat automat de Puppeteer
    console.log("Lansare browser...");
    browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    console.log("Browser lansat.");

    const page = await browser.newPage();
    console.log("Pagină nouă creată.");

    const width = req.query.width ? parseInt(req.query.width, 10) : 1280;
    const height = req.query.height ? parseInt(req.query.height, 10) : 800;
    await page.setViewport({ width, height });

    console.log("Navigare la URL...");
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
    console.log("Navigare finalizată.");
    
    const screenshot = await page.screenshot({
      fullPage: req.query.full === 'true',
      type: 'jpeg',
      quality: 85
    });
    console.log("Screenshot realizat.");

    res.setHeader("Content-Type", "image/jpeg");
    res.send(screenshot);
  
  } catch (error) {
    console.error("A apărut o eroare:", error);
    res.status(500).send(`A apărut o eroare la generare: ${error.message}`);
  
  } finally {
    if (browser) {
      console.log("Închidere browser...");
      await browser.close();
      console.log("Browser închis.");
    }
  }
});

app.listen(PORT, () => {
  console.log(`Serverul ascultă pe portul ${PORT}`);
});
