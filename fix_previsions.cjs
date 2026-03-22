const fs = require('fs');
const file = 'j:/Antigravity/Money/src/pages/Previsions.jsx';
let c = fs.readFileSync(file, 'utf8');

// Replace conditional backgrounds in month tiles
c = c.replace(/'#f8fafc'/g, "'var(--color-surface-alt)'");
c = c.replace(/:\s*'white'/g, ": 'var(--color-surface)'");
c = c.replace(/'#f9fafb'/g, "'var(--color-bg)'");
c = c.replace(/'#fff'/g, "'var(--color-surface)'");
c = c.replace(/'#eee'/g, "'var(--color-bg)'");
c = c.replace(/'#fff9eb'/g, "'var(--color-warning-light)'");
c = c.replace(/'rgba\(255,255,255,0\.5\)'/g, "'var(--color-surface-alt)'");

// Replace Header Gradient to Green-Black
c = c.replace(/linear-gradient\(135deg, var\(--color-primary-bg\) 0%, #e2eeec 100%\)/g, "linear-gradient(135deg, var(--color-primary) 0%, #000000 100%)");

// Fix text colors inside the header so they remain legible on dark background
c = c.replace(/color:\s*'var\(--color-text-secondary\)',([^>]+)>Solde prévisionnel à 12 mois/g, "color: 'rgba(255,255,255,0.7)',$1>Solde prévisionnel à 12 mois");
c = c.replace(/color:\s*'var\(--color-text-primary\)',([^>]+)>\{formatBalance\(calculatedResults\[lastForecast\.id\]\?\.final \|\| 0\)\}/g, "color: 'white',$1>{formatBalance(calculatedResults[lastForecast.id]?.final || 0)}");

fs.writeFileSync(file, c);
console.log('Previsions fixed.');
