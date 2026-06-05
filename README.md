# AB Investment

Personal investment intelligence dashboard. VC position tracker + sector research library.

## Stack

- React 18 + Vite
- Recharts (charts), Lucide (icons)
- localStorage for personal state (notes, scoring overrides, position log)
- Static JSON files in `src/data/` for reference data (holdings list, research library, etc.)
- Hosted on Netlify via GitHub auto-deploy

## Local dev

```
npm install     # one-time, installs dependencies
npm run dev     # starts dev server at localhost:5173
npm run build   # builds production bundle into dist/
npm run preview # serves the production build locally
```

## Project layout

```
src/
├── main.jsx                  React entry point
├── App.jsx                   Mode routing: home / tracker / research
├── components/
│   ├── HomeLanding.jsx
│   ├── Header.jsx
│   ├── tracker/              VC tracker tabs (signals, scoring, etc.)
│   └── research/             Sector reports (holdings, data-centers, ...)
├── data/                     Static JSON content
└── lib/                      Helpers (storage, scoring, formatting)
```

## Adding a new research section

1. Create `src/components/research/MySection.jsx` exporting a default React component
2. Add an entry to `src/data/research-library.json` with a unique `id`
3. Add the routing line to `src/components/research/ResearchDetail.jsx`
4. `git push` — Netlify auto-deploys

## Deploy

Connected to Netlify via GitHub. Every push to `main` triggers a build and deploy. Build settings live in `netlify.toml`.
