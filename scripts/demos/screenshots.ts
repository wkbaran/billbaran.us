/**
 * Captures each demo in its dark and its light theme for the project cards
 * (public/images/shots/<project>-dark.png and -light.png). The card shows the
 * one matching the page's theme.
 *
 * Needs a built site being served: npm run build && npm run preview, then
 *   npm run shots              (or SHOTS_BASE=http://host:port npm run shots)
 */
import { join } from 'node:path';
import { chromium } from 'playwright';
import { ROOT } from './common.ts';

const BASE = process.env.SHOTS_BASE ?? 'http://localhost:4321';

// Project id -> the demo page to capture, and the key each app keeps its theme under.
const SHOTS: Record<string, { path: string; themeKey: string }> = {
  'equity-watch': { path: '/demos/equity-watch/index.html#/queue', themeKey: 'equity-watch.theme' },
  kotoba: { path: '/demos/kotoba/digest-2026-10-04.html', themeKey: 'kotoba-theme' },
  'outlier-caucus': { path: '/demos/outlier-caucus/index.html', themeKey: 'congress-theme' },
  'spread-book': { path: '/demos/spread-book/index.html', themeKey: 'optionspread.theme' },
};

const browser = await chromium.launch();
try {
  for (const theme of ['dark', 'light'] as const) {
    // A fresh context per theme, so nothing carries over between captures.
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: theme });
    const page = await context.newPage();
    for (const [project, { path, themeKey }] of Object.entries(SHOTS)) {
      await page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch {} }, [themeKey, theme]);
      await page.goto(BASE + path, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      // The demo marker is for visitors of the live demo, not for thumbnails.
      await page.evaluate(() => document.querySelectorAll('[role="note"]').forEach((n) => n.remove()));
      const file = join(ROOT, 'public/images/shots', `${project}-${theme}.png`);
      await page.screenshot({ path: file });
      console.log(`${project} ${theme} -> ${file}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
