#!/usr/bin/env tsx
/** Offline walk-forward pool matrix. Reads only a local CSV and writes local reports. */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, basename } from 'node:path';
import { importTrisCsv } from '../src/research/data-adapter';
import { runPoolExperimentMatrix } from '../src/research/pool-method-experiment';
import type { Pos, PoolMethod } from '../src/research-core';

const input = process.argv[2];
if (!input) {
  console.error('Usage: npm run research:pools -- <local-path-to-Tris.csv>');
  process.exit(2);
}
const inputPath = resolve(input);
const csv = await readFile(inputPath, 'utf8');
const sha256 = createHash('sha256').update(csv).digest('hex');
const imported = importTrisCsv(csv);
if (imported.validation.errors.length) {
  console.error('CSV validation errors:');
  imported.validation.errors.slice(0, 30).forEach(e => console.error('- ' + e));
  process.exit(1);
}
const draws = imported.validation.valid;
if (draws.length <= 1000) {
  console.error('Need more than 1,000 valid draws for this matrix (minTrain=1000).');
  process.exit(1);
}
const positions: Pos[] = [0, 1, 2, 3, 4];
const methods: PoolMethod[] = ['frequency', 'long-absence', 'short-absence', 'balanced', 'recent-frequency'];
const sizes = [1,2,3,4,5,6,7,8,9,10];
const windows = [20,50,100,200];
const minTrain = 1000;
const rows = runPoolExperimentMatrix(draws, positions, methods, sizes, minTrain, windows);
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = resolve('reports/pool-matrix');
await mkdir(outDir, { recursive: true });
const csvEscape = (v: unknown) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const columns = ['position','method','poolSize','window','tested','hits','hitRate','uniformRate','liftVsUniform','fixedFrequencyHits','fixedFrequencyRate','rollingFrequencyHits','rollingFrequencyRate','pairedDiffVsRolling','pairedCI95Low','pairedCI95High','warnings'];
const matrixCsv = [columns.join(','), ...rows.map(r => [
  r.position,r.method,r.poolSize,r.window,r.tested,r.hits,r.hitRate,r.uniformRate,r.liftVsUniform,
  r.fixedFrequencyHits,r.fixedFrequencyRate,r.rollingFrequencyHits,r.rollingFrequencyRate,
  r.pairedDiffVsRolling,r.pairedDiffCI95[0],r.pairedDiffCI95[1],r.warnings.join(' | ')
].map(csvEscape).join(','))].join('\n') + '\n';
const csvFile = resolve(outDir, `matrix-${stamp}.csv`);
const reportFile = resolve(outDir, `report-${stamp}.md`);
await writeFile(csvFile, matrixCsv, 'utf8');
const distinctConfigCount = new Set(rows.map(r => `${r.position}:${r.method}:${r.poolSize}:${r.method === 'frequency' ? 'all-history' : r.window}`)).size;
const report = `# TRIS offline pool matrix report

## Provenance
- Input file: ${basename(inputPath)}
- SHA-256: ${sha256}
- Valid draws: ${draws.length}
- Draw range: ${draws[0]?.drawId ?? 'n/a'}–${draws.at(-1)?.drawId ?? 'n/a'}
- Date range: ${imported.provenance.dateRange[0] ?? 'n/a'} – ${imported.provenance.dateRange[1] ?? 'n/a'}
- Train prefix: ${minTrain} draws; walk-forward test rows: ${Math.max(0,draws.length-minTrain)}
- Rows in matrix: ${rows.length}; unique settings after removing redundant window choices for global frequency: ${distinctConfigCount}
- CSV report: ${basename(csvFile)}

## Settings
- Positions: 0–4 (R1–R5)
- Methods: ${methods.join(', ')}
- Pool sizes: 1–10
- Rolling windows: ${windows.join(', ')}
- The global-frequency method uses the full prior history; window settings are redundant for that method.

## Data quality
${imported.validation.warnings.length ? imported.validation.warnings.slice(0,100).map(w => '- ' + w).join('\n') : '- No import warnings.'}
${imported.validation.warnings.length > 100 ? '\n- (Additional warnings omitted from this report; inspect adapter output.)' : ''}

## Interpretation guardrails
- This is exploratory historical analysis, not a prediction or guarantee.
- All target draws are scored using information from prior draws only.
- The matrix contains many comparisons; the best historical configuration is likely optimistic due to selection.
- Freeze shortlisted settings and evaluate them prospectively on new draws before claiming a signal.
- Pool hit rates are not equivalent to prize probability or expected monetary value.
`;
await writeFile(reportFile, report, 'utf8');
console.log('Offline matrix complete.');
console.log(`CSV: ${csvFile}`);
console.log(`Report: ${reportFile}`);
console.log(`SHA-256: ${sha256}`);
console.log(`Rows: ${rows.length}; valid draws: ${draws.length}`);
