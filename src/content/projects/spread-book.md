---
title: Spread Book
tagline: Daily exit decisions and greek risk heatmaps for a book of credit spreads.
order: 4
live: https://spreads.billbaran.us/
repo: https://github.com/wkbaran/spread-book
license: FSL-1.1-MIT
stack: [JavaScript, Node, SheetJS, SVG, Docker, supercronic, S3 + CloudFront, CloudFormation]
highlights:
  - "Flags spreads that hit an exit rule: 50% of max profit, 25% of max loss, 21 days or less to expiration, or more than 60% of the way to either exit."
  - "Heatmaps of theta, delta, gamma and vega by underlying and expiration. Keys 1–4 switch between them."
  - "A \"what each spread pays for its risk\" scatter plots theta/gamma against theta/vega, with median lines."
  - "The exit rules live in one module that runs in Node and is inlined into the page, so the report and the agent brief always agree."
  - "Each report is a single self-contained HTML file with one dependency and no build step."
demo: spread-book
demoNote: "These positions and greeks are made up. The real report uses my own positions from a licensed options platform."
---
Spread Book is a risk dashboard for a portfolio of options credit spreads. Twice each trading day it pulls the open positions, works out which spreads need action, and publishes one self-contained page. That page has decision lists, greek heatmaps, a sortable scorecard, and a "try a trade" what-if panel.
