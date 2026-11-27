#!/usr/bin/env tsx
/** Phase 96: moving-block bootstrap from the Phase 94 matched random-control report. */
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {evaluateStructuralMotifBlockBootstrap} from "../src/research/structural-motif-block-bootstrap";
const input=resolve(process.argv[2]??"reports/structural-motif-random-control/latest.json");
const blockSize=Number(process.argv[3]??3),replicates=Number(process.argv[4]??2000),seed=Number(process.argv[5]??960221);
if(!Number.isInteger(blockSize)||blockSize<2||!Number.isInteger(replicates)||replicates<199||!Number.isInteger(seed)){console.error("Usage: npm run research:structural-block-bootstrap -- [phase94-latest.json] [blockSize>=2] [replicates>=199] [integer-seed]");process.exit(2);}
const source=JSON.parse(await readFile(input,"utf8")),rows=source.report?.rows??source.rows;
if(!Array.isArray(rows)||!rows.length||!rows.every((r:any)=>Number.isInteger(r.targetDrawId)&&typeof r.family==="string"&&Number.isInteger(r.position)&&typeof r.structuralHit==="boolean"&&typeof r.randomMean==="number")){console.error("Phase 94 report lacks the required per-target fields: targetDrawId, family, position, structuralHit, randomMean.");process.exit(2);}
const report=evaluateStructuralMotifBlockBootstrap(rows,{blockSize,replicates,seed}),out=resolve("reports/structural-motif-block-bootstrap");
await mkdir(out,{recursive:true});await writeFile(resolve(out,"latest.json"),JSON.stringify({sourceReport:input,report},null,2)+"\n");
const pct=(v:number)=>(100*v).toFixed(2)+"%";
const lines=["# Fase 96 — Bootstrap por bloques temporales","","Informe Fase 94: "+input,"Tamaño de bloque: "+blockSize,"Réplicas: "+replicates,"Semilla: "+seed,"Grupos evaluados: "+report.summary.evaluatedGroups,"","| Familia | Pos. | N | Tramos | Δ observada | IC bootstrap 95% | P(Δ > 0) | Lectura |","|---|---:|---:|---:|---:|---:|---:|---|",...report.metrics.map((m:any)=>"| "+m.family+" | "+(m.position+1)+" | "+m.evaluatedTargets+" | "+m.contiguousRuns+" | "+pct(m.observed.difference)+" | "+pct(m.bootstrap.q025)+" a "+pct(m.bootstrap.q975)+" | "+pct(m.bootstrap.probabilityAboveZero)+" | "+m.interpretation+" |"),"","## Grupos excluidos",...report.skipped.map((x:any)=>"- "+x.family+" posición "+(x.position+1)+": "+x.reason+" (N="+x.observations+", mínimo="+x.minimum+")"),"","## Limitaciones",...report.limitations.map((x:string)=>"- "+x)];
await writeFile(resolve(out,"latest.md"),lines.join("\n")+"\n");
console.log("Phase 96: "+report.summary.evaluatedGroups+" groups evaluated; "+report.summary.skippedGroups+" skipped.");
