#!/usr/bin/env tsx
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {analyzePositionalPoolSensitivity} from "../src/research/positional-pool-temporal-sensitivity";
const list=(v:string|undefined,fallback:number[])=>v? v.split(",").map(Number):fallback;
const report=analyzePositionalPoolSensitivity({
 replications:Number(process.env.TRIS_POSITIONAL_POOL_SENSITIVITY_REPS??250),
 blocksPerReplication:Number(process.env.TRIS_POSITIONAL_POOL_SENSITIVITY_BLOCKS??30),
 windowBlocks:list(process.env.TRIS_POSITIONAL_POOL_SENSITIVITY_WINDOWS,[5,8,10]),
 stepModes:(process.env.TRIS_POSITIONAL_POOL_SENSITIVITY_STEP_MODES??"one,half,non-overlap").split(",") as Array<"one"|"half"|"non-overlap">,
 consistencyThresholds:list(process.env.TRIS_POSITIONAL_POOL_SENSITIVITY_THRESHOLDS,[.7,.8]),
 minimumPairs:Number(process.env.TRIS_POSITIONAL_POOL_STABILITY_MIN_PAIRS??3),
 seed:Number(process.env.TRIS_POSITIONAL_POOL_SENSITIVITY_SEED??20261201)
});
const dir=resolve("reports/positional-pool-temporal-sensitivity");await mkdir(dir,{recursive:true});
const stamp=new Date().toISOString();
await writeFile(resolve(dir,"latest.json"),JSON.stringify({generatedAt:stamp,...report},null,2)+"\n","utf8");
const pct=(x:number)=>((100*x).toFixed(1)+"%");
const md=["# Fase 31 — sensibilidad de estabilidad temporal posicional-pool","","- Generado: "+stamp,"- Réplicas por configuración: "+report.replications,"- Bloques por réplica: "+report.blocksPerReplication,"- Mínimo de pares: "+report.minimumPairs,"","| Ventana | Paso | Consistencia | Falsas alertas nulo | Falsas alertas alternante | Detección + | Detección − | Estable débil |","|---:|---:|---:|---:|---:|---:|---:|---:|",...report.rows.map(r=>"| "+r.windowBlocks+" | "+r.stepBlocks+" | "+pct(r.consistencyThreshold)+" | "+pct(r.nullFalseStableRate)+" | "+pct(r.alternatingFalseStableRate)+" | "+pct(r.positiveDetectionRate)+" | "+pct(r.negativeDetectionRate)+" | "+pct(r.weakPositiveStableRate)+" |"),"","## Limitaciones",...report.limitations.map(x=>"- "+x)].join("\n")+"\n";
await writeFile(resolve(dir,"latest.md"),md,"utf8");console.log(md);
