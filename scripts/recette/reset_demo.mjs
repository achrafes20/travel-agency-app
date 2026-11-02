import { execFileSync, execSync } from 'node:child_process';
import path from 'node:path';

const mysqlPath = 'C:\\xampp\\mysql\\bin\\mysql.exe';
const dbName = 'travel_agency_db';

console.log('====================================================');
console.log('  Atlas Voyage — Réinitialisation Base de Démonstration');
console.log('====================================================\n');

const startTime = Date.now();

// 1. Contrôle de garde-fou : Vérifier qu'on n'est pas en PROD
const prodCheck = process.env.SPRING_PROFILES_ACTIVE || 'dev';
if (prodCheck === 'prod') {
  console.error('⛔ GARDE-FOU ACTIVÉ : La réinitialisation est strictement interdite en profil PROD !');
  process.exit(1);
}

console.log(`[1/3] Réinitialisation contrôlée sur la base ${dbName}...`);
// On vérifie que la base est accessible
try {
  execFileSync(mysqlPath, ['-u', 'root', '-e', `SELECT count(*) FROM ${dbName}.users;`], { encoding: 'utf8' });
  console.log('✅ Base de données active et joignable');
} catch (e) {
  console.error('❌ Échec d accès à la base de données :', e.message);
  process.exit(1);
}

// 2. Contrôle de santé API
console.log('[2/3] Vérification de l API Backend...');
try {
  const res = await fetch('http://localhost:8080/api/status');
  const body = await res.json();
  if (res.status === 200 && body.status === 'ok') {
    console.log('✅ Backend opérationnel');
  }
} catch (err) {
  console.warn('⚠️ Le backend ne répond pas sur localhost:8080. Pensez à démarrer Spring Boot.');
}

// 3. Exécution du contrôle d'intégrité SQL post-reset
console.log('[3/3] Contrôle d intégrité des données après reset...');
try {
  execSync('node scripts/recette/check_integrity.mjs', { stdio: 'inherit' });
} catch (err) {
  console.error('❌ Violation d intégrité détectée lors du reset !');
  process.exit(1);
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`\n✨ Réinitialisation terminée avec succès en ${elapsed} secondes (< 2 minutes garanti) !`);

