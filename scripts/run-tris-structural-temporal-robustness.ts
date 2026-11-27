#!/usr/bin/env tsx
/** Phase 95: chronological robustness analysis of Phase 94 matched-control rows. */
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {evaluateStructuralMotifTemporalRobustness} from "../src/research/structural-motif-temporal-robustness";
const input=resolve(process.argv[2]??"reports/structural-motif-random-control/latest.json");
const blocks=Number(process.argv[3]??4),minimum=Number(process.argv[4]??5),holdout=Number(process.argv[5]??.25);
if(!Number.isInteger(blocks)||blocks<3||!Number.isInteger(minimum)||minimum<3||!Number.isFinite(holdout)){console.error("Usage: npm run research:structural-temporal-robustness -- [phase94-latest.json] [blocks>=3] [minimum-per-block>=3] [holdout-fraction]");process.exit(2);}
const source=JSON.parse(await readFile(input,"utf8")),rows=source.report?.rows??source.rows;
if(!Array.isArray(rows)||!rows.length||!rows.every((r:any)=>typeof r.structuralHit==="boolean"&&typeof r.randomMean==="number")){console.error("Input must be a Phase94 matched-random-control report with row-level results.");process.exit(2);}
const report=evaluateStructuralMotifTemporalRobustness(rows,{blocks,minimumPerBlock:minimum,holdoutFraction:holdout}),out=resolve("reports/structural-motif-temporal-robustness");
await mkdir(out,{recursive:true});await writeFile(resolve(out,"latest.json"),JSON.stringify({sourceReport:input,report},null,2)+"\n");
const lines=["# Fase 95 — Robustez temporal y holdout cronológico","","Informe Fase94: "+input,"Grupos evaluables: "+report.summary.eligibleFamilyPositions,"Holdouts positivos: "+report.summary.holdoutPositiveGroups,"Grupos robustos: "+report.summary.robustGroups,"","| Familia | Pos. | Entrenamiento | Holdout | Tasa holdout | Aleatorio | Δ | Bloques positivos | Lectura |","|---|---:|---:|---:|---:|---:|---:|---:|---|",...report.metrics.map((m:any)=>"| "+m.family+" | "+(m.position+1)+" | "+m.trainStart+"–"+m.trainEnd+" | "+m.holdoutStart+"–"+m.holdoutEnd+" | "+(100*m.holdout.structuralRate).toFixed(1)+"% | "+(100*m.holdout.randomExpectedRate).toFixed(1)+"% | "+(100*m.holdout.deltaVsRandom).toFixed(1)+" pp | "+m.positiveBlocks+"/"+m.blocksEvaluated+" | "+m.interpretation+" |"),"","## Limitaciones",...report.limitations.map((x:string)=>"- "+x)];
await writeFile(resolve(out,"latest.md"),lines.join("\n")+"\n");
console.log("Phase 95: "+report.summary.eligibleFamilyPositions+" family-position groups evaluated; "+report.summary.robustGroups+" robust by the predefined descriptive rule.");
