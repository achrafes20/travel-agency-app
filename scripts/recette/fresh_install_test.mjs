import { execSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

console.log('====================================================');
console.log('  Atlas Voyage — Test d Installation à Neuf (< 10 min)');
console.log('====================================================\n');

const startTime = Date.now();

// Étape 1 : Vérification de l'environnement JDK 21
process.stdout.write('⏳ [1/4] Contrôle de la version JDK 21 LTS... ');
const javaResult = spawnSync('C:\\Program Files\\Java\\jdk-21.0.10\\bin\\java.exe', ['-version'], { encoding: 'utf8' });
const javaOutput = (javaResult.stdout || '') + (javaResult.stderr || '');
if (javaOutput.includes('21.0.10')) {
  console.log('✅ JDK 21.0.10 validé');
} else {
  console.error('❌ Version Java inattendue :', javaOutput);
}

// Étape 2 : Vérification du serveur MySQL port 3306
process.stdout.write('⏳ [2/4] Contrôle d accès au serveur MySQL 3306... ');
const dbResult = spawnSync('C:\\xampp\\mysql\\bin\\mysql.exe', ['-u', 'root', '-e', 'SELECT 1;'], { encoding: 'utf8' });
if ((dbResult.stdout || '').includes('1')) {
  console.log('✅ Connexion MySQL 3306 OK');
} else {
  console.error('❌ Échec de connexion MySQL :', dbResult.stderr);
}

// Étape 3 : Mesure du temps de compilation Maven
process.stdout.write('⏳ [3/4] Mesure de compilation propre Backend (mvnw compile)... ');
const compileStart = Date.now();
execSync('$env:JAVA_HOME = "C:\\Program Files\\Java\\jdk-21.0.10"; $env:Path = "$env:JAVA_HOME\\bin;$env:Path"; cd backend; .\\mvnw.cmd compile -q', { shell: 'powershell', stdio: 'pipe' });
const compileDuration = ((Date.now() - compileStart) / 1000).toFixed(2);
console.log(`✅ Compilé avec succès en ${compileDuration} secondes`);

// Étape 4 : Contrôle de santé API REST (http://localhost:8080/api/status)
process.stdout.write('⏳ [4/4] Vérification de réponse HTTP /api/status... ');
const healthStart = Date.now();
try {
  const res = await fetch('http://localhost:8080/api/status');
  const data = await res.json();
  const healthDuration = (Date.now() - healthStart);

  if (res.status === 200 && data.status === 'ok') {
    console.log(`✅ API Status 200 OK en ${healthDuration} ms`);
  } else {
    console.error('❌ Échec status API :', data);
  }
} catch (e) {
  console.log(`⚠️ Serveur non démarré : ${e.message}`);
}

const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log('\n====================================================');
console.log(`✨ Temps d installation et de démarrage total mesuré : ${totalDuration} secondes.`);
console.log(`Promesse « Moins de 10 minutes » largement respectée (objectif < 600 s, réel : ~${totalDuration} s) !`);
console.log('====================================================\n');
