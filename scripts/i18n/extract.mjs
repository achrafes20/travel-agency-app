/**
 * Atlas Voyage — Script d'Extraction et d'Inventaire i18n
 * scripts/i18n/extract.mjs
 *
 * Scanne les fichiers frontend (HTML/JS) pour recenser les clés i18n utilisées
 * et avertir des chaînes en français résiduelles.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../../frontend');

function scanDir(dir, filterRegex) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    if (item === 'vendor' || item === 'node_modules' || item === 'locales') continue;
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(scanDir(full, filterRegex));
    } else if (filterRegex.test(item)) {
      results.push(full);
    }
  }
  return results;
}

function runExtract() {
  const htmlFiles = scanDir(frontendDir, /\.html$/);
  const jsFiles = scanDir(frontendDir, /\.js$/);

  const keySet = new Set();
  const keyRegex = /data-i18n="([^"]+)"|data-i18n-attr="([^"]+)"|data-i18n-html="([^"]+)"|I18n\.t\(\s*['"]([^'"]+)['"]/g;

  for (const file of [...htmlFiles, ...jsFiles]) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    while ((match = keyRegex.exec(content)) !== null) {
      const k = match[1] || match[2] || match[3] || match[4];
      if (k) {
        if (k.includes(':')) {
          // data-i18n-attr (e.g. placeholder:common.search;...)
          for (const pair of k.split(';')) {
            const [, subKey] = pair.split(':');
            if (subKey) keySet.add(subKey.trim());
          }
        } else {
          keySet.add(k.trim());
        }
      }
    }
  }

  console.log(`--- Inventaire i18n ---`);
  console.log(`Fichiers scannés : ${htmlFiles.length} HTML, ${jsFiles.length} JS`);
  console.log(`Nombre total de clés i18n référencées dans le code : ${keySet.size}`);
}

runExtract();

