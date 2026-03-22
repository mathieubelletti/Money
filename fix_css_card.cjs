const fs = require('fs');
const file = 'j:/Antigravity/Money/src/index.css';
let c = fs.readFileSync(file, 'utf8');

// The regex matches `.card { ... background: white;` and `.card { background: #ffffff;` 
// Since we don't know exact spacing, breaking it into two simple replaces if possible.
// Actually, earlier replace might have failed if it wasn't exact. Let's just do a string replace 
// on the specific block if we can, or just replace `background: white;` universally IN .card blocks.

// A simple way is to match `.card {` and the next `background:`
c = c.replace(/\.card\s*\{[^}]*background:\s*(white|#ffffff);/gi, (match) => {
  return match.replace(/background:\s*(white|#ffffff);/i, 'background: var(--color-surface);');
});

// Just in case, do it for dashboard cards too
c = c.replace(/\.dashboard-card\s*\{[^}]*background:\s*(white|#ffffff);/gi, (match) => {
  return match.replace(/background:\s*(white|#ffffff);/i, 'background: var(--color-surface);');
});

// Same for any -card classes
c = c.replace(/\.[a-zA-Z0-9_-]+-card\s*\{[^}]*background:\s*(white|#ffffff);/gi, (match) => {
  return match.replace(/background:\s*(white|#ffffff);/i, 'background: var(--color-surface);');
});

fs.writeFileSync(file, c);
console.log('index.css card backgrounds fixed.');
