# План апгрейда раздела «Дата-центры для ИИ»

Синтез двух исследований (5 агентов + memory-deep-dive, июль 2026).
Сейчас: **10 слоёв · 31 узел · ~100 компаний**. Цель: закрыть дыры и убрать устаревшее.

> Правило точности: любую цифру, которая идёт на экран, сверять с первоисточником
> (earnings / 8-K / JEDEC). Многое в отчётах помечено RUMORED / second-tier.

---

## 1. ДОБАВИТЬ — новые узлы (по приоритету)

### 🔴 Приоритет 1 — без этого раздел мис-центрирован

**A. Новый слой «03.5 ПАМЯТЬ» (между ЧИПЫ и СБОРКА)** — главный пробел.
HBM = ~63% стоимости AI-чипа (логика ~13%). Узлы:
- **HBM** — SK Hynix, Samsung, Micron; CXMT (Китай, watch)
- **Обычная DRAM (DDR5/LPDDR5X)** — те же три + CXMT
- **NAND / enterprise SSD** — Samsung, SK Hynix/Solidigm, Kioxia, Micron, SanDisk; контроллеры Silicon Motion, Phison
- **SOCAMM / CXL-модули** — Astera Labs, Marvell, Rambus, Montage, Microchip

**B. Чокпоинты HBM (суб-линия к памяти/упаковке)** — «тихие монополии» в духе GOES:
- Логическая база-die → фаундри (TSMC N12/N3P, Samsung Foundry) — новое ребро цепочки
- **Ajinomoto — ~98% ABF-плёнки**; **Namics — единственный источник MR-MUF**; **Resonac — NCF/TIM**
- Тест HBM: **Advantest (де-факто монополия)**, Teradyne, Camtek, Onto
- Гибридная склейка = рубеж **HBM4E/2027** (BESI, Applied Materials, Hanwha Semitech) — не для HBM4

**C. Кастомные AI-чипы (ASIC design-services)** — отдельно от GPU:
Broadcom (~60%), Marvell (~25–35%), Alchip, GUC, Socionext. Растут +45%/год против +16% у GPU.

**D. Сборка серверов и стоек (Server & Rack-Scale Systems)** — между компонентами и neocloud:
Dell, HPE, Supermicro (OEM); Foxconn, Quanta, Wiwynn, Wistron, Celestica, Jabil (ODM).
Узкое место — интеграция жидкостного охлаждения + burn-in. Nvidia забирает маржу вверх (L10-трей).

**E. Сеть — чипы и фабрика (Networking)** — вся «передача бит», сейчас нет:
- Scale-up (NVLink / UALink): NVDA, AMD, Astera Labs, Broadcom
- Scale-out (InfiniBand vs Ethernet): Arista, NVIDIA, Cisco, Celestica
- Switch-кремний: Broadcom, Marvell, Astera Labs, Credo
- Оптические трансиверы 800G/1.6T: Coherent, Lumentum, Fabrinet (Innolight/Eoptolink — Китай, note)

### 🟧 Приоритет 2 — завершают физическую картину

**F. Кремниевые пластины (отделить от «Химия для чипов»)** — тесная олигополия:
Shin-Etsu, SUMCO, GlobalWafers, Siltronic, SK Siltron (top-5 >90%). HBM ест ~3× площади.

**G. Недвижимость и колокация (Physical Shell & Colocation)** — слой «арендодателя»:
Digital Realty, Equinix, Iron Mountain, Applied Digital; QTS/Vantage/Aligned (private).

**H. Поршневые генераторы (Gensets)** — отдельно от газовых турбин:
Caterpillar, Cummins, Rolls-Royce (mtu), Generac, Wärtsilä. Bridge/prime power в обход очереди.

**I. Накопители энергии (BESS + UPS)** — сглаживание AI-нагрузки:
Tesla (Megapack), Fluence, Vertiv, Eaton, Schneider.

### 🟨 Приоритет 3 — уточнения

- **J. Разбить «Охлаждение»** на (a) direct-to-chip + CDU и (b) отвод тепла/чиллеры + иммерсия.
  Добавить Modine, Schneider (Motivair), Delta; пометить Boyd/CoolIT как private.
- **K. Кабельная инфраструктура + модульная стройка**: Corning, Amphenol, CommScope, Belden; Vertiv/Schneider/JCI/Hubbell (prefab). Blackwell-стойке нужно ~16× больше волокна.
- **L. Вода** — красная полоса-ограничение (регуляторы/пермиты) + сателлит: Xylem, Veralto, Ecolab, American Water.
- *(опц.) Стекло-подложки; слой финансирования/долга.*

---

## 2. ИСПРАВИТЬ — устаревшее содержимое (быстрые правки)

| Что | Сейчас | Правка |
|---|---|---|
| **Wolfspeed** | Med-High conviction | Chapter 11 (июн–сен 2025), акционеры обнулены → снизить/пометить «реорг.» |
| **«Groq» в bucket Compute** | «post-Groq exit math brutal» | Groq теперь успех → заменить на **circular financing / долг CoreWeave** |
| **Bloom Energy** | в общей куче с Plug/Ballard | $25B Brookfield, 2.8GW Oracle, 1GW AEP → поднять и отделить как SOFC-питание |
| **Узел `pkg` (CoWoS)** | «сегодняшняя главная пробка» | Смягчить: тесно, но расширяется (35k→~130k wpm, gap 20%→10%); добавить Amkor/SPIL, CoWoS-L/SoIC |
| **CoreWeave** | «горячее IPO» | Nasdaq-100, но ~$25B долга, −$4.7B FCF, инсайдеры продали $2.3B |
| **Lambda** | "Pre-IPO" | Всё ещё private, IPO ~H2 2026 |
| **CPO (в Photonics)** | «ранняя стадия» | Уже отгружается на стороне свитчей в 2026 (Quantum-X / Bailly) |
| **Очередь на подключение** | «~8 лет» | ~2600 ГВт бэклог, медиана ~5 лет; узкое место сместилось в HV-трансформаторы |
| **Gas Turbines / Power** | старые цифры | GE Vernova бэклог ~100ГВт / $176B, цены +~300% за 3 года, sold out к 2030 |
| **Samsung HBM** | (если есть «отстал») | Прошёл квалификацию HBM3E (сен 2025) и HBM4 (2026) |

---

## 3. РЕСТРУКТУРИЗАЦИЯ

- **Расфасовать `AI Compute Infra`**: neocloud = CoreWeave/Nebius/Lambda/Crusoe; **IREN = гибрид**; **Applied Digital → в недвижимость**.
- **Переименовать узел `Nuclear/SMR`** (там большая атомка: Constellation, Vistra, BWXT) в «Атомная энергия» — сейчас конфликтует с отдельным узлом `SMR` (Oklo, NuScale).
- **Отделить кремниевые пластины** от «Химия для чипов» (см. узел F).

---

## 4. УДАЛИТЬ ПОЛНОСТЬЮ

Целых узлов на удаление нет. Убираются только устаревшие формулировки/акценты
(ссылка на Groq, «CoWoS = пробка», conviction Wolfspeed) — см. раздел 2.

---

## Порядок работ (предложение)

1. **Фаза 1** — слой ПАМЯТЬ + чокпоинты HBM + Custom ASIC + быстрые FIX (Wolfspeed/Groq/Bloom).
2. **Фаза 2** — Server systems + Networking + реклассификация neocloud.
3. **Фаза 3** — недвижимость, gensets, BESS, wafers.
4. **Фаза 4** — split охлаждения, кабель/модуль, вода.

Все новые узлы — с той же глубиной: `ЧТО ЭТО` + `РОЛЬ В ЦЕПОЧКЕ` + компании.
Мелкими коммитами (правило миграций).
