# Notes for agents working in this repo

- **Never call live data APIs from a demo.** The apps' real sources (Schwab, OptionStrat, Yahoo, FMP, news publishers) are licensed for personal use. Demos are built only from invented fixtures, with `scripts/demos/no-network.cjs` or the demo shim in place.
- **Never copy real data out of the sibling repos.** In particular:
  - `spread-book/data/*.csv` are real positions;
  - equity-watch's state files and `tests/fixtures/webull_*` may be real;
  - the medium-reader-mcp and substack-reader-mcp folders `classifier-data/` and `experiments/` hold the owner's taste profile and reading history;
  - `hermes/CLAUDE.md` has server details.
  Use each repo's documented fixtures and worked examples.
- **Demos are committed snapshots.** Edit the generator in `scripts/demos/`, re-run `npm run demos -- <name>`, then look at the result in a browser. Don't hand-edit `public/demos/`.
- **Run `npm run build`, not just `astro build`.** It runs `scripts/check-sanitized.ts` before and after the build. Put new personal patterns in `.sanitize-patterns` (gitignored), never in a committed file. That includes this one and the checker's own source.
- The checker reads `x.local`/`x.home`-style names as LAN hostnames. That's why the patterns file is `.sanitize-patterns` and not `.sanitize.local`.
- spread-book's `book.js` hard-codes the owner's local time zone. The demo generator swaps any non-market `America/*` zone for `America/New_York`; keep that.
- Outlier Caucus demos use **fictional members** on purpose. Don't swap in real ones: the demo's scores could read as a claim about a real person.
- Commit as `Bill Baran <2525633+wkbaran@users.noreply.github.com>`, with no AI attribution trailers.
- Experience entries with `draft: true` are placeholders waiting on a career interview. In dev they show a dashed outline.
