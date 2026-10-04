/**
 * Outlier Caucus demo: a daily report, member pages and party pages built by
 * the app's own builders (buildHtmlReport, buildMemberPage, buildPartyPage).
 * Every trade goes through the real scorer (scoreTrade) with the real
 * committee-to-industry taxonomy.
 *
 * The members are fictional, so the demo can't be read as a claim about a
 * real person. The tickers are real but the trades and market data are made up.
 */
import { injectShim, outDir, repoPath, write, writeSource } from './common.ts';

const REPO = 'outlier-caucus';
const src = (p: string) => repoPath(REPO, p);
const { scoreTrade, DEFAULT_SCORING_CONFIG } = await import(src('src/scoring/index.ts'));
const { createSectorMap } = await import(src('src/data/sector-map.ts'));
const { buildHtmlReport, buildMemberPage, buildPartyPage, buildScoreLookup } = await import(src('src/output/html.ts'));

// ---- deterministic randomness -------------------------------------------------
let seed = 20261004;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const pick = <T,>(xs: T[]): T => xs[Math.floor(rand() * xs.length)];

// ---- the cast -------------------------------------------------------------------
interface Member { first: string; last: string; chamber: 'house' | 'senate'; party: string; committees: string[]; avg: number }
const MEMBERS: Member[] = [
  { first: 'Avery', last: 'Lindqvist', chamber: 'house', party: 'Democrat', committees: ['HSIF', 'HSSY'], avg: 8_000 },
  { first: 'Marcus', last: 'Okafor', chamber: 'senate', party: 'Republican', committees: ['SSAS', 'SSEG'], avg: 32_000 },
  { first: 'Priya', last: 'Halvorsen', chamber: 'house', party: 'Republican', committees: ['HSBA'], avg: 15_000 },
  { first: 'Dolores', last: 'Vance-Whitaker', chamber: 'senate', party: 'Democrat', committees: ['SSHR', 'SSFI'], avg: 50_000 },
  { first: 'Theo', last: 'Brannigan', chamber: 'house', party: 'Independent', committees: ['HSAG', 'HSPW'], avg: 8_000 },
  { first: 'Rosalind', last: 'Achebe-Ford', chamber: 'house', party: 'Democrat', committees: ['HSAS'], avg: 8_000 },
];

interface Stock { symbol: string; name: string; cap: number; sector: string; industry: string; congressTrades: number; exchange: string }
const STOCKS: Stock[] = [
  { symbol: 'MSFT', name: 'Microsoft Corp', cap: 3.1e12, sector: 'Technology', industry: 'Software - Infrastructure', congressTrades: 420, exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corp', cap: 4.0e12, sector: 'Technology', industry: 'Semiconductors', congressTrades: 380, exchange: 'NASDAQ' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co', cap: 6.5e11, sector: 'Financial Services', industry: 'Banks - Diversified', congressTrades: 260, exchange: 'NYSE' },
  { symbol: 'LMT', name: 'Lockheed Martin Corp', cap: 1.1e11, sector: 'Industrials', industry: 'Aerospace & Defense', congressTrades: 95, exchange: 'NYSE' },
  { symbol: 'XOM', name: 'Exxon Mobil Corp', cap: 4.8e11, sector: 'Energy', industry: 'Oil & Gas Integrated', congressTrades: 150, exchange: 'NYSE' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc', cap: 3.2e11, sector: 'Healthcare', industry: 'Healthcare Plans', congressTrades: 140, exchange: 'NYSE' },
  { symbol: 'DE', name: 'Deere & Co', cap: 1.3e11, sector: 'Industrials', industry: 'Agricultural - Machinery', congressTrades: 40, exchange: 'NYSE' },
  { symbol: 'ADM', name: 'Archer-Daniels-Midland Co', cap: 2.6e10, sector: 'Consumer Defensive', industry: 'Agricultural Farm Products', congressTrades: 12, exchange: 'NYSE' },
  { symbol: 'KTOS', name: 'Kratos Defense & Security', cap: 1.8e9, sector: 'Industrials', industry: 'Aerospace & Defense', congressTrades: 3, exchange: 'NASDAQ' },
  { symbol: 'CRSP', name: 'CRISPR Therapeutics AG', cap: 1.6e9, sector: 'Healthcare', industry: 'Biotechnology', congressTrades: 2, exchange: 'NASDAQ' },
  { symbol: 'AMSC', name: 'American Superconductor', cap: 9.0e8, sector: 'Industrials', industry: 'Electrical Equipment & Parts', congressTrades: 1, exchange: 'NASDAQ' },
  { symbol: 'NWBI', name: 'Northwest Bancshares', cap: 1.5e9, sector: 'Financial Services', industry: 'Banks - Regional', congressTrades: 4, exchange: 'NASDAQ' },
  { symbol: 'CVX', name: 'Chevron Corp', cap: 2.8e11, sector: 'Energy', industry: 'Oil & Gas Integrated', congressTrades: 120, exchange: 'NYSE' },
  { symbol: 'AAPL', name: 'Apple Inc', cap: 3.4e12, sector: 'Technology', industry: 'Consumer Electronics', congressTrades: 510, exchange: 'NASDAQ' },
];

const AMOUNTS = ['$1,001 - $15,000', '$1,001 - $15,000', '$15,001 - $50,000', '$15,001 - $50,000', '$50,001 - $100,000', '$100,001 - $250,000', '$250,001 - $500,000'];
const OWNERS = ['Self', 'Self', 'Self', 'Joint', 'Spouse', 'Spouse', 'Child'];

const RUN = new Date('2026-10-04T12:00:00Z');
const day = (n: number) => new Date(RUN.getTime() - n * 86_400_000).toISOString().slice(0, 10);
const dateLabel = 'October 4, 2026';
const dateStr = day(0);

// Each member leans toward stocks their committees oversee, so the overlap flag shows up.
const sectorMap = createSectorMap();
const overlaps = (m: Member, s: Stock) => m.committees.some((c) => sectorMap.hasOverlap(c, s.sector, s.industry));

const trades: Array<{ trade: Record<string, string>; member: Member; stock: Stock }> = [];
for (let i = 0; i < 46; i++) {
  const member = MEMBERS[i % MEMBERS.length];
  const leaning = STOCKS.filter((s) => overlaps(member, s));
  const stock = leaning.length && rand() < 0.45 ? pick(leaning) : pick(STOCKS);
  const option = rand() < 0.1;
  const sale = rand() < 0.35;
  const traded = 2 + Math.floor(rand() * 40);
  trades.push({
    member, stock,
    trade: {
      firstName: member.first, lastName: member.last,
      office: `${member.first} ${member.last}`,
      transactionDate: day(traded),
      dateRecieved: day(Math.max(0, traded - 10 - Math.floor(rand() * 20))),
      owner: pick(OWNERS),
      assetDescription: option ? `${stock.name} - Call Option` : stock.name,
      assetType: option ? 'Stock Option' : 'Stock',
      type: sale ? pick(['Sale (Full)', 'Sale (Partial)']) : 'Purchase',
      amount: pick(AMOUNTS),
      symbol: stock.symbol,
      firstSeen: new Date(RUN.getTime() - Math.floor(rand() * 5) * 86_400_000).toISOString(),
    },
  });
}

const parseAmount = (a: string) => { const [lo, hi] = a.replace(/[$,]/g, '').split(' - ').map(Number); return { low: lo, high: hi }; };
const scoredTrades = trades.map(({ trade, member, stock }) => {
  const trader = { id: `${member.first}-${member.last}`.toLowerCase(), firstName: member.first, lastName: member.last, chamber: member.chamber, committees: member.committees, party: member.party };
  const input = { symbol: trade.symbol, assetDescription: trade.assetDescription, assetType: trade.assetType, type: trade.type, amount: parseAmount(trade.amount), transactionDate: trade.transactionDate, owner: trade.owner };
  const score = scoreTrade(
    input, trader,
    { visibleTrades: [], averageTradeSize: member.avg, totalTradeCount: 30 },
    { marketCap: stock.cap, sector: stock.sector, industry: stock.industry, averageVolume: null, exchange: stock.exchange },
    { symbol: stock.symbol, totalTrades: stock.congressTrades, uniqueTraders: Math.max(1, Math.round(stock.congressTrades / 6)), recentTrades: Math.round(stock.congressTrades / 10) },
    sectorMap,
  );
  return { trade, chamber: member.chamber, trader, score };
});

const report = {
  generatedAt: RUN.toISOString(),
  config: DEFAULT_SCORING_CONFIG,
  totalTradesAnalyzed: scoredTrades.length,
  scoredTrades,
  summary: { topByScore: [], byRarity: [], byCommitteeRelevance: [], symbolStats: { totalSymbols: STOCKS.length, uniqueSymbols: STOCKS.length, rareSymbols: 4 } },
};
const scoreLookup = buildScoreLookup(report);
const exchangeMap = new Map(STOCKS.map((s) => [s.symbol, s.exchange]));
const byDate = (a: { trade: Record<string, string> }, b: { trade: Record<string, string> }) => (b.trade.transactionDate ?? '').localeCompare(a.trade.transactionDate ?? '');
const withParty = trades.map(({ trade, member }) => ({ trade, party: member.party })).sort(byDate);
const isSale = (t: Record<string, string>) => t.type.toLowerCase().includes('sale');

const slug = (m: Member) => `${m.first}-${m.last}`.toLowerCase();
const memberOf = (t: Record<string, string>) => MEMBERS.find((m) => m.first === t.firstName && m.last === t.lastName)!;
const memberLink = (t: Record<string, string>) => `member-${slug(memberOf(t))}.html`;
const PARTY_FILES: Record<string, string> = { Republican: 'party-republican.html', Democrat: 'party-democrat.html', Independent: 'party-independent.html' };

const pages: Record<string, string> = {};
for (const m of MEMBERS) {
  pages[`member-${slug(m)}.html`] = buildMemberPage({
    memberName: `${m.first} ${m.last}`, memberSlug: slug(m), chamber: m.chamber === 'senate' ? 'Sen.' : 'Rep.', party: m.party,
    trades: withParty.filter(({ trade }) => memberOf(trade) === m),
    dateLabel, reportUrl: 'index.html', exchangeMap, scoreLookup, dateStr,
  });
}
for (const [label, file] of Object.entries(PARTY_FILES)) {
  pages[file] = buildPartyPage({
    partyLabel: label, trades: withParty.filter(({ party }) => party === label),
    dateLabel, reportUrl: 'index.html', exchangeMap, memberLink, scoreLookup, dateStr,
  });
}
// Disclosures "found" in the last day count as new since the previous run.
const since = RUN.getTime() - 86_400_000;
pages['index.html'] = buildHtmlReport({
  report,
  purchaseTrades: withParty.filter(({ trade }) => !isSale(trade)),
  salesTrades: withParty.filter(({ trade }) => isSale(trade)),
  dateLabel, dateStr, exchangeMap, memberLink,
  partyPageUrls: { republican: PARTY_FILES.Republican, democrat: PARTY_FILES.Democrat, independent: PARTY_FILES.Independent },
  isNewlyDisclosed: (t: Record<string, string>) => Date.parse(t.firstSeen) >= since,
  previousRunLabel: 'October 3, 2026',
  runs: [5, 4, 3, 2, 1, 0].map((n, i) => ({ label: day(n), href: n === 0 ? 'index.html' : '#', date: day(n), newTrades: [6, 11, 3, 9, 4, 7][i] })).reverse(),
});

const dir = outDir(REPO);
for (const [file, html] of Object.entries(pages)) {
  write(dir, file, injectShim(html, { name: REPO, project: 'outlier-caucus', stub: { 'manifest.json': [] }, theme: { key: 'congress-theme', toggle: '#theme-btn' }, allowHosts: ['fonts.googleapis.com', 'fonts.gstatic.com'] }));
}
writeSource(dir, REPO);
console.log(`outlier-caucus demo -> ${dir} (${scoredTrades.length} trades)`);
