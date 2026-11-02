import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

console.log('====================================================');
console.log('  Atlas Voyage — Suite Complète de Recette (Phase 17)');
console.log('====================================================\n');

const startTime = Date.now();
const steps = [
  { name: '1. Test d installation fraîche et compilation backend', script: 'scripts/recette/fresh_install_test.mjs' },
  { name: '2. Réinitialisation idempotente du jeu de données démo', script: 'scripts/recette/reset_demo.mjs' },
  { name: '3. Contrôle d intégrité SQL et financière BDD', script: 'scripts/recette/check_integrity.mjs' },
  { name: '4. Scan d absence de données factices (mock data)', script: 'scripts/recette/find_mock_data.mjs' },
  { name: '5. Campagne de tests fonctionnels E2E automatisés (Chrome)', script: 'e2e/recette/runner.mjs' }
];

let allPassed = true;

for (const step of steps) {
  console.log(`\n>>> Exécution : ${step.name}...`);
  try {
    const output = execSync(`node ${step.script}`, {
      encoding: 'utf8',
      stdio: 'inherit'
    });
    console.log(`>>> Succès : ${step.name}`);
  } catch (err) {
    console.error(`>>> Erreur lors de : ${step.name}`);
    console.error(err.message);
    allPassed = false;
  }
}

const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

console.log('\n====================================================');
console.log(`  FIN DE LA SUITE DE RECETTE : ${allPassed ? '✅ TOUTES ÉTAPES VALIDÉES' : '❌ ANOMALIES DÉTECTÉES'}`);
console.log(`  Durée totale d exécution : ${totalDuration} secondes`);
console.log('====================================================\n');

if (!allPassed) {
  process.exit(1);
}

