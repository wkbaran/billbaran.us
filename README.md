# billbaran.us

The source for [billbaran.us](https://billbaran.us): my portfolio and interactive resume. It's a static [Astro](https://astro.build) site on S3 + CloudFront.

The project pages include **live demos** of apps I run every day:
- [Kotoba no Sekai](https://github.com/wkbaran/kotoba-no-sekai)
- [Equity Watch](https://github.com/wkbaran/equity-watch)
- [Outlier Caucus](https://github.com/wkbaran/outlier-caucus)
- [Spread Book](https://github.com/wkbaran/spread-book)

Each demo is the app's real page, built by the app's own code from **invented data**. The real apps use services licensed for personal use (brokerage and options data, news text), so the demos never contact them.

## Develop

```sh
fnm use 26
npm ci
npm run dev        # http://localhost:4321
npm run build      # sanitization check + astro build + check of dist/
```

## Demos

Demo snapshots are committed under `public/demos/<name>/`, so CI never needs the app repos. To regenerate them, check out the app repos next to this one (or set `DEMO_SRC_ROOT`) with `npm install` done in each, then run:

```sh
npm run demos                 # all of them
npm run demos -- kotoba       # just one
```

| Script | What it runs | Data |
|---|---|---|
| `scripts/demos/equity-watch.ts` | `buildDashboard`, `siteDocument`, `sealVault` + the real `web/` page | the app's Playwright fixtures |
| `scripts/demos/kotoba.ts` | `writeHtmlOutput`, `writeIndexOutput` | nine words, with example sentences written for the demo |
| `scripts/demos/outlier-caucus.ts` | the real scorer + `buildHtmlReport`, member and party pages | fictional members, random trades |
| `scripts/demos/spread-book.ts` | `portfolio.js` with network access refused | a generated book of credit spreads |
| `scripts/demos/llm-replays.ts` | reads the MCP servers' docs | the docs' worked examples, which the servers' own tests check |

`scripts/demos/demo-shim.js` is inlined at the top of every demo page. It:
- blocks requests to other origins (only Google Fonts is allowed);
- fakes the write endpoint;
- for Equity Watch, stands in for the browser's WebMCP host where there isn't one, so the project page's agent console can list and call the tools the dashboard registers (through their own `execute`, consent dialog included);
- keeps the app's light/dark mode matching the portfolio page while the demo is shown in its frame;
- opens links to other sites in a new tab (most sites, GitHub included, refuse to load inside a frame);
- shifts timestamps so a snapshot always looks fresh;
- shows the "invented data" marker.

Each demo folder has a `SOURCE.json` recording the app commit it was built from.

The project-card thumbnails are screenshots of the demos in each app's dark and light theme. The card shows whichever matches the page. To recapture them, serve a build (`npm run build && npm run preview`), then run `npm run shots` (set `SHOTS_BASE` if it isn't on `localhost:4321`).

## Nothing personal

`scripts/check-sanitized.ts` runs before and after every build and in CI. It fails on:
- LAN addresses and hostnames
- home-lab paths
- local time zones
- keys
- any pattern in a gitignored `.sanitize-patterns` file (one regex per line, for things too personal to put in the repo itself)

## Hosting

`infra/site.yaml` is one CloudFormation stack, deployed in us-east-1. It contains:
- a private S3 bucket behind CloudFront (Origin Access Control)
- an ACM certificate for the apex and `www`
- a CloudFront Function for the `www` → apex redirect and directory indexes
- security headers (CSP)
- Route 53 alias records
- a GitHub OIDC deploy role limited to this repo's `main` branch

```sh
aws cloudformation deploy --region us-east-1 --stack-name billbaran-us \
  --template-file infra/site.yaml --capabilities CAPABILITY_IAM \
  --parameter-overrides BucketName=<unique-bucket> HostedZoneId=<zone-id> CreateOidcProvider=<true|false> \
    GitHubSubjectPrefix="$(gh api repos/<owner>/<repo>/actions/oidc/customization/sub --jq .sub_claim_prefix)"
```

Newer GitHub repos sign Actions in with an *immutable* subject that pins the owner and repo IDs (`repo:owner@123/name@456`). The deploy role trusts exactly that prefix on `main`. Leave `GitHubSubjectPrefix` blank for a repo that still uses the classic `repo:owner/name` form.

To publish from a workstation, run `npm run deploy`. It builds the site, then syncs it and invalidates CloudFront using the stack's outputs (set `STACK` if the stack isn't called `billbaran-us`).

Then set the stack outputs as repo **secrets**: `AWS_DEPLOY_ROLE_ARN`, `SITE_BUCKET` and `SITE_DISTRIBUTION_ID`. None of them grants access on its own. They're secrets so GitHub masks them in the public Actions logs, which keeps the account ID and bucket name out of view. Every push to `main` deploys via `.github/workflows/deploy.yml`.

Mail for the domain is forwarded by [ImprovMX](https://improvmx.com). Its MX and SPF records are set in Route 53 by hand, outside this stack.

## License

The code is MIT. The writing and images are © Bill Baran.
