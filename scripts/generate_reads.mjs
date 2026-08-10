#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// generate_reads — the dashboard's deal-"read" generator (weekly-routine step).
//
// The "read" is dashboard-owned NARRATIVE, written FROM THE PAYLOAD ONLY (never
// the web — every fact is already in the flow + its joined nodes). It is cached
// against the engine's stable `flow.id`, so a read is written once and only
// (re)generated for ids not yet in the store — unchanged deals are never
// re-worded, and coverage climbs to 100% over cycles.
//
// This script does the DETERMINISTIC half (find gaps, assemble briefs, persist);
// an agent (the weekly routine following .claude/skills/capital-flow-reads)
// writes the actual angle+read from each brief. Three modes:
//
//   node scripts/generate_reads.mjs stats
//       coverage report: how many flows have a read, hand vs cached vs none.
//
//   node scripts/generate_reads.mjs briefs [--limit N] [--all]
//       emits JSON [{id, brief}] for flows with NO read yet (largest first).
//       The agent turns each brief into {id, angle, read}. --all ignores limit.
//
//   node scripts/generate_reads.mjs save <path-to-{id:{angle,read}}.json>
//       merges generated reads into src/data/flowNotes.json (keyed by flow.id),
//       preserving everything already there. Idempotent.
//
// Boundary: this file NEVER fetches anything and NEVER edits engine facts. It
// only reads capitalMap.json + flowNotes.json and writes flowNotes.json.
// ══════════════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAP = join(ROOT, 'src/data/capitalMap.json');
const NOTES = join(ROOT, 'src/data/flowNotes.json');
const REF = join(ROOT, 'src/data/entityReference.json');

const read = (p) => JSON.parse(readFileSync(p, 'utf8'));

function fmtUSD(n) {
  if (n == null) return null;
  const a = Math.abs(n);
  if (a >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${Math.round(n)}`;
}

// A read already EXISTS for a flow when the engine wrote one, or the store has
// an entry keyed by flow.id, or a legacy entry keyed by source=>target.
function hasRead(flow, notes) {
  if (flow.read) return 'engine';
  if (flow.id && notes[flow.id]) return 'cached';
  if (notes[`${flow.source}=>${flow.target}`]) return 'legacy';
  return null;
}

// One flow → a compact fact brief (payload-only) for the agent to write from.
function briefFor(flow, byId, allocators, ref) {
  const src = byId.get(flow.source) || {};
  const tgt = byId.get(flow.target) || {};
  const allocName = ref[flow.source]?.displayName || src.label || flow.source.replace(/^alloc:/, '');
  const prof = (allocators[allocName] || allocators[src.label] || {}).profile || {};
  return {
    amount: flow.amount != null ? fmtUSD(flow.amount) : 'undisclosed',
    amount_estimated: !!flow.amount_estimated,
    round_total: flow.round_total != null ? fmtUSD(flow.round_total) : null,
    event_type: flow.event_type,
    instrument: flow.instrument || null,
    capital_role: flow.capital_role || null,
    stage: flow.stage || null,
    sector: flow.sector || null,
    subsector: flow.subsector || null,
    status: flow.status,
    confidence: flow.confidence ?? null,
    date: flow.date,
    co_investors: flow.co_investors || null,
    allocator: {
      name: allocName,
      class: src.cls || null,
      country: src.country || null,
      thesis: prof.thesis || null,
      style: prof.style || null,
      focus: prof.focus || null,
    },
    target: {
      name: tgt.label || flow.target.replace(/^target:/, ''),
      class: tgt.cls || null,
      description: tgt.description || null,
    },
  };
}

const [, , mode, ...rest] = process.argv;
const m = read(MAP);
const notes = read(NOTES);
const ref = read(REF);
const byId = new Map(m.nodes.map((n) => [n.id, n]));
const flows = m.flows;

if (mode === 'stats') {
  const by = { engine: 0, cached: 0, legacy: 0, none: 0 };
  flows.forEach((f) => { by[hasRead(f, notes) || 'none'] += 1; });
  const have = by.engine + by.cached + by.legacy;
  console.log(`flows: ${flows.length}`);
  console.log(`  with a read: ${have} (${Math.round((100 * have) / flows.length)}%)`);
  console.log(`    engine: ${by.engine} · cached (flow.id): ${by.cached} · legacy (src=>tgt): ${by.legacy}`);
  console.log(`  NO read yet: ${by.none}`);
  process.exit(0);
}

if (mode === 'briefs') {
  const all = rest.includes('--all');
  const li = rest.indexOf('--limit');
  const limit = all ? Infinity : li >= 0 ? Number(rest[li + 1]) : 40;
  const gaps = flows
    .filter((f) => f.id && !hasRead(f, notes))
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))
    .slice(0, limit)
    .map((f) => ({ id: f.id, brief: briefFor(f, byId, m.allocators || {}, ref) }));
  console.log(JSON.stringify(gaps, null, 2));
  process.exit(0);
}

if (mode === 'save') {
  const path = rest[0];
  if (!path) { console.error('usage: save <file.json>'); process.exit(1); }
  const incoming = read(path);
  let added = 0;
  for (const [id, v] of Object.entries(incoming)) {
    if (!id.startsWith('flow:')) { console.error(`skip non-flow.id key: ${id}`); continue; }
    if (!v || !v.read) { console.error(`skip ${id}: no read`); continue; }
    if (!notes[id]) added += 1;
    notes[id] = { angle: v.angle || null, read: v.read };
  }
  // Stable, diff-friendly write: _meta first, then flow.id keys sorted.
  const out = {};
  for (const k of Object.keys(notes).filter((k) => k.startsWith('_'))) out[k] = notes[k];
  for (const k of Object.keys(notes).filter((k) => !k.startsWith('_')).sort()) out[k] = notes[k];
  writeFileSync(NOTES, JSON.stringify(out, null, 2) + '\n');
  console.log(`saved: +${added} new, ${Object.keys(incoming).length} total in payload`);
  process.exit(0);
}

console.error('usage: generate_reads.mjs stats | briefs [--limit N|--all] | save <file>');
process.exit(1);
