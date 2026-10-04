/**
 * Equity Watch demo: the real web/ dashboard, fed dashboard.json, alerts.json
 * and vault.json built by the app's own builders from its Playwright fixtures
 * (playwright/fixtures.ts, all invented). Mirrors playwright/server.ts.
 *
 * Run with tsx: the app's sources import "./x.js" for x.ts.
 */
import { readFileSync } from 'node:fs';
import { copy, injectShim, outDir, repoPath, write, writeSource } from './common.ts';

const REPO = 'equity-watch';
const src = (p: string) => repoPath(REPO, p);

const { buildDashboard } = await import(src('src/dashboard.ts'));
const { buildAlertRows } = await import(src('src/web/alertsPage.ts'));
const { siteDocument } = await import(src('src/web/site.ts'));
const { sealVault, vaultContents } = await import(src('src/web/vault.ts'));
const { FIXTURE_ALERTS, FIXTURE_PROFILES, FIXTURE_REVISITS, HOLDINGS, PRICES } = await import(src('playwright/fixtures.ts'));

/** The demo's ops token; the shim pre-fills it so editing starts unlocked. */
const DEMO_TOKEN = 'demo';

const now = new Date();
const quotes = new Map(Object.entries(PRICES as Record<string, number>).map(([s, lastPrice]) => [s, { lastPrice, totalVolume: 0 }]));
const dashboard = buildDashboard({
  alerts: FIXTURE_ALERTS,
  revisits: FIXTURE_REVISITS,
  holdings: HOLDINGS,
  quotes,
  now,
  includeApproaching: true,
  profiles: FIXTURE_PROFILES,
  exchanges: new Map([['MSFT', 'NASDAQ Global Select']]),
  betas: new Map([['AA', -0.4], ['TSLA', 2.1]]),
  daily: new Map([
    ['AA', { atr: 5, highClose: 47 }],
    ['TSLA', { atr: 9.68, highClose: 255 }],
  ]),
});
const held = new Set<string>(HOLDINGS.lots.map((l: { symbol: string }) => l.symbol.toUpperCase()));

const dir = outDir(REPO);
write(dir, 'dashboard.json', siteDocument(dashboard, { holdings: false, ops: true, vault: true }, {
  results: [],
  processedThrough: new Date(now.getTime() - 6 * 60_000).toISOString(),
  intervalMinutes: 15,
  nextCheckAt: null,
  maxStaleMinutes: null,
  authExpiredSince: null,
}));
write(dir, 'alerts.json', { generatedAt: dashboard.generatedAt, alerts: buildAlertRows(FIXTURE_ALERTS, quotes, new Set(), new Map(), held) });
write(dir, 'vault.json', sealVault(vaultContents(dashboard, HOLDINGS), DEMO_TOKEN));

const html = readFileSync(src('web/index.html'), 'utf8');
write(dir, 'index.html', injectShim(html, {
  name: REPO,
  project: 'equity-watch',
  anchor: now.toISOString(),
  shift: ['dashboard.json', 'alerts.json'],
  ops: { endpoint: 'ops', document: 'dashboard.json' },
  theme: { key: 'equity-watch.theme', toggle: '#theme-btn' }, webmcp: true, allowHosts: ['fonts.googleapis.com', 'fonts.gstatic.com'],
  storage: { 'equity-watch.opsToken': DEMO_TOKEN },
}));
for (const f of ['app.js', 'palette.js', 'webmcp.js']) copy(src(`web/${f}`), dir, f);
writeSource(dir, REPO);
console.log(`equity-watch demo -> ${dir}`);
