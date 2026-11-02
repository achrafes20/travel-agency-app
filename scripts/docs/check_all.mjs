import fs from 'node:fs';
import path from 'node:path';

console.log('====================================================');
console.log('  Atlas Voyage — Contrôle Qualité Docs-as-Code');
console.log('====================================================\n');

let totalErrors = 0;
let totalWarnings = 0;

function error(msg) {
  console.error(`❌ [ERREUR] ${msg}`);
  totalErrors++;
}

function warn(msg) {
  console.warn(`⚠️ [ATTENTION] ${msg}`);
  totalWarnings++;
}

function success(msg) {
  console.log(`✅ [OK] ${msg}`);
}

// 1. Collecte de tous les fichiers Markdown
function getMarkdownFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'node_modules' || file === '.git' || file === 'target') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getMarkdownFiles(fullPath));
    } else if (file.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

const mdFiles = getMarkdownFiles(process.cwd());
console.log(`🔍 Analyse de ${mdFiles.length} fichiers Markdown...\n`);

// 2. Contrôle des Liens Relatifs et des Images
let checkedLinks = 0;
let checkedImages = 0;
let checkedMermaid = 0;

const validMermaidTypes = [
  'flowchart', 'graph', 'sequenceDiagram', 'stateDiagram', 
  'stateDiagram-v2', 'classDiagram', 'erDiagram', 'xychart-beta', 'pie', 'gantt'
];

for (const filePath of mdFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  const dir = path.dirname(filePath);
  const relPath = path.relative(process.cwd(), filePath);

  // A. Vérification des liens Markdown [texte](cible)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const rawTarget = match[2].trim();
    if (rawTarget.startsWith('http://') || rawTarget.startsWith('https://') || 
        rawTarget.startsWith('mailto:') || rawTarget.startsWith('#') || 
        rawTarget.startsWith('conversation://') || rawTarget.startsWith('file://')) {
      continue;
    }
    checkedLinks++;
    const [targetFile, anchor] = rawTarget.split('#');
    if (!targetFile) continue; // Just anchor
    const resolvedPath = path.resolve(dir, targetFile);
    if (!fs.existsSync(resolvedPath)) {
      error(`Lien mort dans ${relPath} : "${rawTarget}" introuvable.`);
    }
  }

  // B. Vérification des images Markdown ![alt](cible)
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(content)) !== null) {
    const rawImg = imgMatch[2].trim();
    if (rawImg.startsWith('http://') || rawImg.startsWith('https://') || rawImg.startsWith('data:')) {
      continue;
    }
    checkedImages++;
    const [imgFile] = rawImg.split('?');
    const resolvedImg = path.resolve(dir, imgFile);
    if (!fs.existsSync(resolvedImg)) {
      error(`Image introuvable dans ${relPath} : "${rawImg}"`);
    }
  }

  // C. Vérification des blocs Mermaid
  const mermaidRegex = /```mermaid\s*\n([\s\S]*?)```/g;
  let mMatch;
  while ((mMatch = mermaidRegex.exec(content)) !== null) {
    checkedMermaid++;
    const block = mMatch[1].trim();
    const firstLine = block.split('\n')[0].trim();
    const isValid = validMermaidTypes.some(t => firstLine.startsWith(t));
    if (!isValid) {
      error(`Type Mermaid non supporté ou invalide dans ${relPath} : "${firstLine}"`);
    }
  }

  // D. Détection de secrets accidentels
  if (content.includes('BEGIN RSA PRIVATE KEY') || content.includes('BEGIN OPENSSH PRIVATE KEY')) {
    error(`Clé privée détectée dans ${relPath} !`);
  }
}

success(`${checkedLinks} liens relatifs validés.`);
success(`${checkedImages} images référencées validées.`);
success(`${checkedMermaid} blocs de diagrammes Mermaid validés.`);

// 3. Contrôle de Parité des Endpoints (Code vs OpenAPI vs Markdown)
console.log('\n🔍 Contrôle de Parité des Endpoints...');
const extractedEndpointsPath = path.resolve('scripts/docs/extracted_endpoints.json');
const openApiPath = path.resolve('docs/api/openapi.yaml');
const apiEndpointsMdPath = path.resolve('docs/api_endpoints.md');

if (fs.existsSync(extractedEndpointsPath) && fs.existsSync(openApiPath) && fs.existsSync(apiEndpointsMdPath)) {
  const extracted = JSON.parse(fs.readFileSync(extractedEndpointsPath, 'utf8'));
  const openApiContent = fs.readFileSync(openApiPath, 'utf8');
  const apiMdContent = fs.readFileSync(apiEndpointsMdPath, 'utf8');

  // Compter les opérations dans openapi.yaml
  const openApiOps = (openApiContent.match(/\n    (get|post|put|patch|delete):/g) || []).length;
  
  // Compter les lignes de tableau dans api_endpoints.md
  const mdRows = (apiMdContent.match(/\| `(GET|POST|PUT|PATCH|DELETE) \//g) || []).length;

  console.log(`   - Contrôleurs Spring Boot extraits : ${extracted.length} endpoints`);
  console.log(`   - Contrat OpenAPI 3.0.3 (openapi.yaml) : ${openApiOps} opérations`);
  console.log(`   - Tableau récapitulatif (api_endpoints.md) : ${mdRows} entrées`);

  if (extracted.length === openApiOps && openApiOps === mdRows) {
    success(`Parité stricte validée : exactement ${extracted.length} endpoints synchronisés !`);
  } else {
    warn(`Écart détecté sur la parité : Code=${extracted.length}, OpenAPI=${openApiOps}, MD=${mdRows}`);
  }
} else {
  error('Fichiers de référence d endpoints manquants.');
}

// 4. Contrôle de Sécurité « Zéro Secret » sur les Environnements Postman
console.log('\n🔍 Contrôle Zéro Secret sur les environnements Postman...');
const prodEnvPath = path.resolve('docs/postman/env.prod.json');
if (fs.existsSync(prodEnvPath)) {
  const prodEnv = JSON.parse(fs.readFileSync(prodEnvPath, 'utf8'));
  let secretsFound = 0;
  for (const v of prodEnv.values) {
    if (v.key.toLowerCase().includes('password') || v.key.toLowerCase().includes('secret') || v.key.toLowerCase().includes('token')) {
      if (v.value && !v.value.startsWith('<') && !v.value.endsWith('>')) {
        error(`Secret non masqué en clair dans env.prod.json : clé "${v.key}" = "${v.value}"`);
        secretsFound++;
      }
    }
  }
  if (secretsFound === 0) {
    success('Garantie Zéro Secret validée pour docs/postman/env.prod.json.');
  }
}

// 5. Bilan
console.log('\n====================================================');
if (totalErrors === 0) {
  console.log(`🎉 SUCCÈS : 0 erreur, ${totalWarnings} avertissement(s).`);
  console.log('La documentation est 100% conforme et prête pour publication !');
  process.exit(0);
} else {
  console.error(`💥 ÉCHEC : ${totalErrors} erreur(s) bloquante(s) trouvée(s).`);
  process.exit(1);
}
