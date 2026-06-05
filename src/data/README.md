# `src/data/`

Static reference data for the AB Investment dashboard. These files are committed JSON — version-controlled, no API calls, no schema migrations. Edit a file, push, Vercel rebuilds.

## Files

### `research-library.json`
The list of research reports shown on the Research landing page. Each entry has:
- `id` — used in URLs and component routing (e.g. `'holdings'`, `'data-centers-ai'`)
- `title`, `subtitle`, `sector`, `dateCompleted` — display fields
- `companyCount`, `sectionCount` — stats shown on the card
- `accent` — hex color for the report's visual theme
- `summary` — short description

**To add a new report** (e.g. "IPO Proxies" or "Hedges"):
1. Add an entry here
2. Create `src/components/research/<NewSection>.jsx`
3. Add the routing line in `src/components/research/ResearchDetail.jsx`

### `holdings.json`
All data for the Holdings dashboard:
- `companies` — the 9 holding company objects (SoftBank, Brookfield, KKR, etc.) keyed by uppercase id
- `HOLDING_COMPANIES_ORDER` — display order (array of lowercase ids)
- `META` — color, mono badge, group assignment per company
- `GROUPS` — the 3 zone definitions (Pure AI / Heavy pivot / Diversified)
- `THEMES` — dark/light theme tokens used inside the holdings dashboard
- `SECTIONS` — the 5 main sections shown for each company (snapshot, changes, strategy, pipeline, worldview)
- `SUBS` — Russian-language subtitles for each section
- `DIMENSIONS`, `HEATMAP_THEMES`, `AI_TIERS` — comparison-view configuration

To add a new holding: add a new company object under `companies`, append its id to `HOLDING_COMPANIES_ORDER`, and add a META entry with color + mono badge + group.

### `tracker-companies.json`
Metadata for tracked VC positions (currently Zeely, Cursor). Each entry has display fields (id, name, legalName, accent, storagePrefix) plus a `dataKeys` map that points to the seed data files in component code. Function references (config, memoBaseline, etc.) get wired up in the Tracker component layer — they can't be stored as JSON.

**To add a new tracker position** (Phase 4+):
1. Create seed-data JSON files: `src/data/tracker/<id>/config.json`, `memo-baseline.json`, `observations.json`, etc.
2. Add a company entry here pointing at those files
3. The Tracker component reads `tracker-companies.json` and lazy-loads the right seed data for the active company
