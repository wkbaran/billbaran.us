---
title: Equity Watch
tagline: Price alerts that don't stop at "it fired."
order: 2
live: https://watch.billbaran.us/
repo: https://github.com/wkbaran/equity-watch
license: AGPL-3.0
stack: [TypeScript, Node, WebMCP, MCP, Vanilla JS dashboard, Lambda, SQS FIFO, S3 + CloudFront, Route 53, CloudFormation, Docker, Vitest, Playwright]
highlights:
  - "AI agents can drive it. The dashboard registers its own controls as WebMCP tools, a proposed browser standard that's only behind a flag in Chrome so far. The same tools are also served by an MCP server for desktop agents. Every change waits for your approval."
  - "Alerts on price levels, trailing stops, volume and moving averages, with ATR, moving averages and volume baselines all calculated in-house."
  - "Every alert that fires goes into a ranked revisit queue that suggests a new level and explains the signals behind it."
  - "\"State is local; the cloud is a mailbox.\" The static dashboard sends edits through Lambda to SQS FIFO, and the home server pulls them in. There is no always-on server to secure."
  - "Holdings are encrypted with WebCrypto and decrypted only in the browser."
  - "A run with nothing to check makes zero API calls."
demo: equity-watch
cardNote: AI agents can drive it through WebMCP, the new browser standard for agent tools.
webmcp: true
demoNote: "Every symbol, price, alert and position here is made up. The real app runs on licensed brokerage market data."
---
Equity Watch is a self-hosted alert engine for US stocks. It replaced a paid service that capped how many alerts you could have. Each alert that fires lands in a revisit queue where you can apply a suggested new level, dismiss it, or ask for a new suggestion, from any device.
