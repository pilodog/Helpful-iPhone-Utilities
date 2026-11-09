// Render the vector logo to transparent PNGs (several widths) and a standalone SVG with outlined text.
import { chromium } from 'playwright-core';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell' });
for (const W of [1800, 3600]) {
  const p = await b.newPage({ viewport: { width: 1800, height: 300 }, deviceScaleFactor: W / 1800 });
  await p.goto('file://' + path.join(HERE, 'logo.html')); await p.waitForFunction('window.READY === true');
  await p.locator('#logo').screenshot({ path: path.join(HERE, `logo-${W}.png`), omitBackground: true });
  if (W === 1800) { const svg = await p.locator('#logo').evaluate(e => e.outerHTML); fs.writeFileSync(path.join(HERE, 'logo-raw.svg'), svg); }
  await p.close();
}
await b.close(); console.log('ok');
