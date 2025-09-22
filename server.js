// Fișier: server.js
const express = require("express");
const puppeteer = require("puppeteer-core");
const chromium = require("chrome-aws-lambda"); // Schimbat pachetul aici

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", async (req, res) => {
  let browser = null;

  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).send('Eroare: Parametrul "url" este obligatoriu.');
    }
    
    // Noul pachet are nevoie de aceste setări specifice
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    const width = req.query.width ? parseInt(req.query.width, 10) : 1280;
    const height = req.query.height ? parseInt(req.query.height, 10) : 800;
    await page.setViewport({ width, height });
    
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });

    const screenshot = await page.screenshot({ 
      fullPage: req.query.full === 'true',
      type: 'jpeg',
      quality: 85
    });

    res.setHeader("Content-Type", "image/jpeg");
    res.send(screenshot);

  } catch (error) {
    console.error("EROARE DETALIATĂ:", error);
    res.status(500).send(`DEBUG: Eroarea reală este -> ${error.message}`); 

  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Serverul ascultă pe portul ${PORT}`);
});
