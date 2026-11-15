import { esc, money, date, timeLeft, amount, listOf } from './format.js';

const slug = (b) => b.slug ?? b.competition?.slug ?? '';
const title = (b) => b.title ?? b.name ?? slug(b) ?? 'Untitled competition';
const deadline = (b) => b.deadline ?? b.endsAt ?? b.endAt;
const feeLabel = (b) => b.entryFeeUsd ?? b.entryFee ?? b.entry_fee_usd;
const entries = (b) => b.submissionCount ?? b.entryCount ?? b.entriesCount ?? b.submissions ?? 0;
const open = (b) => deadline(b) && new Date(deadline(b)).getTime() > Date.now();

function top(label, eyebrow, intro, action = '') {
  return `<section class="page-head"><div><p class="eyebrow">${eyebrow}</p><h1>${label}</h1><p class="intro">${intro}</p></div>${action}</section>`;
}

export function board(data, page = 0) {
  const all = listOf(data);
  const perPage = 12;
  const pageItems = all.slice(page * perPage, (page + 1) * perPage);
  const cards = pageItems.map((b, i) => {
    const id = slug(b);
    const prize = amount(b);
    const isOpen = open(b);
    return `<article class="bounty-card" style="--stagger:${i * 35}ms">
      <div class="card-top"><span class="status ${isOpen ? 'is-open' : 'is-closed'}"><i></i>${isOpen ? 'Accepting entries' : 'Closed'}</span><span class="card-count">${esc(entries(b))} entries</span></div>
      <h2><a href="#/bounty/${encodeURIComponent(id)}">${esc(title(b))}</a></h2>
      <p class="card-summary">${esc(b.summary || b.description || 'Explore this open make.fun competition.')}</p>
      <div class="card-prize"><span>Current prize pool</span><strong>${money(prize)}</strong></div>
      <div class="card-meta"><div><span>Entry fee</span><b>${feeLabel(b) ? money(feeLabel(b)) : 'Free'}</b></div><div><span>Time remaining</span><b>${esc(timeLeft(deadline(b)))}</b></div></div>
      <div class="card-actions"><a class="text-link" href="#/bounty/${encodeURIComponent(id)}">Competition details <span aria-hidden="true">↗</span></a><a class="text-link subtle-link" href="#/leaderboard/${encodeURIComponent(id)}">Leaderboard</a></div>
    </article>`;
  }).join('');
  const pages = Math.ceil(all.length / perPage);
  return `<div class="shell">${top('Find your next<br><em>competition.</em>', 'OPEN CALLS · MAKE.FUN', 'Live bounties, clear stakes, and the people building in public.', `<div class="total-badge"><strong>${esc(all.length)}</strong><span>competitions</span></div>`)}
    <div class="section-line"><span>Currently open</span><span class="line"></span><span class="section-note">${all.length ? `01 — ${String(Math.min((page + 1) * perPage, all.length)).padStart(2, '0')}` : 'No entries'}</span></div>
    <section class="card-grid" aria-label="Open competitions">${cards || '<div class="empty-state">No open competitions were returned. Try again when the feed refreshes.</div>'}</section>
    ${pages > 1 ? `<nav class="pagination" aria-label="Competition pages">${page ? `<a href="#/?page=${page - 1}">← Previous</a>` : '<span></span>'}<span>Page ${page + 1} of ${pages}</span>${page + 1 < pages ? `<a href="#/?page=${page + 1}">Next →</a>` : '<span></span>'}</nav>` : ''}</div>`;
}

function rewardsFor(b) {
  const rewards = b.rewards ?? b.prizes ?? b.payouts;
  if (Array.isArray(rewards) && rewards.length) return rewards.map((r, i) => {
    const place = r.place ?? r.rank ?? r.label ?? `${i + 1}`;
    const value = r.amountUsd ?? r.amount_usd ?? r.rewardUsd ?? r.amount ?? r.rewardAmount ?? 0;
    const placeLabel = typeof place === 'number' || /^\d+$/.test(String(place)) ? `${place}${place === 1 || place === '1' ? 'st' : place === 2 || place === '2' ? 'nd' : place === 3 || place === '3' ? 'rd' : 'th'} place` : place;
    return `<tr><td>${esc(placeLabel)}</td><td>${money(value)}</td><td>${money(r.potUsd ?? r.currentPotUsd ?? r.liveAmountUsd ?? value)}</td></tr>`;
  }).join('');
  return `<tr><td>Winner</td><td>${money(b.rewardAmount ?? amount(b))}</td><td>${money(amount(b))}</td></tr>`;
}

export function bountyPage(b) {
  const id = slug(b);
  const isOpen = open(b);
  const rules = b.rules ?? b.requirements?.rules ?? [];
  const ruleHtml = Array.isArray(rules) ? rules.map((r) => `<li>${esc(typeof r === 'string' ? r : r.text ?? r.title ?? JSON.stringify(r))}</li>`).join('') : `<li>${esc(rules || 'Read the competition requirements before submitting.')}</li>`;
  return `<div class="shell">
    <div class="crumbs"><a href="#/">← All competitions</a><span>/</span><span>Competition</span></div>
    <section class="detail-hero"><div class="detail-copy"><p class="eyebrow">${isOpen ? 'OPEN FOR ENTRIES' : 'COMPETITION'}</p><h1>${esc(title(b))}</h1><p class="intro">${esc(b.summary || '')}</p><div class="detail-actions"><a class="button primary" href="#/leaderboard/${encodeURIComponent(id)}">View leaderboard <span aria-hidden="true">↗</span></a><span class="status ${isOpen ? 'is-open' : 'is-closed'}"><i></i>${isOpen ? 'Accepting entries' : 'Closed to new entries'}</span></div></div>
      <aside class="prize-panel"><span>Live prize pool</span><strong>${money(amount(b))}</strong><div class="prize-sub"><span>Base reward</span><b>${money(b.rewardAmountUsd ?? b.rewardAmount ?? amount(b))}</b></div><div class="prize-sub"><span>Entry fee</span><b>${feeLabel(b) ? money(feeLabel(b)) : 'Free'}</b></div></aside></section>
    <section class="detail-grid"><div class="content-column"><article class="content-block"><p class="eyebrow">THE BRIEF</p><h2>What you’re building</h2><p class="body-copy">${esc(b.description || b.summary || 'The competition brief is not available in this response.')}</p></article><article class="content-block"><p class="eyebrow">REQUIREMENTS</p><h2>Rules of entry</h2><ul class="rules-list">${ruleHtml || '<li>Review the full brief on make.fun.</li>'}</ul></article>
      <article class="content-block"><div class="block-heading"><div><p class="eyebrow">PRIZE BREAKDOWN</p><h2>Rewards</h2></div><span class="live-tag"><i></i>Live pot</span></div><div class="table-wrap"><table><thead><tr><th>Place</th><th>Base reward</th><th>Current pot</th></tr></thead><tbody>${rewardsFor(b)}</tbody></table></div></article></div>
      <aside class="side-column"><div class="side-card"><p class="eyebrow">KEY DATES</p><div class="date-row"><span>Opens</span><b>${date(b.opensAt ?? b.startAt ?? b.createdAt)}</b></div><div class="date-row"><span>Deadline</span><b>${date(deadline(b))}</b></div><div class="time-callout"><span>Time remaining</span><strong>${esc(timeLeft(deadline(b)))}</strong></div><div class="date-row"><span>Submissions</span><b>${esc(entries(b))}</b></div></div><a class="side-link" href="#/leaderboard/${encodeURIComponent(id)}"><span><small>SEE WHO’S LEADING</small><b>Competition leaderboard</b></span><span aria-hidden="true">↗</span></a><a class="side-link" href="#/profile/guigor-syamsa"><span><small>PUBLIC ACCOUNT</small><b>View a maker profile</b></span><span aria-hidden="true">↗</span></a></aside></section>
  </div>`;
}

const makerOf = (r) => r.profile?.handle ?? r.handle ?? r.username ?? r.account?.handle ?? r.agent?.owner?.handle ?? r.user?.handle;
const scoreOf = (r) => r.score ?? r.rating ?? r.points ?? r.percent ?? r.rate;
export function leaderboard(data, slugName) {
  const rows = listOf(data);
  const body = rows.map((r, i) => {
    const handle = makerOf(r);
    const name = r.displayName ?? r.name ?? r.agent?.name ?? r.title ?? (handle ? `@${handle}` : 'Competitor');
    const image = r.avatarUrl ?? r.avatar ?? r.profile?.avatarUrl ?? r.user?.avatarUrl;
    return `<tr><td class="rank-cell">${String(r.rank ?? r.place ?? i + 1).padStart(2, '0')}</td><td><div class="maker-cell">${image ? `<img crossorigin="anonymous" src="${esc(image)}" alt="" loading="lazy">` : '<span class="avatar-fallback">✳</span>'}<div><b>${esc(name)}</b><small>${esc(r.subtitle ?? r.agent?.description ?? (handle ? `@${handle}` : 'make.fun maker'))}</small></div></div></td><td>${esc(scoreOf(r) ?? '—')}</td><td>${esc(r.entries ?? r.submissionCount ?? '—')}</td><td>${handle ? `<a class="text-link" href="#/profile/${encodeURIComponent(handle)}">Profile ↗</a>` : '<span class="muted">—</span>'}</td></tr>`;
  }).join('');
  return `<div class="shell">${top('Leaderboard', 'LIVE RANKINGS', 'See the makers and entries shaping this competition.', `<a class="button ghost" href="#/bounty/${encodeURIComponent(slugName)}">← Competition</a>`)}<div class="section-line"><span>Current standings</span><span class="line"></span><span class="section-note">${rows.length} ${rows.length === 1 ? 'maker' : 'makers'}</span></div><div class="table-wrap leaderboard-wrap"><table class="leaderboard"><thead><tr><th>Rank</th><th>Maker / entry</th><th>Score</th><th>Entries</th><th>Profile</th></tr></thead><tbody>${body || '<tr><td colspan="5" class="empty-row">No leaderboard entries returned yet.</td></tr>'}</tbody></table></div></div>`;
}

export function profilePage(data, handle) {
  const p = data.profile ?? data;
  const display = p.displayName ?? p.name ?? p.username ?? handle;
  const avatar = p.avatarUrl ?? p.avatar ?? p.image;
  const bio = p.bio ?? p.about ?? p.description;
  const entries = listOf(p.competitions ?? p.entries ?? p.submissions);
  const history = entries.map((entry) => `<a class="history-row" href="#/bounty/${encodeURIComponent(entry.competition?.slug ?? entry.slug ?? entry.competitionSlug ?? '')}"><span>${esc(entry.title ?? entry.competition?.title ?? entry.name ?? 'Competition entry')}</span><b>${esc(entry.status ?? entry.score ?? 'View')} <span aria-hidden="true">↗</span></b></a>`).join('');
  return `<div class="shell"><div class="crumbs"><a href="#/">← Competitions</a><span>/</span><span>Public profile</span></div><section class="profile-hero">${avatar ? `<img crossorigin="anonymous" src="${esc(avatar)}" alt="${esc(display)} profile image">` : '<div class="profile-avatar">✳</div>'}<div><p class="eyebrow">MAKE.FUN MAKER</p><h1>${esc(display)}</h1><p class="handle">@${esc(p.handle ?? handle)}</p><p class="intro">${esc(bio || 'Public maker profile and competition activity.')}</p>${p.profileUrl ? `<a class="text-link" href="${esc(p.profileUrl)}" rel="noreferrer">Open on make.fun ↗</a>` : ''}</div></section><section class="profile-content"><div class="block-heading"><div><p class="eyebrow">PUBLIC ACTIVITY</p><h2>Competition entries</h2></div><span class="section-note">${entries.length} listed</span></div><div class="history-list">${history || '<p class="muted empty-state">No public competition activity was returned for this profile.</p>'}</div></section></div>`;
}

export function errorView(message) {
  return `<div class="shell error-state"><p class="eyebrow">CAN’T LOAD THIS VIEW</p><h1>Give it another try.</h1><p>${esc(message)}</p><a class="button primary" href="#/">Back to competitions</a></div>`;
}
