#!/usr/bin/env tsx
/** Phase 94: matched-size random controls using the audited Phase 93 report. */
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {evaluateStructuralMotifRandomControl} from "../src/research/structural-motif-random-control";
const input=resolve(process.argv[2]??"reports/structural-motif-prospective-outcome/latest.json");
const permutations=Number(process.argv[3]??1999),seed=Number(process.argv[4]??940221);
if(!Number.isInteger(permutations)||permutations<99||!Number.isInteger(seed)){console.error("Usage: npm run research:structural-random-control -- [phase93-latest.json] [permutations>=99] [integer-seed]");process.exit(2);}
const source=JSON.parse(await readFile(input,"utf8")),rows=source.report?.rows??source.rows;
if(!Array.isArray(rows)||!rows.length||!rows.every((r:any)=>Array.isArray(r.candidateEntries))){console.error("Phase 93 report lacks candidateEntries. Re-run research:structural-outcome with the updated phase 94-compatible evaluator.");process.exit(2);}
const report=evaluateStructuralMotifRandomControl(rows,{permutations,seed}),out=resolve("reports/structural-motif-random-control");
await mkdir(out,{recursive:true});await writeFile(resolve(out,"latest.json"),JSON.stringify({sourceReport:input,report},null,2)+"\\n");
const lines=["# Fase 94 — Control aleatorio emparejado","","Informe Fase 93: "+input,"Permutaciones: "+permutations,"Semilla: "+seed,"Grupos evaluados: "+report.summary.evaluatedRows,"","| Familia | Pos. | Concursos | Hits estructurales | Tasa | Hits aleatorios esperados | IC aleatorio 95% | Percentil | p empírico | k medio | N medio |","|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",...report.metrics.map((m:any)=>"| "+m.family+" | "+(m.position+1)+" | "+m.evaluatedTargets+" | "+m.structuralHits+" | "+(100*m.structuralRate).toFixed(1)+"% | "+m.randomMeanHits.toFixed(2)+" ± "+m.randomSdHits.toFixed(2)+" | "+m.randomQ025Hits.toFixed(2)+"–"+m.randomQ975Hits.toFixed(2)+" | "+m.percentile.toFixed(1)+" | "+m.pValue.toFixed(4)+" | "+m.meanStructuralCandidates.toFixed(2)+" | "+m.meanUniverseCandidates.toFixed(2)+" |"),"","## Limitaciones",...report.limitations.map((x:string)=>"- "+x)];
await writeFile(resolve(out,"latest.md"),lines.join("\\n")+"\\n");
console.log("Phase 94: "+report.summary.evaluatedRows+" groups evaluated; "+report.metrics.length+" family-position summaries.");
