// Rendert die App headless und speichert Screenshots der Hauptseiten (Desktop + Smartphone, hell + dunkel).
// Aufruf: node tools/screenshot.mjs http://localhost:8080 out-dir
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PW_PATH || '/opt/node-tools/node_modules/playwright');
import { mkdirSync } from 'node:fs';

const base = process.argv[2] || 'http://localhost:8080';
const out = process.argv[3] || 'shots';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const errors = [];
const routes = ['start', 'lernplan', 'thema', 'ueben', 'tutor', 'unterlagen', 'einstellungen'];
for (const [name, vp, scheme] of [['desktop', { width: 1280, height: 900 }, 'light'], ['phone', { width: 400, height: 820 }, 'dark']]) {
  const ctx = await browser.newContext({ viewport: vp, colorScheme: scheme, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${name} console: ${m.text()}`); });
  for (const r of routes) {
    await page.goto(`${base}/#${r}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => { location.hash = location.hash; });
    await page.waitForTimeout(400);
    const w = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (w) errors.push(`${name}/${r}: horizontaler Überlauf`);
    await page.screenshot({ path: `${out}/${name}-${r}.png`, fullPage: true });
  }
  // Übungsmodus durchspielen: Formel rechnen und prüfen
  await page.goto(`${base}/#ueben`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const inputs = await page.$$('.answer .calc input');
  if (inputs.length) {
    await inputs[0].fill('1+1');
    await page.click('.answer .calc button');
    await page.click('text=Prüfen');
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${out}/${name}-ueben-geprueft.png`, fullPage: true });
  }
  await ctx.close();
}
await browser.close();
console.log(errors.length ? 'Probleme:\n' + errors.join('\n') : 'Keine Fehler, keine Überläufe.');
process.exit(errors.length ? 1 : 0);
