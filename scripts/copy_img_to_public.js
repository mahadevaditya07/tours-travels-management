const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const srcDir = path.join(repoRoot, 'img');
const destDir = path.join(repoRoot, 'frontend', 'public', 'images');

if (!fs.existsSync(srcDir)) {
  console.error('Source img directory not found:', srcDir);
  process.exit(1);
}

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const allowed = ['.jpg', '.jpeg', '.png', '.gif'];
const files = fs.readdirSync(srcDir).filter(f => allowed.includes(path.extname(f).toLowerCase()));

const copied = [];
for (const f of files) {
  const src = path.join(srcDir, f);
  const dest = path.join(destDir, f);
  try {
    fs.copyFileSync(src, dest);
    copied.push(f);
  } catch (err) {
    console.error('Failed to copy', f, err.message);
  }
}

console.log('Copied files to', destDir);
console.log(copied.join('\n'));
