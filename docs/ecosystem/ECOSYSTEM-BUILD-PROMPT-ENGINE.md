# ЗАДАЧА: движок карты «Экосистема» (месячный конвейер)

Ты работаешь автономно в репозитории движка: **`/Users/macbook/Desktop/Capital Flow`**.
Решения принимай сам, вопросов не задавай — фиксируй выбор в журнале сборки (см. в конце).

## Контекст: две сборки идут параллельно

Прямо сейчас запущены **два промпта одновременно**:

1. **Этот** — движок: агенты, БД, месячный конвейер, генерация файла передачи.
2. **Второй** — дашборд в `/Users/macbook/Desktop/BASE/Code/ab-investment`: рисует карту.

Вы **не общаетесь и не ждёте друг друга**. Единственная точка стыковки — контракт передачи
ниже, он заморожен и повторён в обоих промптах дословно. Дашборд собирает визуал на
фикстуре той же формы; когда ты отдашь настоящий файл, он подставится без правок кода.

**Границы:**
- Ты пишешь **только** в `/Users/macbook/Desktop/Capital Flow`.
- В `ab-investment` ты **не пишешь ничего**. Читать оттуда можно (таксономия, план).
- Контракт в одиночку не меняешь. Нужна правка — остановись и напиши пользователю.

## План — прочитай первым делом

`/Users/macbook/Desktop/BASE/Code/ab-investment/CAPITAL-FLOW-ECOSYSTEM-MAP-PROPOSAL.md`

Это утверждённый план целиком (модель, роли, 10 типов рёбер, хребет капитала, линзы,
архитектура §7). Он — источник смысла; промпт ниже — источник обязательств.

## Что уже есть в твоём репозитории — прочитай перед стройкой

- `ARCHITECTURE.md`, `RUNBOOK.md` — как устроен недельный конвейер.
- `agents/CONTEXT.md` и `agents/corporate.md` — **эталон формата брифа агента**. Новые
  брифы пиши в том же стиле: кого трекаем, что ищем, обязательные Tier-1 проверки, гочи.
- `db/schema.sql` — стиль схемы (CHECK-констрейнты, `created_at`, UNIQUE).
- `engine/ingest.py`, `engine/handoff.py`, `engine/db.py` — стиль детерминированного слоя.
- `config/sources.yaml` (реестр тиров), `config/aliases.yaml`, `config/allocators.yaml`.
- `run_week.py` — оркестратор, по образцу которого делаешь месячный.

**Переиспользуй, не дублируй:** резолвинг сущностей (`entity_aliases`,
`entity_external_ids`, `config/aliases.yaml`), реестр источников, паттерн прогонов
`runs/<период>/<агент>/`, паттерн handoff. NVIDIA должна быть одной NVIDIA в обоих конвейерах.

## КОНТРАКТ ПЕРЕДАЧИ — ЗАМОРОЖЕН, ИЗМЕНЕНИЮ В ОДНОСТОРОННЕМ ПОРЯДКЕ НЕ ПОДЛЕЖИТ

Этот блок дословно повторён во втором промпте. Он — единственная точка стыковки двух
параллельных сборок. Движок пишет такой файл, дашборд его читает.

Файл: `handoff/ecosystem_map.json` (движок) → `src/data/ecosystemMap.json` (дашборд).

```jsonc
{
  "generated": "2026-08-18",          // ISO-дата генерации
  "asOf": "2026-08",                  // месяц прогона
  "source": "engine",                 // "engine" | "fixture" — дашборд показывает плашку, если не engine
  "ecosystem": "ai-datacenters",
  "totals": { "nodes": 0, "edges": 0, "layers": 12, "cycles": 0 },

  "layers": [
    { "id": "L1", "label": "СЫРЬЁ", "caption": "материалы · химия", "band": 1,
      "concentration": { "level": "oligopoly", "hhi": 0.31, "top": ["shin-etsu"] } }
    // level: "monopoly" | "oligopoly" | "competitive"
    // band: 1..5 — цветовая полоса (L1-L2=1, L3-L4=2, L5-L7=3, L8-L10=4, L11-L12=5)
  ],

  "sectors": [
    { "key": "Litho Tools", "label": "Станки для чипов", "layer": "L2", "dcNode": "litho" }
  ],

  "nodes": [
    {
      "id": "asml",                    // стабильный slug, НИКОГДА не меняется между прогонами
      "name": "ASML",
      "role": "producer",              // producer | owner | capital | demand | platform
      "sector": "Litho Tools",
      "layers": [                      // 1..N — компания может жить в нескольких слоях
        { "layer": "L2", "primary": true, "criticality": 100 }
      ],
      "criticality": 100,              // = criticality основного слоя
      "criticalityFactors": { "share": 5, "alternatives": 5, "switchTime": 5, "barrier": 5 },
      "gravity": { "nodes": 24, "layers": 6, "edgeTypes": 3, "score": 78 },
      "oneLiner": "Единственный в мире производитель EUV-сканеров",
      "whatBreaksIt": "Появление рабочей альтернативы EUV или потеря доступа к оптике Zeiss",
      "ticker": "AMS: ASML",
      "publicPrivate": "Pub",          // "Pub" | "Pvt"
      "geo": "NL",
      "tier": "anchor",                // anchor | core | emerging
      "techNodes": ["euv"],
      "dcNode": "litho",               // id узла в dc-details.json / Roadmap.jsx, или null
      "firstSeen": "2026-08",
      "lastConfirmed": "2026-08",
      "stale": false
    }
  ],

  "techNodes": [
    { "id": "euv", "label": "EUV", "owner": "asml", "note": "Литография ниже 7 нм" }
  ],

  "edges": [
    {
      "id": "asml__tsmc__supply",     // <source>__<target>__<type>, стабильный
      "source": "asml",
      "target": "tsmc",
      "type": "supply",                // supply|offtake|platform|partner|compete|owns|stake|finances|develops|operates
      "spine": "physical",             // "physical" | "capital"
      "strength": 95,                  // 0..100 — существенность ДЛЯ ПОЛУЧАТЕЛЯ
      "techNode": "euv",               // или null — подпись на ребре
      "status": "active",              // active | expired | unverified
      "tier": "filing",                // filing | company_pr | transcript | press | estimate
      "confirmedSources": 2,           // >=2 → сплошная линия, 1 → пунктир
      "engineConfirmed": false,        // сверено с capitalMap.json (только stake/owns/finances)
      "started": "2010",               // или null
      "lastConfirmed": "2026-07",
      "note": "EUV-сканеры для узлов N3/N2",
      "evidence": [
        { "quote": "…дословная цитата…", "url": "https://…", "tier": "filing",
          "published": "2026-02-14", "fetched": "2026-08-18", "alive": true }
      ]
    }
  ],

  "cycles": [
    { "id": "c1", "type": "sales",     // "sales" | "financing"
      "path": ["nvidia", "openai", "coreweave", "nvidia"],
      "edges": ["nvidia__openai__stake", "openai__coreweave__offtake", "coreweave__nvidia__supply"],
      "note": "Контур сбыта: доля в лаборатории возвращается закупкой GPU" }
  ],

  "changelog": {
    "month": "2026-08",
    "added":   [ { "kind": "node", "id": "…", "why": "…" } ],
    "removed": [ { "kind": "edge", "id": "…", "why": "источник мёртв" } ],
    "changed": [ { "kind": "node", "id": "…", "field": "criticality", "from": 72, "to": 81 } ]
  }
}
```

**Железные правила контракта:**
1. `nodes[].id` и `edges[].id` стабильны между прогонами. Переименование = потеря истории.
2. `edges[].source` / `target` ссылаются на `nodes[].id`. Висячих ссылок быть не может.
3. `evidence` непустой для каждого ребра. Нет цитаты — ребра нет.
4. `layers` всегда 12 записей, даже если в слое нет узлов.
5. Дашборд не считает ничего сам: `criticality`, `gravity`, `concentration`, `cycles` уже
   посчитаны движком. Дашборд только рисует.
6. Ни одна сторона не меняет контракт в одиночку. Нужна правка — остановиться и написать
   пользователю, что и почему.

## ТАКСОНОМИЯ СЛОЁВ — ФИКСИРОВАНА

Источник истины: `ab-investment/src/components/research/dc/Roadmap.jsx` (LAYERS + NODES).

| id | label | caption | band | сектора (`sector` из Roadmap.jsx) |
|---|---|---|---|---|
| L1 | СЫРЬЁ | материалы · химия | 1 | GOES Steel, Photoresist, Specialty Chem, InP/GaAs, Titanium, HBM Materials |
| L2 | ОБОРУДОВАНИЕ | станки · софт · тесты | 1 | Litho Tools, Test, EDA, IP/Bonding |
| L3 | ЧИПЫ | логика · силовые · кастомные | 2 | AI Silicon, Wide-Bandgap, Custom ASIC |
| L4 | ПАМЯТЬ | HBM · DRAM · SSD | 2 | HBM, DRAM, NAND/SSD |
| L5 | СБОРКА | упаковка · платы | 3 | Adv Packaging, PCB |
| L6 | ГЕНЕРАЦИЯ | источники · топливо | 3 | Nuclear, SMR, Fuel Cells, Gas Pipelines, Gas Turbines, Renewables |
| L7 | ПЕРЕДАЧА ТОКА | сеть → стойка | 3 | Power, Transformers, Switchgear, Power Mgmt |
| L8 | СВЯЗЬ | сеть · оптика | 4 | Photonics, Network Silicon, Interconnect Fabric, Optical Modules, Dark Fiber, Fiber/Cable |
| L9 | СИСТЕМЫ | серверы · охлаждение · стройка | 4 | Server Systems, Liquid Cooling, MEP, Contracting |
| L10 | ВЫЧИСЛЕНИЯ | стойка | 4 | AI Compute Infra |
| L11 | ИНФЕРЕНС | работа моделей · цена ответа | 5 | Inference |
| L12 | AI-ЛАБОРАТОРИИ | модели · конечный спрос на вычисления | 5 | Frontier Lab |

Фаундри (TSMC, Samsung Foundry, Intel Foundry) относить к **L3**; облака и неклауды
(AWS, Azure, OCI, CoreWeave, Crusoe, Nebius) и ДЦ-REIT (Equinix, Digital Realty) — к **L10**;
софт/оркестрация (Databricks, HuggingFace) — к **L11**; спрос и лаборатории — к **L12**.
Капитал (`role: capital`) сажать в тот слой, где стоит контролируемый актив, а не в отдельный.

## РУБРИКА КРИТИЧНОСТИ — ФИКСИРОВАНА

| Фактор | Ключ | Вес | 5 | 4 | 3 | 2 | 1 | 0 |
|---|---|---|---|---|---|---|---|---|
| Доля в своей функции | `share` | 0.30 | >90% | 70–90% | 50–70% | 30–50% | 15–30% | <15% |
| Реальных альтернатив | `alternatives` | 0.30 | нет | одна | две | три-четыре | много | товар |
| Сколько займёт замена | `switchTime` | 0.25 | больше 5 лет | 3–5 лет | 1–3 года | 6–12 мес | до 6 мес | мгновенно |
| Порог входа | `barrier` | 0.15 | неподъёмный | очень высокий | высокий | средний | низкий | нет |

`criticality = round(100 × (0.30·share + 0.30·alternatives + 0.25·switchTime + 0.15·barrier) / 5)`

Проверка: ASML 5/5/5/5 → 100. ODM-сборщик 2/1/1/1 → 26.

## ТИРЫ ИСТОЧНИКОВ — ФИКСИРОВАНЫ

| tier | Что это | Линия на карте |
|---|---|---|
| `filing` | 10-K / 20-F / 8-K / проспект / 13D-G | сплошная, полный контраст |
| `company_pr` | Пресс-релиз одной из сторон | сплошная |
| `transcript` | Заявление на звонке по отчётности | сплошная, тоньше |
| `press` | Reuters / Bloomberg / FT / WSJ | пунктир |
| `estimate` | TrendForce / Omdia / аналитика долей | пунктир + подпись «оценка» |

Плюс: `confirmedSources >= 2` → сплошная; `== 1` → пунктир независимо от тира.
`status: "unverified"` (ссылка мертва или цитата пропала) → узел гаснет.
`lastConfirmed` старше 6 месяцев → блёкнет с подписью «не подтверждалось с …».

## ПОРОГ STRENGTH

В базу и в JSON пишется **всё**. На карте по умолчанию рисуются рёбра `strength >= 20`,
ползунок опускает до 0. В панели узла список связей **всегда полный**, без порога.

---

# ЧТО ПОСТРОИТЬ

## 1. Схема — `db/schema_eco.sql`, в тот же `db/capital.db`

Таблицы с префиксом `eco_`. Ничего в существующих таблицах не трогай.

```
eco_nodes        id, slug UNIQUE, name, role, sector, tier, ticker, public_private, geo,
                 one_liner, what_breaks_it, dc_node,
                 f_share, f_alternatives, f_switch_time, f_barrier,   -- 0..5
                 criticality, first_seen, last_confirmed, stale, created_at

eco_node_layers  node_id, layer CHECK(L1..L12), is_primary, criticality_in_layer
                 UNIQUE(node_id, layer)
                 -- компания в нескольких слоях = несколько строк, НИКОГДА не второй узел

eco_tech_nodes   id, slug UNIQUE, label, owner_node_id, note

eco_edges        id, slug UNIQUE, source_id, target_id, edge_type CHECK(10 значений),
                 spine CHECK('physical','capital'), strength 0..100, tech_node_id,
                 status CHECK('active','expired','unverified'), started, ended,
                 last_confirmed, note, created_at
                 UNIQUE(source_id, target_id, edge_type)

eco_evidence     id, edge_id, source_url, source_tier CHECK(5 значений), quote,
                 published_date, fetched_date, alive
                 -- НЕСКОЛЬКО строк на ребро. Отсюда считаются confirmed_sources и тир.

eco_scores       node_id, run_id, criticality, gravity_nodes, gravity_layers,
                 gravity_edge_types, gravity_score
eco_layer_stats  run_id, layer, hhi, level, top_json
eco_cycles       id, run_id, cycle_type, path_json, edges_json, note
eco_runs         id, month, agent, rows_in, rows_rejected, notes, created_at
```

Ключевое требование: **доказательства отдельной таблицей**, не колонкой в ребре. Из неё
бесплатно берутся правило двух источников, тир и месячная перепроверка живости.

## 2. Конфиги

- `config/eco_layers.yaml` — 12 слоёв, полосы, сектора (таблица таксономии выше, дословно).
- `config/eco_watchlist.yaml` — якоря, восходящие, хребет капитала:
  - **Якоря (~10):** NVIDIA, TSMC, ASML, Broadcom, Microsoft, Alphabet, Amazon, OpenAI, SK Hynix, Foxconn. Кандидаты: Oracle, Brookfield, Anthropic.
  - **Восходящие:** Astera Labs, Credo, Celestial AI, Crusoe, Nebius, Lambda, Oklo, Alchip, Fluidstack.
  - **Хребет капитала:** Brookfield (+ Westinghouse, Brookfield Renewable, Compass Datacenters, Data4), Blackstone (+ QTS), KKR, MGX, Stonepeak, GIP/BlackRock, Ontario Teachers', Digital Realty, Equinix, Vantage, Constellation, Vistra, CoreWeave, Oracle.
- `config/eco_rules.yaml` — веса рубрики, порог `strength` = 20, правило двух источников,
  устаревание 6 месяцев, правила включения R1–R5.

Стартовый набор компаний бери из `ab-investment/src/data/dc-companies.json` (285 записей с
секторами, тикерами, гео и заметками) — **читай его частями, файл большой**.

## 3. Агенты — `agents/eco-CONTEXT.md` + шесть брифов

`agents/eco-CONTEXT.md` — общий контекст: миссия, что такое ребро, 10 типов, роли, тиры,
CSV-контракт, правило цитаты, таксономия слоёв.

| Бриф | Слои | За чем идёт |
|---|---|---|
| `agents/eco-silicon.md` | L1–L4 | материалы, оборудование, EDA, фаундри, чипы, HBM |
| `agents/eco-systems.md` | L5, L8–L9 | упаковка, платы, сети, оптика, серверы, охлаждение, стройка |
| `agents/eco-power.md` | L6–L7 | генерация, турбины, атом, SMR, трансформаторы, щиты |
| `agents/eco-infra.md` | L10 | ДЦ, REIT, неклауды, гиперскейлеры |
| `agents/eco-models.md` | L11–L12 | инференс, лаборатории, софт, оркестрация, спрос |
| `agents/eco-capital.md` | сквозной | роли `owner`/`capital`: владение, JV, проектное финансирование, девелопмент |

**Что агент ищет — конкретно:**
- **10-K / 20-F**: разделы про концентрацию поставщиков и клиентов («customer A accounted
  for X% of net revenue»), зависимость от единственного источника, риск-факторы про поставки.
- **8-K, проспекты, 13D/G**: владение, доли, JV, проектное финансирование.
- **Пресс-релизы сторон**: контракты, выкуп мощности, co-design, объёмы, сроки.
- **Звонки по отчётности**: подтверждение зависимости своими словами.
- **TrendForce / Omdia / SemiAnalysis**: доли рынка — **только** как `estimate`.

**Железное правило: нет дословной цитаты, где связь названа → ребро не пишется.**
Оценочные суждения («вероятно, поставляет») запрещены. `compete` в v1 **не собираем**.

**Выход агента — два CSV в `runs/<YYYY-MM>/<агент>/`:**

```
edges.csv   source, target, edge_type, spine, strength, tech_node, started,
            evidence_quote, source_url, source_tier, published_date, note

nodes.csv   name, layers, sector, role, tier, ticker, public_private, geo,
            f_share, f_alternatives, f_switch_time, f_barrier,
            share_note, one_liner, what_breaks_it, dc_node
            -- layers: "L3:primary|L10|L12" — несколько слоёв через |
```

Плюс `source_log.csv` и `summary.md` — как у существующих агентов.

## 4. Движок — детерминированный слой, `engine/`

- `eco_ingest.py` — CSV → валидация → резолвинг имён через существующие алиасы → дедуп →
  SQLite. Отклонённые строки в `runs/<месяц>/rejects.csv` с причиной, чтобы следующий
  прогон вернул их агентам (как уже сделано в недельном конвейере).
- `eco_verify.py` — дёргает каждый `source_url`, проверяет 200 и наличие `quote` на
  странице → `alive`. Мёртвое ребро → `status='unverified'`. `last_confirmed` старше
  6 месяцев → пометка устаревания. Сетевые ошибки не роняют прогон.
- `eco_score.py` — критичность по рубрике (per-layer и общая), гравитация, HHI и уровень
  концентрации по слоям. Чистая арифметика из сохранённых факторов, никаких суждений.
- `eco_cycles.py` — поиск замкнутых контуров (длина 3–5), классификация `sales` vs
  `financing` по составу типов рёбер. Дедуп по множеству участников.
- `eco_handoff.py` — SQLite → `handoff/ecosystem_map.json` строго по контракту +
  `handoff/ECOSYSTEM-CHANGELOG.md` (диф на 10–20 строк: добавлено, отвалилось, сменился
  владелец, погасло ребро).
- **Сверка с недельным конвейером:** для рёбер `stake` / `owns` / `finances` проверить,
  есть ли соответствующее событие в существующих таблицах → `engineConfirmed: true`.

## 5. Оркестратор — `run_month.py`

```
агенты (Claude Code, пишут CSV) → eco_ingest → eco_verify → eco_score → eco_cycles → eco_handoff
```

По образцу `run_week.py`: флаги `--month`, `--skip-agents`, `--deliver`. Агенты —
недетерминированный слой, всё после — Python + SQL.

## 6. Первый прогон — хребет NVIDIA

Не гони сразу все 150 узлов. Сначала **~40 узлов и ~90 рёбер** вокруг цепочки
`ASML → TSMC → NVIDIA → Foxconn → CoreWeave → OpenAI` плюс кейс Brookfield → Westinghouse
(проверь реальные доли по первоисточникам — ничего не бери из плана на веру, там числа
по памяти). Убедись, что контракт наполняется настоящими данными, и только потом
масштабируй до ~150 узлов по правилам R1–R5.

# КРИТЕРИИ ГОТОВНОСТИ

1. `python run_month.py --month 2026-08` проходит от начала до конца без ручных шагов.
2. `handoff/ecosystem_map.json` валиден по контракту: нет висячих ссылок, у каждого ребра
   непустой `evidence`, `layers` ровно 12, у каждого узла `criticality` сходится с рубрикой.
3. Каждое ребро прослеживается до живого URL с цитатой.
4. Повторный прогон того же месяца не плодит дубли (идемпотентность по slug).
5. `ECOSYSTEM-CHANGELOG.md` читается за минуту.
6. Обновлены `ARCHITECTURE.md` (раздел про месячный конвейер) и `RUNBOOK.md` (как запускать).

# ЖУРНАЛ СБОРКИ

Веди `handoff/ECOSYSTEM-BUILD-LOG.md`: что решил, где отступил от плана и почему, что
не сошлось. Это то, что пользователь прочитает вместо разбора кода.

Работай до конца. Не останавливайся на подтверждения — кроме случая, когда контракт
требует изменения.
