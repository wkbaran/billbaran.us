/**
 * Snapshots the worked examples from the MCP servers' docs into
 * src/data/replays.json for the run replay on /llm-workflows/.
 *
 * Those examples are fictional and are checked against real tool output by
 * each repo's docs-example test, so the replay shows exactly what the tools
 * print. Blocks are marked in the docs with <!-- example: name --> (the
 * arguments) and <!-- generated: name --> (the output). The model's answers
 * are derived from the finish tools' example arguments, so they match them.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoPath, ROOT } from './common.ts';

function blocks(repo: string, doc: string): Map<string, string> {
  const text = readFileSync(repoPath(repo, doc), 'utf8');
  const out = new Map<string, string>();
  const re = /<!-- (example|generated): (\w+) -->\s*```\w*\n([\s\S]*?)```/g;
  for (const m of text.matchAll(re)) out.set(`${m[1]}:${m[2]}`, m[3].trimEnd());
  return out;
}

type Actor = 'model' | 'job' | 'cron';
interface Step { actor: Actor; title: string; note: string; call?: string; output?: string }

function need(b: Map<string, string>, key: string): string {
  const v = b.get(key);
  if (v === undefined) throw new Error(`missing block ${key}`);
  return v;
}

const medium = blocks('medium-reader-mcp', 'docs/digest-tools.md');
const spotify = blocks('spotify-discovery-mcp', 'docs/discovery-tools.md');

/** One post's verdict, from the reply the docs show for F1 (written for an agent, as labelled lines). */
function verdict(): Record<string, string | number> {
  const text = readFileSync(repoPath('medium-reader-mcp', 'docs/digest-tools.md'), 'utf8');
  const m = text.match(/## 3\. What a subagent returns[\s\S]*?```text\n([\s\S]*?)```/);
  if (!m) throw new Error('missing F1 verdict');
  const field = (k: string) => m[1].match(new RegExp(`^${k}: (.*)$`, 'm'))?.[1] ?? '';
  return { type: field('TYPE'), gist: field('GIST'), depth: Number(field('DEPTH')), why: field('WHY') };
}

/** The digest_finish output, trimmed to what Discord receives. */
const digestMessage = (s: string) => s.split(/^=====.*=====$/m)[1]?.trim() ?? s;

const json = (v: unknown) => JSON.stringify(v, null, 2);

// The model's answers aren't tool output, so no test checks them. They're derived
// from the arguments the docs pass to the finish tools, so they always agree with them.
type Gist = { ref: string; gist: string; why?: string };
const mFinish = JSON.parse(need(medium, 'example:digest_finish')) as Record<'starred' | 'following' | 'top_picks' | 'for_you', Gist[]>;
const refs = (xs: Gist[]) => xs.map((x) => x.ref);
const bySection = (p: string) => [...mFinish.starred, ...mFinish.following, ...mFinish.top_picks, ...mFinish.for_you].filter((x) => x.ref.startsWith(p));
const shortlist = { following: refs(bySection('F')), top_picks: refs(bySection('T')), for_you: refs(bySection('Y')), clickbait: [] };
const picks = { picks: mFinish.starred.map(({ ref, why }) => ({ ref, why })) };

const sFinish = JSON.parse(need(spotify, 'example:discovery_finish')) as { picks: string[]; reject: string[]; why: Record<string, string> };
const choice = { picks: sFinish.picks, reject: sFinish.reject, why: Object.entries(sFinish.why).map(([ref, reason]) => ({ ref, reason })) };

const replays = [
  {
    id: 'medium',
    label: 'Medium daily digest',
    schedule: 'Every morning · its own container · local Qwen 27B through LiteLLM',
    steps: [
      { actor: 'cron', title: 'supercronic starts medium-digest', note: 'A plain Node script with no agent framework. It starts medium-reader-mcp as a child process and talks to it over MCP.' },
      { actor: 'job', title: 'digest_begin', note: "The job's code makes this call. The server collects Following, top picks and For you, drops what was already reported, has Jev rank every headline, and writes a run file. It hands back the posts as refs.", call: need(medium, 'example:digest_begin'), output: need(medium, 'generated:digest_begin') },
      { actor: 'model', title: 'Which headlines to read', note: 'One question with a JSON schema: the ranked rows, the reader\'s interests and recent reading in, refs out. Code checks the caps and drops any ref the model invents.', output: json(shortlist) },
      { actor: 'job', title: 'read_post by ref', note: 'The job fetches each shortlisted post by ref. The server resolves F1 from the run file, so nobody copies a URL and nothing can be renumbered.', call: need(medium, 'example:read_post'), output: need(medium, 'generated:read_post') },
      { actor: 'model', title: 'One verdict per post', note: 'The post\'s full text in, a verdict out. The gist has to state the argument, not the topic, and depth says how much you lose by reading only the gist.', output: json({ ref: 'F1', ...verdict() }) },
      { actor: 'model', title: 'Which posts get a ⭐', note: 'One last question over all the verdicts. None is a valid answer when nothing is strong.', output: json(picks) },
      { actor: 'job', title: 'digest_finish', note: 'Code assembles the arguments from the answers. The server validates every ref, fills in titles and links, saves state, and lays out the message.', call: need(medium, 'example:digest_finish'), output: need(medium, 'generated:digest_finish') },
      { actor: 'job', title: 'Posted to Discord', note: 'The job posts the text after the ===== line to a webhook. No model ever handles the finished message.', output: digestMessage(need(medium, 'generated:digest_finish')) },
    ] satisfies Step[],
  },
  {
    id: 'spotify',
    label: 'Spotify discovery lane',
    schedule: 'Every morning · six genre lanes in a row · local Qwen 27B through LiteLLM, $0',
    steps: [
      { actor: 'cron', title: 'supercronic starts the lanes', note: 'One command runs all six lanes in order. Each adds 3–6 tracks to the day\'s private playlist. An expired login or a Spotify block stops the rest.' },
      { actor: 'job', title: 'discovery_begin', note: 'Finds or creates today\'s playlist, pulls new releases from the lane\'s known labels and artists within a request budget, and hands out K refs.', call: need(spotify, 'example:discovery_begin'), output: need(spotify, 'generated:discovery_begin') },
      { actor: 'model', title: 'Web research → verify_tracks', note: 'The one open-ended step: a tool loop with web search and page reads. Code enforces the budgets (20 searches, 10 reads, 8 verify calls) by taking a tool away once it\'s spent. The server checks each find on Spotify with exact field searches, compares the ℗ label, and dedups by URI, ISRC and artist + title.', call: need(spotify, 'example:verify_tracks'), output: need(spotify, 'generated:verify_tracks') },
      { actor: 'job', title: 'discovery_review', note: 'Everything that can be picked, read from the server\'s own run file.', call: need(spotify, 'example:discovery_review'), output: need(spotify, 'generated:discovery_review') },
      { actor: 'model', title: 'The choice', note: 'One question with a JSON schema, and the only call that thinks. Order is the model\'s real say: the server drops from the end to meet the limits.', output: json(choice) },
      { actor: 'job', title: 'discovery_finish', note: 'The server enforces the lane limits by dropping picks from the end instead of refusing, adds the tracks, and saves history, the pool and what the lane learned.', call: need(spotify, 'example:discovery_finish'), output: need(spotify, 'generated:discovery_finish') },
      { actor: 'job', title: 'Report posted to Discord', note: 'The job runs the server\'s report command and posts it as "Spotify · a-dnb". The report comes from the run file; no model writes or relays it.', output: need(spotify, 'generated:report') },
    ] satisfies Step[],
  },
];

writeFileSync(join(ROOT, 'src/data/replays.json'), JSON.stringify(replays, null, 2) + '\n');
console.log('replays -> src/data/replays.json');
