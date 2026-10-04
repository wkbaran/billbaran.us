/**
 * Spread Book demo: the app's own CLI (portfolio.js, then generate-index.js)
 * run on an invented book of credit spreads, inside a scratch copy of the app
 * with all network access refused (no-network.cjs), so the Yahoo price fetch
 * just fails quietly.
 *
 * The CSV only copies the *column layout* of an OptionStrat export. None of
 * the real exports in the app's data/ folder are read.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { copy, injectShim, outDir, repoPath, ROOT, write, writeSource } from './common.ts';

const REPO = 'spread-book';
/** Any zone but market time: book.js reads snapshot stamps in the author's local zone. */
const LOCAL_ZONE = /America\/(?!New_York)[A-Za-z_]+/g;
const APP_FILES = ['portfolio.js', 'generate-index.js', 'book.js', 'report.js', 'report.css', 'theme.css', 'palette.js', 'package.json'];

let seed = 7;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const between = (lo: number, hi: number) => lo + rand() * (hi - lo);

const now = new Date();
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ord = (d: number) => d + (d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th');
const mdy = (d: Date) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${String(d.getUTCFullYear()).slice(2)}`;
/** The Friday on or after `days` from now. */
function friday(days: number): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days));
  d.setUTCDate(d.getUTCDate() + ((5 - d.getUTCDay() + 7) % 7));
  return d;
}
const EXPIRIES = [friday(12), friday(26), friday(47), friday(75)];
const money = (n: number) => (n < 0 ? ` $(${Math.abs(n).toFixed(2)}) ` : ` $${n.toFixed(2)} `);

// [underlying, price, bull put?, expiry index, return % of max profit] — a few are set up to trip each exit rule.
const BOOK: Array<[string, number, boolean, number, number]> = [
  ['SPY', 575, true, 0, 58],    // past the 50% close
  ['SPY', 575, true, 2, 18],
  ['QQQ', 495, true, 1, 31],
  ['QQQ', 495, false, 3, -12],
  ['IWM', 218, true, 0, -64],   // near the 25%-of-max-loss stop
  ['IWM', 218, true, 2, 9],
  ['AAPL', 232, true, 1, 44],   // over 60% of the way to the close
  ['MSFT', 420, true, 2, 22],
  ['NVDA', 180, false, 1, -38],
  ['AMZN', 188, true, 3, 6],
  ['XLE', 92, false, 2, 27],
  ['GLD', 248, true, 1, 15],
  ['TLT', 94, false, 0, 35],    // inside 21 days
  ['JPM', 214, true, 3, 3],
  ['META', 585, true, 2, -21],
  ['COST', 905, true, 1, 40],
];

const header1 = 'Name,Total Return %,Total Return $,Created At,Expiration,Net Debit/Credit,Chance,Max Loss,Max Profit,High,Low,Delta,Theta,Gamma,Vega,Rho,IV,Link,Group';
const header2 = 'Symbol,Quantity,Entry Price,Current Price,Close Price,,,,,,,,,,,,,,';
const rows = BOOK.map(([sym, price, bullPut, e, ret]) => {
  const exp = EXPIRIES[e];
  const width = price > 400 ? 10 : 5;
  const offset = price * between(0.05, 0.1);
  const short = Math.round((bullPut ? price - offset : price + offset) / width) * width;
  const long = bullPut ? short - width : short + width;
  const strikes = bullPut ? `${long}/${short}` : `${short}/${long}`;
  const credit = width * between(0.18, 0.3);
  const maxProfit = credit * 100;
  const maxLoss = (width - credit) * 100;
  const dte = Math.max(1, (exp.getTime() - now.getTime()) / 86_400_000);
  const chance = between(0.66, 0.86) + (ret > 30 ? 0.06 : ret < -30 ? -0.12 : 0);
  const theta = (maxProfit / dte) * between(0.35, 0.7) * (ret < -30 ? 0.6 : 1);
  const gamma = -between(0.002, 0.012) * (30 / dte) * (ret < -30 ? 2.5 : 1);
  const vega = -between(0.8, 3.2) * Math.sqrt(dte / 30);
  const delta = (bullPut ? 1 : -1) * between(2, 9) * (ret < -30 ? 2.2 : 1);
  const opened = new Date(now.getTime() - between(5, 30) * 86_400_000);
  const name = `${sym} ${MONTHS[exp.getUTCMonth()]} ${ord(exp.getUTCDate())} ${strikes} ${bullPut ? 'Bull Put' : 'Bear Call'} Spread`;
  return [
    name, `${ret.toFixed(2)}%`, money((ret / 100) * maxProfit), `${mdy(opened)} 10:30`, `${mdy(exp)} 14:00`,
    money(credit * 100), `${(chance * 100).toFixed(2)}%`, money(maxLoss), money(maxProfit),
    `${between(80, 160).toFixed(2)}%`, `${(-between(40, 100)).toFixed(2)}%`,
    delta.toFixed(9), theta.toFixed(9), gamma.toFixed(9), vega.toFixed(9), (between(-0.4, 0.4)).toFixed(9),
    `${between(14, 42).toFixed(2)}%`, 'Open', 'Live',
  ].join(',');
});

// A scratch copy of just the app's code; the CSV name carries the snapshot time.
const work = mkdtempSync(join(tmpdir(), 'spread-book-demo-'));
for (const f of APP_FILES) cpSync(repoPath(REPO, f), join(work, f));
const stamp = now.toISOString().slice(0, 10) + '_10-30';
const csv = join(work, `demo-book-${stamp}.csv`);
writeFileSync(csv, [header1, header2, ...rows].join('\n') + '\n');
execFileSync(process.execPath, ['--require', join(ROOT, 'scripts/demos/no-network.cjs'), 'portfolio.js', csv], { cwd: work, stdio: 'inherit' });

const dir = outDir(REPO);
const reports = join(work, 'reports');
for (const f of readdirSync(reports)) {
  if (f.endsWith('-prices.json')) continue; // empty: the price fetch was refused
  if (!f.endsWith('.html')) { copy(join(reports, f), dir, f); continue; }
  const html = readFileSync(join(reports, f), 'utf8').replace(LOCAL_ZONE, 'America/New_York');
  write(dir, f, injectShim(html, { name: REPO, project: 'spread-book', allowHosts: ['fonts.googleapis.com', 'fonts.gstatic.com'] }));
}
writeSource(dir, REPO);
console.log(`spread-book demo -> ${dir}`);
