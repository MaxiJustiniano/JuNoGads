import * as fs from 'fs';
import * as path from 'path';

function processDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // regex to match relative imports that don't end in .js or .json
      content = content.replace(/from\s+['"](\.[^'"]*?(?<!\.js)(?<!\.json))['"]/g, "from '$1.js'");
      fs.writeFileSync(fullPath, content);
      console.log('Fixed', fullPath);
    }
  }
}

processDir('src/server');

function processFile(fullPath: string) {
    if(!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/from\s+['"](\.[^'"]*?(?<!\.js)(?<!\.json))['"]/g, "from '$1.js'");
    fs.writeFileSync(fullPath, content);
    console.log('Fixed', fullPath);
}

processFile('server.ts');
processFile('api/index.ts');
