import { execSync } from 'node:child_process';
import path from 'node:path';

console.log('====================================================');
console.log('  Atlas Voyage — Synchronisation Docs-as-Code');
console.log('====================================================\n');

const scripts = [
  { name: 'Extraction des Endpoints Spring Boot', file: 'extract_endpoints.mjs' },
  { name: 'Génération du contrat OpenAPI 3.0.3', file: 'gen_openapi.mjs' },
  { name: 'Génération de la documentation API Endpoints', file: 'gen_api_endpoints_md.mjs' },
  { name: 'Génération du diagramme ER et du dictionnaire', file: 'gen_er.mjs' },
  { name: 'Mise à jour de la collection Postman', file: 'update_postman.mjs' },
  { name: 'Génération de l architecture et des ADRs', file: 'write_architecture_doc.mjs' }
];

for (const s of scripts) {
  process.stdout.write(`⏳ [1/6] ${s.name}... `);
  try {
    execSync(`node scripts/docs/${s.file}`, { stdio: 'pipe' });
    console.log('✅ OK');
  } catch (err) {
    console.log('❌ ERREUR');
    console.error(err.message);
    process.exit(1);
  }
}

console.log('\n✨ Synchronisation documentaire terminée avec succès !');

