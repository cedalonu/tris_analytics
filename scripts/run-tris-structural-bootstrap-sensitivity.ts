#!/usr/bin/env tsx
/** Phase 97: compare bootstrap conclusions for block lengths 3, 5 and 7. */
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {evaluateStructuralMotifBootstrapSensitivity} from "../src/research/structural-motif-bootstrap-sensitivity";
const input=resolve(process.argv[2]??"reports/structural-motif-random-control/latest.json");
const blockSizes=(process.argv[3]??"3,5,7").split(",").map(Number),replicates=Number(process.argv[4]??2000),seed=Number(process.argv[5]??970221);
if(!blockSizes.length||blockSizes.some(x=>!Number.isInteger(x)||x<2)||!Number.isInteger(replicates)||replicates<199||!Number.isInteger(seed)){console.error("Usage: npm run research:structural-bootstrap-sensitivity -- [phase94-latest.json] [3,5,7] [replicates>=199] [integer-seed]");process.exit(2);}
const source=JSON.parse(await readFile(input,"utf8")),rows=source.report?.rows??source.rows;
if(!Array.isArray(rows)||!rows.every((r:any)=>Number.isInteger(r.targetDrawId)&&typeof r.family==="string"&&Number.isInteger(r.position)&&typeof r.structuralHit==="boolean"&&typeof r.randomMean==="number")){console.error("Phase 94 report lacks required per-target rows.");process.exit(2);}
const report=evaluateStructuralMotifBootstrapSensitivity(rows,{blockSizes,replicates,seed}),out=resolve("reports/structural-motif-bootstrap-sensitivity");
await mkdir(out,{recursive:true});await writeFile(resolve(out,"latest.json"),JSON.stringify({sourceReport:input,report},null,2)+"\n");
const pct=(v:number)=>(100*v).toFixed(2)+"%";
const lines=["# Fase 97 — Sensibilidad del bootstrap","", "Informe Fase 94: "+input,"Tamaños de bloque: "+blockSizes.join(", "),"Réplicas por tamaño: "+replicates,"Semilla: "+seed,"","| Familia | Pos. | Bloques evaluados | Δ mínima | Δ máxima | Conclusión |","|---|---:|---:|---:|---:|---|",...report.groups.map((g:any)=>"| "+g.family+" | "+(g.position+1)+" | "+g.evaluatedBlockSizes+"/"+blockSizes.length+" | "+pct(g.observedDifferenceRange.minimum)+" | "+pct(g.observedDifferenceRange.maximum)+" | "+g.conclusion+" |"),"","## Detalle por grupo","",...report.groups.flatMap((g:any)=>["### "+g.family+" · posición "+(g.position+1),"","| Bloque | N | Δ | IC 95% | P(Δ > 0) | Lectura |","|---:|---:|---:|---:|---:|---|",...g.byBlock.map((x:any)=>"| "+x.blockSize+" | "+x.evaluatedTargets+" | "+pct(x.observedDifference)+" | "+pct(x.lower)+" a "+pct(x.upper)+" | "+pct(x.probabilityAboveZero)+" | "+x.interpretation+" |"),""]), "## Limitaciones",...report.limitations.map((x:string)=>"- "+x)];
await writeFile(resolve(out,"latest.md"),lines.join("\n")+"\n");
console.log("Phase 97: "+report.summary.groups+" groups; "+report.summary.sensitive+" sensitive; "+report.summary.incomplete+" incomplete.");
