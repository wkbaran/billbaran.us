---
title: Outlier Caucus
tagline: Scores every stock trade Congress discloses for how unusual it is.
order: 3
live: https://dctrades.billbaran.us/
repo: https://github.com/wkbaran/outlier-caucus
license: AGPL-3.0
stack: [TypeScript, Node, MuPDF, Ollama vision OCR, SEC EDGAR, Docker, supercronic, S3 + CloudFront, CloudFormation, Playwright]
highlights:
  - "It reads STOCK Act filings straight from the source: it decrypts and parses House Clerk PTR PDFs and reads Senate eFD."
  - "Scanned paper filings are read by a local vision model, so there's no paid OCR."
  - "Six factors give each trade a 0–100 score: how rarely Congress trades the stock, size compared with the member's usual trades, committee oversight of the industry, small cap, options, and spouse or child accounts."
  - "A hand-built table maps each committee to the industries it oversees, to flag possible conflicts."
  - "It publishes a daily briefing, a page per member and per party, and a latest.json brief written for LLM agents."
  - "It uses only public-domain data."
demo: outlier-caucus
demoNote: "The members, trades and scores here are made up for the demo. The real site reports public filings."
---
Outlier Caucus gives every disclosed congressional stock trade a score for how unusual it is, writes out the reasons, and flags trades where a member's committee oversees the company's industry. A weekday cron job builds the whole site as static HTML.
