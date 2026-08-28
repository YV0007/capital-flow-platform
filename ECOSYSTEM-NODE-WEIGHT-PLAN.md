# Ecosystem — one metric instead of three

**BUILT — 2026-08-28.** This file is the design record; the metric now ships.
Numbers below are real, computed on the live `src/data/aiEcosystemNetwork.json`
(107 entities, 262 edges). Code: `src/data/ecoWeight.js`, wired into
`buildGraphFrom()`. Report: `node scripts/eco_weight_report.mjs`.
The data problems it surfaced went upstream as `ECOSYSTEM-ENGINE-EDGE-FIXES.md`.

---

## 1. The problem

The entity panel currently prints three separate verdicts:

| block | what it answers | how it is built |
|---|---|---|
| **Критичность** 0–100 | how hard to replace | hand-scored rubric, 4 weighted factors, engine |
| **Гравитация** 0–100 | how woven into the graph | count of neighbours / layers / edge types / loops |
| **Центральность** (degree, betweenness, pagerank×) | position in the network | graph algorithms, engine |

They overlap, they disagree, and none of them is a ranking. Comparing two
entities means holding six numbers in your head. So: **one number, 0–100, and a
rank.** Criticality/gravity/centrality do not disappear — they become the
*inputs* of it.

---

## 2. The name

**ВЕС В СИСТЕМЕ / Systemic Weight**, shortened to **ВЕС** in the table.
Reads as a single question: *how much of the industry rests on this node.*

Alternatives if you prefer: «ОПОРА» (load-bearing), «ЗНАЧИМОСТЬ», «ВЛИЯНИЕ».

---

## 3. The foundation: dependency PageRank

PageRank is the right base for the reason you named — importance is recursive:
a link from an important node is worth more than a link from a random one, and
that has to be solved as a fixed point, not a weighted average.

Three things have to be right for it to mean anything here.

### 3.1 The edges must be turned into *dependencies*, and pointed the right way

PageRank flows rank **toward** what is linked to. So the graph fed to it is not
the map's edge list — it is a derived **dependency graph** whose arrow means
*"A leans on B"*. `asml —supplies→ tsmc` becomes `tsmc ⇒ asml`.

Each of the map's 33 edge types gets a fixed orientation and a class weight
(`ts` = target depends on source, `st` = source depends on target):

| family | types | orient | class w |
|---|---|---|---|
| physical supply | manufactures, supplies, packages, delivers_to, enables | ts | 0.9–1.0 |
| assembly | integrates | ts | 0.8 |
| built-around | optimizes_for, standardizes_on, path_dependent_on | st | 0.9–1.0 |
| mutual | co_designs, strategic_partner, enables_interop | both, ½ each way | 0.4–0.6 |
| purchase | customer_of | st | 0.9 |
| lock-in | locks_in_developers, locks_in_platforms | ts | 1.0 |
| demand | validates_demand, proves_roi, proves_use_case | ts | 0.4–0.5 |
| capital | invests_in, board_seat, funded_by | ts / st | 0.45–0.6 |
| standing | sets_benchmark, defines_category | ts | 0.4 |
| control | controls_access_to, export_controlled_by, subject_to_restriction, geopolitically_dependent | **role-resolved** | 0.7–1.0 |
| rivalry | competes_with, is_alternative_to, threatens, could_disrupt, hedges_against, diversifies_supply | **dropped** | — |

Two decisions worth naming:

* **Rivalry edges carry no weight (43 of 262).** Being competed with does not
  make you load-bearing. AMD competing with NVIDIA must not lend NVIDIA rank.
  Substitution is handled properly one line below, per-link.
* **Control edges are oriented by `role`, not by the verb.** The payload is
  inconsistent here — `bis —export_controlled_by→ nvidia` and
  `nvidia —subject_to_restriction→ china` point opposite ways for the same
  real relation. Rule: **the side whose `role === 'state'` is the one being
  depended on.** This alone moved Taiwan from 38 to 64 and BIS from 38 to 54 in
  the prototype. (Also worth a bug report upstream to the engine.)

### 3.2 Not every dependency is equally heavy

Each surviving edge gets a weight from fields the engine already ships:

```
substance(e) = 0.50·strength/100          how big the dependence is
             + 0.30·lockInDepth/100       how deeply embedded
             + 0.20·(1 − substitutability/100)   how hard THIS link is to swap

w(e) = substance(e) × confidence × statusFactor × classWeight
              statusFactor: confirmed 1.0 · high_confidence 0.9 · signal 0.6
```

`substitutability` is the substitution answer done right: if TSMC could swap
Lam Research tomorrow, TSMC's weight barely reaches Lam. Nothing hardcoded —
the engine annotates every edge with it already.

### 3.3 A node forwards only as much weight as the map actually knows about it

Standard PageRank splits a node's mass across its out-edges. In a hand-built
map that is dangerous: a node with **one** modeled dependency hands that
dependency 100% of NVIDIA's inherited weight, and a small supplier rockets into
the top ten purely because we were lazy about modeling.

Fix — **coverage damping.** A node forwards

```
share(u) = d · outdeg(u) / (outdeg(u) + k)        d = 0.85, k = 2.0
```

1 modeled dependency → forwards 28%. 5 → 61%. 15 → 75%. The remainder leaks back
to the teleport vector. Meaning in one sentence: *we only propagate as much
influence as we have evidence for.*

### 3.4 The teleport vector is criticality — this is where the rubric enters

Classic PageRank teleports uniformly (every node equally important a priori).
Ours teleports **proportionally to criticality**, so the hand-scored,
source-backed rubric is what seeds the whole fixed point. Depending on a
criticality-96 node is structurally worth more than depending on a
criticality-30 node, before a single edge is counted.

```
R = leak·p  +  Σ_u  R(u) · share(u) · w(u→v)/Σw(u→·)         p ∝ criticality
```

Solved by 200 power iterations. 107 nodes — under a millisecond.

---

## 4. Three more terms, then one number

PageRank alone is blind to two things that matter on this map, so the final
metric is a **geometric mean of four multiples-of-average**. Every term is
expressed as "×average across the network", so their product is also a
×average, and each is separately readable in the panel.

| term | what it catches | how it is computed | exponent |
|---|---|---|---|
| **Влияние** (influence) | important things lean on it, recursively | the PageRank above ÷ network mean | **0.50** |
| **Незаменимость** (irreplaceability) | inherent hardness to replace, evidence-backed | `criticality` ÷ network mean | **0.20** |
| **Охват** (reach) | leaned on from *many different* layers, not one clique | `exp(H)` — entropy of the weighted layer distribution of its dependents = "effective number of layers", ÷ network mean | **0.18** |
| **Ломкость** (bridge) | removing it cuts the network in two | `1 + betweenness` (engine-computed) ÷ network mean | **0.12** |

```
I = Влияние^0.50 · Незаменимость^0.20 · Охват^0.18 · Ломкость^0.12
```

Exponents sum to 1, so `I` stays a clean ×average. Multiplicative, not
additive, on purpose: one huge term cannot fully rescue a node that is nothing
on the other three, and there is no "points out of 25" arithmetic to argue with.

**Deliberately NOT separate terms:**
* *Loops / cycles* — PageRank already rewards them: weight recirculates through
  a closed lock-in loop instead of leaking away. Gravity counted them by hand.
* *Degree* — that is what gravity's «связана с» was, and raw degree is exactly
  the thing PageRank was invented to replace.
* *Evidence quality* — already inside every edge weight (`confidence`, `status`).
* *The node's own exposure* (what **it** depends on) — that is fragility, a
  different question. Worth its own future row; it is not importance.

### Scaling to 0–100

`I` is a multiple of average, and multiples are unreadable. Fixed log anchor:

```
ВЕС = clamp(0, 100, round(50 + 16.6 · log₂ I))
```

**50 = exactly network-average. Every doubling of influence = +16.6 points.**
One sentence in a tooltip, stable month to month (it is anchored to the mean,
not to a rank), and comparable between the two maps.

Because the middle of any real network is crowded, the panel shows the score
**with its rank** — `73 · #4 из 107` — which is what actually settles "is this
one bigger than that one" at a glance.

Bands (colour + word, same treatment criticality has today):
`85+ Опора · 65–84 Несущий · 50–64 Значимый · 35–49 Второй ряд · <35 Периферия`

---

## 5. What it actually produces (real prototype output)

```
id                  ВЕС   влияние×  незамен×  охват×  ломкость×   (crit / grav today)
nvidia               88      8.64      1.78    4.62      1.81        96 / 97
tsmc                 70      3.05      1.58    2.06      1.12        85 / 64
cuda                 67      2.85      1.78    1.25      1.02        96 / 47
taiwan               63      1.93      1.52    1.92      0.99        82 / 10
openai               62      1.73      1.41    1.85      1.05        76 / 51
google               60      1.58      1.21    2.06      1.00        65 / 28
usa                  60      1.69      1.56    1.35      0.99        84 / 13
kubernetes           59      1.46      1.30    2.00      0.99        70 / 14
microsoft            59      1.54      1.28    1.49      1.08        69 / 59
netherlands          59      1.57      1.41    1.35      0.99        76 /  8
arm                  58      1.42      1.52    1.34      0.99        82 / 26
huggingface          58      1.33      1.25    1.98      0.99        67 / 42
pytorch              58      1.43      1.49    1.17      0.99        80 / 33
lam-research         58      1.60      1.12    1.19      0.99        60 / 11
…
asml                 54      1.31      1.52    0.68      0.99        82 /  8
equinix              53      1.06      1.15    1.39      1.02        52 / 22
a16z                 38      0.37      0.67    0.68      0.99        31 /  4
lite-on              34      0.37      0.58    0.68      0.99        26 /  4
```

Distribution: min 34 · p25 42 · median 47 · p75 54 · max 88.
Rank correlation with today's criticality ρ=0.90, with gravity ρ=0.62 — it
agrees with the rubric broadly and re-ranks sharply at the top, which is the
intent.

**The one honest weakness, visible above:** ASML lands at 54 despite
criticality 82, because the map records exactly **one** ASML edge
(`asml → tsmc`). The metric is not wrong — the map under-models ASML, and the
metric is the first thing that has ever said so out loud. Two responses, not
exclusive: (a) it stays, and low ВЕС on a high-criticality node becomes a
signal to go fix the map; (b) the engine adds the missing ASML→Samsung/Intel/
SK Hynix edges next run and ASML rises on its own. I lean (a) + report it.

Note criticality is deliberately counted twice — as the teleport prior and as
its own 0.20 term. Not an oversight: the prior decides *whose dependence is
worth more*, the term keeps a thinly-modeled monopolist from being punished for
the map's gaps. Drop the explicit term and ASML falls to 52, Synopsys to 52.

---

## 6. Where it is computed

**In the dashboard, not the engine.** New module `src/data/ecoWeight.js`
(~300 lines), called once from `buildGraphFrom()` in
`src/data/nvidiaEcosystem.js`, which both maps already share — so the network map and the reserve NVIDIA map get it for free, and the
frozen `ai-ecosystem-network/2` contract does not change. Every input already
exists in the payload. No engine round-trip, no waiting a month, and the
formula stays editable in one file while it is being tuned. If it proves out,
the engine can adopt it verbatim later and we just read the field.

Each node gains:

```js
weight: {
  score: 73, rank: 4, of: 107, band: 'load_bearing',
  influence: 1.73, irreplaceability: 1.41, reach: 1.85, bridge: 1.05,
  reachLayers: 5,            // effective layer count, for the plain-language row
  topDependents: [...],      // 3 heaviest contributors — "who makes it heavy"
}
```

---

## 7. What changes in the UI

**EcoEntityPanel** — sections 3 and 7 collapse into one:

* **DELETED**: the «Гравитация» block (score + 4 stat rows) and its
  «Центральность в сети» sub-block (degree / betweenness / influence×).
* **NEW «ВЕС В СИСТЕМЕ»** block in gravity's place: the big number + band +
  `#4 из 107`, then the four factor rows in the exact visual language
  criticality uses today (label · `×0.50` exponent chip · meter · value), each
  with one line of plain Russian under it — e.g. *«На неё опираются 12 сущностей
  из 5 разных слоёв, включая NVIDIA и TSMC»*.
* **Критичность**: keeps its 4 rubric rows and their `criticalityWhy` prose —
  they are the best writing in the panel — but **loses the big 30px number**
  and nests under the «Незаменимость» factor as an expandable breakdown. One
  headline number in the panel, not two.
* Tooltip on the headline: *«50 — среднее по сети. Каждое удвоение веса — +17.
  Считается как PageRank по графу зависимостей: важна та, на кого опираются
  важные.»*

**Shipped with the defaults** — all four are one-line flips:

1. **EcoTable** — `ВЕС` column in, `Гравит.` column out, default sort by ВЕС. ✔
2. **Node size on the canvas** — unchanged, still criticality. The metric is a
   reading, not a re-draw. ✔
3. **Graph hover tooltip** — one line, `Вес в системе 70 · Несущий узел · #2`,
   replacing the criticality and «влияние в сети» rows. ✔
4. **Filter bar** — no ВЕС slider. Not yet. ✔

---

## 8. Build order

1. `ecoWeight.js` — orientation table, edge weights, coverage-damped
   personalized PageRank, reach entropy, composition, banding, ranking. Pure
   function, zero React.
2. Wire into `buildGraphFrom()`; both maps get `n.weight`.
3. Panel: new block in, gravity + centrality out, criticality demoted.
4. Table column, hover tooltip, whatever is said yes to in §7.
5. A `scripts/eco_weight_report.mjs` that prints the full 107-row table sorted
   by ВЕС — so tuning the exponents is one command, not a page reload.
6. `npm run build`, push.
