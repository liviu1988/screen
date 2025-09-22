const express = require("express");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium-min");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).send('Eroare: Parametrul "url" este obligatoriu.');
    }

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    const width = req.query.width ? parseInt(req.query.width, 10) : 1280;
    const height = req.query.height ? parseInt(req.query.height, 10) : 800;
    await page.setViewport({ width, height });
    
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    const screenshot = await page.screenshot({ 
      fullPage: req.query.full === 'true',
      type: 'jpeg',
      quality: 85
    });

    await browser.close();

    res.setHeader("Content-Type", "image/jpeg");
    res.send(screenshot);

  } catch (error) {
    console.error("A apărut o eroare:", error.message);
    res.status(500).send("Eroare la generarea screenshot-ului. URL-ul ar putea fi invalid.");
  }
});

app.listen(PORT, () => {
  console.log(`Serverul ascultă pe portul ${PORT}`);
});
