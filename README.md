# make.fun Open Calls

A lightweight, static frontend for exploring public make.fun competitions. It reads the make.fun public API with read-only requests and provides a competition board, detail pages, live leaderboards, and public maker profiles.

## Run locally

Serve the `app/` directory with any static HTTP server, then open its `index.html`. Hash routes are supported directly:

- `#/` — open competitions
- `#/bounty/<slug>` — competition brief, rewards, and dates
- `#/leaderboard/<slug>` — leaderboard
- `#/profile/<handle>` — public maker profile

The app caches successful API responses briefly and falls back to its small embedded snapshot when the network is unavailable.

The root `main.ts` copies the static app and screenshots to `MAKEFUN_OUTPUT_DIR` and writes the make.fun dossier using the vendored library.

## License

MIT. See [LICENSE](LICENSE).
