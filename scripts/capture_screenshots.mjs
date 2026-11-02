import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs/promises";

const execFileAsync = promisify(execFile);
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const baseUrl = "http://127.0.0.1:5500/frontend";

const targetDir = process.argv[2] || "before";
const outDir = path.resolve(process.cwd(), "docs/design/screenshots", targetDir);
await fs.mkdir(outDir, { recursive: true });

const pages = [
  { name: "accueil", url: `${baseUrl}/accueil.html` },
  { name: "catalogue", url: `${baseUrl}/catalogue.html?type=H%C3%B4tels%20%26%20Riads` },
  { name: "offre", url: `${baseUrl}/offre.html?id=chefchaouen` },
  { name: "panier", url: `${baseUrl}/panier.html` },
  { name: "connexion", url: `${baseUrl}/connexion.html` },
  { name: "a-propos", url: `${baseUrl}/a-propos.html` },
  { name: "contact", url: `${baseUrl}/contact.html` },
  { name: "faq", url: `${baseUrl}/faq.html` },
  { name: "404", url: `${baseUrl}/404.html` },
  { name: "500", url: `${baseUrl}/500.html` },
  { name: "admin", url: `${baseUrl}/admin/index.html` },
  { name: "client", url: `${baseUrl}/client/index.html` },
  { name: "supplier", url: `${baseUrl}/supplier/index.html` },
  { name: "agent", url: `${baseUrl}/agent/index.html` }
];

const viewports = [
  { label: "360", width: 360, height: 740 },
  { label: "768", width: 768, height: 1024 },
  { label: "1280", width: 1280, height: 800 }
];

console.log(`--- Capture des screenshots dans ${outDir} ---`);

for (const p of pages) {
  for (const v of viewports) {
    const filename = `${p.name}_${v.label}.png`;
    const dest = path.join(outDir, filename);
    const args = [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      `--window-size=${v.width},${v.height}`,
      `--virtual-time-budget=1500`,
      `--screenshot=${dest}`,
      p.url
    ];
    try {
      await execFileAsync(chromePath, args);
      console.log(`[OK] ${filename}`);
    } catch (err) {
      console.error(`[ERR] ${filename}:`, err.message);
    }
  }
}

console.log("--- Captures terminées ---");
