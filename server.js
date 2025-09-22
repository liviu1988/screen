// Fișier: index.js
const express = require("express");
const puppeteer = require("puppeteer-core");
const chromium = require("chrome-aws-lambda");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pentru a verifica dacă serverul este funcțional
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.get("/", async (req, res) => {
  console.log("Început procesare cerere screenshot...");
  let browser = null;

  try {
    const url = req.query.url;
    if (!url) {
      console.log("Eroare: Parametrul 'url' lipsește.");
      return res.status(400).send('Eroare: Parametrul "url" este obligatoriu.');
    }
    console.log(`URL solicitat: ${url}`);

    // Setările pentru lansarea browser-ului
    console.log("Lansare browser...");
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath, // Important: pentru puppeteer@10 este fără '()'
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
    console.log("Browser lansat cu succes.");

    const page = await browser.newPage();
    console.log("Pagină nouă creată.");

    const width = req.query.width ? parseInt(req.query.width, 10) : 1280;
    const height = req.query.height ? parseInt(req.query.height, 10) : 800;
    await page.setViewport({ width, height });
    console.log(`Viewport setat la ${width}x${height}.`);

    console.log("Navigare la URL...");
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
    console.log("Navigare finalizată.");

    console.log("Realizare screenshot...");
    const screenshot = await page.screenshot({
      fullPage: req.query.full === 'true',
      type: 'jpeg',
      quality: 85
    });
    console.log("Screenshot realizat cu succes.");

    res.setHeader("Content-Type", "image/jpeg");
    res.send(screenshot);

  } catch (error) {
    console.error("A apărut o eroare în timpul procesării:", error);
    res.status(500).send(`A apărut o eroare: ${error.message}`);

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
