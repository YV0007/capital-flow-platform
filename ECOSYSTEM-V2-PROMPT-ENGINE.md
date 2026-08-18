# ЗАДАЧА: движок карты «Экосистема NVIDIA» — v2, полная пересборка

Ты работаешь автономно в репозитории движка: **`/Users/macbook/Desktop/Capital Flow`**.
Решения принимай сам, вопросов не задавай — фиксируй выбор в журнале сборки (см. в конце).

## Что произошло и почему это пересборка, а не правка

Первая версия карты «Экосистема» отвечала на вопрос **«как устроена цепочка поставок
дата-центра для ИИ»**. Двенадцать слоёв, десять типов связей, два хребта, узел = звено
цепочки. Она работала, но отвечала не на тот вопрос.

Пользователь передал новый рамочный документ —
**`/Users/macbook/Desktop/BASE/Code/ab-investment/ECOSYSTEM-V2-BLUEPRINT.md`**
(NVIDIA Ecosystem Representation Blueprint v1.0). Прочитай его целиком первым делом:
это источник СМЫСЛА. Промпт ниже — источник ОБЯЗАТЕЛЬСТВ.

Новый вопрос карты: **«кто делает NVIDIA незаменимой, кто заперт в её орбите, кто её
шлюзует и чем она хеджируется»**. Это не цепочка поставок. Это карта взаимной
зависимости: многонаправленная, с контурами, с рвами и с политическими шлюзами.

**Три разрыва с v1 — каждый обязателен:**

1. **Отвязка от DC-AI.** Карта больше НЕ наследует таксономию из исследования
   «дата-центры для ИИ». Своя таксономия слоёв, свои сектора, ни одного поля,
   указывающего в DC-AI (`dcNode` мёртв). Причина: старая таксономия описывала стройку
   дата-центра, а новая описывает позицию NVIDIA в мире. Это разные онтологии, и
   склеивать их — значит получить карту, которая наполовину про бетон, наполовину
   про рвы.
2. **Якорь.** Экосистема теперь имеет ЦЕНТР — `anchor: "nvidia"`. Сущность, до которой
   от якоря не дойти за два шага, в карту не входит. v1 собирала «отрасль», v2 собирает
   «орбиту одной компании».
3. **Пилот — только NVDA.** Первый прогон делается ЦЕЛИКОМ, но ровно по одной
   экосистеме. Расширение на другие якоря — только после того, как этот прогон принят.
   Ничего не проектируй «на вырост» так, чтобы это удорожало пилот; но и не зашивай
   `nvidia` туда, где через месяц понадобится второй якорь (см. §«Расширяемость»).

## Границы

- Ты пишешь **только** в `/Users/macbook/Desktop/Capital Flow`.
- В `ab-investment` ты **не пишешь ничего**. Читать оттуда можно и нужно: блюпринт,
  этот промпт, промпт дашборда.
- Контракт передачи ниже в одиночку не меняешь.
- Параллельно с тобой идёт **вторая сборка** — дашборд в `ab-investment`. Вы не
  общаетесь и не ждёте друг друга. Единственная точка стыковки — контракт, он
  повторён в обоих промптах дословно. Дашборд соберёт визуал на фикстуре той же
  формы; когда ты отдашь настоящий файл, он подставится без правок кода.

## Что уже есть в твоём репозитории — прочитай перед стройкой

- `ARCHITECTURE.md`, `RUNBOOK.md` — как устроены недельный и месячный конвейеры.
- `agents/CONTEXT.md`, `agents/corporate.md` — **эталон формата брифа агента**.
- `agents/eco-CONTEXT.md` и шесть `agents/eco-*.md` — **брифы v1**. Формат хороший,
  содержание устарело. Переписываются под новую таксономию, не патчатся.
- `db/schema_eco.sql`, `engine/eco*.py`, `run_month.py` — **конвейер v1**. Структура
  (ingest → verify → score → cycles → handoff) правильная и сохраняется. Содержание
  таблиц и формул меняется целиком.
- `config/eco_layers.yaml`, `config/eco_rules.yaml`, `config/eco_watchlist.yaml` —
  конфиги v1, переписываются.
- `engine/db.py`, `engine/ingest.py`, `config/sources.yaml`, `config/aliases.yaml`,
  `entity_aliases` / `entity_external_ids` — **переиспользуй, не дублируй.** Резолвинг
  сущностей, реестр источников и паттерн прогонов уже решены.

## Шаг 0 — архив v1, до единой правки

```
mkdir -p archive/ecosystem-v1
git mv db/schema_eco.sql            archive/ecosystem-v1/
git mv engine/eco.py engine/eco_ingest.py engine/eco_verify.py \
       engine/eco_score.py engine/eco_cycles.py engine/eco_handoff.py \
                                    archive/ecosystem-v1/
git mv agents/eco-CONTEXT.md agents/eco-silicon.md agents/eco-systems.md \
       agents/eco-power.md agents/eco-infra.md agents/eco-models.md \
       agents/eco-capital.md        archive/ecosystem-v1/
git mv config/eco_layers.yaml config/eco_rules.yaml config/eco_watchlist.yaml \
                                    archive/ecosystem-v1/
cp     handoff/ecosystem_map.json   archive/ecosystem-v1/
```

Положи рядом `archive/ecosystem-v1/README.md` на десять строк: что это было, каким
вопросом отвечало, почему заменено, дата. Таблицы v1 в `capital.db` **не дропай** —
переименуй с префиксом `v1_` или оставь как есть; место дешевле истории.

Дальше всё новое пишется в файлы с суффиксом `_nv` или в `engine/nveco_*.py` — так,
чтобы `git log` показывал разрыв, а не эволюцию.

---
# КОНТРАКТ ПЕРЕДАЧИ — ЗАМОРОЖЕН

Этот блок дословно одинаков в промпте движка и в промпте дашборда. Ни одна сторона не
меняет его в одиночку. Нужна правка — остановись и напиши пользователю.

```
~/Desktop/Capital Flow/                          ← движок (агенты + Python + SQLite)
   └── МЕСЯЧНЫЙ конвейер
         → handoff/nvidia_ecosystem.json
              → ab-investment/src/data/nvidiaEcosystem.json
                   → src/data/nvidiaEcosystem.js   (адаптер)
                        → components/research/ecosystem/   (рисование)
```

**Имя файла новое.** Старый `ecosystemMap.json` (12 слоёв, экосистема `ai-datacenters`)
объявлен мёртвым и лежит в `archive/ecosystem-v1/`. Никакой миграции, никакой обратной
совместимости, никакого чтения старого файла. Чистый разрыв.

## Форма файла

```jsonc
{
  "schema": "nvidia-ecosystem/2",     // версия контракта, растёт при ЛЮБОЙ правке формы
  "generated": "2026-08-18",          // ISO-дата генерации
  "asOf": "2026-08",                  // месяц прогона
  "source": "engine",                 // "engine" | "fixture"
  "ecosystem": "nvidia",              // slug экосистемы; на пилоте всегда "nvidia"
  "anchor": "nvidia",                 // id якорной сущности — центр вопроса
  "totals": { "entities": 0, "edges": 0, "layers": 16, "cycles": 0, "techNodes": 0 },

  // ── СЛОИ ─────────────────────────────────────────────────────────────────
  // Переменной длины. Дашборд НЕ хардкодит ни число слоёв, ни их порядок:
  // всё, что нужно для раскладки, приходит в записи слоя.
  "layers": [
    { "id": "L3",
      "label": "ФАБРИКИ",              // ЗАГЛАВНЫМИ, ≤16 знаков
      "caption": "литография · процесс",// строчными, ≤28 знаков
      "plane": "orbit",                // "control" | "orbit" | "nucleus"
      "order": 3,                      // место на орбите по часовой стрелке
      "band": 2,                       // 1..5 — цветовая полоса
      "concentration": { "level": "monopoly", "hhi": 0.86, "top": ["tsmc"] }
    }
  ],

  // ── СЕКТОРА ──────────────────────────────────────────────────────────────
  // Собственная таксономия карты. Ни одного поля, указывающего в DC-AI.
  "sectors": [
    { "key": "foundry", "label": "Фабрики", "layer": "L3" }
  ],

  // ── СУЩНОСТИ ─────────────────────────────────────────────────────────────
  "entities": [
    {
      "id": "tsmc",                    // slug, СТАБИЛЕН между прогонами
      "name": "TSMC",
      "aliases": ["Taiwan Semiconductor Manufacturing Company"],
      "type": "company",               // company | geopolitical | agency | research_org | standards_body
      "role": "producer",              // producer | platform | operator | demand | capital | state
      "sector": "foundry",             // sectors[].key
      "layers": [                      // все слои, где сущность стоит
        { "layer": "L3", "primary": true, "criticality": 88 }
      ],
      "primaryLayer": "L3",

      "criticality": 88,               // 0..100, СЧИТАЕТ ДВИЖОК по рубрике ниже
      "criticalityFactors": {          // каждый 0..100
        "irreplaceability": 95,
        "lockInDepth": 90,
        "timeToReplace": 95,
        "strategicControl": 40
      },
      "criticalityWhy": {              // одна строка обоснования на фактор, ≤120 знаков
        "irreplaceability": "Ни одна другая фабрика не делает 3 нм в объёме",
        "lockInDepth": "Правила процесса вшиты в саму топологию чипа",
        "timeToReplace": "Равнозначная фабрика строится 7–10 лет",
        "strategicControl": "Места в совете нет, рычаг — только объём закупки"
      },

      "gravity": {                     // СЧИТАЕТ ДВИЖОК, структурно по графу
        "reach": 24,                   // со сколькими сущностями связана
        "layers": 6,                   // сколько слоёв задевает
        "edgeTypes": 4,                // сколько разных типов связей
        "cycles": 3,                   // на скольких замкнутых контурах стоит
        "score": 78,                   // 0..100
        "signals": {}                  // опционально: доля рынка и т.п., ТОЛЬКО из источника Tier 1–4
      },

      "oneLiner": "…",                 // ≤110 знаков, без жаргона, по-русски
      "whyIrreplaceable": "…",         // 2–3 предложения, ≤280 знаков, по-русски
      "whatBreaksIt": "…",             // ≤110 знаков: что обнулит позицию

      "phase": "mature",               // emerging | scaling | mature | at_risk | declining
      "risk": {
        "geopolitical": "critical",    // critical | high | medium | low
        "note": "…",                   // ≤200 знаков, по-русски
        "exportRegime": "TW_EXPORT_CONTROLS",   // null если не применимо
        "concentration": 92            // 0..100, концентрация в одной юрисдикции
      },

      "ticker": "NYSE: TSM",           // null если не публичная
      "publicPrivate": "public",       // public | private | government | academic
      "geo": "TW",                     // ISO-2 штаб-квартиры
      "founded": "1987",
      "revenueUsdB": 72.6,             // null если неизвестно / неприменимо
      "techNodes": ["n3", "n5"],       // techNodes[].id

      "firstSeen": "2026-08",
      "lastConfirmed": "2026-08",
      "stale": false,                  // true если lastConfirmed старше 6 месяцев
      "sources": [ /* Source, см. ниже */ ]
    }
  ],

  // ── ТЕХ-УЗЛЫ ─────────────────────────────────────────────────────────────
  "techNodes": [
    { "id": "cuda", "label": "CUDA", "owner": "nvidia",
      "note": "Слой программирования GPU", "importance": "critical" }
  ],

  // ── СВЯЗИ ────────────────────────────────────────────────────────────────
  "edges": [
    {
      "id": "nvidia__tsmc__manufactures",   // "<source>__<target>__<type>", СТАБИЛЕН
      "source": "nvidia",
      "target": "tsmc",
      "type": "manufactures",               // из таксономии связей ниже
      "spine": "physical",                  // physical | capital | moat | control | rivalry
      "direction": "upstream",              // upstream | downstream | lateral | bidirectional

      "strength": 95,                       // 0..100
      "lockInDepth": 90,                    // 0..100
      "substitutability": 5,                // 0..100, ОБРАТНАЯ шкала: 0 = незаменимо
      "isReversible": false,

      "status": "confirmed",                // confirmed | high_confidence | signal
      "confidence": 0.98,                   // 0..1
      "sourceTier": 1,                      // 1..6, ЛУЧШИЙ тир среди evidence
      "confirmedSources": 2,                // сколько независимых источников

      "risk": {
        "level": "critical",                // critical | high | medium | low
        "type": "geopolitical",             // geopolitical | substitution | market | regulatory | technical | none
        "timeline": "2-5y",                 // immediate | 1-2y | 2-5y | 5y+ | ongoing | none
        "mitigation": "…"                   // ≤160 знаков, по-русски; null если нечем крыть
      },

      "techNode": "n3",                     // null если связь не про конкретную технологию
      "formed": "1998",                     // год возникновения связи
      "strengthened": "2020",               // год, когда связь резко углубилась; null
      "lastConfirmed": "2026-08",
      "note": "…",                          // ≤200 знаков, по-русски, без жаргона
      "evidence": [ /* Source, ≥1 ОБЯЗАТЕЛЬНО */ ]
    }
  ],

  // ── КОНТУРЫ ──────────────────────────────────────────────────────────────
  "cycles": [
    { "id": "c1", "type": "sales",          // sales | financing | lockin
      "path": ["nvidia", "openai", "coreweave", "nvidia"],
      "edges": ["nvidia__openai__invests_in", "…"],
      "note": "…" }
  ],

  "changelog": { "month": "2026-08", "added": [], "removed": [], "changed": [] }
}
```

## Source — единая форма для `entities[].sources` и `edges[].evidence`

```jsonc
{
  "tier": 1,                     // 1..6, см. «Тиры источников»
  "type": "sec_filing",          // sec_filing | earnings_call | company_pr | partner_pr |
                                 // product_doc | white_paper | patent | interview | conference |
                                 // testimony | research | analyst | database | press | social
  "title": "NVIDIA 10-K, Risk Factors",
  "url": "https://www.sec.gov/…",
  "published": "2026-04-30",     // дата публикации
  "fetched": "2026-08-18",       // когда движок реально ходил по ссылке
  "alive": true,                 // ссылка ответила 200 при последней проверке
  "quote": "…",                  // ДОСЛОВНАЯ цитата из источника, СТРОГО ≤15 слов
  "confidence": 0.98             // 0..1
}
```

## Железные правила

1. **`entities[].id` и `edges[].id` стабильны между прогонами.** Переименование = потеря
   истории. Новый id заводится только для действительно новой сущности.
2. **`edges[].source` / `target` ссылаются на существующий `entities[].id`.** Висячая
   ссылка — это баг движка. Адаптер такое ребро **выбрасывает** и пишет `console.warn`.
3. **`evidence` непустой у каждого ребра. Нет цитаты — нет ребра.** Цитата дословная и
   ≤15 слов. Пересказ вместо цитаты — брак.
4. **Каждая сущность связана с якорем (`anchor`) не длиннее чем в 2 шага.** Сущность,
   до которой от NVIDIA не дойти за два хода, в файл не попадает. Это и есть «экосистема
   NVIDIA», а не «мировая полупроводниковая промышленность».
5. **Дашборд не считает ничего сам.** `criticality`, `criticalityFactors`, `gravity`,
   `concentration`, `cycles`, `spine`, `stale` приходят посчитанными. На стороне
   дашборда — только отрисовка и фильтрация.
6. **`layers` переменной длины.** Дашборд читает `plane`, `order`, `band` из записи слоя
   и не хардкодит ни одного идентификатора слоя. Придёт 12 слоёв или 20 — карта соберётся.
7. **Никаких ссылок в DC-AI.** Поля `dcNode` не существует ни у сущности, ни у сектора.
   Карта самодостаточна: терминология объясняется внутри неё.
8. **camelCase во всём JSON.** В блюпринте схема записана snake_case — это язык
   исследования; язык передачи здесь camelCase, движок конвертирует на выходе.
9. **Числа — числа.** `criticality`, `strength`, `lockInDepth`, `substitutability`,
   `confidence` приходят числами, а не строками, и уже в своих диапазонах.
10. **Контракт не меняется в одностороннем порядке.**

## ТАКСОНОМИЯ СЛОЁВ — ФИКСИРОВАНА

16 слоёв, L0…L15. Это ПОЛНАЯ замена прежним 12; соответствия между старой и новой
нумерацией нет и искать его не надо.

| id | label | caption | plane | order | band |
|---|---|---|---|---|---|
| L0  | ГЕОПОЛИТИКА       | юрисдикции · контроль доступа | control | 0  | – |
| L1  | СЫРЬЁ И СТАНКИ    | материалы · оборудование      | orbit   | 1  | 1 |
| L2  | ПРОЕКТИРОВАНИЕ    | софт для чипов · лицензии     | orbit   | 2  | 1 |
| L3  | ФАБРИКИ           | литография · процесс          | orbit   | 3  | 2 |
| L4  | ПАМЯТЬ            | HBM · DRAM · хранение         | orbit   | 4  | 2 |
| L5  | СИСТЕМЫ           | сборка · серверы · стойки     | orbit   | 5  | 3 |
| L6  | ЭНЕРГИЯ           | генерация · передача тока     | orbit   | 6  | 3 |
| L7  | ОХЛАЖДЕНИЕ        | тепло · вода · жидкость       | orbit   | 7  | 3 |
| L8  | СВЯЗЬ             | сеть · оптика · коммутация    | orbit   | 8  | 4 |
| L9  | ИНФРАСТРУКТУРА    | площадки · облака             | orbit   | 9  | 4 |
| L10 | ПЛАТФОРМА         | CUDA · фреймворки             | orbit   | 10 | 5 |
| L11 | ИНФЕРЕНС          | запуск моделей · оркестрация  | orbit   | 11 | 5 |
| L12 | ЛАБОРАТОРИИ       | модели · обучение             | orbit   | 12 | 5 |
| L13 | ПРИЛОЖЕНИЯ        | ИИ в бизнесе · отрасли        | orbit   | 13 | 5 |
| L14 | КАПИТАЛ           | кто владеет и финансирует     | nucleus | 14 | – |
| L15 | РЕГУЛИРОВАНИЕ     | правила · субсидии · стандарты| control | 15 | – |

**Три плана карты** — единственная геометрическая новость по сравнению с v1:

- **`nucleus`** (L14) — ядро молекулы. Капитал владеет стеком и финансирует его, сам в
  нём не стоя. Ровно та позиция, что и в v1, и та же, что у аллокаторов на карте потоков.
- **`orbit`** (L1…L13) — 13 ячеек по кольцу, угол = `order`, цвет = `band`. Радиус
  считает раскладка: слой, торгующий со многими ДРУГИМИ слоями, подтягивается к центру.
- **`control`** (L0, L15) — внешняя дуга. Государства, агентства и стандарты не стоят
  в стеке — они его **шлюзуют**. Отдельный план нужен ровно потому, что вставить США
  между «памятью» и «системами» значит соврать про природу связи.

## ТАКСОНОМИЯ СВЯЗЕЙ — ФИКСИРОВАНА

31 тип на пяти хребтах. Хребет задаёт цветовую семью, тип — подпись и глагол.

**`physical`** — что физически движется и что кем собрано (холодная гамма, синий→бирюза):
`manufactures` · `supplies` · `packages` · `integrates` · `delivers_to` · `enables` ·
`co_designs` · `optimizes_for`

**`capital`** — кто платит и кто владеет (тёплая гамма, янтарь→глина):
`invests_in` · `funded_by` · `board_seat` · `strategic_partner` · `hedges_against` ·
`diversifies_supply` · `customer_of`

**`moat`** — что запирает и что доказывает спрос (зелёная гамма):
`validates_demand` · `proves_roi` · `proves_use_case` · `locks_in_developers` ·
`locks_in_platforms` · `path_dependent_on` · `standardizes_on` · `sets_benchmark` ·
`defines_category`

**`control`** — кто шлюзует доступ (красная гамма):
`controls_access_to` · `subject_to_restriction` · `export_controlled_by` ·
`geopolitically_dependent`

**`rivalry`** — кто откусывает (серо-фиолетовая гамма):
`competes_with` · `threatens` · `could_disrupt`

Хребет **выводится из типа детерминированно** и пишется движком в поле `spine`.
Дашборд его не вычисляет — он его красит.

**Почему пять, а не два.** В v1 хребтов было два: «физика» и «капитал», и этого хватало,
пока карта отвечала на вопрос «кто кому поставляет». Блюпринт спрашивает другое: «кто
кого делает дороже, кто заперт, кто чем хеджируется». Ров (`moat`) и шлюз (`control`) —
это не разновидности поставки и не разновидности денег, это отдельные механики власти,
и одним цветом с поставкой они читаться не должны.

## РУБРИКА КРИТИЧНОСТИ — ФИКСИРОВАНА

```
criticality = round(0.30·irreplaceability + 0.30·lockInDepth
                  + 0.25·timeToReplace   + 0.15·strategicControl)
```

Каждый фактор — 0..100. Веса менять нельзя. Считает **движок**, не агент и не дашборд:
агент отдаёт четыре фактора и по строке обоснования на каждый, арифметику делает Python.

Шкалы факторов — §«Criticality Scoring Model» блюпринта, дословно:

- **irreplaceability** — 95–100 монополия с рвом 7+ лет · 85–94 дуополия · 75–84 замены
  есть, но упираются во время и капитал · 65–74 замены заметно хуже · 50–64 альтернативы
  ясны, преимущество в инерции · 30–49 коммодити · 0–29 полные близнецы.
- **lockInDepth** — 95–100 задевает 4+ слоя стека · 85–94 три слоя · 75–84 два слоя ·
  65–74 один-два с сильной зависимостью · 50–64 один со средней · 30–49 один со слабой ·
  0–29 один слой, меняется на лету.
- **timeToReplace** — 95–100 семь лет и больше · 85–94 пять-семь · 75–84 три-пять ·
  65–74 два-три · 50–64 год-два · 30–49 полгода-год · 0–29 замена немедленная.
- **strategicControl** — 95–100 дочерняя компания или место в совете плюс крупные
  вложения · 85–94 вложения от $1 млрд плюс соглашение · 75–84 $100 млн–$1 млрд плюс
  совместная разработка · 65–74 $10–100 млн плюс формальное партнёрство · 50–64 публичное
  партнёрство без денег · 30–49 неформальные отношения · 0–29 отношений нет или они враждебны.

Проверка на TSMC: 95·0.30 + 90·0.30 + 95·0.25 + 40·0.15 = 28.5 + 27 + 23.75 + 6 = **85**.
Проверка на коммодити-разъёме 15/25/20/0: 4.5 + 7.5 + 5 + 0 = **17**.

Итоговые полосы: **90–100 критично** · 75–89 высоко · 60–74 средне · 45–59 ниже среднего ·
0–44 низко.

## ТИРЫ ИСТОЧНИКОВ — ФИКСИРОВАНЫ

| Тир | Что это | Доверие |
|---|---|---|
| 1 | Официальная NVIDIA: 10-K/10-Q, стенограммы звонков, пресс-релизы, вайтпейперы, патенты, презентации для инвесторов | 0.95–1.00 |
| 2 | Официальное от контрагента: его пресс-релизы про NVIDIA, его звонки, документация продукта, каталог NVIDIA-Certified, партнёрский директорий | 0.90–0.95 |
| 3 | Прямая речь принципалов: подкасты с Хуангом, GTC и Davos, инвестконференции, показания в Конгрессе, верифицированные интервью | 0.85–0.90 |
| 4 | Исследования и данные: научные статьи, лидерборды, отчёты аналитиков, Crunchbase/PitchBook | 0.75–0.85 |
| 5 | Вторичная пресса: Bloomberg, Reuters, WSJ, The Information, отраслевые рассылки | 0.65–0.75 |
| 6 | Третичное и сигналы: подкасты без принципалов, соцсети, форумы, блоги, видео | 0.40–0.65 |

**Правило подтверждения — не смягчается:**

- `status: "confirmed"` — два и более источника тира 1–2, **либо** один тира 1 плюс один тира 3.
- `status: "high_confidence"` — один тира 1, **либо** два тира 2–3.
- `status: "signal"` — один тира 4 и ниже, либо только косвенные признаки.

Связь, у которой нет ни одного источника тира 1–3, **не может** нести `risk.level:
"critical"` и не может иметь `strength > 80`: движок обрезает и пишет в лог.

## ПОРОГ STRENGTH

В файл пишется всё. На карте по умолчанию рисуются рёбра `strength >= 20`, ползунок
опускает до 0. **В панели сущности список связей всегда полный** — зависимость, которую
не видно из-за положения ползунка, забывается.

---

# ЧТО ПОСТРОИТЬ

## 1. Схема — `db/schema_nveco.sql`, в тот же `db/capital.db`

Таблицы (имена с префиксом `nveco_`, чтобы не столкнуться с v1):

- `nveco_entity` — id, name, type, role, sector, primary_layer, phase, ticker,
  public_private, geo, founded, revenue_usd_b, first_seen, last_confirmed.
- `nveco_entity_layer` — (entity_id, layer_id, is_primary, criticality). Сущность в
  нескольких слоях — несколько строк, не массив в колонке.
- `nveco_entity_factor` — (entity_id, factor, value 0..100, why). Четыре строки на
  сущность. Так фактор и его обоснование живут вместе, и `criticalityWhy` собирается
  без отдельной таблицы.
- `nveco_entity_risk` — (entity_id, geopolitical, note, export_regime, concentration).
- `nveco_edge` — id, source_id, target_id, type, spine, direction, strength,
  lock_in_depth, substitutability, is_reversible, status, confidence, source_tier,
  confirmed_sources, risk_level, risk_type, risk_timeline, risk_mitigation,
  tech_node, formed, strengthened, last_confirmed, note.
- `nveco_source` — единая таблица источников для сущностей и рёбер:
  (owner_kind ∈ {entity, edge}, owner_id, tier, type, title, url, published, fetched,
  alive, quote, confidence). Одна таблица, а не две: `eco_verify` тогда ходит по
  ссылкам одним проходом.
- `nveco_tech_node` — id, label, owner_id, note, importance.
- `nveco_cycle` + `nveco_cycle_edge`.
- `nveco_run` — прогон: month, agent, rows_in, rows_kept, rejected, notes.

CHECK-констрейнты обязательны и делают половину валидации бесплатно:
`criticality BETWEEN 0 AND 100`, `tier BETWEEN 1 AND 6`, `spine IN (…)`,
`type IN (…31 значение…)`, `status IN ('confirmed','high_confidence','signal')`,
`phase IN ('emerging','scaling','mature','at_risk','declining')`.
Стиль — как в `db/schema.sql`: `created_at`, UNIQUE на естественный ключ.

## 2. Конфиги

- `config/nveco_layers.yaml` — 16 слоёв дословно по таблице таксономии выше:
  id, label, caption, plane, order, band. **Это единственное место**, где живёт
  таксономия слоёв. Ни один Python-модуль не хардкодит «L3».
- `config/nveco_edges.yaml` — 31 тип связи → хребет, русский глагол, русская подпись,
  направление по умолчанию. Тоже единственное место.
- `config/nveco_anchors.yaml` — реестр якорей. На пилоте одна запись:
  `nvidia: { id: nvidia, name: NVIDIA, ticker: "NASDAQ: NVDA", hops: 2 }`.
- `config/nveco_watchlist.yaml` — стартовый список сущностей на прогон, по агентам.
  Заполняется из §«NVIDIA Blueprint: Layer-by-Layer» блюпринта: это не полный ответ,
  а затравка для STEP 1, агент обязан искать сверх списка.
- `config/sources.yaml` — **дополни, не переписывай**: добавь тиры 1–6 новой шкалы
  и правило соответствия домен → тир (sec.gov → 1, nvidia.com/newsroom → 1,
  investor.<partner>.com → 2, arxiv.org → 4, bloomberg.com → 5, x.com → 6).

## 3. Агенты — `agents/nveco-CONTEXT.md` + семь брифов + синтезатор

`nveco-CONTEXT.md` — общий контекст, читается каждым агентом первым: что такое эта
карта, что такое якорь, правило двух шагов, рубрика, тиры, формат CSV, стилевые
правила русского текста.

| Бриф | Слои | Ориентир по числу сущностей |
|---|---|---|
| `agents/nveco-geo.md`      | L0, L15      | 10–14 |
| `agents/nveco-silicon.md`  | L1–L4        | 18–24 |
| `agents/nveco-systems.md`  | L5, L8, L9   | 16–22 |
| `agents/nveco-power.md`    | L6, L7       | 10–14 |
| `agents/nveco-software.md` | L10, L11     | 12–16 |
| `agents/nveco-models.md`   | L12, L13     | 14–18 |
| `agents/nveco-capital.md`  | L14          | 10–14 |
| `agents/nveco-strategic.md`| сквозной, БЕЗ поиска новых сущностей | — |

Каждый бриф строится по **семишаговому воркфлоу блюпринта** (§Agent Research Workflows),
без сокращений:

1. **BASELINE DISCOVERY** — найти всех живых участников слоя. Обязательные точки входа:
   партнёрский директорий NVIDIA, каталог NVIDIA-Certified Systems, референсные
   архитектуры, повестка GTC, вайтпейперы, 10-K NVIDIA (раздел про поставщиков и риски).
2. **ACTIVE STATUS CHECK** — не поглощён ли, не мёртв ли, есть ли активность за 6 месяцев.
3. **RELATIONSHIP DETECTION** — все способы, которыми сущность связана с якорем и с
   соседями по стеку. Вопросы из блюпринта задаются буквально: вкладывается ли NVIDIA;
   партнёрство ли это; кто кому поставляет; конкуренты ли они одновременно.
4. **CRITICALITY ASSESSMENT** — четыре фактора 0..100 **плюс строка обоснования на
   каждый**. Агент НЕ считает итог: веса применяет Python.
5. **RISK & TIMELINE** — геополитика, замещение, рынок, регуляторика, техника; горизонт
   и чем NVIDIA кроет.
6. **SOURCE DOCUMENTATION** — на каждое ребро 1–3 источника, дословная цитата ≤15 слов,
   тир, дата, живой URL.
7. **SYNTHESIS & QA** — чего явно не хватает, где связи должны быть двусторонними,
   не противоречат ли оценки собственному тексту `whyIrreplaceable`.

`nveco-strategic.md` — восьмой агент, запускается **после** остальных семи и не ищет
новых сущностей. Его работа: контуры, которые не видит ни один слоевой агент
(`nvidia → openai → coreweave → nvidia`), рвы, хеджи, и список дыр на следующий месяц.
Именно он ставит рёбра хребтов `moat` и `rivalry` между слоями.

**Стилевые правила русского текста — жёсткие, это поля агентов:**
`oneLiner` ≤110 знаков, `whyIrreplaceable` ≤280, `note` ≤200, `whatBreaksIt` ≤110.
Пишутся для человека, который не знает стек. Не «кастомные ASIC гиперскейлеров», а
«облака переведут обучение на собственные чипы под одну свою задачу». Аббревиатура
допустима, только если она тут же расшифрована. Английские термины — только там, где
русского эквивалента нет (CUDA, HBM), и тогда с пояснением при первом появлении.

## 4. Формат выдачи агента

Каждый агент пишет в `runs/<YYYY-MM>/<agent>/` ровно четыре CSV — так же, как в v1,
потому что CSV диффится и ревьюится глазами, а YAML на 300 сущностей — нет:

- `entities.csv` — id, name, aliases (`|`-разделитель), type, role, sector,
  primary_layer, layers (`|`), phase, ticker, public_private, geo, founded,
  revenue_usd_b, one_liner, why_irreplaceable, what_breaks_it,
  geo_risk, geo_risk_note, export_regime, concentration
- `factors.csv` — entity_id, irreplaceability, lock_in_depth, time_to_replace,
  strategic_control, why_irreplaceability, why_lock_in, why_time, why_control
- `edges.csv` — source, target, type, direction, strength, lock_in_depth,
  substitutability, is_reversible, risk_level, risk_type, risk_timeline,
  risk_mitigation, tech_node, formed, strengthened, note
- `sources.csv` — owner_kind, owner_key, tier, type, title, url, published, quote, confidence

`owner_key` для ребра — `"<source>__<target>__<type>"`; id ребра собирает движок, агент
его не выдумывает. Поля `spine`, `criticality`, `status`, `confidence` ребра,
`confirmed_sources`, `source_tier`, `gravity`, `stale` агент **не заполняет вообще** —
это вычисляемые поля, и дать агенту их писать значит однажды получить карту, где
цифры не сходятся с собственной рубрикой.

## 5. Детерминированный слой — `engine/nveco_*.py`

- `nveco_ingest.py` — валидация CSV против конфигов (тип связи существует? слой
  существует? фактор в 0..100?), резолвинг имён через существующий `entity_aliases`,
  дедуп, загрузка. Отвергнутые строки не молчат: пишутся в
  `runs/<month>/_rejected/<agent>.csv` с причиной и считаются в `nveco_run`.
- `nveco_verify.py` — переобход **каждой** ссылки: HTTP-статус, `alive`, `fetched`.
  Мёртвая ссылка не удаляет ребро, но снимает с него один `confirmed_sources`, что
  может уронить `status` — и это правильное поведение.
- `nveco_score.py` — веса рубрики, `spine` из типа, `status` и `confidence` из тиров
  по правилу подтверждения, `gravity` структурно по графу, `concentration` слоя (HHI
  по `criticality` внутри слоя), `stale` по дате. **Обрезки тоже здесь**: связь без
  источника тира 1–3 не может нести `critical` и `strength > 80` — режем и логируем.
- `nveco_cycles.py` — замкнутые контуры до длины 5, классификация: `sales` (контур
  идёт по `physical` + `customer_of`), `financing` (есть ребро `capital`), `lockin`
  (есть ребро `moat`). Контуры — главный аргумент новой карты, им нужен свой тест.
- `nveco_handoff.py` — сборка `handoff/nvidia_ecosystem.json` строго по контракту,
  `ECOSYSTEM-V2-CHANGELOG.md` (added / removed / changed против прошлого месяца),
  и **валидатор на выходе**: файл, не прошедший все железные правила, не пишется.

## 6. Оркестратор — `run_nvidia.py`

По образцу `run_month.py`:
`python run_nvidia.py [YYYY-MM] [--anchor nvidia] [--skip-agents] [--deliver] [--offline] [--verify-limit N]`

`--deliver` копирует в
`~/Desktop/BASE/Code/ab-investment/src/data/nvidiaEcosystem.json` — и это
**единственная** запись в чужой репозиторий. Отсутствие директории агента не фатально:
месяц, где обновили два слоя из шестнадцати, — легальный прогон.

## 7. Расширяемость — ровно столько, сколько бесплатно

`anchor` — колонка в `nveco_entity`… нет: **колонка в `nveco_run`** и поле в
`config/nveco_anchors.yaml`. Слои, типы связей и рубрика от якоря не зависят и
переиспользуются целиком. Всё, что нужно для второго якоря через месяц, — новая
запись в конфиге и новый прогон. Больше ничего «на вырост» не делай: ни абстрактных
провайдеров, ни плагинов, ни мультиэкосистемных джойнов.

---

# ПИЛОТНЫЙ ПРОГОН — ТОЛЬКО NVDA

Один якорь, один месяц, полный конвейер от агентов до файла.

**Целевые цифры** (ориентир, не квота — лучше 80 честных, чем 120 натянутых):

| | Цель |
|---|---|
| Сущности | 90–120 |
| Рёбра | 220–340 |
| Слои непустые | все 16, минимум 4 сущности в каждом |
| Контуры | ≥6, минимум по одному каждого типа |
| Доля `status: confirmed` | ≥55% рёбер |
| Доля рёбер с источником тира 1–3 | ≥70% |
| Мёртвых ссылок после `verify` | 0 |
| Сущностей дальше 2 шагов от якоря | 0 |

**Обязательные к покрытию узлы** — если после прогона какого-то из них нет, это дыра,
а не решение: NVIDIA, TSMC, ASML, Synopsys, Cadence, ARM, SK Hynix, Micron, Samsung,
Foxconn, Supermicro, Vertiv, Eaton, Arista, Broadcom, Microsoft, Amazon, Google,
CoreWeave, Nebius, OpenAI, Anthropic, Meta, xAI, Hugging Face, PyTorch, CUDA, vLLM,
Databricks, США, Тайвань, Китай, Нидерланды, Южная Корея, Bureau of Industry and
Security, CFIUS, NVIDIA Ventures (NVentures).

**Три связи, на которых проверяется, что карта отвечает на новый вопрос.** Если они
получились плоскими «поставками» — рубрика применена неправильно:

1. `cuda —locks_in_developers→ pytorch`, `bidirectional`, `isReversible: false`,
   `lockInDepth` 90+, хребет `moat`. Не «поставка софта».
2. `openai —validates_demand→ nvidia`, хребет `moat`. Спрос как доказательство, а не
   как закупка. Отдельно от него — `openai —customer_of→ nvidia`, хребет `capital`.
3. `nvidia —hedges_against→ coreweave`, хребет `capital`, с `risk.mitigation`,
   объясняющим, ПРОТИВ ЧЕГО хедж (монополия гиперскейлеров на инференс).

---

# КРИТЕРИИ ГОТОВНОСТИ

- [ ] v1 заархивирован, `archive/ecosystem-v1/README.md` на месте.
- [ ] 16 слоёв и 31 тип связи живут в YAML, ни один не захардкожен в Python.
- [ ] `db/schema_nveco.sql` применяется на чистой БД без ошибок; CHECK-констрейнты ловят
      мусор (проверь намеренно битой строкой).
- [ ] Восемь брифов написаны по семишаговому воркфлоу; каждый содержит свой список
      обязательных Tier-1 проверок и свои гочи.
- [ ] `run_nvidia.py 2026-08` проходит целиком на реальных выдачах агентов.
- [ ] `nveco_verify` реально ходил по сети; `alive: false` нигде не осталось.
- [ ] Валидатор `nveco_handoff` отвергает файл, если нарушено любое железное правило —
      проверено намеренной порчей (висячий `target`, ребро без evidence, цитата в 30 слов).
- [ ] Все целевые цифры пилота достигнуты либо расхождение объяснено в журнале.
- [ ] Три контрольные связи из списка выше есть и имеют правильный хребет.
- [ ] `handoff/nvidia_ecosystem.json` собран, `source: "engine"`.
- [ ] `--deliver` кладёт файл в дашборд; больше ничего в `ab-investment` не тронуто.
- [ ] `ECOSYSTEM-V2-CHANGELOG.md` сгенерирован.
- [ ] `RUNBOOK.md` дополнен разделом про месячный прогон NVIDIA.

# ЖУРНАЛ СБОРКИ

Веди `handoff/NVIDIA-ECOSYSTEM-BUILD-LOG.md` по ходу, не в конце. На каждое решение,
которое ты принял сам: что выбрал, из чего выбирал, почему. Отдельным разделом —
**«Где блюпринт разошёлся с реальностью»**: места, где источников не нашлось, где
рубрика дала неинтуитивный результат, где 16 слоёв оказались неудобны. Это вход в
разговор о расширении на второй якорь, и он ценнее, чем гладкий отчёт.
