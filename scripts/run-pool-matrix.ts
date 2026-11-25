/**
 * Offline TRIS pool matrix runner.
 * Usage: npm run research:pools -- ./data/Tris.csv
 * No network requests or API dependencies; input is a locally supplied CSV.
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { importTrisCsv } from '../src/research/data-adapter';
import { runPoolExperimentMatrix } from '../src/research/pool-method-experiment';

const input=resolve(process.argv[2]??'data/Tris.csv');
const csv=await readFile(input,'utf8');
const imported=importTrisCsv(csv);
if(imported.validation.errors.length)throw new Error(imported.validation.errors.join('\n'));
const draws=imported.validation.valid;
const fingerprint=createHash('sha256').update(csv).digest('hex');
const minTrain=1000,windows=[20,50,100,200],positions=[0,1,2,3,4] as const;
const methods=['frequency','long-absence','short-absence','balanced','recent-frequency'] as const;
const sizes=[1,2,3,4,5,6,7,8,9,10];
const results=runPoolExperimentMatrix(draws,[...positions],[...methods],[...sizes],minTrain,[...windows]);
const timestamp=new Date().toISOString().replace(/[:.]/g,'-');
const outputDir=resolve('reports/pool-matrix');
await mkdir(outputDir,{recursive:true});
const base='pool-matrix-'+timestamp;
const fields=['position','method','poolSize','window','tested','hits','hitRate','uniformRate','liftVsUniform','fixedFrequencyHits','fixedFrequencyRate','rollingFrequencyHits','rollingFrequencyRate','pairedDiffVsRolling','pairedDiffCI95Low','pairedDiffCI95High','redundantWindow','sourceRows','minDrawId','maxDrawId','sha256'];
const csvEscape=(value:unknown)=>{const s=String(value??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
const rows=results.map(r=>[r.position,r.method,r.poolSize,r.window,r.tested,r.hits,r.hitRate.toFixed(8),r.uniformRate.toFixed(8),r.liftVsUniform.toFixed(8),r.fixedFrequencyHits,r.fixedFrequencyRate.toFixed(8),r.rollingFrequencyHits,r.rollingFrequencyRate.toFixed(8),r.pairedDiffVsRolling.toFixed(8),r.pairedDiffCI95[0].toFixed(8),r.pairedDiffCI95[1].toFixed(8),r.method==='frequency'?'yes':'no',draws.length,draws[0]?.drawId,draws.at(-1)?.drawId,fingerprint]);
await writeFile(resolve(outputDir,base+'.csv'),[fields.join(','),...rows.map(r=>r.map(csvEscape).join(','))].join('\n'),'utf8');
const summary=`# Offline TRIS pool matrix\n\n- Input file: ${input}\n- Draws: ${draws.length}\n- Draw ID range: ${draws[0]?.drawId??'n/a'}–${draws.at(-1)?.drawId??'n/a'}\n- Initial training period: ${minTrain} draws\n- Windows: ${windows.join(', ')}\n- Rows: ${results.length}\n- SHA-256: ${fingerprint}\n- Imported warnings: ${imported.validation.warnings.length}\n\nThis is exploratory historical testing, not a prediction claim. Configurations are not independent; selecting the best rows creates multiple-testing/selection bias. Window is redundant for global frequency. Keep frozen candidates for prospective validation on future draws.\n`;
await writeFile(resolve(outputDir,base+'.md'),summary,'utf8');
console.log(JSON.stringify({input,draws:draws.length,errors:imported.validation.errors.length,warnings:imported.validation.warnings.length,rows:results.length,csv:resolve(outputDir,base+'.csv'),report:resolve(outputDir,base+'.md'),sha256:fingerprint},null,2));
