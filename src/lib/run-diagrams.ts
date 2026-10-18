/**
 * The two "who acts at each step" diagrams, first ported from the generator that
 * made the PNGs for the articles (hermes/images/make-diagrams.py) and since
 * redrawn for the job containers. Same layout, but drawn with CSS classes instead of fixed colours, so the inline SVG
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
  const BW = 188, GAP = 20, W = 40 + 7 * BW + 6 * GAP + 40, H = 560;
  const lanes: Lane[] = [
    { name: 'Model', sub: 'answers narrow questions against a JSON schema; never calls a tool', y: 20, h: 255, kind: 'model' },
    { name: 'Code', sub: 'the job and the MCP server: fetching, ranking, refs, layout, state, delivery', y: 290, h: 255, kind: 'server' },
  ];
  const boxes: Box[] = [
    [0, 1, '1', 'digest_begin', `Fetches everything new, drops what was already reported, ranks every headline with Jev, gives each post a ref: ${code('F1')} ${code('T2')} ${code('Y3')}`],
    [1, 0, '2', 'Shortlist', 'From the ranked headlines, which refs are worth reading. Fewer when a section is weak'],
    [2, 1, '3', 'read_post "F3"', 'The job fetches each shortlisted post; the server looks the ref up in the run file'],
    [3, 0, '4', 'Verdict per post', 'Type, gist, depth 1–5 and why, from the full text. Never sees a URL'],
    [4, 0, '5', 'Stars', 'Which posts are worth reading in full. None is a valid answer'],
    [5, 1, '6', 'digest_finish', 'Checks every ref, refuses a section left empty by mistake, saves state, lays out the message'],
    [6, 1, '7', 'Discord webhook', 'The job posts the message. No model handles it'],
  ];
  const arrows: Arrow[] = [[[0, 1], [1, 0]], [[1, 0], [2, 1]], [[2, 1], [3, 0]], [[3, 0], [4, 0]], [[4, 0], [5, 1]], [[5, 1], [6, 1]]];
  return render(id, lanes, boxes, arrows, W, H, BW, GAP, 'A digest run. The model shortlists, judges each post and picks the stars. Code begins the run, fetches posts by ref, finishes, saves state and posts to Discord.');
}

function spotify(id: string): string {
  const BW = 200, GAP = 24, W = 40 + 6 * BW + 5 * GAP + 40, H = 560;
  const lanes: Lane[] = [
    { name: 'Model', sub: 'searches the web in a bounded loop, then chooses', y: 20, h: 255, kind: 'model' },
    { name: 'Code', sub: 'Spotify, verification, budgets, pick limits, playlist, state, delivery', y: 290, h: 255, kind: 'server' },
  ];
  const boxes: Box[] = [
    [0, 1, '1', 'discovery_begin', `Today's playlist (under a lock), new releases from known labels and artists within a request budget, refs ${code('K1')} ${code('C1')}`],
    [1, 0, '2', 'Web research', "Looks for labels and artists the feed doesn't cover. A tool disappears when its budget is spent"],
    [1, 1, '2b', 'verify_tracks', `Exact Spotify search, real label from the ℗ line, dedup, refs ${code('W1')}`],
    [2, 1, '3', 'discovery_review', "Everything pickable, from the server's own records"],
    [3, 0, '4', 'Choice', 'Tracks by ref, best first, and up to 3 rejects. The only call that thinks'],
    [4, 1, '5', 'discovery_finish', 'Applies the pick limits, adds only new tracks, saves state, writes the report'],
    [5, 1, '6', 'Discord webhook', 'The job posts the report as Spotify · lane, then starts the next lane'],
  ];
  const arrows: Arrow[] = [[[0, 1], [1, 0]], [[1, 0], [1, 1], true], [[1, 1], [2, 1]], [[2, 1], [3, 0]], [[3, 0], [4, 1]], [[4, 1], [5, 1]]];
  return render(id, lanes, boxes, arrows, W, H, BW, GAP, 'A Spotify lane run. The model researches in a bounded tool loop and makes the choice. Code verifies tracks, enforces budgets and limits, writes the playlist and state, and posts the report.');
}

export const RUN_DIAGRAMS = { digest, spotify };
export type RunDiagramKind = keyof typeof RUN_DIAGRAMS;
