const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const newOptions = `<option value="gemma-2-2b-it">Gemma 4 (New & Smart) ✨</option>
              <option value="gemini-3-flash-preview">High Quality (G3 Flash)</option>
              <option value="gemini-2.5-flash">Medium Quality (G2.5 Flash)</option>
              <option value="gemini-3.1-flash-lite-preview">Fast (G3.1 Lite)</option>`;

walkDir('./src', function(filePath) {
  if (!filePath.endsWith('.tsx')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  
  const targetRe = /<option value="gemini-3-flash-preview">.*?<\/option>\s*<option value="gemini-3\.1-flash-lite-preview">.*?<\/option>\s*<option value="gemini-2\.5-flash">.*?<\/option>/ms;
  const targetRe2 = /<option value="gemini-3-flash-preview">G3 Flash \(HQ\)<\/option>\s*<option value="gemini-3\.1-flash-lite-preview">G3\.1 Lite \(Medium\)<\/option>\s*<option value="gemini-2\.5-flash">G2\.5 Flash \(Fast\)<\/option>/ms;
  const targetRe3 = /<option value="gemini-3-flash-preview">Fast \(3\.0 Flash\)<\/option>\s*<option value="gemini-3\.1-flash-lite-preview">Fastest \(3\.1 Lite\)<\/option>\s*<option value="gemini-2\.5-flash">Balanced \(2\.5 Flash\)<\/option>/ms;

  let replaced = false;
  if(targetRe.test(content)) {
    content = content.replace(targetRe, newOptions);
    replaced = true;
  } else if(targetRe2.test(content)) {
    content = content.replace(targetRe2, newOptions);
    replaced = true;
  } else if (targetRe3.test(content)) {
    content = content.replace(targetRe3, newOptions);
    replaced = true;
  }
  
  if (replaced) {
    fs.writeFileSync(filePath, content);
    console.log('Updated ' + filePath);
  }
});
