#!/usr/bin/env tsx
/** Read-only phase 93 join of pre-target structure, frozen forecasts and official CSV results. */
import {readFile,readdir,mkdir,writeFile} from "node:fs/promises";
import {resolve,basename} from "node:path";
import {importTrisCsv} from "../src/research/data-adapter";
import {evaluateStructuralMotifProspectiveOutcomes} from "../src/research/structural-motif-prospective-outcome";
import type {HistoricalPackage} from "../src/research/historical-comparison";
import type {FrozenForecast,ResolvedForecast} from "../src/research/intuition-prospective";
const csvPath=process.argv[2],packageDir=process.argv[3],ledgerDir=resolve(process.argv[4]??"data/prospective");
if(!csvPath||!packageDir){console.error("Usage: npm run research:structural-outcome -- <local-Tris.csv> <package-directory> [ledger-directory]");process.exit(2);}
const imported=importTrisCsv(await readFile(resolve(csvPath),"utf8"));
if(imported.validation.errors.length||imported.validation.warnings.some(x=>x.startsWith("draw gap "))){console.error("Official CSV validation failed; evaluation stopped.");[...imported.validation.errors,...imported.validation.warnings.filter(x=>x.startsWith("draw gap "))].slice(0,40).forEach(x=>console.error("- "+x));process.exit(1);}
const names=(await readdir(resolve(packageDir))).filter(x=>x.toLowerCase().endsWith(".json")).sort(),packages:HistoricalPackage[]=[];
for(const name of names){const p=JSON.parse(await readFile(resolve(packageDir,name),"utf8"));const times=(p.snapshots??[]).flatMap((s:any)=>(s.history??[]).map((h:any)=>h.recordedAt)).filter((x:any)=>typeof x==="string").sort();if(times.length)packages.push({id:name,name,date:times.at(-1)!.slice(0,10),package:p});}
async function jsonl<T>(name:string):Promise<T[]>{try{return(await readFile(resolve(ledgerDir,name),"utf8")).split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line) as T);}catch(e){if((e as NodeJS.ErrnoException).code==="ENOENT")return[];throw e;}}
const forecasts=await jsonl<FrozenForecast>("forecasts.jsonl"),resolutions=await jsonl<ResolvedForecast>("results.jsonl");
if(!packages.length||!forecasts.length||!resolutions.length){console.error("Missing evidence: packages="+packages.length+", forecasts="+forecasts.length+", resolutions="+resolutions.length+". No result inferred.");process.exit(2);}
const report=evaluateStructuralMotifProspectiveOutcomes(packages,forecasts,resolutions,imported.validation.valid),out=resolve("reports/structural-motif-prospective-outcome");
await mkdir(out,{recursive:true});await writeFile(resolve(out,"latest.json"),JSON.stringify({sourceCsv:basename(csvPath),packageCount:packages.length,report},null,2)+"\n");
const lines=["# Fase 93 — Motivos estructurales y resultados oficiales TRIS","","CSV: "+basename(csvPath),"Paquetes: "+packages.length,"Pronósticos válidos: "+report.summary.validForecasts,"Lotes con motivos: "+report.summary.structuralMotifBatches,"Grupos puntuados: "+report.summary.evaluatedTargetGroups,"Desajustes CSV: "+report.summary.officialMismatches,"","| Familia | Pos. | N | Candidatos | Pool estructural | Pool total | Estructural | Todos | Base | Δ vs todos | Δ vs base |","|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",...report.metrics.map(m=>"| "+m.family+" | "+(m.position+1)+" | "+m.targetGroups+" | "+m.structuralCandidates+" | "+m.meanStructuralPoolSize.toFixed(2)+" | "+m.meanAllPoolSize.toFixed(2)+" | "+(100*m.structuralRate).toFixed(1)+"% | "+(100*m.allRate).toFixed(1)+"% | "+(100*m.baselineRate).toFixed(1)+"% | "+(100*m.pairedVsAll).toFixed(1)+" pp | "+(100*m.pairedVsBaseline).toFixed(1)+" pp |"),"","## Auditoría temporal","| Concurso | Paquetes previos | Futuros excluidos | Nodos | Candidatos | Estado |","|---:|---:|---:|---:|---:|---|",...report.audits.map(a=>"| "+a.targetDrawId+" | "+a.priorPackages+" | "+a.futurePackagesExcluded+" | "+a.nodes+" | "+a.motifCandidates+" | "+a.status+" |"),"","## Limitaciones",...report.limitations.map(x=>"- "+x)];
await writeFile(resolve(out,"latest.md"),lines.join("\n")+"\n");
console.log("Phase 93: "+report.summary.evaluatedTargetGroups+" scored groups; "+report.summary.structuralMotifBatches+" batches with structural motifs; "+report.summary.officialMismatches+" official mismatches.");
console.log("Report: "+out);
