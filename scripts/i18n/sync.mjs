/**
 * Atlas Voyage — Script de Synchronisation des Clés i18n
 * scripts/i18n/sync.mjs
 *
 * Ajoute les clés manquantes de 'fr' vers 'en' et 'ar' avec un préfixe '[TODO]'
 * pour faciliter le travail des traducteurs sans laisser de blancs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '../../frontend/locales');

function syncObject(source, target) {
  const result = { ...target };
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      result[k] = syncObject(v, result[k] || {});
    } else {
      if (result[k] === undefined) {
        result[k] = `[TODO] ${v}`;
      }
    }
  }
  return result;
}

function runSync() {
  const frDir = path.join(root, 'fr');
  if (!fs.existsSync(frDir)) process.exit(1);

  const files = fs.readdirSync(frDir).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    const frJson = JSON.parse(fs.readFileSync(path.join(frDir, file), 'utf-8'));

    for (const lang of ['en', 'ar']) {
      const targetDir = path.join(root, lang);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

      const targetPath = path.join(targetDir, file);
      const targetJson = fs.existsSync(targetPath) ? JSON.parse(fs.readFileSync(targetPath, 'utf-8')) : {};
      const synced = syncObject(frJson, targetJson);
      fs.writeFileSync(targetPath, JSON.stringify(synced, null, 2) + '\n', 'utf-8');
      console.log(`[SYNC] Synchronisé ${lang}/${file}`);
    }
  }
}

runSync();

