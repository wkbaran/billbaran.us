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
- **Deploying:** every push to `main` deploys through GitHub Actions. `npm run deploy` does the same from a workstation, reading the bucket and distribution from the `billbaran-us` stack outputs.
  - The workflow's targets are repo **secrets**, not variables, so the public Actions logs mask them. Keep the `--only-show-errors` on the syncs for the same reason.
  - Don't add a job `environment:`. It changes the OIDC subject, and the deploy role trusts only `<prefix>:ref:refs/heads/main`. This repo uses GitHub's immutable subject form, set through the stack's `GitHubSubjectPrefix` parameter.
- **DNS at the apex is shared with mail.** The MX records point to ImprovMX, and the apex TXT set holds both the SPF line and a Google site-verification value. Route 53 keeps one TXT set per name, so an edit must keep every value.
- Commit as `Bill Baran <2525633+wkbaran@users.noreply.github.com>`, with no AI attribution trailers.
- The run diagrams are inline SVG from `src/lib/run-diagrams.ts`, ported from `hermes/images/make-diagrams.py`. They're coloured with CSS tokens so they follow the theme and palette. Change the words there, not in an image.
- Each demo generator passes `theme: { key, toggle }`: the app's own localStorage key for its mode and a selector for its own toggle button. The shim uses the toggle so the app updates its labels and charts itself. If an app renames either one, update the generator.
- The Equity Watch agent console (`src/components/WebMcpConsole.astro`) only calls tools through `window.__demoAgent` in the demo iframe, which the shim sets up when `webmcp: true`. Never call the app's internals directly: going through the registered tool is the point, because that's what a real agent does.
- Experience entries with `draft: true` are placeholders waiting on a career interview. In dev they show a dashed outline.
