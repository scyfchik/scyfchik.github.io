# lunyxzz-portfolio

Personal portfolio: Roblox QA work, studios, community roles. Live at https://lunyxzz.pages.dev.

Plain HTML, CSS and ES modules. No framework, no build step. Content is in Russian and English.

## Running locally

Serve the folder over HTTP. Opened straight from disk, `index.html` falls back to the static copy of the content (no live stats, no language switch), because ES modules don't load from `file://`.

```bash
npx http-server -p 5173 -c-1
```

Any static server does the job (`python -m http.server` too).

## Layout

- `src/data/` — hand-edited content: profile, skills, experience, project lists
- `src/ui/` — rendering of each section
- `src/services/` — loading the JSON from `data/`
- `data/` — Roblox stats, written by the update script; `studios.json` is the studio list and is edited by hand
- `scripts/update-roblox-stats.mjs` — pulls stats from the Roblox API
- `index.html` — also contains a static copy of the content, shown before JS loads

## Adding a project

Add an entry to the matching file in `src/data/`:

- `qaProjects.js` — QA Experience
- `contributionProjects.js` — independent contributions
- `communityProjects.js` — Community & Moderation

`placeId` is the number from the game URL (`roblox.com/games/<placeId>/...`). Descriptions take `ru` and `en`. QA cards are sorted by visits, so order in the file only matters for ties; projects with 100M+ visits get a full card, the rest go into the compact list (`FEATURED_MIN_VISITS` in `src/ui/portfolioSections.js`). Roles containing "Lead" or "Manager" get a badge.

Visits, online count and the icon show up after the next stats update. Studios go into `data/studios.json` by `groupId`; their games are discovered automatically.

## Stats updates

`.github/workflows/update-roblox-stats.yml` runs every 5 minutes (GitHub may delay scheduled runs). It runs the script, which:

1. reads `placeId`s from `src/data/*Projects.js`
2. resolves them to universe IDs and fetches visits, players and icons in batches
3. walks the group games of every studio in `data/studios.json`
4. writes `data/roblox-stats.json` and `data/studio-stats.json`

The workflow commits the result, which is where the "Update Roblox stats" commits come from. The Roblox API fails regularly, so requests have timeouts and retries; a project that can't be fetched keeps its previous numbers and is marked `unavailable`.

To run it by hand (Node 20+):

```bash
npm run update:roblox-stats
```
