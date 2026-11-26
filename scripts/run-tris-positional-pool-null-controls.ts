#!/usr/bin/env tsx
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import type {PositionalPoolConcordanceReport} from "../src/research/positional-pool-concordance";
import {analyzePositionalPoolNullControls} from "../src/research/positional-pool-null-controls";
const input=resolve(process.argv[2]??"data/prospective-portfolio/regime-analysis/latest.json");
const raw=JSON.parse(await readFile(input,"utf8"));
const concordance=raw.positionalPoolConcordance as PositionalPoolConcordanceReport;
if(!concordance||!Array.isArray(concordance.blocks))throw new Error("input lacks positionalPoolConcordance.blocks; run research:regime-analysis first");
const report=analyzePositionalPoolNullControls(concordance,{replications:Number(process.env.TRIS_POSITIONAL_POOL_NULL_REPS??999),minimumPairs:Number(process.env.TRIS_POSITIONAL_POOL_NULL_MIN_PAIRS??3),seed:Number(process.env.TRIS_POSITIONAL_POOL_NULL_SEED??20261202)});
const dir=resolve("reports/positional-pool-null-controls");await mkdir(dir,{recursive:true});const generatedAt=new Date().toISOString();
await writeFile(resolve(dir,"latest.json"),JSON.stringify({generatedAt,input, ...report},null,2)+"\n","utf8");
const pct=(v:number|null)=>v===null?"n/d":(100*v).toFixed(2)+"%";
const md=["# Fase 32 — controles nulos de concordancia posicional-pool","","- Entrada: "+input,"- Réplicas solicitadas: "+report.replications,"- Semilla: "+report.seed,"","| Régimen | Posición | Método | Pool | Métrica | Soporte | Corr. observada | Media nula | DE nula | P2.5 | Mediana | P97.5 | Excedencias | Cola empírica (+1) |","|---|---:|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|",...report.groups.flatMap(g=>g.metrics.map(m=>"| "+g.regimeId+" | R"+(g.position+1)+" | "+g.method+" | "+g.poolSize+" | "+m.metric+" | "+m.support+" | "+(m.observedCorrelation?.toFixed(3)??"n/d")+" | "+(m.nullMean?.toFixed(3)??"n/d")+" | "+(m.nullSd?.toFixed(3)??"n/d")+" | "+(m.nullP025?.toFixed(3)??"n/d")+" | "+(m.nullMedian?.toFixed(3)??"n/d")+" | "+(m.nullP975?.toFixed(3)??"n/d")+" | "+m.exceedances+" / "+m.replications+" | "+pct(m.empiricalTwoSidedTailRate)+" |")),"","## Limitaciones",...report.limitations.map(x=>"- "+x)].join("\n")+"\n";
await writeFile(resolve(dir,"latest.md"),md,"utf8");console.log(md);
