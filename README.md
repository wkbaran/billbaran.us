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
- shifts timestamps so a snapshot always looks fresh;
- shows the "invented data" marker.

Each demo folder has a `SOURCE.json` recording the app commit it was built from.

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
  --parameter-overrides BucketName=<unique-bucket> HostedZoneId=<zone-id> CreateOidcProvider=<true|false>
```

Then set the stack outputs as repo **variables** (not secrets; none of them grant access by themselves): `AWS_DEPLOY_ROLE_ARN`, `SITE_BUCKET` and `SITE_DISTRIBUTION_ID`. Every push to `main` deploys via `.github/workflows/deploy.yml`.

Mail for the domain is forwarded by [ImprovMX](https://improvmx.com). Its MX and SPF records are set in Route 53 by hand, outside this stack.

## License

The code is MIT. The writing and images are © Bill Baran.
