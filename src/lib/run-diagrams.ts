/**
 * The two "who acts at each step" diagrams, ported from the generator that made
 * the PNGs for the articles (hermes/images/make-diagrams.py). Same layout and
 * words, but drawn with CSS classes instead of fixed colours, so the inline SVG
 * follows the page's theme and palette (styles in RunDiagram.astro).
 */

type Lane = { name: string; sub: string; y: number; h: number; kind: 'model' | 'server' };
type Box = [col: number, lane: number, num: string, title: string, body: string];
type Arrow = [from: [number, number], to: [number, number], dashed?: boolean];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const code = (s: string) => `<code>${s}</code>`;

function render(id: string, lanes: Lane[], boxes: Box[], arrows: Arrow[], W: number, H: number, BW: number, GAP: number, label: string): string {
  const X0 = 40;
  // Unique per copy: a page can show a diagram twice (inline and in its zoom dialog).
  const marker = `${id}-arrow`;
  const out = [
    `<svg class="run-diagram" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">`,
    `<defs><marker id="${marker}" markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="16" refX="13" refY="8" orient="auto"><path class="rd-head" d="M0,1 L15,8 L0,15 z"/></marker></defs>`,
  ];
  for (const l of lanes) {
    out.push(`<rect class="rd-lane rd-${l.kind}" x="10" y="${l.y}" width="${W - 20}" height="${l.h}" rx="14"/>`);
    const ty = l.kind === 'model' ? l.y + 34 : l.y + l.h - 18;
    out.push(`<text class="rd-lane-label rd-${l.kind}" x="28" y="${ty}"><tspan class="rd-lane-name">${esc(l.name)}</tspan><tspan class="rd-lane-sub" dx="12">${esc(l.sub)}</tspan></text>`);
  }
  const pos = new Map<string, [number, number, number, number]>();
  for (const [col, li, num, title, body] of boxes) {
    const l = lanes[li];
    const x = X0 + col * (BW + GAP);
    const y = l.y + (l.kind === 'model' ? 58 : 16);
    const h = l.h - 74;
    pos.set(`${col},${li}`, [x, y, BW, h]);
    out.push(`<g class="rd-box rd-${l.kind}">`);
    out.push(`<rect class="rd-card" x="${x}" y="${y}" width="${BW}" height="${h}" rx="10"/>`);
    out.push(`<circle class="rd-dot" cx="${x + 22}" cy="${y + 22}" r="15"/><text class="rd-num" x="${x + 22}" y="${y + 28}" text-anchor="middle">${esc(num)}</text>`);
    out.push(
      `<foreignObject x="${x + 8}" y="${y + 6}" width="${BW - 16}" height="${h - 10}"><div xmlns="http://www.w3.org/1999/xhtml" class="rd-text">` +
        `<div class="rd-title">${esc(title).replace(/_/g, '_<wbr/>')}</div><div class="rd-body">${body}</div></div></foreignObject>`,
    );
    out.push('</g>');
  }
  for (const [a, b, dashed] of arrows) {
    const [x1, y1, w1, h1] = pos.get(a.join(','))!;
    const [x2, y2, , h2] = pos.get(b.join(','))!;
    let d: string;
    if (a[0] === b[0]) {
      const xm = x1 + w1 / 2;
      d = y2 > y1 ? `M${xm},${y1 + h1} L${xm},${y2 - 4}` : `M${xm},${y1} L${xm},${y2 + h2 + 4}`;
    } else if (Math.abs(y1 - y2) < 1) {
      d = `M${x1 + w1},${y1 + h1 / 2} L${x2 - 4},${y2 + h2 / 2}`;
    } else {
      const xm = (x1 + w1 + x2) / 2;
      d = `M${x1 + w1},${y1 + h1 / 2} L${xm},${y1 + h1 / 2} L${xm},${y2 + h2 / 2} L${x2 - 4},${y2 + h2 / 2}`;
    }
    out.push(`<path class="rd-arrow${dashed ? ' rd-dashed' : ''}" d="${d}" marker-end="url(#${marker})"/>`);
  }
  out.push('</svg>');
  return out.join('');
}

function digest(id: string): string {
  const BW = 200, GAP = 24, W = 40 + 6 * BW + 5 * GAP + 40, H = 560;
  const lanes: Lane[] = [
    { name: 'Model', sub: 'judgment only: which posts, which stars, what each one says', y: 20, h: 255, kind: 'model' },
    { name: 'Server (code)', sub: 'fetching, ranking, refs, layout, state', y: 290, h: 255, kind: 'server' },
  ];
  const boxes: Box[] = [
    [0, 1, '1', 'digest_begin', `Fetches everything new, drops what was already reported, ranks every headline with Jev, gives each post a ref: ${code('F1')} ${code('T2')} ${code('Y3')}`],
    [1, 0, '2', 'Shortlist', 'Picks the refs worth reading, starting from the top of the ranked list'],
    [2, 0, '3', 'Subagents read', 'On the local model, five refs each. They never see a URL'],
    [2, 1, '3b', 'read_post "F3"', 'Looks the ref up in the run file and fetches that exact post'],
    [3, 0, '4', 'Pick and summarize', 'Chooses the ⭐ posts and writes each gist, by ref'],
    [4, 1, '5', 'digest_finish', 'Checks every ref, saves state, then lays out the finished message'],
    [5, 0, '6', 'Reply', 'Sends the message unchanged. State is already saved'],
  ];
  const arrows: Arrow[] = [[[0, 1], [1, 0]], [[1, 0], [2, 0]], [[2, 0], [2, 1], true], [[2, 0], [3, 0]], [[3, 0], [4, 1]], [[4, 1], [5, 0]]];
  return render(id, lanes, boxes, arrows, W, H, BW, GAP, 'A digest run. The model shortlists, has subagents read, picks and replies. The server begins the run, resolves refs, finishes and saves state.');
}

function spotify(id: string): string {
  const BW = 188, GAP = 20, W = 40 + 7 * BW + 6 * GAP + 40, H = 560;
  const lanes: Lane[] = [
    { name: 'Models', sub: 'the main model picks; a research subagent searches the web', y: 20, h: 255, kind: 'model' },
    { name: 'Server (code)', sub: 'Spotify, verification, pick limits, playlist, state, delivery', y: 290, h: 255, kind: 'server' },
  ];
  const boxes: Box[] = [
    [0, 1, '1', 'discovery_begin', `Today's playlist (under a lock), new releases from known labels and artists, refs ${code('K1')} ${code('C1')}`],
    [1, 0, '2', 'Web research', "Subagent looks for labels and artists the feed doesn't cover"],
    [1, 1, '2b', 'verify_tracks', `Exact Spotify search, real label from the ℗ line, dedup, refs ${code('W1')}`],
    [2, 1, '3', 'discovery_review', "Everything pickable, from the server's own records"],
    [3, 0, '4', 'Pick', 'Chooses tracks by ref, best first'],
    [4, 1, '5', 'discovery_finish', 'Applies the pick limits, adds only new tracks, saves state, writes the report'],
    [5, 0, '6', '"Done: a-dnb"', 'The lane job delivers nothing itself'],
    [6, 1, '7', 'Report job', 'No model. Every 5 min, posts each finished report once'],
  ];
  const arrows: Arrow[] = [[[0, 1], [1, 0]], [[1, 0], [1, 1], true], [[1, 1], [2, 1]], [[2, 1], [3, 0]], [[3, 0], [4, 1]], [[4, 1], [5, 0]], [[5, 0], [6, 1], true]];
  return render(id, lanes, boxes, arrows, W, H, BW, GAP, 'A Spotify lane run. Models do the research and the picking. The server verifies tracks, enforces limits, writes the playlist and state, and a separate job with no model delivers the report.');
}

export const RUN_DIAGRAMS = { digest, spotify };
export type RunDiagramKind = keyof typeof RUN_DIAGRAMS;
