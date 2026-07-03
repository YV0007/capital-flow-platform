# KKR & Co — Holdings dossier

KKR · тип asset manager · дата 28.06.2026 · источников: 35

> KKR & Co. Inc. (NYSE: KKR) — глобальный alternative asset manager с тремя сегментами: Asset Management (комиссии за управление PE/credit/real assets фондами + capital markets), Insurance (Global Atlantic, 100% KKR) и Strategic Holdings (прямые мажоритарные доли в core-PE компаниях на балансе KKR, приносящие дивиденды). На 31.03.2026 AUM $757.9B, FRE $3.91B LTM (+14% г/г, margin 69%), но ANI вырос лишь +5% LTM из-за переноса монетизаций — это проблема тайминга окна выходов, а не комиссионной базы. Для решения hold/add/cut ключевые узлы: акция $90.13 (-41% от 52-недельного максимума $153.87, P/ANI ~17.7x против пиковых ~30x), insider-buying обоих Co-CEO на просадке и ухудшение кредита в управляемом BDC (FSK, NAV -9.9% за квартал).

## Tier 1 — Substance

### 01 Текущий портфель

13F-позиции KKR (Masonite, Amedisys, Lamar и т.д.) — это активы клиентских фондов, НЕ баланс KKR; они исключены из анализа холдинга. Собственный баланс KKR состоит из трёх частей: Asset Management (co-invest в свои фонды), Insurance (Global Atlantic) и Strategic Holdings (прямые core-PE доли).

**AUM (управляемый для клиентов, не на балансе KKR): $757.9B; FPAUM $614.8B; perpetual capital $326B (43% AUM, 51% FPAUM).** Все три цифры подтверждены первичным earnings release Q1'26 (SEC 8-K, 05.05.2026, открыт через curl HTTP 200).

**Ring 1 — балансовые позиции с опубликованной оценкой**

| Позиция | Vehicle / тип | Оценка (31.03.2026) | Описание |
|---|---|---|---|
| Global Atlantic (страхование) | 100% KKR, Insurance segment | Book value $11.66B (точно $11,664,526K, primary); GA AUM $231B | Страховщик аннуитетов/life/перестрахования; net investment income $1.9B за Q1'26; Insurance operating earnings $260.3M Q1, $1,110,953K LTM |
| Asset Management investments | На балансе KKR (co-invest в свои фонды) | Fair value $7,999M (primary); embedded unrealized gains $2.8B | Собственный капитал KKR в своих фондах; 41% Traditional PE, 16% Real Estate, 13% Growth Equity, 7% Infra (разбивка не переподтверждена из release — см. gaps) |
| FS KKR Capital (FSK) | Публичный BDC (NYSE: FSK), KKR — advisor | Портфель fair value $12.3B, 236 компаний, NAV/share $18.83 | KKR владеет долей акций FSK и получает management/incentive fees; non-accrual 4.2% по fair value (подтверждено сайтом FSK) |

**Ring 1 — флагманские фонды** (commitment / remaining fair value из vehicle-таблиц; цифры из FACTS-агента, источник 10-Q; точные строки 10-Q НЕ переподтверждены мной построчно — SEC HTML недоступен через WebFetch, см. gaps)

| Фонд (vintage) | Commitment | Remaining FV | Realized | Описание |
|---|---|---|---|---|
| North America Fund XIII (2021) | $18.4B | $23.45B | $0.57B | Крупнейший активный североамериканский PE-фонд предыдущего vintage |
| North America Fund XIV (2025) | $21.9B / vintage 4/2025 | $0 (только начал) | $0 | Крупнейший в истории KKR фонд только для Северной Америки (агенты дают $21.9B commitment и "$23B vintage" — расхождение, не сверено) |
| Asian Fund IV (2020) | $14.7B | $16.20B | $4.23B | Азиатский PE-фонд |
| Global Infrastructure Investors IV (2021) | $16.6B | $19.62B | $1.70B | Инфраструктурный фонд |
| Diversified Core Infrastructure (открытый) | $14.3B | $13.51B | $1.72B | Бессрочный core-инфраструктурный фонд |

**Ring 2 — Strategic Holdings (названы, БЕЗ поштучной fair value на балансе; учитываются по дивидендам)**
KKR раскрывает только агрегат, не fair value по каждой компании. Strategic Holdings operating earnings = $48,296K Q1'26 / $178,906K LTM (в release это строка "Dividends, Net" — подтверждено primary). KKR's доля LTM Adjusted EBITDA по этим компаниям ~$1.1B. Названные мажоритарные core-PE активы (из инвест-релизов / 2024 Investor Day, не из Q1'26 release): **USI Insurance Services**, **Heartland Dental**, **1-800 Contacts**, **Internet Brands**, **Mills Fleet Farm**, **BridgeBio** (частично реализована). Полный список ~18-19 компаний единым первичным документом не подтверждён.

### Концентрация и структура
- **Топ-1 балансовая позиция: Global Atlantic** (book value $11.66B) — крупнее всего собственного Asset Management-портфеля ($7,999M).
- **Гео (Strategic Holdings, KKR's share EBITDA):** Americas 64%, Europe 31%, Asia Pacific 5% (из агента, не переподтверждено).
- **Отрасли (Strategic Holdings):** Business Services 33%, Consumer 28%, Health Care 16%, TMT 14%, Infrastructure 6%, Industrials 3% (из агента, не переподтверждено).
- **Listed vs unlisted:** портфель преимущественно unlisted; единственная крупная публичная балансовая экспозиция — доля в FSK (NYSE: FSK).
- **AI-линза (реальна):** через инфраструктуру/энергетику и data-center спрос (Helix Digital Infrastructure $10B+, Global Infrastructure фонды, core infra), не через страховой core.

### 02 Недавние изменения

**Покупки / новые vehicle**

| Дата | Сделка | Размер | Vehicle | Статус |
|---|---|---|---|---|
| 05.05.2026 | **Arctos Partners** (инвестор в доли спортивных франшиз, ~$15B AUM) | $1.4B initial ($300M cash + $900M + $200M equity) + до $550M earn-out до 2031 | Корп. поглощение KKR (платформа KKR Solutions) | ЗАКРЫТО (подтверждено BusinessWire 04-05.05.2026; primary указывает ~$15B AUM, а не $16B) |
| 04.12.2025 | **Spectris plc** (приборостроение, делистинг с LSE) | £4.7B (~$6.5B) | Фонды KKR | ЗАКРЫТО (подтверждено BusinessCloud/MergerLinks/Financier Worldwide) |
| 10.10.2025 | **OSTTRA** (post-trade сервисы) от S&P Global и CME | $3.1B EV | Фонды KKR (Infrastructure) | ЗАКРЫТО |
| 19.02.2025 | **Fuji Soft** (японский IT) через тендер | ~$4.4B | Фонды KKR Asia | ЗАКРЫТО (тендер выигран у Bain) |

**Продажи / монетизации**

| Дата | Сделка | Размер | Эффект |
|---|---|---|---|
| май 2026 | Продажа аэрокосмического бизнеса **Circor** компании Parker Hannifin | $2.55B | KKR сохраняет naval/industrial Circor (подтверждено WebSearch; прямой KKR-PR не открыт — см. gaps) |
| Q1'26 | Net realized performance income $197,191K Q1 (+124% г/г vs $87,989K Q1'25); за LTM инвестировано $97B | — | Подтверждено primary; ВАЖНО: LTM realized performance income $600,938K — это СНИЖЕНИЕ vs $618,779K годом ранее, несмотря на сильный квартал |

**Капитал к развёртыванию (dry powder)**
- **Uncalled commitments: $124,857K тыс. (~$125B)** на 31.03.2026 (+14% г/г vs $115,628K тыс.) — primary-подтверждено. Разбивка PE $53B / Real Assets $37B / Credit $34B — из агента, не сверена построчно.
- **AUM not yet paying fees: $64B** committed — primary-подтверждено; встроенный рост management fees при инвестировании.
- New capital raised: $27,750K тыс. ($27.75B) за Q1'26, $126,609K тыс. ($126.6B) LTM — primary. K-Series AUM $38B (vs $21B годом ранее) — primary.

**PENDING / незакрытое**
- Увеличение долей в core-PE (USI, 1-800 Contacts, Heartland Dental) на ~$1.1B (+ Chubb ~$1.0B) — анонс 1H2025, +~$50M/год к Strategic Holdings OE; полное завершение всех траншей первичным источником на 28.06.2026 НЕ подтверждено (см. gaps).

### Track record капитал-аллокации

Для asset manager качество = реализованная доходность по vintage. Цифры из 10-Q vehicle-таблиц по агенту FACTS; SEC 10-Q HTML недоступен через WebFetch, поэтому MOIC ниже НЕ переподтверждены мной построчно (см. gaps). MOIC = (Realized + Remaining FV) / Invested.

**Private Equity флагманы**

| Фонд (vintage) | Invested | Realized | Remaining FV | MOIC |
|---|---|---|---|---|
| 2006 Fund (2006) | $17.31B | $37.42B | $0 | 2.16x (полностью реализован) |
| Millennium Fund (2002) | $6.0B | $14.13B | $0 | 2.36x (полностью реализован) |
| Americas Fund XII (2017) | $12.75B | $18.51B | $16.32B | 2.73x |
| North America Fund XI (2012) | $10.20B | $25.15B | $1.71B | 2.64x |
| North America Fund XIII (2021) | $17.27B | $0.57B | $23.45B | 1.39x (молодой) |
| European Fund IV (2015) | $3.65B | $5.73B | $2.19B | 2.17x |
| Asian Fund III (2017) | $8.27B | $11.60B | $8.68B | 2.45x |

**Infrastructure**

| Фонд (vintage) | Invested | Realized | Remaining FV | MOIC |
|---|---|---|---|---|
| Global Infrastructure I (2010) | $1.05B | $2.23B | $0 | 2.12x |
| Global Infrastructure II (2014) | $3.17B | $5.76B | $0.96B | 2.12x |
| Global Infrastructure III (2018) | $7.07B | $5.83B | $5.15B | 1.55x |
| Global Infrastructure IV (2021) | $15.25B | $1.70B | $19.62B | 1.40x (молодой) |

**Private Credit — gross/net returns vs бенчмарк** (по агенту, не сверено построчно): Lending Partners III (2017) 7.4%; IV (2021) 9.2% vs бенчмарк LSTA+200bps; Asset Based Finance Partners I (2020) 10.9% gross; Private BDC (2023) 8.0% net.

**Конкретные exit-кейсы:** GeoStabilization International (продан Leonard Green, 2024) — 5.0x на вложенный капитал (раскрыто KKR). Core Investors I (2018) invested $10.50B → remaining FV $17.53B + realized $2.68B = 1.92x.

**Вывод:** зрелые vintages (2002-2017) дают 2.1x-2.7x MOIC; молодые (2020-2021) пока ~1.4x в раннем holdperiod. Аллокация устойчиво выше 2x на полных циклах — при оговорке, что vehicle-таблицы не сверены мной построчно из 10-Q.

### 04 Будущие сделки

На 28.06.2026 крупных объявленных но незакрытых M&A первичными источниками не выявлено — Arctos, OSTTRA, Spectris, Fuji Soft уже закрыты.

| Объект | Counterparty | Размер | Статус | Эффект |
|---|---|---|---|---|
| Увеличение долей в USI / 1-800 Contacts / Heartland Dental | существующие акционеры | ~$1.1B | анонс 1H2025; полное завершение не подтверждено | +~$50M/год к Strategic Holdings OE |
| Circor aerospace → Parker Hannifin | Parker Hannifin | $2.55B | объявлено май 2026 | Монетизация; реализованный gain поступит в Investing Earnings |
| ST Telemedia Global Data Centres (консорциум KKR+Singtel) | — | S$13.8B EV | анонс 02.02.2026, закрытие ожидалось 2H'26 | Data-center экспозиция (AI-линза) |

**Forward-таргеты, раскрытые KKR (forward-looking, primary где указано):**
- **FRE per adjusted share >$4.50/год** (2026 цель, Investor Day 2024).
- **ANI/share 2026** — на Q1'26 call менеджмент сказал "more likely below $7" из-за переноса монетизаций в 2027+ (бюджет был $7-8).
- **Strategic Holdings OE:** $350+M в 2026 → $700+M к 2028 → $1.1B+ к 2030 (с текущих $178,906K LTM). Реализация смещена на конец 2026.
- **Forward monetizations $1.2B+ подписано** — "largest forward monetization figure in our history" (Q1'26 call).
- $64B committed capital "not yet paying fees" (~80 bps) станет fee-paying при инвестировании.
- Долгосрочно: AUM $1T к 2030; ANI/share $15+ за ≤10 лет (Investor Day 2024).

### 08 Финансовая составляющая

Все Q1'26 цифры переподтверждены мной из primary earnings release (SEC 8-K, curl HTTP 200).

| Метрика | Q1'26 | Q1'26 LTM | Q1'25 | Q1'25 LTM |
|---|---|---|---|---|
| **FRE** | $1,016,375K | $3,908,085K | $822,603K | $3,421,658K |
| FRE / adj. share | $1.13 | $4.34 | $0.92 | $3.82 |
| **Total Operating Earnings** | $1,325,001K | $5,197,944K | $1,112,861K | $4,509,113K |
| TOE / adj. share | $1.47 | $5.77 | $1.24 | $5.04 |
| **Adjusted Net Income (ANI/DE)** | $1,249,539K | $4,593,023K | $1,033,988K | $4,372,509K |
| ANI / adj. share | $1.39 | $5.10 | $1.15 | $4.88 |
| Insurance operating earnings | $260,330K | $1,110,953K | $258,772K | $1,000,478K |
| Strategic Holdings OE | $48,296K | $178,906K | $31,486K | $86,977K |
| Management Fees | $1,192,504K | $4,376,011K | $917,334K | $3,563,388K |
| AUM | $757,877K тыс. | — | $664,319K тыс. | — |
| FPAUM | $614,845K тыс. | — | $526,045K тыс. | — |

- **FRE margin: 69%** (стабильно 69% Q1'25 LTM и Q1'26 LTM) — primary-подтверждено.
- **Total Segment Earnings: $6,130,031K LTM** (primary). 85% сегментных earnings — из "durable & recurring" частей (FRE + Insurance + Strategic Holdings) = ~$1.3B из $1.5B Q1'26 (call).
- **Total Investing Earnings: $932,087K LTM** — primary; СНИЖЕНИЕ с $1,231,663K годом ранее (это и есть источник слабого роста ANI +5% LTM).
- Transaction & Monitoring Fees $252,709K Q1 / $1,083,777K LTM (primary).
- **Preferred Stock Dividends $159,026K LTM** (primary) — новый элемент структуры капитала (Series D Mandatory Convertible).

**Балансовый профиль (holdco, Q1'26, primary):**
- Cash & short-term investments (excl. GA) $4,968M + AM investments $7,999M = **Cash & investments $12,967M**.
- Outstanding debt (at par) $9,340M → **Net cash & investments ~$3.63B**.
- Embedded unrealized gains в AM $2.8B (primary); gross unrealized performance income $10.2B (по агенту).
- Рейтинг 'A' у S&P и Fitch, средняя дюрация долга ~15 лет (по агенту, не сверено).

**Многолетний FRE ряд:** release-график показывает FRE 2023 ~$3.0B, 2024 ~$3.5B, 2025 ~$4.1B. ВНИМАНИЕ: FACTS-агент привёл FY2024 FRE $3.27B и FY2025 $3.71B — это РАСХОДИТСЯ с release-графиком (~$3.5B и ~$4.1B). Точные годовые значения из release-графика приоритетны; цифры агента не приняты (см. unverified).

## Tier 2 — Context

### Карта рисков

| Риск | Уровень | Конкретный триггер |
|---|---|---|
| **Концентрация в Global Atlantic** | Средний-высокий | GA — топ-1 балансовая позиция (book value $11.66B, AUM $231B). Триггер: рост кредитных спредов/дефолтов в инвестпортфеле GA, рейтинговый даунгрейд, отток аннуитетов. Q1'26 GAAP net investment-related losses по Insurance существенны (по агенту -$653M, не переподтверждено) |
| **Перенос монетизаций / carry-зависимость** | Средний | ANI/share вырос лишь +5% LTM (vs FRE +14%) — Total Investing Earnings упали до $932,087K LTM с $1,231,663K (primary). Триггер: повторный перенос монетизаций с Q3 на Q4/2027 → ANI-цель под угрозой |
| **Кредитный риск BDC (FSK)** | Средний | FSK NAV/share упал до $18.83 (-9.9% кв/кв с $20.89); non-accrual 4.2% по fair value (8.1% по cost); дистрибуция срезана с $0.48 до $0.42; KKR влил $300M поддержки. Триггер: расползание стресса на private BDC/direct lending |
| **Leverage / LTV** | Низкий | KKR holdco — нетто-кэш (~$3.63B net cash & investments), долг $9.34B при рейтинге 'A'. Триггер только при системном кризисе ликвидности |
| **Key-person dependency** | Низкий-средний | Co-CEO Bae и Nuttall + основатели Kravis/Roberts (Co-Executive Chairmen). Митигируется институционализацией |
| **Regulatory exposure** | Средний | Рост retail/wealth (K-Series AUM $38B) и страхования → надзор SEC/страховых регуляторов |
| **Multiple de-rating** | Средний-высокий | Акция $90.13 vs 52w-максимум $153.87 (-41%). Триггер: дальнейшее сжатие мультипликатора при замедлении fundraising/монетизаций |

### Оценка vs история

Не valuation-инструмент — только исторический anchor. На 26.06.2026 (stockanalysis.com как structured-aggregator, переподтверждено мной + KKR primary):
- **Цена: $90.13**, market cap **$80.93B**, shares outstanding 897.87M, P/E (GAAP trailing) **31.36** — все переподтверждены через WebFetch.
- **52-недельный диапазон: $82.67 - $153.87.** Текущая цена в нижних ~9% диапазона (от низа +9%, от верха -41%).
- По adjusted-метрикам: $90.13 / ANI $5.10 LTM = **P/ANI ~17.7x**; / FRE $4.34 = **P/FRE ~20.8x**.
- **Dividend yield: 0.87%** ($0.78/год; квартальный дивиденд $0.195, +5% годовых) — переподтверждено.

**Контекст:** пик 52w $153.87 предполагал P/ANI ~30x; текущие ~17.7x — существенное сжатие относительно собственного недавнего максимума при растущем FRE +14%. KKR не публикует единый "book value per share" в стиле holdco — прокси: net cash & investments holdco ~$3.63B + GA book value $11.66B. Аналитический консенсус (stockanalysis): средний таргет $125.53 (+39%), 21 buy / 0 sell.

**Decision-grade:** позиция в нижней части 52w-диапазона при P/ANI ~17.7x (vs пиковые ~30x) — относительно дешёвый вход по историческим меркам компании; ключевой риск — продолжение de-rating сектора.

### Действия инсайдеров и компании

**Form 4 — открытые покупки на просадке (код P).** Все строки ниже открыты мной построчно из SEC Form 4 XML (CIK 0001404912, curl HTTP 200); цена и объём сверены с openinsider.com как агрегатор-валидация. Это покупки за личные деньги топ-менеджмента в окне просадки акции (с $153.87 пика до $82-90).

| Дата сделки | Инсайдер | Роль | Объём | Цена (P) | Сумма | Тип | Источник |
|---|---|---|---|---|---|---|---|
| 09.02.2026 | Timothy R. Barakett | директор | 50,000 | $104.93 | ~$5.25M | indirect | Form 4 (acc. ...004845) |
| 17.02.2026 | **Joseph Y. Bae** | Co-CEO | 125,000 | $100.39-$103.17 (wavg ~$102.19) | ~$12.77M | indirect, By Trusts | Form 4 (acc. ...006056) |
| 17.02.2026 | **Scott C. Nuttall** | Co-CEO | 125,000 | $102.13-$103.41 (wavg ~$102.67) | ~$12.83M | прямая (direct) | Form 4 (acc. ...006054) |
| 17.02.2026 | Matt Cohler | директор | 43,872 | $102.90 | ~$4.51M | прямая (direct) | Form 4 (acc. ...006058) |
| 27.02.2026 | **Joseph Y. Bae** | Co-CEO | 50,000 | $88.56 | ~$4.43M | indirect, By Trusts | Form 4 (acc. ...007578) |
| 27.02.2026 | **Scott C. Nuttall** | Co-CEO | 50,000 | $87.81 | ~$4.39M | прямая (direct) | Form 4 (acc. ...007579) |
| 02.03.2026 | Mary N. Dillon | директор | 22,225 | $90.96 | ~$2.02M | indirect, By Trust | Form 4 (acc. ...007577) |
| 04.03.2026 | Timothy R. Barakett | директор | 50,000 | $94.47 | ~$4.72M | indirect, траст | Form 4 (acc. ...008123) |

**Итог покупок (09.02-04.03.2026): 8 сделок, ~516,322 акций, ~$50.9M.** Оба Co-CEO купили по 175,000 акций каждый (по 125,000 на $102 + по 50,000 на $87-89); три независимых директора (Barakett, Cohler, Dillon) добавили ~166,322 акции. Покупки идут двумя волнами: середина февраля у $100-105 и конец февраля / начало марта у $88-95 — то есть инсайдеры докупали и на втором, более глубоком провале. Ни одного открытого insider-sale у действующего менеджмента/директоров в 2026 году в Form 4 не зафиксировано.

**Контекст — крупные продажи основателей в 2025 (код S, НЕ по плану 10b5-1).** Co-Executive Chairmen Henry R. Kravis и George R. Roberts продали значимые блоки в первой половине / середине 2025, на более высоких уровнях, до падения акции. Открыто мной из SEC Form 4 XML; флаг плана 10b5-1 в обоих filings = false (дискреционные продажи).

| Дата сделки | Инсайдер | Роль | Объём | Цена (S) | Сумма | Источник |
|---|---|---|---|---|---|---|
| 02.06.2025 | **Henry R. Kravis** | Co-Exec Chairman | 1,281,394 | wavg ~$119.99 | ~$153.8M | Form 4 (acc. ...021188) |
| 02.06.2025 | **George R. Roberts** | Co-Exec Chairman | 1,190,094 | $119.80 | ~$142.6M | Form 4 (acc. ...021191) |
| 07.08.2025 | **George R. Roberts** | Co-Exec Chairman | 809,906 | $144.25 | ~$116.8M | Form 4 (acc. ...029677) |

**Итог продаж основателей (2025): ~3.28M акций, ~$413.2M** при ценах $120-144. Часть проданного Roberts (август) по footnote держалась "solely for purposes of charitable donations" — то есть отчасти благотворительная ликвидация, а не чистый кэш-аут. После этих продаж у каждого основателя остаётся крупная доля (Roberts ~83.9M акций после августовской сделки; Kravis ~81.4M после июньской — по строке sharesOwnedFollowingTransaction в Form 4).

**Сигнал (decision-grade):** разнонаправленный по уровню иерархии. Основатели (Kravis/Roberts, отходящие от операционного управления) фиксировали прибыль у $120-144 в 2025 — это диверсификация/благотворительность пожилых мажоритариев, а не операционный сигнал. Действующее руководство, наоборот, покупало за свои у $88-105 в феврале-марте 2026 — оба Co-CEO + три директора, ~$50.9M суммарно, без единой продажи. Сочетание «менеджмент-покупает-на-дне + основатели-продали-на-пике» читается как уверенность операционной команды в недооценке при текущем P/ANI ~17.7x.

**Buybacks (primary Q1'26 release, открыт через curl HTTP 200):**
- С конца 2025 года по 01.05.2026 KKR использовал **$317M** на выкуп и погашение **3.5M акций** по средней **$91.08** — то есть выкуп шёл примерно по той же цене, по которой докупали инсайдеры (вторая волна $88-95).
- Совет одобрил **увеличение программы на $500M**. Механика амортизации: когда остаток программы падает до $50M или ниже, лимит автоматически прирастает на $500M.
- **Inception-to-date (с авторизации 27.10.2015 по 01.05.2026):** 69.6M акций выкуплено на открытом рынке + 28.1M погашено по retired equity awards = **97.7M акций, $3,083M, средняя $31.56/акция**. Остаток доступности на 01.05.2026 — **$122M** (до авто-прироста).

**Дивиденды (primary release):**
- Квартальный дивиденд по обыкновенной акции **$0.195** объявлен за Q1'26; выплата 29.05.2026, record 15.05.2026. **+5% к аннуализированному уровню 2025.**
- KKR повышает аннуализированный дивиденд **каждый год с момента конверсии в C-Corp в 2018** — то есть непрерывная серия повышений, без cut и без пропусков. Инициаций новых дивидендов нет (программа давно действует).

**Эмиссия / структура капитала (primary release):**
- **Series D Mandatory Convertible Preferred Stock** — preferred dividends $159,026K LTM (в Q1'26 — $40,430K). Объявленный дивиденд по preferred **$0.78125/акция**, выплата 01.06.2026, record 15.05.2026.
- Это обязательная конвертация в обыкновенные акции — встроенное будущее разводнение; дата конвертации не позднее 01.03.2028 (из прежних filings; в самом Q1'26 release дата конверсии построчно не переподтверждена — см. gaps). Эффект: preferred-дивиденды уменьшают Net Income to common stockholders уже сейчас, конверсия добавит акции к 2028.
- Иных крупных эмиссий обыкновенных акций или spin-off на 28.06.2026 первичными источниками не выявлено.

### Peer positioning

| Метрика | **KKR** | Blackstone (BX) | Apollo (APO) | Brookfield AM (BAM) |
|---|---|---|---|---|
| Total AUM | $757.9B (primary) | $1.30T | $1.0T+ | ~$1.2T |
| Fee-paying AUM | $614.8B (primary) | $937.6B | $836B | $614B |
| Q1'26 FRE | $1,016,375K (primary) | $1.55B | рекорд (абсолют не извлечён) | $772M |
| FRE рост г/г | +24% (primary) | +23% | сильный | +11% |
| Inflows Q1'26 | $27.75B (primary) | $68.5B | $115B (рекорд) | н/п |
| Перпетуал/страхование | GA $231B AUM | мин. | Athene | мин. |

(Peer-цифры BX/APO/BAM — из агентов через structured-aggregators, мной не переподтверждены построчно.)

**Относительное позиционирование (decision-grade):**
- **Масштаб:** KKR меньше по AUM и абсолютному FRE, чем Blackstone и Apollo, но быстрее растёт по FRE, чем Brookfield (+24% vs +11%).
- **Fundraising:** KKR отстаёт по квартальным inflows ($27.75B vs Apollo $115B, BX $68.5B) — относительная слабость momentum.
- **Уникум KKR:** Strategic Holdings (прямые core-PE доли с растущими дивидендами до $1.1B+ к 2030) — структурно отличает KKR от peers.

**Вывод hold/add/cut:** относительно Brookfield (медленнее) + insider-buying на просадке + сжатый мультипликатор → профиль ближе к hold/add; главный негатив vs Apollo/BX — отставание в фандрейзинге.

## Tier 3 — Voice

### 03 Заявленная стратегия

**Edge-тезис менеджмента (Q1'26 call, 05.05.2026):**
- Durability и диверсификация прибыли. CFO Rob Lewin: «We benefit from real stability and durability of earnings and increased visibility on how they will grow». В Q1'26 «85% of segment earnings are from the more durable and recurring portions» (FRE + Insurance OE + Strategic Holdings OE) — ~$1.3B из сегментных $1.5B.
- 50-летний трек. CEO в release: «On May 1st, KKR celebrated its 50th anniversary... a half century of navigating cycles».
- AI как кросс-портфельный рычаг: 150+ портфельных компаний внедряют AI (применимо к Asset Management/Infra, не к Insurance/roll-up).

**Правила капитал-аллокации (Lewin, Q1'26 call):** «how we take our marginal dollar of cash flows and drive the most amount of recurring durable and growing earnings per share». Жёсткой формулы нет — решение на марже по risk-adjusted return. Приоритеты Q1'26: (1) buyback $317M (3.5M акций по $91.08); (2) M&A (Arctos закрыта 04.05.2026); (3) докапитализация Insurance при расширении спредов; (4) рост Strategic Holdings. Сотрудники владеют ~30% акций KKR (call) — основа long-term ориентации.

**Слои стратегии (2024 Investor Day, 10.04.2024 + Q1'26):**
- 2026 цели: FRE/share >$4.50; TOE/share >$7; ANI/share $7-8 (на Q1'26 call скорректировано "more likely below $7").
- Долгосрочно: ANI/share $15+ за ≤10 лет; AUM $1T к 2030.
- Strategic Holdings OE: $350+M в 2026 → $700+M к 2028 → $1.1B+ к 2030.

### 05 Взгляд на рынок

**Во что верят (Q1'26 call, 05.05.2026):**
- Long-duration insurance: 80% origination в Q1'26 имели duration 7+ лет (против 37% за весь 2024) — ставка на рост ROE при нормализации спредов. Lewin: «$6 billion of dry powder equity... translates into $60-plus billion of buying power» при дислокациях.
- Digital infrastructure / AI buildout — главная секулярная тема: $40B+ развёрнуто (KKR + партнёры), gross IRR 20%+, 6 глобальных дата-центр платформ.
- Перпетуальный капитал как стабилизатор: $326B (43% AUM, 51% FPAUM — primary).

**Чего избегают:** розничный кредит при сжатых спредах. Lewin: «Spreads are as tight as they've been in a very long time». Не форсируют exit'ы в слабом окне монетизаций — переносят, а не отменяют.

**За чем следят:** окно монетизаций (нормализация = триггер для ANI); волатильность как сигнал для buyback и развёртывания insurance dry powder; wealth-канал (ожидают замедление Q2 на фоне шума вокруг private-credit redemptions).

**Свежие датированные тезисы:**
1. **11.06.2026 (BusinessWire):** запуск **Helix Digital Infrastructure** — $10B+ long-duration капитала; якорные инвесторы KKR, Kuwait Investment Authority, NVIDIA, Vistra; CEO — экс-глава AWS Adam Selipsky. Прямая AI-линза.
2. **25.06.2026 (BusinessWire, intra-quarter update):** capital markets transaction fees за Q2'26 ожидаются ~$175M; часть транзакций сдвинута с Q2 на Q3'26 — подтверждает тезис о задержке монетизаций.

## Tier 4 — Signals

### 06 Что мониторить

**Earnings / отчётность KKR:**
- **Q2'26 earnings release — дата НЕ подтверждена однозначно:** TipRanks указывает 04.08.2026, public.com — 30.07.2026. Использовать официальный IR-анонс. Главное к проверке: подтвердятся ли capital markets fees ~$175M; сместился ли ANI ниже $7; темп Strategic Holdings OE к $350+M.
- **10-Q за Q2'26** — SEC EDGAR (CIK 0001404912), первая половина августа 2026. Источник балансовых данных Strategic Holdings и GA book value.
- **Начало ноября 2026** — Q3'26 release.

**Управляемые vehicle:**
- **FS KKR Capital (FSK, BDC)** — следующий 10-Q/earnings Q2'26 начало августа 2026. Q1'26: NAV/share $18.83 (-9.9% кв/кв), портфель $12.3B, non-accrual 4.2% по fair value, дистрибуция $0.42. KKR влил $300M ($150M convertible preferred 5.00% cash/7.00% PIK + $150M tender + waiver incentive fee на 4 квартала). Мониторить: Medallia, Production Resource Group, ATX, Cubic Corp., Affordable Care.
- **NPORT-P** по кредитным фондам KKR — ежеквартально в EDGAR.

**Регуляторные / корпоративные:**
- **DEF 14A** (proxy) — апрель/май; следующий ориентир апрель 2027.
- **Form 4 / Schedule 13D/G** — инсайдерские сделки через EDGAR + openinsider как валидация.
- **13F-HR за Q2'26** — дедлайн ~14.08.2026. ВАЖНО: это активы клиентских фондов, НЕ баланс KKR.

**Новостные потоки (media.kkr.com):**
- Helix Digital Infrastructure (запуск 11.06.2026) — развёртывание капитала, hyperscaler-контракты.
- ST Telemedia Global Data Centres (KKR+Singtel, S$13.8B EV) — закрытие 2H'26.
- North America Fund XIV (vintage 4/2025) — темп развёртывания.

### 07 Аналитический слой

*Интерпретация аналитика на основе раскрытых фактов. Не valuation, без DCF.*

**Что значат недавние события:**
- Расхождение FRE vs ANI — структурное, не кризисное. FRE +24% и management fees +30% г/г показывают, что комиссионная база растёт к цели $4.50+. Снижение прогноза ANI ниже $7 и сдвиг capital markets fees к ~$175M с переносом сделок на Q3 — проблема тайминга окна монетизаций, не ухудшение фандрейзинга. «Качество» прибыли защищено, волатилен только carry/realization-компонент.
- Helix ($10B+, KKR/KIA/NVIDIA/Vistra) — материализация AI-тезиса в отдельный capital pool. Поддерживает рост FPAUM и future management fees.
- FSK (BDC) — главный негативный сигнал из экосистемы. NAV -9.9% за квартал, non-accrual до 4.2% по fair value, срез дистрибуции, экстренный $300M пакет — видимое ухудшение качества кредита в нижнем сегменте direct lending. Прямой эффект на KKR holdco невелик (FSK — vehicle, не баланс KKR), но это (а) репутационный/фандрейзинговый встречный ветер для credit/wealth K-Series, (б) ранний индикатор стресса в private credit.

**Влияние на структуру:**
- Strategic Holdings — back-end-weighted к цели $350+M; EBITDA-вклад (KKR share LTM ~$1.1B) даёт растущие дивиденды независимо от exit-окна. Положительно для durability.
- Insurance (GA, book value $11.66B) — pivot в long-duration (80% origination 7+ лет) + $6B dry powder = опцион на ROE-рост при расширении спредов; текущий ROE ниже low-double-digit таргета — встречный ветер.

**Сигналы (триггеры, не valuation-уровни):**
- **HOLD / ADD-триггеры:** (1) подтверждение на Q2'26 capital markets fees ≥$175M и роста Strategic Holdings OE к $350M; (2) фактическое закрытие $1.2B+ forward monetizations; (3) расширение спредов → разворот insurance ROE вверх; (4) масштабирование Helix новыми инвесторами.
- **TRIM / CUT-триггеры:** (1) дальнейший рост non-accrual в FSK → системный, а не идиосинкратический кредитный стресс; (2) повторный перенос монетизаций → ANI-цель под угрозой два квартала подряд; (3) замедление wealth K-Series при продолжении redemptions; (4) Insurance OE стагнирует, dry powder не развёрнут при волатильности.

## Источники

1. KKR Q1 2026 Earnings Release (SEC 8-K exhibit, q126earningsrelease_vf.htm) — https://www.sec.gov/Archives/edgar/data/0001404912/000140491226000011/q126earningsrelease_vf.htm — SEC EDGAR 8-K primary (открыт мной через curl HTTP 200) — 2026-05-05
2. KKR Q1 2026 10-Q index (SEC EDGAR, CIK 0001404912) — https://www.sec.gov/Archives/edgar/data/0001404912/000140491226000017/kkr-20260331.htm — SEC EDGAR 10-Q primary (HTML недоступен через WebFetch) — 2026-05-05
3. KKR Q4 2025 / FY2025 Earnings Release — https://www.sec.gov/Archives/edgar/data/0001404912/000140491226000002/q425earningsrelease_vf.htm — SEC EDGAR 8-K primary — 2026-02-05
4. KKR Q1 2026 Earnings Call Transcript (Motley Fool) — https://www.fool.com/earnings/call-transcripts/2026/05/05/kkr-kkr-q1-2026-earnings-call-transcript/ — earnings-call transcript — 2026-05-05
5. KKR Investor Relations homepage — https://ir.kkr.com/ — primary IR — 2026-06-28
6. KKR Reports First Quarter 2026 Results (BusinessWire) — https://www.businesswire.com/news/home/20260505994009/en/KKR-Co.-Inc.-Reports-First-Quarter-2026-Results — primary PR — 2026-05-05
7. KKR Q1 2026 8-K material event (StockTitan, validation) — https://www.stocktitan.net/sec-filings/KKR/8-k-kkr-co-inc-reports-material-event-77e0b43d20f9.html — structured-aggregator (validation) — 2026-05-05
8. KKR Announces Intra-Quarter Update (Q2'26 capital markets fees ~$175M) — https://www.businesswire.com/news/home/20260625517751/en/KKR-Announces-Intra-Quarter-Update — primary PR — 2026-06-25
9. KKR Launches Helix Digital Infrastructure ($10B+, KKR/KIA/NVIDIA/Vistra) — https://www.businesswire.com/news/home/20260610500794/en/KKR-Launches-Helix-Digital-Infrastructure — primary PR — 2026-06-11
10. KKR Closes Acquisition of Arctos Partners (~$15B AUM) — https://www.businesswire.com/news/home/20260504956768/en/KKR-Closes-Acquisition-of-Arctos-Partners — primary PR (переподтверждено WebSearch) — 2026-05-04
11. KKR to Acquire Arctos — структура $1.4B + $550M earn-out — https://www.businesswire.com/news/home/20260204778743/en/KKR-to-Acquire-Arctos — primary PR (переподтверждено WebSearch) — 2026-02-04
12. FS KKR Capital (FSK) Q1 2026 Results & Strategic Value Actions (PR Newswire) — https://www.prnewswire.com/news-releases/fs-kkr-capital-corp-announces-first-quarter-2026-results-302768117.html — primary PR — 2026-05-06
13. FS KKR Capital (FSK) портфель (официальный сайт BDC) — https://www.fskkrcapitalcorp.com/about/portfolio/ — primary (переподтверждено мной через WebFetch: $12.3B, 236 компаний, non-accrual 4.2%) — 2026-06-28
14. FS KKR Q1 2026 8-K material event ($150M preferred, StockTitan) — https://www.stocktitan.net/sec-filings/FSK/8-k-fs-kkr-capital-corp-reports-material-event-7274b1c9adcc.html — structured-aggregator (validation) — 2026-05-07
15. S&P Global & CME to sell OSTTRA to KKR for $3.1B — https://osttra.com/press_releases/sp-global-and-cme-group-to-sell-osttra-to-kkr-for-3-1-billion/ — primary PR — 2025-04-14
16. KKR Completes Tender Offer for FUJI SOFT (BusinessWire) — https://www.businesswire.com/news/home/20250219106284/en/KKR-Completes-Tender-Offer-for-FUJI-SOFT — primary PR — 2025-02-19
17. KKR completes £4.7bn acquisition of Spectris (MergerLinks/BusinessCloud) — https://news.mergerlinks.com/daily-review/kkr-completes-the-acquisition-of-spectris-for-4-7bn — structured-aggregator (переподтверждено WebSearch) — 2025-12-04
18. KKR increases ownership in core PE (USI, 1-800 Contacts, Heartland Dental, Nasdaq summary) — https://www.nasdaq.com/articles/kkr-increases-ownership-core-private-equity-businesses-quick-facts — press summary (validation) — 2025-02-04
19. KKR targets $1T AUM, $15+ ANI/share (2024 Investor Day, Bloomberg) — https://www.bloomberg.com/news/articles/2024-04-10/kkr-targets-1-trillion-of-assets-under-management-in-five-years — investor day coverage (validation) — 2024-04-10
20. KKR stock quote: цена/P-E/yield/52w (stockanalysis.com) — https://stockanalysis.com/stocks/kkr/ — structured-aggregator (переподтверждено мной через WebFetch) — 2026-06-26
21. Scott Nuttall Form 4 / insider activity (QuiverQuant) — https://www.quiverquant.com/insiders/1207606/Scott-C-Nuttall — structured-aggregator (validation) — 2026-02-27
22. KKR co-CEO open-market purchases — Form 4 (StockTitan) — https://www.stocktitan.net/sec-filings/KKR/form-4-kkr-co-inc-insider-trading-activity-b6a4ca0334d6.html — structured-aggregator (validation) — 2026-02-27
23. KKR Q2 2026 earnings date (TipRanks Aug 4 vs public.com Jul 30 — расхождение) — https://www.tipranks.com/stocks/kkr/earnings — earnings-calendar aggregator (validation) — 2026-06-01
24. KKR Form 4 index (все insider-filings, SEC EDGAR, CIK 0001404912) — https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001404912&type=4&owner=include&count=100 — SEC EDGAR Form 4 primary (открыт мной через curl HTTP 200) — 2026-06-28
25. Form 4 — Joseph Y. Bae покупка 125,000 акций @ ~$102.19 (17.02.2026) — https://www.sec.gov/Archives/edgar/data/1404912/000114036126006056/form4.xml — SEC EDGAR Form 4 primary (открыт мной построчно) — 2026-02-18
26. Form 4 — Scott C. Nuttall покупка 125,000 акций @ ~$102.67 (17.02.2026) — https://www.sec.gov/Archives/edgar/data/1404912/000114036126006054/form4.xml — SEC EDGAR Form 4 primary (открыт мной построчно) — 2026-02-18
27. Form 4 — Matt Cohler покупка 43,872 акций @ $102.90 (17.02.2026) — https://www.sec.gov/Archives/edgar/data/1404912/000114036126006058/form4.xml — SEC EDGAR Form 4 primary (открыт мной построчно) — 2026-02-18
28. Form 4 — Joseph Y. Bae покупка 50,000 акций @ $88.56 (27.02.2026) — https://www.sec.gov/Archives/edgar/data/1404912/000114036126007578/form4.xml — SEC EDGAR Form 4 primary (открыт мной построчно) — 2026-03-03
29. Form 4 — Scott C. Nuttall покупка 50,000 акций @ $87.81 (27.02.2026) — https://www.sec.gov/Archives/edgar/data/1404912/000114036126007579/form4.xml — SEC EDGAR Form 4 primary (открыт мной построчно) — 2026-03-03
30. Form 4 — Mary N. Dillon покупка 22,225 акций @ $90.96 (02.03.2026) — https://www.sec.gov/Archives/edgar/data/1404912/000114036126007577/form4.xml — SEC EDGAR Form 4 primary (открыт мной построчно) — 2026-03-03
31. Form 4 — Timothy R. Barakett покупка 50,000 акций @ $94.47 (04.03.2026) — https://www.sec.gov/Archives/edgar/data/1404912/000114036126008123/form4.xml — SEC EDGAR Form 4 primary (открыт мной построчно) — 2026-03-05
32. Form 4 — Henry R. Kravis продажа 1,281,394 акций @ ~$119.99 (02.06.2025, не 10b5-1) — https://www.sec.gov/Archives/edgar/data/1404912/000114036125021188/ — SEC EDGAR Form 4 primary (открыт мной построчно) — 2025-06-02
33. Form 4 — George R. Roberts продажа 1,190,094 акций @ $119.80 (02.06.2025, не 10b5-1) — https://www.sec.gov/Archives/edgar/data/1404912/000114036125021191/ — SEC EDGAR Form 4 primary (открыт мной построчно) — 2025-06-02
34. Form 4 — George R. Roberts продажа 809,906 акций @ $144.25 (07.08.2025, не 10b5-1, частично charitable) — https://www.sec.gov/Archives/edgar/data/1404912/000114036125029677/ — SEC EDGAR Form 4 primary (открыт мной построчно) — 2025-08-07
35. KKR insider transactions table (openinsider.com) — http://openinsider.com/search?q=KKR — structured-aggregator (validation покупок/продаж, сверено с Form 4) — 2026-06-28

## Пробелы и неподтверждённое

- **Поштучная fair value Strategic Holdings** (USI, Heartland Dental, 1-800 Contacts, Internet Brands, Mills Fleet Farm) — НЕ раскрыта в Q1'26 release; только агрегат (KKR share LTM Adjusted EBITDA ~$1.1B). Ring 2. Нужен полный 10-Q EX-таблицы или Investor Day deck.
- **Полный список ~18-19 компаний Strategic Holdings** с долями — не подтверждён единым первичным документом; поимённо подтверждены 6 крупнейших.
- **Статус полного завершения ~$1.1B сделки** по USI/1-800 Contacts/Heartland Dental — анонс 1H2025, закрытие всех траншей на 28.06.2026 первичным источником не подтверждено.
- **10-Q vehicle-таблицы** (MOIC по фондам, dry powder breakdown, Private Credit IRR) — SEC HTML (kkr-20260331.htm) недоступен через WebFetch (403); цифры взяты от FACTS-агента, НЕ сверены мной построчно. Earnings release сверен полностью через curl.
- **Named FSK holdings с fair value** (Medallia, Production Resource Group, ATX, Cubic Corp.) — по BDC-аналитике, не построчно из FSK 10-Q Schedule of Investments.
- **Circor → Parker Hannifin $2.55B** — подтверждено WebSearch, прямой первичный KKR/Parker PR не открыт через WebFetch.
- **Form 4 инсайдерские сделки** — все ключевые покупки 2026 и продажи основателей 2025 ОТКРЫТЫ мной построчно из SEC Form 4 XML (см. источники 24-35) и сверены с openinsider. Не верифицирован построчно полный «long tail» мелких award/J-кодовых filings (RSU vesting, gift-коды G, внутригрупповые переводы KKR Group Partnership) — они не несут directional-сигнала и в таблицы не включены.
- **Series D Mandatory Convertible — дата конверсии (≤01.03.2028)** взята из прежних filings; в самом Q1'26 earnings release построчно не переподтверждена (release раскрывает только текущий preferred-дивиденд $0.78125 и payment dates).
- **Peer-цифры BX/APO/BAM** — из structured-aggregators, не сверены построчно с их primary releases. Apollo абсолютная квартальная FRE не извлечена.
- **Дата Q2'26 earnings** — расхождение TipRanks (04.08.2026) vs public.com (30.07.2026); официальный IR-анонс не сверен.
- **«Embedded gains $18.3B»** из агрегаторов транскрипта НЕ сводится к release: primary даёт embedded unrealized gains $2.8B и gross unrealized performance income $10.2B. $18.3B отброшено как неподтверждённое.

## Статус верификации

Все headline-метрики Q1'26 переподтверждены напрямую из первичного earnings release (SEC 8-K, открыт через curl HTTP 200, обход 403-блокировки WebFetch): FRE $3,908,085K LTM / $4.34 на share, TOE $5,197,944K / $5.77, ANI $4,593,023K / $5.10, AUM $757,877K тыс., FPAUM $614,845K тыс., perpetual $326B (43%/51%), management fees $4,376,011K LTM, Insurance OE $1,110,953K LTM, Strategic Holdings OE $178,906K LTM, GA book value $11,664,526K, uncalled commitments $124,857K тыс., buyback $317M/3.5M акций/$91.08, дивиденд $0.195, preferred dividends $159,026K. Котировки (цена $90.13, market cap $80.93B, P/E 31.36, yield 0.87%, 52w $82.67-$153.87, shares 897.87M) переподтверждены через stockanalysis.com. Arctos ($1.4B + $550M, ~$15B AUM), Spectris (£4.7B), FSK ($12.3B/236 компаний/non-accrual 4.2%) переподтверждены. ВАЖНЫЕ ПОПРАВКИ к черновикам: (1) GA AUM = $231B (primary), FACTS-агент ошибочно дал $220B; (2) Arctos AUM ~$15B (primary), не $16B; (3) FACTS-агент дал FY2024/2025 FRE $3.27B/$3.71B — расходится с release-графиком (~$3.5B/$4.1B), отброшено; (4) Total Investing Earnings СНИЖАЮТСЯ LTM ($932,087K vs $1,231,663K) — это корень слабого ANI. Инсайдерская секция усилена: все ключевые Form 4 (покупки Bae/Nuttall/Cohler/Dillon/Barakett на $50.9M в фев-март 2026; продажи основателей Kravis/Roberts на $413.2M в 2025, флаг 10b5-1=false) ОТКРЫТЫ построчно из SEC Form 4 XML и сверены с openinsider; buyback ($317M/3.5M/$91.08 + $500M, inception-to-date 97.7M акций/$3,083M/$31.56), дивиденд ($0.195, +5%, серия с 2018) и Series D preferred ($0.78125, $159,026K LTM) переподтверждены из release. НЕ переподтверждены построчно: 10-Q vehicle-таблицы (MOIC, IRR), per-company Strategic Holdings оценки, peer-цифры. Общий уровень доверия: ВЫСОКИЙ по финансам/котировкам/сделкам holdco, СРЕДНИЙ по track-record фондов и peer-сравнению (опираются на не сверённые построчно источники).
