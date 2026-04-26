const fs = require('fs');
const glob = require('glob');

const newOptions = `              <option value="gemma-2-2b-it">Gemma 4 (New & Smart) ✨</option>
              <option value="gemini-3-flash-preview">High Quality (G3 Flash)</option>
              <option value="gemini-2.5-flash">Medium Quality (G2.5 Flash)</option>
              <option value="gemini-3.1-flash-lite-preview">Fast (G3.1 Lite)</option>`;

const files = glob.sync('src/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Try to find the select options block for AI Models
  const targetRe = /<option value="gemini-3-flash-preview">.*?<\/option>\s*<option value="gemini-3\.1-flash-lite-preview">.*?<\/option>\s*<option value="gemini-2\.5-flash">.*?<\/option>/ms;
  const targetRe2 = /<option value="gemini-3-flash-preview">G3 Flash \(HQ\)<\/option>\s*<option value="gemini-3\.1-flash-lite-preview">G3\.1 Lite \(Medium\)<\/option>\s*<option value="gemini-2\.5-flash">G2\.5 Flash \(Fast\)<\/option>/ms;
  
  let replaced = false;
  if(targetRe.test(content)) {
    content = content.replace(targetRe, newOptions);
    replaced = true;
  } else if(targetRe2.test(content)) {
    content = content.replace(targetRe2, newOptions);
    replaced = true;
  }
  
  if (replaced) {
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
