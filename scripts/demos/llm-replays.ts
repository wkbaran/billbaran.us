/**
 * Snapshots the worked examples from the MCP servers' docs into
 * src/data/replays.json for the run replay on /llm-workflows/.
 *
 * Those examples are fictional and are checked against real tool output by
 * each repo's docs-example test, so the replay shows exactly what the tools
 * print. Blocks are marked in the docs with <!-- example: name --> (the
 * arguments) and <!-- generated: name --> (the output).
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

type Actor = 'model' | 'server' | 'subagent' | 'cron';
interface Step { actor: Actor; title: string; note: string; call?: string; output?: string }

function need(b: Map<string, string>, key: string): string {
  const v = b.get(key);
  if (v === undefined) throw new Error(`missing block ${key}`);
  return v;
}

const medium = blocks('medium-reader-mcp', 'docs/digest-tools.md');
const spotify = blocks('spotify-discovery-mcp', 'docs/discovery-tools.md');

/** The subagent's reply isn't tool output, so the docs show it without a marker. */
function subagentReply(): string {
  const text = readFileSync(repoPath('medium-reader-mcp', 'docs/digest-tools.md'), 'utf8');
  const m = text.match(/## 3\. What a subagent returns[\s\S]*?```text\n([\s\S]*?)```/);
  if (!m) throw new Error('missing subagent reply');
  return m[1].trimEnd();
}

/** The digest_finish output, trimmed to what Discord receives. */
const digestMessage = (s: string) => s.split(/^=====.*=====$/m)[1]?.trim() ?? s;

const replays = [
  {
    id: 'medium',
    label: 'Medium daily digest',
    schedule: 'Every morning · Sonnet main session, local Qwen subagents',
    steps: [
      { actor: 'cron', title: 'Hermes cron starts the medium-digest skill', note: 'The model has no file tools in this job. It can only call the server and delegate reading.' },
      { actor: 'model', title: 'digest_begin', note: 'One call. The server collects Following, top picks and For you, drops what was already reported, has Jev rank every headline, and writes a run file. The model gets a compact work list of refs.', call: need(medium, 'example:digest_begin'), output: need(medium, 'generated:digest_begin') },
      { actor: 'subagent', title: 'read_post by ref', note: 'Subagents on a local 27B model read posts by ref. The server resolves F1 from the run file, so nobody copies a URL and nothing can be renumbered.', call: need(medium, 'example:read_post'), output: need(medium, 'generated:read_post') },
      { actor: 'subagent', title: 'Each subagent returns a verdict', note: "This is the model's only real job: judging a post.", output: subagentReply() },
      { actor: 'model', title: 'digest_finish', note: 'The model sends picks and gists by ref. The server validates every ref, fills in titles and links, saves state before it replies, and returns the exact message to send.', call: need(medium, 'example:digest_finish'), output: need(medium, 'generated:digest_finish') },
      { actor: 'server', title: 'Delivered to Discord', note: 'The reply is the text after the ===== line, word for word.', output: digestMessage(need(medium, 'generated:digest_finish')) },
    ] satisfies Step[],
  },
  {
    id: 'spotify',
    label: 'Spotify discovery lane',
    schedule: 'Tue & Fri mornings · six genre lanes, all on a local Qwen model, $0',
    steps: [
      { actor: 'cron', title: 'Hermes cron starts one lane', note: 'Six lanes run one after another. Each one adds 3–6 tracks to that day\'s private playlist.' },
      { actor: 'model', title: 'discovery_begin', note: 'Finds or creates today\'s playlist, pulls new releases from the lane\'s known labels and artists, and hands out K refs.', call: need(spotify, 'example:discovery_begin'), output: need(spotify, 'generated:discovery_begin') },
      { actor: 'subagent', title: 'Web research → verify_tracks', note: 'The research subagent searches the open web and passes its finds as plain lines. The server checks each one on Spotify with exact field searches, compares the ℗ label, and dedups by URI, ISRC and artist+title.', call: need(spotify, 'example:verify_tracks'), output: need(spotify, 'generated:verify_tracks') },
      { actor: 'model', title: 'discovery_review', note: 'Everything that can be picked, read from the server\'s own run file.', call: need(spotify, 'example:discovery_review'), output: need(spotify, 'generated:discovery_review') },
      { actor: 'model', title: 'discovery_finish', note: 'The model ranks by ref. The server enforces the lane limits by dropping picks from the end instead of refusing, adds the tracks, and saves history, the pool and what the lane learned.', call: need(spotify, 'example:discovery_finish'), output: need(spotify, 'generated:discovery_finish') },
      { actor: 'cron', title: 'A no-model job delivers the report', note: 'A model once posted its own persona prompt to Discord instead of the report. Now plain code, run every five minutes, posts each finished report exactly once.', output: need(spotify, 'generated:report') },
    ] satisfies Step[],
  },
];

writeFileSync(join(ROOT, 'src/data/replays.json'), JSON.stringify(replays, null, 2) + '\n');
console.log('replays -> src/data/replays.json');
