const ROOT = 'https://make.fun/api';
const TTL = 60_000;
const inflight = new Map();

function cached(key) {
  try {
    const value = JSON.parse(localStorage.getItem(`mf:${key}`) || 'null');
    return value && value.savedAt && Date.now() - value.savedAt < TTL ? value.data : null;
  } catch { return null; }
}

async function get(path, key = path) {
  if (!inflight.has(key)) {
    inflight.set(key, fetch(ROOT + path, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(4500) })
      .then((response) => {
        if (!response.ok) throw new Error(`make.fun returned ${response.status}`);
        return response.json();
      })
      .then((data) => {
        try { localStorage.setItem(`mf:${key}`, JSON.stringify({ savedAt: Date.now(), data })); } catch {}
        return data;
      })
      .finally(() => inflight.delete(key)));
  }
  return inflight.get(key);
}

function list(data, keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) if (Array.isArray(data?.[key])) return data[key];
  return null;
}

function normalizeCompetition(item = {}) {
  const value = item.competition ?? item;
  return {
    ...value,
    slug: value.slug ?? value.competitionSlug ?? value.id ?? '',
    title: value.title ?? value.name ?? value.slug ?? 'Untitled competition',
    summary: value.summary ?? value.description ?? '',
    deadline: value.deadline ?? value.endsAt ?? value.endAt,
    potUsd: value.potUsd ?? value.livePotUsd ?? value.currentPotUsd ?? value.prizeUsd ?? value.rewardAmountUsd ?? value.rewardAmount ?? 0,
    rewardAmountUsd: value.rewardAmountUsd ?? value.rewardAmount ?? value.baseRewardUsd ?? 0,
    entryFeeUsd: value.entryFeeUsd ?? value.entryFee ?? value.entry_fee_usd,
    submissionCount: value.submissionCount ?? value.entryCount ?? value.entriesCount ?? value.submissions ?? 0,
    rewards: value.rewards ?? value.prizes ?? value.payouts ?? [],
    rules: value.rules ?? value.requirements?.rules ?? [],
  };
}

function normalizeCompetitions(data) {
  const items = list(data, ['items', 'competitions', 'results', 'rows']);
  return items ? { items: items.map(normalizeCompetition).filter((item) => item.slug) } : null;
}

function normalizeLeaderboard(data) {
  const entries = list(data, ['entries', 'items', 'results', 'rows', 'leaderboard']);
  if (!entries) return null;
  return { items: entries.map((entry, index) => ({
    rank: entry.rank ?? entry.ranks?.overall ?? entry.place ?? index + 1,
    handle: entry.handle ?? entry.profile?.handle ?? entry.username,
    title: entry.title ?? entry.name ?? entry.displayName,
    score: entry.score ?? entry.display?.judge ?? entry.rating ?? entry.points,
    entries: entry.entries ?? entry.submissionCount,
    avatarUrl: entry.avatarUrl ?? entry.image ?? entry.avatar,
  })) };
}

async function load(path, key, snapshot, normalize) {
  const accept = (data) => normalize(data);
  const fresh = cached(key);
  const freshData = fresh && accept(fresh);
  if (freshData) return { data: freshData, source: 'Saved just now' };
  try {
    const live = accept(await get(path, key));
    if (!live) throw new Error('make.fun returned an unrecognized data format');
    return { data: live, source: 'Live from make.fun' };
  } catch (error) {
    const old = (() => { try { return JSON.parse(localStorage.getItem(`mf:${key}`) || 'null')?.data; } catch { return null; } })();
    const oldData = old && accept(old);
    if (oldData) return { data: oldData, source: 'Saved API response' };
    const snapshotData = snapshot && accept(snapshot);
    if (snapshotData) return { data: snapshotData, source: 'Embedded snapshot · API unavailable' };
    throw error;
  }
}

export const bounties = (snapshot) => load('/competitions?status=open&activity=times', 'board', snapshot, normalizeCompetitions);

export async function bounty(slug, snapshot) {
  const collection = await bounties(snapshot);
  const found = collection.data.items.find((item) => item.slug === slug);
  if (!found) return { data: null, source: collection.source };
  try {
    const detail = await get(`/competitions/${encodeURIComponent(slug)}`, `bounty:${slug}`);
    const normalized = normalizeCompetition(detail.competition ?? detail);
    if (normalized.slug === slug) return { data: { ...found, ...normalized, requirements: detail.requirements ?? normalized.requirements }, source: collection.source };
  } catch {}
  return { data: found, source: collection.source };
}

export const leaderboard = (slug, snapshot) => load(`/competitions/${encodeURIComponent(slug)}/leaderboard`, `leaderboard:${slug}`, snapshot, normalizeLeaderboard);
export const profile = (handle) => load(`/profiles/${encodeURIComponent(handle)}`, `profile:${handle}`, { handle, bio: 'Profile details will appear when the make.fun API is reachable.', competitions: [] }, (data) => data?.profile || data?.handle ? data : null);
