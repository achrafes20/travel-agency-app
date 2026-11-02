import assert from "node:assert/strict";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const require = createRequire(path.join(os.tmpdir(), "atlas-phase1-browser-tools", "package.json"));
const { chromium } = require("playwright-core");
const base = process.env.FRONTEND_BASE || "http://127.0.0.1:5500/frontend";
const password = process.env.DEMO_PASSWORD;
assert.ok(password, "Exporter DEMO_PASSWORD pour les contrôles de connexion.");
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true
});
const checks = [];
try {
  const cases = [
    ["omar.tazi@atlasvoyage.ma", "admin", ["users","offers","promos"]],
    ["karim.idrissi@atlasvoyage.ma", "supplier", ["offers","inventory","new-offer"]],
    ["vols@atlasvoyage.ma", "supplier", ["offers","new-offer"]],
    ["voitures@atlasvoyage.ma", "supplier", ["offers","new-offer"]],
    ["transferts@atlasvoyage.ma", "supplier", ["offers","new-offer"]],
    ["excursions@atlasvoyage.ma", "supplier", ["offers","new-offer"]],
    ["nadia.elfassi@atlasvoyage.ma", "agent", ["bundles"]],
    ["sarah.benali@example.com", "client", ["panier"]]
  ];
  for (const [email, area, pages] of cases) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("response", response => {
      if (response.url().startsWith("http://localhost:8080/api/") && response.status() >= 400) {
        errors.push("API " + response.status() + " " + new URL(response.url()).pathname);
      }
    });
    await page.goto(base + "/connexion.html", {waitUntil:"networkidle"});
    await page.locator("#login-email").fill(email);
    await page.locator("#login-password").fill(password);
    await page.locator("#login-form button[type=submit]").click();
    await page.waitForURL("**/" + area + "/index.html**");
    for (const name of pages) {
      await page.goto(base + "/" + area + "/index.html?page=" + name, {waitUntil:"networkidle"});
      const content = area === "supplier" ? page.locator("#page-content") :
        area === "client" ? page.locator("#app") : page.locator("main");
      assert.ok((await content.textContent()).trim().length > 50, area + "/" + name);
      assert.doesNotMatch(await content.textContent(), /Impossible de charger|Chargement de votre espace fournisseur/);
    }
    assert.deepEqual(errors, [], email + " erreurs");
    checks.push(email + ": " + pages.join(", "));
    await context.close();
  }
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const type of ["Hôtels & Riads","Vols","Location de voiture","Taxi/Transferts","Excursions"]) {
    await page.goto(base + "/catalogue.html?type=" + encodeURIComponent(type), {waitUntil:"networkidle"});
    assert.ok(await page.locator("form").count() > 0, type + " : recherche visible");
  }
  assert.deepEqual(errors, []);
  checks.push("Catalogue public : 5 catégories");
  await context.close();
  console.log(JSON.stringify({result:"OK",checks}, null, 2));
} finally { await browser.close(); }

