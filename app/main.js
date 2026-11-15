import { bounties, bounty, leaderboard, profile } from './api.js';
import { board, bountyPage, leaderboard as leaderboardPage, profilePage, errorView } from './views.js';

const root = document.querySelector('#app');
const dataState = document.querySelector('#data-state');
let snapshot = { items: [] };
let leaderboardSnapshot = { items: [] };
const snapshotReady = Promise.all([
  fetch('./data/snapshot.json').then((r) => r.json()).then((data) => { snapshot = data; }).catch(() => {}),
  fetch('./data/leaderboard.json').then((r) => r.json()).then((data) => { leaderboardSnapshot = data; }).catch(() => {}),
]);

async function render() {
  window.__shotReady = false;
  await snapshotReady;
  root.setAttribute('aria-busy', 'true');
  root.innerHTML = '<div class="shell loading"><span class="loader"></span><p>Loading make.fun data…</p></div>';
  const route = decodeURIComponent(location.hash || '#/');
  const page = Number(new URLSearchParams(route.split('?')[1] || '').get('page') || 0);
  try {
    if (/^#\/bounty\/[^/]+/.test(route)) {
      const id = route.match(/^#\/bounty\/([^/?]+)/)[1];
      const result = await bounty(id, snapshot);
      if (!result.data) {
        document.title = 'Competition not found · make.fun';
        root.innerHTML = '<div class="shell error-state"><p class="eyebrow">COMPETITION NOT FOUND</p><h1>This competition is unavailable.</h1><p>It may have closed or the link may be incorrect.</p><a class="button primary" href="#/">Back to competitions</a></div>';
        dataState.textContent = result.source;
        return;
      }
      document.title = `${result.data.title} · make.fun`;
      root.innerHTML = bountyPage(result.data);
      dataState.textContent = result.source;
    } else if (/^#\/leaderboard\/[^/]+/.test(route)) {
      const id = route.match(/^#\/leaderboard\/([^/?]+)/)[1];
      const result = await leaderboard(id, leaderboardSnapshot);
      document.title = `Leaderboard · make.fun`;
      root.innerHTML = leaderboardPage(result.data, id);
      dataState.textContent = result.source;
    } else if (/^#\/profile\/[^/]+/.test(route)) {
      const handle = route.match(/^#\/profile\/([^/?]+)/)[1];
      const result = await profile(handle);
      document.title = `@${handle} · make.fun profile`;
      root.innerHTML = profilePage(result.data, handle);
      dataState.textContent = result.source;
    } else {
      const result = await bounties(snapshot);
      document.title = 'Open competitions · make.fun';
      root.innerHTML = board(result.data, page);
      dataState.textContent = result.source;
    }
    window.scrollTo(0, 0);
  } catch (error) {
    root.innerHTML = errorView(error?.message || 'The public API is not responding.');
    dataState.textContent = 'API unavailable';
  } finally {
    root.removeAttribute('aria-busy');
    window.__shotReady = true;
  }
}

window.addEventListener('hashchange', render);
window.__shotReady = false;
render();
