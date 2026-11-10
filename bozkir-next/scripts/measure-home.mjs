/**
 * Ana sayfa ölçümü: bölüm sayısı, toplam yükseklik, yatay taşma, H2 ve bölüm id'leri.
 * Kullanım: node scripts/measure-home.mjs [--base http://localhost:3000] [--width 390] [--theme light|dark]
 */
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const base = arg('base', 'http://localhost:3000').replace(/\/$/, '');
const only = arg('width', null);
const widths = only ? [Number(only)] : [390, 768, 1440];
const path = arg('path', '/tr');
const theme = arg('theme', null);

const browser = await chromium.launch();
const out = [];

for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    colorScheme: theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : undefined,
  });
  if (theme) {
    await context.addInitScript((t) => {
      try {
        localStorage.setItem('theme', t);
      } catch {
        // yok say
      }
    }, theme);
  }
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200));
  });

  const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle', timeout: 60000 });
  const status = response?.status() ?? 0;

  // Tembel görsellerin yüklenmesi için sayfayı sonuna kadar kaydır.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });

  const data = await page.evaluate(() => {
    const root =
      document.querySelector('main [data-night]') ?? document.querySelector('main') ?? document.body;
    // Ana sayfa bantları: [data-night] altındaki doğrudan çocuklar (bazıları <section>, bazıları <div>).
    const bands = Array.from(root.children).filter((el) => {
      const tag = el.tagName.toLowerCase();
      if (['script', 'style', 'nav', 'aside', 'template'].includes(tag)) return false;
      return el.getBoundingClientRect().height > 80;
    });

    const vw = document.documentElement.clientWidth;
    const offenders = Array.from(document.querySelectorAll('main *'))
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && (r.right > vw + 1 || r.left < -1);
      })
      .slice(0, 8)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${el.className && typeof el.className === 'string' ? `.${el.className.split(' ').slice(0, 3).join('.')}` : ''} [${Math.round(r.left)}..${Math.round(r.right)}]`;
      });

    return {
      sections: bands.length,
      docHeight: Math.round(document.documentElement.scrollHeight),
      viewports: Number((document.documentElement.scrollHeight / window.innerHeight).toFixed(1)),
      h2: document.querySelectorAll('h2').length,
      ids: bands.map((el) => el.id).filter(Boolean),
      bands: bands.map((el) => ({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        h: Math.round(el.getBoundingClientRect().height),
      })),
      overflow: Math.max(
        0,
        Math.round(document.documentElement.scrollWidth - document.documentElement.clientWidth),
      ),
      offenders,
    };
  });

  out.push({ width, status, ...data, consoleErrors: consoleErrors.slice(0, 5) });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(out, null, 2));
