import puppeteer from "puppeteer-core";
import fs from "node:fs/promises";
import path from "node:path";
import axe from "axe-core";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const baseUrl = "http://127.0.0.1:5500/frontend";

const pages = [
  { name: "accueil", url: `${baseUrl}/accueil.html` },
  { name: "catalogue", url: `${baseUrl}/catalogue.html?type=H%C3%B4tels%20%26%20Riads` },
  { name: "offre", url: `${baseUrl}/offre.html?id=chefchaouen` },
  { name: "panier", url: `${baseUrl}/panier.html` },
  { name: "connexion", url: `${baseUrl}/connexion.html` },
  { name: "404", url: `${baseUrl}/404.html` },
  { name: "500", url: `${baseUrl}/500.html` },
  { name: "admin", url: `${baseUrl}/admin/index.html` },
  { name: "client", url: `${baseUrl}/client/index.html` },
  { name: "supplier", url: `${baseUrl}/supplier/index.html` },
  { name: "agent", url: `${baseUrl}/agent/index.html` }
];

console.log("=== Démarrage de l'audit d'accessibilité axe-core ===");

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"]
});

const report = {};

for (const p of pages) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  try {
    await page.goto(p.url, { waitUntil: "networkidle0", timeout: 10000 });
    // Attente du rendu JS
    await new Promise((r) => setTimeout(r, 1000));

    await page.evaluate(axe.source);
    const results = await page.evaluate(async () => {
      return await axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]
        }
      });
    });

    const summary = {
      critical: results.violations.filter((v) => v.impact === "critical"),
      serious: results.violations.filter((v) => v.impact === "serious"),
      moderate: results.violations.filter((v) => v.impact === "moderate"),
      minor: results.violations.filter((v) => v.impact === "minor")
    };

    report[p.name] = {
      url: p.url,
      passes: results.passes.length,
      violationsCount: results.violations.length,
      critical: summary.critical.length,
      serious: summary.serious.length,
      moderate: summary.moderate.length,
      minor: summary.minor.length,
      details: results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help,
        nodesCount: v.nodes.length,
        nodes: v.nodes.slice(0, 3).map((n) => ({
          target: n.target,
          html: n.html,
          failureSummary: n.failureSummary
        }))
      }))
    };

    console.log(
      `[${p.name}] Violations: ${results.violations.length} (Critical: ${summary.critical.length}, Serious: ${summary.serious.length}, Moderate: ${summary.moderate.length})`
    );
  } catch (err) {
    console.error(`[${p.name}] Erreur lors de l'audit:`, err.message);
  } finally {
    await page.close();
  }
}

await browser.close();

const outputFile = process.argv[2] === "final" ? "docs/design/audit_axe_final.json" : "docs/design/audit_axe_initial.json";
const outPath = path.resolve(process.cwd(), outputFile);
await fs.writeFile(outPath, JSON.stringify(report, null, 2), "utf-8");
console.log(`=== Audit axe-core terminé. Résultats sauvés dans ${outPath} ===`);
