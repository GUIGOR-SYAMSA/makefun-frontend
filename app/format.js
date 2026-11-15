export const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: value < 10 ? 2 : 0 }).format(Number(value) || 0);
export const date = (value) => value ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(value)) : 'Date unavailable';
export function timeLeft(value) {
  const ms = new Date(value).getTime() - Date.now();
  if (!Number.isFinite(ms)) return 'Date unavailable';
  if (ms <= 0) return 'Closed';
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor(ms % 86400000 / 3600000);
  return days ? `${days}d ${hours}h left` : `${hours}h left`;
}
export const amount = (b) => b?.potUsd ?? b?.livePotUsd ?? b?.rewardAmountUsd ?? b?.rewardAmount ?? b?.prizeUsd ?? 0;
export const listOf = (data) => Array.isArray(data) ? data : data?.items ?? data?.entries ?? data?.results ?? data?.rows ?? data?.leaderboard?.items ?? data?.leaderboard?.rows ?? [];
