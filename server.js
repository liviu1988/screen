// Fișier: server.js
const express = require("express");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium-min");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", async (req, res) => {
  let browser = null; // Definim browser-ul aici pentru a-l putea închide în caz de eroare

  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).send('Eroare: Parametrul "url" este obligatoriu.');
    }

    // --- MODIFICARE CHEIE 1: Am adăugat flag-uri de siguranță ---
    const browserArgs = [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process'
    ];
    
    browser = await puppeteer.launch({
      args: browserArgs,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    const width = req.query.width ? parseInt(req.query.width, 10) : 1280;
    const height = req.query.height ? parseInt(req.query.height, 10) : 800;
    await page.setViewport({ width, height });
    
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 }); // Timeout mai mare

    const screenshot = await page.screenshot({ 
      fullPage: req.query.full === 'true',
      type: 'jpeg',
      quality: 85
    });

    res.setHeader("Content-Type", "image/jpeg");
    res.send(screenshot);

  } catch (error) {
    // --- MODIFICARE CHEIE 2: Afișăm eroarea REALĂ ---
    console.error("EROARE DETALIATĂ:", error); // Logăm eroarea completă pe server
    // Trimitem mesajul specific de eroare în browser pentru a-l vedea ușor
    res.status(500).send(`DEBUG: Eroarea reală este -> ${error.message}`); 

  } finally {
    // Ne asigurăm că browser-ul se închide mereu, chiar dacă a fost o eroare
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Serverul ascultă pe portul ${PORT}`);
});
