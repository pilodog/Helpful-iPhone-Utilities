// Render the end card at 1080×1920 (vertical) and 1920×1080 (horizontal).
import { chromium } from 'playwright-core'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell' });
for (const [w, h, name] of [[1080, 1920, 'finale-verticale'], [1920, 1080, 'finale-orizzontale']]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto('file://' + path.join(HERE, 'endcard.html')); await p.waitForFunction('window.READY === true');
  await p.screenshot({ path: path.join(HERE, name + '.png') }); await p.close();
}
await b.close(); console.log('ok');
