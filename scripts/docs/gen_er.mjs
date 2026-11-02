import fs from 'fs';
import path from 'path';

const entityDir = 'backend/src/main/java/com/agence/voyage/entity';
const files = fs.readdirSync(entityDir).filter(f => f.endsWith('.java'));

const entities = {};
const relationships = [];

files.forEach(file => {
  const name = file.replace('.java', '');
  const content = fs.readFileSync(path.join(entityDir, file), 'utf8');

  // Check if @Entity or @Embeddable or Enum
  const isEntity = content.includes('@Entity');
  const isEnum = content.includes('public enum ' + name);
  const isSuperclass = content.includes('@MappedSuperclass');

  if (!isEntity && !isEnum && !isSuperclass) return;

  const fields = [];
  const lines = content.split('\n');

  // Parse fields
  const fieldRegex = /(?:private|protected)\s+([\w\<\>\[\],\s]+)\s+(\w+)\s*(?:=|;)/;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
    
    const m = trimmed.match(fieldRegex);
    if (m) {
      let type = m[1].trim();
      const fieldName = m[2].trim();
      
      // Simplify Java types for ER
      type = type.replace(/List<(\w+)>/, '$1[]')
                 .replace(/Set<(\w+)>/, '$1[]')
                 .replace(/Optional<(\w+)>/, '$1');

      if (!['serialVersionUID'].includes(fieldName)) {
        fields.push({ name: fieldName, type });
      }
    }
  });

  // Extract explicit JPA relations
  // e.g. @ManyToOne ... private User user;
  const relRegex = /@(ManyToOne|OneToMany|OneToOne|ManyToMany)(?:[^\n]*)\s+(?:private|protected)\s+([\w\<\>\[\]]+)\s+(\w+)/g;
  let relMatch;
  while ((relMatch = relRegex.exec(content)) !== null) {
    const card = relMatch[1];
    let target = relMatch[2].replace(/[Set<|List<|>]/g, '').trim();
    if (card === 'ManyToOne') {
      relationships.push({ from: name, to: target, label: 'appartient à', symbol: '}o--||' });
    } else if (card === 'OneToMany') {
      relationships.push({ from: name, to: target, label: 'contient', symbol: '||--o{' });
    } else if (card === 'OneToOne') {
      relationships.push({ from: name, to: target, label: 'lié à', symbol: '||--||' });
    }
  }

  entities[name] = {
    isEntity,
    isEnum,
    fields
  };
});

// Format Mermaid erDiagram
let er = 'erDiagram\n';

// Add core main tables with selected key fields to keep diagram legible
const mainEntities = [
  'User', 'Offer', 'Hotel', 'Flight', 'Car', 'TaxiTransfer', 'Excursion',
  'OfferAvailability', 'OfferTranslation', 'City', 'CityTranslation',
  'Cart', 'CartItem', 'PromoCode', 'Bundle',
  'Booking', 'BookingItem', 'BookingItemAllocation',
  'Payment', 'PaymentEvent',
  'Notification', 'NotificationPreference',
  'Favorite', 'Review', 'Ticket', 'TicketMessage', 'AuditLog', 'Setting'
];

mainEntities.forEach(ent => {
  const e = entities[ent];
  if (!e) return;
  er += `    ${ent} {\n`;
  e.fields.slice(0, 8).forEach(f => {
    const cleanType = f.type.replace(/[^a-zA-Z0-9_]/g, '_');
    er += `        ${cleanType} ${f.name}\n`;
  });
  er += `    }\n`;
});

// Dedup relationships
const seenRel = new Set();
relationships.forEach(r => {
  if (mainEntities.includes(r.from) && mainEntities.includes(r.to)) {
    const key = `${r.from}-${r.to}`;
    if (!seenRel.has(key)) {
      seenRel.add(key);
      er += `    ${r.from} ${r.symbol} ${r.to} : "${r.label}"\n`;
    }
  }
});

// Generate Data Dictionary
let dataDict = '## Dictionnaire de Données (40 Entités JPA)\n\n';
Object.entries(entities).filter(([n, e]) => e.isEntity).forEach(([n, e]) => {
  dataDict += `### Table \`${n}\`\n\n`;
  dataDict += `| Attribut / Colonne | Type Java / SQL | Rôle / Description |\n`;
  dataDict += `| :--- | :--- | :--- |\n`;
  e.fields.forEach(f => {
    dataDict += `| \`${f.name}\` | \`${f.type}\` | Attribut de l'entité ${n} |\n`;
  });
  dataDict += `\n`;
});

fs.writeFileSync('scripts/docs/extracted_er.mermaid', er, 'utf8');
fs.writeFileSync('scripts/docs/extracted_data_dict.md', dataDict, 'utf8');
console.log(`Generated Mermaid ER diagram and Data Dictionary from ${Object.keys(entities).length} entities.`);

