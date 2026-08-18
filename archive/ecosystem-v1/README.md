# Экосистема v1 — резервная копия

Первая версия второй карты секции Capital Flow. Отвечала на вопрос
**«как устроена цепочка поставок дата-центра для ИИ»**: 12 слоёв, 10 типов связей,
два хребта (физика · капитал), узел = звено цепочки, таксономия унаследована из
исследования DC-AI (`research/dc/Roadmap.jsx`, поле `dcNode`).

**Заменена 2026-08-18** на v2 — карту, якорную на NVIDIA: 16 слоёв, 31 тип связи,
пять хребтов, отвязка от DC-AI. Причина не в том, что v1 была сломана, а в том, что
она отвечала не на тот вопрос. См. `ECOSYSTEM-V2-BLUEPRINT.md` в корне.

## Что здесь лежит

| Папка | Содержимое |
|---|---|
| `components/` | Все 13 файлов `src/components/research/ecosystem/` на момент заморозки |
| `data/` | `ecosystemMap.json` (фикстура: 62 компании, 107 связей, 5 контуров), `ecosystemMap.js` (адаптер), `ecosystemProfiles.json` (63 профиля, писались руками), `ecosystemLogos.json` |
| `docs/` | Оба промпта сборки v1, контекст передачи, журнал сборки, `README` карты |

**Данные непроверены.** `ecosystemMap.json` — правдоподобная фикстура, а не результат
прогона движка (`"source": "fixture"`). Цифры оттуда переиспользовать нельзя.
Интонацию русского текста в `ecosystemProfiles.json` — можно и стоит.

## Полный откат

Состояние всего репозитория на момент заморозки помечено тегом **`ecosystem-v1`**.
Это точка возврата с полной точностью — файлы здесь дублируют её для чтения глазами,
а восстанавливаться надо из тега.

Вернуть карту целиком, не трогая остальной репозиторий:

```bash
git checkout ecosystem-v1 -- \
  src/components/research/ecosystem \
  src/data/ecosystemMap.js \
  src/data/ecosystemMap.json \
  src/data/ecosystemProfiles.json \
  src/data/ecosystemLogos.json \
  src/components/research/CapitalFlowSection.jsx
```

Затем убрать то, что принесла v2:

```bash
rm -f src/data/nvidiaEcosystem.js src/data/nvidiaEcosystem.json src/data/nvidiaEcosystemLogos.json
npm run build
```

Посмотреть, как выглядел репозиторий целиком, ничего не меняя:

```bash
git switch --detach ecosystem-v1     # вернуться: git switch -
```

Отдельный файл, если нужен только один:

```bash
git show ecosystem-v1:src/components/research/ecosystem/EcoGraph.jsx
```

## Что тег НЕ покрывает

Движок живёт в другом репозитории. Его копия v1 — в
`~/Desktop/Capital Flow/archive/ecosystem-v1/`, и её делает промпт движка своим
шагом 0. Откат дашборда и откат движка независимы: дашборд v1 читает
`ecosystemMap.json`, движок v1 его производит, и вернуть можно как обе стороны, так и
одну.
