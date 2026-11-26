#!/usr/bin/env tsx
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import type {PositionalPoolConcordanceReport} from "../src/research/positional-pool-concordance";
import {analyzePositionalPoolCircularShiftControls} from "../src/research/positional-pool-circular-shift";
const input=resolve(process.argv[2]??"data/prospective-portfolio/regime-analysis/latest.json");
const raw=JSON.parse(await readFile(input,"utf8"));
const concordance=raw.positionalPoolConcordance as PositionalPoolConcordanceReport;
if(!concordance||!Array.isArray(concordance.blocks))throw new Error("input lacks positionalPoolConcordance.blocks; run research:regime-analysis first");
const report=analyzePositionalPoolCircularShiftControls(concordance,{replications:Number(process.env.TRIS_POSITIONAL_POOL_SHIFT_REPS??999),minimumPairs:Number(process.env.TRIS_POSITIONAL_POOL_SHIFT_MIN_PAIRS??5),seed:Number(process.env.TRIS_POSITIONAL_POOL_SHIFT_SEED??20261203)});
const dir=resolve("reports/positional-pool-circular-shift");await mkdir(dir,{recursive:true});
await writeFile(resolve(dir,"latest.json"),JSON.stringify({generatedAt:new Date().toISOString(),input,...report},null,2)+"\n","utf8");
const pct=(v:number|null)=>v===null?"n/d":(100*v).toFixed(2)+"%";
const md=["# Fase 33 — controles de desplazamiento circular","","- Entrada: "+input,"- Réplicas: "+report.replications,"- Semilla: "+report.seed,"","| Régimen | Posición | Método | Pool | Métrica | n | Correlación observada | Media nula | DE | P2.5 | Mediana | P97.5 | Excedencias | Cola empírica | Estado |","|---|---:|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|",...report.groups.flatMap(g=>g.metrics.map(m=>"| "+g.regimeId+" | R"+(g.position+1)+" | "+g.method+" | "+g.poolSize+" | "+m.metric+" | "+m.support+" | "+(m.observedCorrelation?.toFixed(3)??"n/d")+" | "+(m.nullMean?.toFixed(3)??"n/d")+" | "+(m.nullSd?.toFixed(3)??"n/d")+" | "+(m.nullP025?.toFixed(3)??"n/d")+" | "+(m.nullMedian?.toFixed(3)??"n/d")+" | "+(m.nullP975?.toFixed(3)??"n/d")+" | "+m.exceedances+" / "+m.replications+" | "+pct(m.empiricalTwoSidedTailRate)+" | "+m.status+" |")),"","## Limitaciones",...report.limitations.map(x=>"- "+x)].join("\n")+"\n";
await writeFile(resolve(dir,"latest.md"),md,"utf8");console.log(md);
