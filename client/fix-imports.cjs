const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Regex to match: import { A as B, C, D as E } from '@mui/icons-material';
  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]@mui\/icons-material['"];?/g;
  
  content = content.replace(importRegex, (match, importsStr) => {
    changed = true;
    const imports = importsStr.split(',').map(s => s.trim()).filter(s => s);
    return imports.map(imp => {
      // Handle "X as Y"
      const parts = imp.split(/\s+as\s+/);
      const iconName = parts[0];
      const alias = parts.length > 1 ? parts[1] : parts[0];
      return `import ${alias} from '@mui/icons-material/${iconName}';`;
    }).join('\n');
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed imports in ${file}`);
  }
});
