// The dark-background logo variant (from endcard.html) as a transparent PNG, 3360 px wide.
import { chromium } from 'playwright-core'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell' });
const p = await b.newPage({ viewport: { width: 2000, height: 1200 }, deviceScaleFactor: 2 });
await p.goto('file://' + path.join(HERE, 'endcard.html')); await p.waitForFunction('window.READY === true');
await p.evaluate(() => { document.getElementById('bg').style.display = 'none'; document.body.style.background = 'transparent'; document.documentElement.style.background = 'transparent'; const L = document.getElementById('logo'); L.setAttribute('width', 1680); L.setAttribute('height', 300); });
await p.locator('#logo').screenshot({ path: path.join(HERE, 'logo-scuro-3360.png'), omitBackground: true });
await b.close(); console.log('ok');
