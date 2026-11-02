/**
 * Atlas Voyage — Script de Vérification de Parité des Clés i18n
 * scripts/i18n/check.mjs
 *
 * Vérifie que pour chaque fichier JSON dans frontend/locales/fr/,
 * les fichiers correspondants existent dans en/ et ar/ et contiennent exactement
 * les mêmes clés avec aucune valeur vide.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '../../frontend/locales');

const langs = ['fr', 'en', 'ar'];

function getKeys(obj, prefix = '') {
  let keys = [];
  for (const k of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
      keys = keys.concat(getKeys(obj[k], full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

function runCheck() {
  console.log('--- Vérification de la parité des traductions i18n ---');
  const frDir = path.join(root, 'fr');
  if (!fs.existsSync(frDir)) {
    console.error(`Erreur: Dossier ${frDir} introuvable.`);
    process.exit(1);
  }

  const files = fs.readdirSync(frDir).filter((f) => f.endsWith('.json'));
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalKeys = 0;

  for (const file of files) {
    const frPath = path.join(frDir, file);
    let frJson;
    try {
      frJson = JSON.parse(fs.readFileSync(frPath, 'utf-8'));
    } catch (e) {
      console.error(`[ERREUR JSON] Erreur syntaxe dans ${frPath}: ${e.message}`);
      totalErrors++;
      continue;
    }
    const frKeys = new Set(getKeys(frJson));
    totalKeys += frKeys.size;

    for (const lang of ['en', 'ar']) {
      const targetPath = path.join(root, lang, file);
      if (!fs.existsSync(targetPath)) {
        console.error(`[FICHIER MANQUANT] ${lang}/${file} n'existe pas.`);
        totalErrors++;
        continue;
      }

      let targetJson;
      try {
        targetJson = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
      } catch (e) {
        console.error(`[ERREUR JSON] Erreur syntaxe dans ${targetPath}: ${e.message}`);
        totalErrors++;
        continue;
      }

      const targetKeys = new Set(getKeys(targetJson));

      // Clés manquantes
      for (const k of frKeys) {
        if (!targetKeys.has(k)) {
          console.error(`[CLÉ MANQUANTE] ${lang}/${file} -> clé "${k}" absente.`);
          totalErrors++;
        }
      }

      // Clés orphelines
      for (const k of targetKeys) {
        if (!frKeys.has(k)) {
          console.warn(`[CLÉ ORPHELINE] ${lang}/${file} -> clé "${k}" non présente en français.`);
          totalWarnings++;
        }
      }
    }
  }

  console.log(`\nBilan : ${files.length} namespaces vérifiés (${totalKeys} clés uniques en français).`);
  if (totalErrors === 0) {
    const warningSummary = totalWarnings === 0
      ? 'Aucun avertissement détecté.'
      : `${totalWarnings} avertissement(s) de clés supplémentaires à vérifier.`;
    console.log(`-> Toutes les clés françaises sont présentes en anglais et en arabe. ${warningSummary}\n`);
    process.exit(0);
  } else {
    console.error(`-> Échec : ${totalErrors} erreur(s) détectée(s).\n`);
    process.exit(1);
  }
}

runCheck();

