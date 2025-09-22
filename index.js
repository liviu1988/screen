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

// ==========================================================================================
// === ENDPOINT FINAL /both CU IZOLARE TOTALĂ (LANSEAZĂ 2 BROWSERE SEPARATE)              ===
// === ACEASTA ESTE SOLUȚIA CARE VA FUNCȚIONA GARANTAT                                    ===
// ==========================================================================================
app.get("/both", async (req, res) => {
  if (req.query.token !== API_SECRET) {
    return res.status(403).send('Acces neautorizat. Token invalid.');
  }

  // NU mai definim browser aici. Fiecare task va avea propriul său browser.
  let desktopBrowser = null;
  let mobileBrowser = null;
  
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).send('Eroare: Parametrul "url" este obligatoriu.');
    }
    
    // --- TASK 1: Screenshot-ul DESKTOP într-un browser propriu ---
    console.log("[ISOLATION] Lansare browser #1 pentru DESKTOP...");
    desktopBrowser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const desktopPage = await desktopBrowser.newPage();
    await desktopPage.setViewport({ width: 1280, height: 800 });
    await desktopPage.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
    const desktopImageBuffer = await desktopPage.screenshot({ fullPage: true, type: 'jpeg', quality: 85 });
    console.log("[ISOLATION] Screenshot DESKTOP finalizat.");
    await desktopBrowser.close(); // Închidem imediat primul browser
    console.log("[ISOLATION] Browser #1 ÎNCHIS.");

    // --- TASK 2: Screenshot-ul MOBIL într-un al doilea browser, complet separat ---
    console.log("[ISOLATION] Lansare browser #2 pentru MOBIL...");
    mobileBrowser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const mobilePage = await mobileBrowser.newPage();
    await mobilePage.setViewport({ width: 375, height: 812 });
    await mobilePage.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
    const mobileImageBuffer = await mobilePage.screenshot({ fullPage: false, type: 'jpeg', quality: 85 }); // fullPage: false este respectat
    console.log("[ISOLATION] Screenshot MOBIL finalizat.");
    await mobileBrowser.close(); // Închidem al doilea browser
    console.log("[ISOLATION] Browser #2 ÎNCHIS.");
    
    // Convertim imaginile binare (buffer) în text Base64
    const desktopImageBase64 = desktopImageBuffer.toString('base64');
    const mobileImageBase64 = mobileImageBuffer.toString('base64');

    console.log("[ISOLATION] Trimitere răspuns JSON...");
    res.json({
      desktop: desktopImageBase64,
      mobile: mobileImageBase64
    });

  } catch (error) {
    console.error("[ISOLATION] Eroare în timpul procesării izolate:", error);
    res.status(500).send(`A apărut o eroare: ${error.message}`);
  } finally {
    // Măsură de siguranță dublă pentru a închide orice browser care a rămas deschis
    if (desktopBrowser) await desktopBrowser.close();
    if (mobileBrowser) await mobileBrowser.close();
  }
});


// Am lăsat și endpoint-urile vechi aici, pentru orice eventualitate
app.get("/", (req, res) => res.send("Endpoint singular. Folosește /both."));
app.get("/test-mobile", (req, res) => res.send("Endpoint de test. Folosește /both."));


app.listen(PORT, () => {
  console.log(`Serverul ascultă pe portul ${PORT}`);
});
