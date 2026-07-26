# AB Investment — Project Memory

## What this is
Personal investment intelligence dashboard. React 18 + Vite 5. Hosted on Vercel, auto-deploys on push to main. Live: ab-investment.vercel.app. Repo: github.com/YV0007/ab-investment.

## Current state
Stages 1, 2a, 2b complete. Stage 3 (Tracker migration) is next.

## Repo conventions
- Data JSONs in `src/data/`
- Components in `src/components/`, grouped by section (`research/`, `tracker/`)
- Subcomponents used by only one parent live in a same-name subfolder (e.g. `research/dc/`)
- Relative imports, not aliases
- Russian + English mix is fine — Holdings is Russian, Tracker is English
- Dark mode only, never reintroduce a light/dark toggle

## Workflow rules
- Always run `npm run build` before pushing. Never push if it fails.
- Commit messages terse: "Stage X: feature" or "Fix: thing"
- Prefer many small commits over one big commit during migrations
- When unsure about architecture, write a plan as a markdown file first, get approval, then code
- `index_slim.html` is the source monolith — gitignored, never commit it
- Don't ask permission to read files. Do ask before destructive ops (rm -rf, force-push)
- Commit author email is set globally — don't change it

## Token budget rules
- NEVER read full data JSONs (`src/data/*.json`, `src/data/holdings-v2/**/*.json`) — they are 200–400 KB each and burn 50–100K tokens per read.
  Use `grep` or `Bash` to find the relevant key/section first, then `Read` with `offset` + `limit` to grab only what you need.
- NEVER read full research MDs (`research/*.md`) — they are 40–65 KB each. Same approach: grep first, targeted read second.
- When editing a data JSON, read only the 50–100 lines around the target key, not the whole file.
- If a task only needs to know the schema/structure of a JSON, read the first 30 lines — don't load the entire file.

## Migration notes
- `COMPANIES` collision: holdings companies are `HOLD_COMPANIES`, VC tracker companies stay as `COMPANIES`
- Function refs (e.g. `config: () => SEEDED_CONFIG`) can't be JSON-serialized — use string keys in JSON, resolve in the consuming component
