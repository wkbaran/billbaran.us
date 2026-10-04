/**
 * Regenerates every demo snapshot under public/demos/. Needs the app repos
 * checked out next to this one (or DEMO_SRC_ROOT), each with npm install done.
 * Pass names to rebuild only some: npm run demos -- kotoba spread-book
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT } from './common.ts';

const ALL = ['equity-watch', 'kotoba', 'outlier-caucus', 'spread-book', 'llm-replays'];
const wanted = process.argv.slice(2);
for (const name of wanted.length ? wanted : ALL) {
  if (!ALL.includes(name)) throw new Error(`unknown demo "${name}" (have: ${ALL.join(', ')})`);
  console.log(`\n── ${name}`);
  execFileSync(join(ROOT, 'node_modules/.bin/tsx'), [join(ROOT, 'scripts/demos', `${name}.ts`)], { stdio: 'inherit' });
}
