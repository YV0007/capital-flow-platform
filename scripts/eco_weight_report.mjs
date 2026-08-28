// ══════════════════════════════════════════════════════════════════════════
// ВЕС В СИСТЕМЕ — the whole table, sorted, in one command.
//
// The metric lives in src/data/ecoWeight.js and is tuned by four exponents,
// a damping factor and a coverage constant. Judging a change to any of them
// from the UI means clicking 107 nodes, so this prints the ranking straight
// out of the same code path the dashboard runs — the built graph, not a
// re-implementation.
//
//   node scripts/eco_weight_report.mjs              top 40 + the tail
//   node scripts/eco_weight_report.mjs --all        all 107 rows
//   node scripts/eco_weight_report.mjs --csv        machine-readable
//   node scripts/eco_weight_report.mjs --gaps       where it disagrees with
//                                                   criticality, and why
//
// Loaded through Vite's SSR loader for the same reason the i18n audit is:
// the data modules import JSON and JSX that bare Node will not resolve.
// ══════════════════════════════════════════════════════════════════════════

import { createServer } from 'vite';

const ARGS = new Set(process.argv.slice(2));
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });

try {
  const i18n = await vite.ssrLoadModule('/src/lib/i18n.jsx');
  i18n.setLangForTooling('ru');
  const mod = await vite.ssrLoadModule('/src/data/aiEcosystemNetwork.js');
  const graph = mod.buildGraph();
  const rows = graph.entities
    .filter(e => e.weight)
    .sort((a, b) => a.weight.rank - b.weight.rank);

  if (ARGS.has('--csv')) {
    console.log('rank,id,name,weight,influence,irreplaceability,reach,bridge,criticality,gravity,dependents,layers');
    rows.forEach(e => {
      const w = e.weight;
      console.log([w.rank, e.id, JSON.stringify(e.name), w.score,
        w.influence.toFixed(3), w.irreplaceability.toFixed(3), w.reach.toFixed(3), w.bridge.toFixed(3),
        e.criticality, e.gravity?.score ?? '', w.dependents, w.layersTouched].join(','));
    });
  } else if (ARGS.has('--gaps')) {
    // Where the metric and the rubric part ways. A high-criticality node with a
    // low weight is usually not a metric error — it is the map admitting it has
    // barely modelled that node. That is the most useful thing this prints.
    console.log('\nВЕС vs КРИТИЧНОСТЬ — biggest disagreements\n');
    const gap = rows.map(e => ({ e, d: e.criticality - e.weight.score }));
    const show = (list, title) => {
      console.log(`  ${title}`);
      list.forEach(({ e, d }) => {
        console.log(`    ${e.name.padEnd(22)} крит ${String(e.criticality).padStart(3)} → вес ${String(e.weight.score).padStart(3)}  (${d > 0 ? '+' : ''}${d})  `
          + `связей внутрь ${e.weight.dependents}, слоёв ${e.weight.layersTouched}`);
      });
      console.log('');
    };
    show(gap.slice().sort((a, b) => b.d - a.d).slice(0, 8), 'RUBRIC HIGHER — under-modelled in the map, or genuinely isolated:');
    show(gap.slice().sort((a, b) => a.d - b.d).slice(0, 8), 'GRAPH HIGHER — carries more than its own rubric score suggests:');
  } else {
    const N = rows.length;
    const head = `${'#'.padStart(4)}  ${'entity'.padEnd(22)}${'ВЕС'.padStart(5)}${'влиян×'.padStart(9)}${'незам×'.padStart(9)}${'охват×'.padStart(9)}${'ломк×'.padStart(8)}${'крит'.padStart(6)}${'грав'.padStart(6)}${'←деп'.padStart(6)}`;
    console.log(`\n  ${graph.stats.entityCount} сущностей · ${graph.stats.edgeCount} рёбер · ${graph.source}\n`);
    console.log(head);
    console.log('  ' + '─'.repeat(head.length - 2));
    const list = ARGS.has('--all') ? rows : rows.slice(0, 40);
    list.forEach(e => {
      const w = e.weight;
      console.log(`${String(w.rank).padStart(4)}  ${e.name.slice(0, 21).padEnd(22)}${String(w.score).padStart(5)}`
        + `${w.influence.toFixed(2).padStart(9)}${w.irreplaceability.toFixed(2).padStart(9)}`
        + `${w.reach.toFixed(2).padStart(9)}${w.bridge.toFixed(2).padStart(8)}`
        + `${String(e.criticality).padStart(6)}${String(e.gravity?.score ?? '—').padStart(6)}${String(w.dependents).padStart(6)}`);
    });
    if (!ARGS.has('--all')) {
      console.log('  …');
      rows.slice(-5).forEach(e => {
        const w = e.weight;
        console.log(`${String(w.rank).padStart(4)}  ${e.name.slice(0, 21).padEnd(22)}${String(w.score).padStart(5)}`
          + `${w.influence.toFixed(2).padStart(9)}${w.irreplaceability.toFixed(2).padStart(9)}`
          + `${w.reach.toFixed(2).padStart(9)}${w.bridge.toFixed(2).padStart(8)}`
          + `${String(e.criticality).padStart(6)}${String(e.gravity?.score ?? '—').padStart(6)}${String(w.dependents).padStart(6)}`);
      });
    }
    const scores = rows.map(e => e.weight.score).sort((a, b) => a - b);
    const q = (p) => scores[Math.floor((scores.length - 1) * p)];
    console.log(`\n  распределение: min ${q(0)} · p25 ${q(0.25)} · медиана ${q(0.5)} · p75 ${q(0.75)} · p90 ${q(0.9)} · max ${q(1)}`);
    // Spearman against the two metrics this one replaces — a sanity check that
    // it agrees broadly with the rubric while re-ranking where it should.
    const rank = (key) => {
      const o = [...rows].sort((a, b) => key(b) - key(a));
      return new Map(o.map((e, i) => [e.id, i + 1]));
    };
    const rw = rank(e => e.weight.score);
    const rho = (other) => {
      const ro = rank(other);
      const d = rows.reduce((s, e) => s + (rw.get(e.id) - ro.get(e.id)) ** 2, 0);
      return 1 - (6 * d) / (N * (N * N - 1));
    };
    console.log(`  ρ(критичность) ${rho(e => e.criticality || 0).toFixed(2)} · `
      + `ρ(гравитация) ${rho(e => e.gravity?.score || 0).toFixed(2)} · `
      + `ρ(PageRank движка) ${rho(e => e.centrality?.pagerank || 0).toFixed(2)}\n`);
  }
} finally {
  await vite.close();
}
