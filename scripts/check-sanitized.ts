/**
 * Fails when anything about to be published carries a personal detail:
 * LAN addresses and hostnames, home-lab paths, local time zones, and whatever
 * extra patterns are listed in .sanitize-patterns (gitignored, one regex per
 * line: personal email, bucket names, distribution ids...).
 *
 * Usage: node scripts/check-sanitized.ts <dir>...   (default: public src)
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const GENERIC: Array<[string, RegExp]> = [
  ['private IPv4 address', /\b(?:192\.168|10\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}\b/],
  ['LAN hostname', /\b[a-z0-9-]+\.(?:home|lan|local)\b(?!\s*(?:page|screen|directory))/i],
  ['home-lab path', /\/(?:var\/home|opt\/data)\//],
  // A login on a bare host name; skips emails (a dot follows) and pinned versions (@v5).
  ['SSH target', /\b[a-z_][a-z0-9_-]*@(?!v\d)[a-z][a-z0-9-]*\b(?![.\w@-])/i],
  ['local time zone', /\bAmerica\/(?!New_York\b)[A-Za-z_]+/],
  ['AWS access key id', /\bAKIA[0-9A-Z]{16}\b/],
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
];

const ROOT = new URL('..', import.meta.url).pathname;
const localFile = join(ROOT, '.sanitize-patterns');
const LOCAL: Array<[string, RegExp]> = existsSync(localFile)
  ? readFileSync(localFile, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
      .map((l) => ['pattern from .sanitize-patterns', new RegExp(l, 'i')])
  : [];
if (!LOCAL.length && !process.env.CI) console.warn('check-sanitized: no .sanitize-patterns, so only the generic patterns run');

const TEXT = new Set(['.html', '.htm', '.js', '.mjs', '.cjs', '.ts', '.astro', '.css', '.json', '.md', '.svg', '.txt', '.xml', '.yaml', '.yml', '.csv']);

function* files(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (TEXT.has(extname(name).toLowerCase())) yield p;
  }
}

const dirs = process.argv.slice(2);
let problems = 0;
for (const d of dirs.length ? dirs : ['public', 'src']) {
  const dir = join(ROOT, d);
  if (!existsSync(dir)) continue;
  for (const file of files(dir)) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const [what, re] of [...GENERIC, ...LOCAL]) {
        const m = line.match(re);
        if (m) {
          problems++;
          console.error(`${relative(ROOT, file)}:${i + 1}: ${what}: ${m[0].slice(0, 60)}`);
        }
      }
    });
  }
}
if (problems) {
  console.error(`\ncheck-sanitized: ${problems} problem(s). Nothing personal may be published.`);
  process.exit(1);
}
console.log(`check-sanitized: clean (${dirs.join(', ') || 'public, src'})`);
