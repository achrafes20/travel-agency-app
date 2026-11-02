import fs from 'fs';
import path from 'path';

const controllerDir = 'backend/src/main/java/com/agence/voyage/controller';
const files = fs.readdirSync(controllerDir).filter(f => f.endsWith('.java'));

const endpoints = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(controllerDir, file), 'utf8');
  
  // Find class @RequestMapping
  let basePath = '';
  const classReq = content.match(/@RequestMapping\((?:(?:value|path)\s*=\s*)?["']([^"']+)["']/);
  if (classReq) {
    basePath = classReq[1];
  }

  // Regex to match mapping annotations
  // e.g. @GetMapping(...) or @PostMapping or @GetMapping({"/mine","/admin"})
  const methodRegex = /@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping)(?:\(([^)]*)\))?/g;
  
  let match;
  while ((match = methodRegex.exec(content)) !== null) {
    const verb = match[1].replace('Mapping', '').toUpperCase();
    const rawArgs = match[2] ? match[2].trim() : '';
    
    // Parse path(s)
    let paths = [];
    if (!rawArgs) {
      paths = [''];
    } else if (rawArgs.startsWith('{')) {
      // Array of paths: {"","/supplier","/admin"}
      const arrMatch = rawArgs.match(/\{([^}]+)\}/);
      if (arrMatch) {
        paths = arrMatch[1].split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      }
    } else {
      // Single path or value="..." or path="..."
      const pathMatch = rawArgs.match(/(?:(?:value|path)\s*=\s*)?["']([^"']*)["']/);
      if (pathMatch) {
        paths = [pathMatch[1]];
      } else {
        paths = [''];
      }
    }

    // Find the method declaration following this annotation
    const remaining = content.slice(match.index);
    const declMatch = remaining.match(/(?:public|protected|private)\s+([\w\<\>\[\],\s\?]+)\s+(\w+)\s*\(([^)]*)\)/);
    const returnType = declMatch ? declMatch[1].trim() : '';
    const methodName = declMatch ? declMatch[2].trim() : '';
    const params = declMatch ? declMatch[3].replace(/\s+/g, ' ').trim() : '';

    // Find summary if @Operation exists nearby
    const opMatch = remaining.slice(0, declMatch ? declMatch.index : 200).match(/@Operation\s*\(\s*summary\s*=\s*["']([^"']+)["']/);
    const summary = opMatch ? opMatch[1] : '';

    paths.forEach(p => {
      let fullPath = (basePath + (p ? (p.startsWith('/') ? p : '/' + p) : '')).replace(/\/+/g, '/');
      if (fullPath.endsWith('/') && fullPath.length > 1) {
        fullPath = fullPath.slice(0, -1);
      }
      endpoints.push({
        controller: file.replace('.java', ''),
        verb,
        path: fullPath,
        methodName,
        returnType,
        summary,
        params
      });
    });
  }
});

console.log(`Analyzed ${files.length} controllers.`);
console.log(`Total mapped endpoints found: ${endpoints.length}`);

// Group by controller
const byController = {};
endpoints.forEach(e => {
  if (!byController[e.controller]) byController[e.controller] = [];
  byController[e.controller].push(`${e.verb} ${e.path} (${e.summary || e.methodName})`);
});

fs.mkdirSync('scripts/docs', { recursive: true });
fs.writeFileSync('scripts/docs/extracted_endpoints.json', JSON.stringify(endpoints, null, 2));
console.log(JSON.stringify(byController, null, 2));
