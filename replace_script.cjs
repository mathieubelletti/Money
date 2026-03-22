const fs = require('fs');
const path = require('path');

const dirs = [
  'j:/Antigravity/Money/src/pages',
  'j:/Antigravity/Money/src/components'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));
  files.forEach(f => {
    const fp = path.join(dir, f);
    let c = fs.readFileSync(fp, 'utf8');
    
    // Replace React inline style 'white' with 'var(--color-surface)'
    c = c.replace(/background:\s*'white'/gi, "background: 'var(--color-surface)'");
    c = c.replace(/backgroundColor:\s*'white'/gi, "backgroundColor: 'var(--color-surface)'");
    
    c = c.replace(/background:\s*white\s*;/gi, "background: var(--color-surface);");
    c = c.replace(/backgroundColor:\s*white\s*;/gi, "backgroundColor: var(--color-surface);");
    
    // Hex codes
    c = c.replace(/background:\s*'#fff'/gi, "background: 'var(--color-surface)'");
    c = c.replace(/backgroundColor:\s*'#fff'/gi, "backgroundColor: 'var(--color-surface)'");
    
    c = c.replace(/background:\s*'#ffffff'/gi, "background: 'var(--color-surface)'");
    c = c.replace(/backgroundColor:\s*'#ffffff'/gi, "backgroundColor: 'var(--color-surface)'");
    
    c = c.replace(/background:\s*'#f8fafc'/gi, "background: 'var(--color-surface-alt)'");
    c = c.replace(/backgroundColor:\s*'#f8fafc'/gi, "backgroundColor: 'var(--color-surface-alt)'");
    
    c = c.replace(/background:\s*'#eee'/gi, "background: 'var(--color-bg)'");
    c = c.replace(/backgroundColor:\s*'#eee'/gi, "backgroundColor: 'var(--color-bg)'");
    
    fs.writeFileSync(fp, c);
  });
});
console.log('Script ran successfully');
