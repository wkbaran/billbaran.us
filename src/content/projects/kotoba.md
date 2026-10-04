---
title: Kotoba no Sekai
subtitle: 言葉の世界
tagline: Learn a few real Japanese words a day from today's news.
order: 1
live: https://kotoba.billbaran.us/
repo: https://github.com/wkbaran/kotoba-no-sekai
license: AGPL-3.0
stack: [TypeScript, Node, kuromoji, SQLite, Ollama, Docker, supercronic, S3 + CloudFront, CloudFormation]
highlights:
  - "A daily job reads NHK, NHK Web Easy, Asahi and graded-reader feeds and splits the text into words with kuromoji. It keeps only words that are new to you and at your JLPT level."
  - "Each word comes with its reading, meaning, the real sentence it came from with furigana and a translation, a table of verb and adjective forms, and audio at three speeds."
  - "It keeps working when optional services are missing. Translation falls back from local Ollama to Google to none. Audio falls back from ElevenLabs to OpenAI to the browser's own speech."
  - "One global throttle covers every Jisho dictionary lookup, and the job stops cleanly if Jisho is down."
  - "The site is static HTML published to S3 + CloudFront. Each run uploads only files whose MD5 changed."
demo: kotoba
demoPage: digest-2026-10-04.html
demoNote: "The words and example sentences here are made up. The real site uses sentences from today's news, which belong to their publishers."
---
Kotoba no Sekai turns each day's Japanese news into a short, personal vocabulary lesson. A scheduled container finds words you haven't seen yet and publishes a study page. On that page you reveal the reading and then the meaning, with the original sentence for context. It also writes an Anki export and a Markdown digest each day.
