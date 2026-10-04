/**
 * Kotoba no Sekai demo: three days of digest pages plus the Days and All words
 * pages, written by the app's own output functions (writeHtmlOutput,
 * writeIndexOutput) from invented words.
 *
 * The example sentences are written for the demo. The real site quotes news
 * articles, which belong to their publishers, so none are reproduced here.
 * Audio uses the browser's speech fallback; no TTS files are shipped.
 */
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { copy, injectShim, outDir, repoPath, write, writeSource } from './common.ts';

const REPO = 'kotoba-no-sekai';
const src = (p: string) => repoPath(REPO, p);
const { writeHtmlOutput } = await import(src('src/output/html.ts'));
const { writeIndexOutput } = await import(src('src/output/index.ts'));

const DEMO_SOURCE = 'https://billbaran.us/projects/kotoba/#demo-source';

/** A sentence as segments: plain text, [kanji, reading], or {target: [text, reading?]}. */
type Seg = string | [string, string] | { target: [string, string?] };

function sentence(segs: Seg[], translation: string, keyword: string) {
  let plain = '', marked = '', glossed = '';
  for (const s of segs) {
    if (typeof s === 'string') {
      plain += s; marked += s; glossed += s;
    } else if (Array.isArray(s)) {
      plain += s[0]; marked += s[0]; glossed += `<ruby>${s[0]}<rt>${s[1]}</rt></ruby>`;
    } else {
      const [text, reading] = s.target;
      plain += text; marked += `<mark>${text}</mark>`;
      glossed += reading ? `<mark><ruby>${text}<rt>${reading}</rt></ruby></mark>` : `<mark>${text}</mark>`;
    }
  }
  return {
    markedHtml: marked,
    glossedHtml: glossed,
    plain,
    sourceUrl: DEMO_SOURCE,
    articleText: '',
    translation,
    translationMarkedHtml: translation.replace(keyword, `<mark>${keyword}</mark>`),
  };
}

interface Word {
  word: string; reading: string; pos: string; definition: string; alt: string[];
  level: 'N5' | 'N4' | 'N3'; domain: string; ex: ReturnType<typeof sentence>;
}

const DAYS: Record<string, Word[]> = {
  '2026-10-02': [
    { word: '天気', reading: 'てんき', pos: 'Noun', definition: 'weather', alt: ['the elements', 'fair weather'], level: 'N5', domain: 'news',
      ex: sentence([['明日', 'あした'], 'の', { target: ['天気', 'てんき'] }, 'は', ['晴', 'は'], 'れになる', ['見込', 'みこ'], 'みです。'], "Tomorrow's weather is expected to be sunny.", 'weather') },
    { word: '増える', reading: 'ふえる', pos: 'Ichidan verb, intransitive verb', definition: 'to increase', alt: ['to multiply'], level: 'N4', domain: 'news',
      ex: sentence([['秋', 'あき'], 'になると、', ['山', 'やま'], 'を', ['訪', 'おとず'], 'れる', ['人', 'ひと'], 'が', { target: ['増える', 'ふえる'] }, '。'], 'When autumn comes, the number of people visiting the mountains increases.', 'increases') },
    { word: '準備', reading: 'じゅんび', pos: 'Noun, Suru verb', definition: 'preparation', alt: ['arrangements', 'provision'], level: 'N4', domain: 'news',
      ex: sentence([['町', 'まち'], 'では', ['祭', 'まつ'], 'りの', { target: ['準備', 'じゅんび'] }, 'が', ['始', 'はじ'], 'まりました。'], 'Preparations for the festival have begun in the town.', 'Preparations') },
  ],
  '2026-10-03': [
    { word: '届く', reading: 'とどく', pos: "Godan verb with 'ku' ending, intransitive verb", definition: 'to reach', alt: ['to arrive', 'to be delivered'], level: 'N3', domain: 'news',
      ex: sentence([['新', 'あたら'], 'しい', ['本', 'ほん'], 'が', ['図書館', 'としょかん'], 'に', { target: ['届いた', 'とどいた'] }, '。'], 'The new books arrived at the library.', 'arrived') },
    { word: '静か', reading: 'しずか', pos: 'Na-adjective (keiyodoshi)', definition: 'quiet', alt: ['silent', 'calm'], level: 'N5', domain: 'easy',
      ex: sentence([['朝', 'あさ'], 'の', ['公園', 'こうえん'], 'はとても', { target: ['静か', 'しずか'] }, 'です。'], 'The park in the morning is very quiet.', 'quiet') },
    { word: '決める', reading: 'きめる', pos: 'Ichidan verb, transitive verb', definition: 'to decide', alt: ['to choose', 'to settle on'], level: 'N4', domain: 'news',
      ex: sentence([['市', 'し'], 'は', ['新', 'あたら'], 'しい', ['駅', 'えき'], 'の', ['名前', 'なまえ'], 'を', { target: ['決めた', 'きめた'] }, '。'], 'The city decided the name of the new station.', 'decided') },
  ],
  '2026-10-04': [
    { word: '涼しい', reading: 'すずしい', pos: 'I-adjective (keiyoushi)', definition: 'cool', alt: ['refreshing'], level: 'N4', domain: 'easy',
      ex: sentence([['今週', 'こんしゅう'], 'は', ['朝晩', 'あさばん'], 'が', { target: ['涼しく', 'すずしく'] }, 'なりました。'], 'Mornings and evenings have become cool this week.', 'cool') },
    { word: '選ぶ', reading: 'えらぶ', pos: "Godan verb with 'bu' ending, transitive verb", definition: 'to choose', alt: ['to select'], level: 'N4', domain: 'news',
      ex: sentence([['学生', 'がくせい'], 'たちは', ['好', 'す'], 'きな', ['作品', 'さくひん'], 'を', { target: ['選びました', 'えらびました'] }, '。'], 'The students chose their favorite works.', 'chose') },
    { word: '地域', reading: 'ちいき', pos: 'Noun', definition: 'region', alt: ['area', 'zone'], level: 'N3', domain: 'news',
      ex: sentence(['この', { target: ['地域', 'ちいき'] }, 'では', ['米作', 'こめづく'], 'りが', ['盛', 'さか'], 'んです。'], 'Rice farming is thriving in this region.', 'region') },
  ],
};

const toRecord = (w: Word, date: string) => ({
  word: w.word, reading: w.reading, pos: w.pos, definition: w.definition, altDefinitions: w.alt,
  examples: [w.ex], sourceUrl: DEMO_SOURCE, domain: w.domain, jlptLevel: w.level, date,
});

// The app writes relative to the working directory, so run it inside a scratch dir.
const work = mkdtempSync(join(tmpdir(), 'kotoba-demo-'));
const cwd = process.cwd();
process.chdir(work);
mkdirSync('web', { recursive: true });
mkdirSync('data', { recursive: true });
let review: ReturnType<typeof toRecord> | null = null;
for (const [date, words] of Object.entries(DAYS)) {
  const records = words.map(w => toRecord(w, date));
  writeFileSync(join('data', `words-${date}.json`), JSON.stringify({ fullRecords: records, reviewWord: review }));
  writeHtmlOutput(records, date, 'web', review);
  writeIndexOutput(records, date, 'web', 'auto', 'data');
  review = records[2];
}
process.chdir(cwd);

const dir = outDir('kotoba');
const sourceLink = new RegExp(`<a href="${DEMO_SOURCE.replace(/[.?#/]/g, '\\$&')}"[^>]*>[^<]*</a>`, 'g');
for (const f of readdirSync(join(work, 'web'))) {
  const from = join(work, 'web', f);
  if (!f.endsWith('.html')) { copy(from, dir, f); continue; }
  const html = readFileSync(from, 'utf8')
    .replace(sourceLink, '<span>Demo sentence, written for this page. The real site links the news article it came from.</span>');
  write(dir, f, injectShim(html, { name: 'kotoba', project: 'kotoba', allowHosts: ['fonts.googleapis.com', 'fonts.gstatic.com'] }));
}
writeSource(dir, REPO);
console.log(`kotoba demo -> ${dir}`);
