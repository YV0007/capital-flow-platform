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
- Dark theme is the default. A light theme exists behind the Header toggle
  (`app:theme` in localStorage) — wired up on the home landing via the
  `--hm-*` CSS variables in `HomeLanding.jsx`; being expanded to the other
  sections page by page. Light = sharp/cool (white surfaces on `#F4F7FB`,
  slate text), never creamy. Keep both themes working when touching home.

## Workflow rules
- Always run `npm run build` before pushing. Never push if it fails.
- Commit messages terse: "Stage X: feature" or "Fix: thing"
- Prefer many small commits over one big commit during migrations
- When unsure about architecture, write a plan as a markdown file first, get approval, then code
- `index_slim.html` is the source monolith — gitignored, never commit it
- Don't ask permission to read files. Do ask before destructive ops (rm -rf, force-push)
- Commit author email is set globally — don't change it
- After a new `capitalMap.json` lands, `npm run logos` fills brand marks for the new
  entities (the engine's `deliver.py` already does this automatically). See
  `src/components/research/capitalflow/README.md` § Logo pipeline.

## Языки (RU | EN)

Весь дашборд двуязычный, переключатель — в шапке (`app:lang` в localStorage).
Ядро: `src/lib/i18n.jsx`.

- **Копия в компонентах** — `const t = useT()`, затем `t('Фильтры', 'Filters')`.
  Русский первым: он оригинал. Каталога ключей нет — пара и есть ключ.
- **Таксономии в data-модулях** — `bi()` / `biMap()` из `src/data/capitalMap.js`
  отдают ГЕТТЕРЫ, поэтому сотни мест вида `META[k].label` читают обычную строку.
- **Проза из движка** — приходит парами `{ ru, en }`, резолвится через `useL()`.
  Русский сайд-кар `capitalMapRu.json` в английском режиме просто не подключается.
- **Не в компоненте** (хелпер, канвас, компаратор) — `getLang()`, не хук.

Три правила, нарушение которых видно только в рантайме, поэтому их держат ворота
сборки (`npm run i18n:check` + `npm run i18n:lint`, оба в `prebuild`):

1. **Никогда не вызывать `t()` на уровне модуля.** Он выполняется при импорте,
   когда переводчика ещё нет: ReferenceError роняет бандл, и пользователь видит
   белый экран. Таблица должна быть функцией от `t` либо на геттерах `bi()`.
2. **Не затенять `t`.** `t` как переменная цикла, таймер или мета-объект
   превращает `t('…','…')` в вызов строки.
3. **Spread замораживает геттер.** `{ ...node }` читает `label` один раз, в
   момент копирования. Геттер надо переприсоединить (см. `layoutNodes()`).
4. **`(t) => …`-хелпер, вызванный не переводчиком.** Лечение пункта 1 — сделать
   таблицу функцией от `t`. Ничто не мешает передать в этот слот что-то другое:
   `tierColor(sec.tier)` при `const tierColor = (t) => tiers(t)…` читается
   безупречно и вызывает строку `'substance'` как функцию.
5. **Хук в хелпере.** `useT()` внутри `withLinks(...)`, вызванного из `.map()`,
   дописывает пару хуков в список ВЫЗЫВАЮЩЕГО компонента — по паре на элемент.
   Меняется число элементов → «Rendered more hooks than during the previous
   render» и размонтированное дерево. Хелпер берёт геттер `bi()` или `getLang()`.
6. **`t` или `L` используется, но не связан.** Зеркало пункта 1: компонент
   зовёт `levels(t)`, а `const t = useT()` никто не написал. Голый
   ReferenceError в тот день, когда в секции впервые появится этот блок.
   То же и с `L`: 09.09.2026 `L(n.title)` уехал в поисковый индекс
   `HoldingSearch`, а `const L = useL()` — в соседний компонент, и раздел
   «Холдинги» лёг с «L is not defined» через зелёную сборку. Проверка теперь
   знает про обе привязки.

Ошибки 1–6 ловит `npm run i18n:lint`. То, что не видно в исходниках, ловит
`ErrorBoundary` (`src/components/ErrorBoundary.jsx`): она обёрнута вокруг ТЕЛА
раздела, но не вокруг шапки, поэтому упавший раздел печатает свою ошибку и стек
компонентов на экране, а навигация продолжает работать. Чёрный экран вместо
дашборда — больше не наш failure mode.

## Token budget rules
- NEVER read full data JSONs (`src/data/*.json`, `src/data/holdings-v2/**/*.json`) — they are 200–400 KB each and burn 50–100K tokens per read.
  Use `grep` or `Bash` to find the relevant key/section first, then `Read` with `offset` + `limit` to grab only what you need.
- NEVER read full research MDs (`research/*.md`) — they are 40–65 KB each. Same approach: grep first, targeted read second.
- When editing a data JSON, read only the 50–100 lines around the target key, not the whole file.
- If a task only needs to know the schema/structure of a JSON, read the first 30 lines — don't load the entire file.

## Migration notes
- `COMPANIES` collision: holdings companies are `HOLD_COMPANIES`, VC tracker companies stay as `COMPANIES`
- Function refs (e.g. `config: () => SEEDED_CONFIG`) can't be JSON-serialized — use string keys in JSON, resolve in the consuming component
