// Tracker company registry — monolith line 1705. Kept in JS (not JSON) because
// each entry exposes lazy getter functions (`config: () => SEEDED_CONFIG`)
// that close over imported constants. App.jsx imports
// `{ COMPANIES, getCompanyById, ACTIVE_COMPANY_KEY }` and reads the lazy
// getters identically to the monolith.

import seededConfig from './seeded-config.json';
import cfgCursor from './cfg-cursor.json';
import memoBaseline from './memo-baseline.json';
import memoBaselineCursor from './memo-baseline-cursor.json';
import seededObservations from './seeded-observations.json';
import seededObservationsCursor from './seeded-observations-cursor.json';
import memoObservations from './memo-observations.json';
import memoObservationsCursor from './memo-observations-cursor.json';
import seededSyndicateLog from './seeded-syndicate-log.json';
import seededSyndicateLogCursor from './seeded-syndicate-log-cursor.json';
import triangulationTasksSeed from './triangulation-tasks.json';
import triangulationTasksSeedCursor from './triangulation-tasks-cursor.json';
import derivedMetrics from './derived-metrics.json';
import derivedMetricsCursor from './derived-metrics-cursor.json';

export const COMPANIES = [
  {
    id: 'zeely',
    name: 'Zeely.ai',
    legalName: 'Zeely Inc.',
    accent: 'cyan',
    storagePrefix: 'zeely',
    config: () => seededConfig,
    memoBaseline: () => memoBaseline,
    memoBaselineKey: 'zeely:memo-baseline:apr2026',
    seededObservations: () => seededObservations,
    memoObservations: () => memoObservations,
    seededSyndicateLog: () => seededSyndicateLog,
    triangulationTasksSeed: () => triangulationTasksSeed,
    derivedMetrics: () => derivedMetrics,
  },
  {
    id: 'cursor',
    name: 'Cursor',
    legalName: 'Anysphere Inc.',
    accent: 'amber',
    storagePrefix: 'cursor',
    config: () => cfgCursor,
    memoBaseline: () => memoBaselineCursor,
    memoBaselineKey: 'cursor:memo-baseline:feb2026',
    seededObservations: () => seededObservationsCursor,
    memoObservations: () => memoObservationsCursor,
    seededSyndicateLog: () => seededSyndicateLogCursor,
    triangulationTasksSeed: () => triangulationTasksSeedCursor,
    derivedMetrics: () => derivedMetricsCursor,
  },
  // YC is a portfolio directory, not a single-company deep-dive. The
  // `isDirectory: true` flag tells App.jsx to skip the heavy tracker load
  // path and render `<YCombinator />` instead of the 7-tab structure.
  {
    id: 'yc',
    name: 'Y Combinator',
    legalName: 'Y Combinator portfolio',
    accent: 'orange',
    storagePrefix: 'yc',
    isDirectory: true,
    config: () => null,
    memoBaseline: () => null,
    memoBaselineKey: 'yc:memo-baseline',
    seededObservations: () => [],
    memoObservations: () => [],
    seededSyndicateLog: () => [],
    triangulationTasksSeed: () => [],
    derivedMetrics: () => ({}),
  },
];

export const ACTIVE_COMPANY_KEY = 'app:active-company';

export function getCompanyById(id) {
  return COMPANIES.find((c) => c.id === id) || COMPANIES[0];
}
