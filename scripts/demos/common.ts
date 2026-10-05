/**
 * Helpers shared by the demo generators.
 *
 * Each generator runs a sibling repo's own page builders against invented
 * fixtures and writes a static snapshot to public/demos/<name>/. The sibling
 * repos are expected next to this one (../<repo>); override with DEMO_SRC_ROOT.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const SRC_ROOT = resolve(process.env.DEMO_SRC_ROOT ?? join(ROOT, '..'));

export function repoPath(repo: string, ...parts: string[]): string {
  return join(SRC_ROOT, repo, ...parts);
}

/** Wipes and recreates public/demos/<name>/. */
export function outDir(name: string): string {
  const dir = join(ROOT, 'public', 'demos', name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function write(dir: string, file: string, body: string | object): void {
  const path = join(dir, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof body === 'string' ? body : JSON.stringify(body));
}

export function copy(from: string, dir: string, file: string): void {
  const to = join(dir, file);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
}

/** Records which commit of the source repo produced the snapshot. */
export function writeSource(dir: string, repo: string): void {
  const sha = execFileSync('git', ['-C', repoPath(repo), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const dirty = execFileSync('git', ['-C', repoPath(repo), 'status', '--porcelain'], { encoding: 'utf8' }).trim() !== '';
  write(dir, 'SOURCE.json', JSON.stringify({ repo: `https://github.com/wkbaran/${repo}`, commit: sha, dirty, generatedAt: new Date().toISOString() }, null, 2) + '\n');
}

/**
 * Swaps the default palette on <html data-palette="ground,ink,signal">.
 * equity-watch and spread-book ship with the same default as this site, so
 * their demos get their own here and don't read as part of the page around
 * them. A visitor's own pick in the app's palette panel still wins.
 */
export function setPalette(html: string, colors: [string, string, string]): string {
  const attr = /(<html\b[^>]*\bdata-palette=")[^"]*"/i;
  if (!attr.test(html)) throw new Error('page has no data-palette on <html>');
  return html.replace(attr, `$1${colors.join(',')}"`);
}

const SHIM = readFileSync(join(ROOT, 'scripts', 'demos', 'demo-shim.js'), 'utf8');

/**
 * Inlines the demo shim as the first script in <head>, so it is in place
 * before any page script runs. `config` becomes window.__DEMO__.
 */
export function injectShim(html: string, config: Record<string, unknown> = {}): string {
  const tag = `<script>window.__DEMO__=${JSON.stringify(config)};\n${SHIM}</script>`;
  const at = html.search(/<head[^>]*>/i);
  if (at < 0) throw new Error('page has no <head>');
  const end = html.indexOf('>', at) + 1;
  return html.slice(0, end) + '\n' + tag + html.slice(end);
}
