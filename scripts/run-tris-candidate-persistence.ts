#!/usr/bin/env tsx
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve} from "node:path";
import type {FrozenForecast,ResolvedForecast} from "../src/research/intuition-prospective";
import type {ProspectivePortfolioManifest} from "../src/research/prospective-portfolio-monitor";
import {summarizeProspectiveCandidatePersistence} from "../src/research/prospective-candidate-persistence";
const dir=resolve(process.argv[2]??"data/prospective-portfolio");
async function json<T>(name:string):Promise<T>{return JSON.parse(await readFile(resolve(dir,name),"utf8")) as T;}
async function jsonl<T>(name:string):Promise<T[]>{return(await readFile(resolve(dir,name),"utf8")).split(/\r?\n/).filter(Boolean).map(x=>JSON.parse(x) as T);}
const manifest=await json<ProspectivePortfolioManifest>("portfolio-manifest.json");
const latest=await json<{summary:{lastObservedDrawId:number};manifest:{portfolioId:string}}>("latest-summary.json");
if(latest.manifest?.portfolioId!==manifest.portfolioId){console.error("latest-summary.json no corresponde al manifiesto.");process.exit(1);}
const forecasts=await jsonl<FrozenForecast>("forecasts.jsonl"),results=await jsonl<ResolvedForecast>("results.jsonl");
if(!results.length){console.error("No hay resultados prospectivos resueltos; no se puede auditar persistencia de candidatos.");process.exit(2);}
const report=summarizeProspectiveCandidatePersistence(manifest,forecasts,results,latest.summary.lastObservedDrawId,{blockSize:Number(process.env.TRIS_CANDIDATE_PERSISTENCE_BLOCK_SIZE??25),minimumResolvedDrawsPerBlock:Number(process.env.TRIS_CANDIDATE_PERSISTENCE_MIN_DRAWS??10)});
const out=resolve(dir,"candidate-persistence");await mkdir(out,{recursive:true});
await writeFile(resolve(out,"latest.json"),JSON.stringify({generatedAt:new Date().toISOString(),report},null,2)+"\n","utf8");
const pct=(x:number|null)=>x===null?"n/d":(100*x).toFixed(1)+"%";
const md=["# TRIS — persistencia prospectiva por candidato","", "- Portafolio: "+report.portfolioId,"- Concursos: "+report.firstTargetDrawId+"–"+report.lastObservedDrawId,"- Bloque: "+report.blockSize+" concursos; mínimo resuelto: "+report.minimumResolvedDrawsPerBlock,"","## Resumen por candidato","| Candidato | Familia | Resueltos / esperados | Cobertura | Aciertos | Baseline | Diferencia | Bloques válidos | + / − / 0 | Participación + | Racha + máx. | Diagnóstico |","|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|",...report.candidates.map(c=>"| "+c.candidateId+" | "+c.family+" | "+c.resolvedDraws+" / "+c.expectedDraws+" | "+pct(c.coverage)+" | "+c.hits+" | "+c.baselineHits+" | "+pct(c.overallDifference)+" | "+c.supportedBlocks+" | "+c.positiveBlocks+" / "+c.negativeBlocks+" / "+c.neutralBlocks+" | "+pct(c.positiveBlockShare)+" | "+c.longestPositiveRun+" | "+c.interpretation+" |"),"","## Detalle por bloque","| Candidato | Bloque | Concursos | Resueltos / esperados | Aciertos | Baseline | Diferencia | Estado |","|---|---:|---|---:|---:|---:|---:|---|",...report.candidates.flatMap(c=>c.blocks.map(b=>"| "+c.candidateId+" | "+b.blockIndex+" | "+b.firstDrawId+"–"+b.lastDrawId+(b.partial?" (parcial)":"")+" | "+b.resolvedDraws+" / "+b.expectedDraws+" | "+b.hits+" | "+b.baselineHits+" | "+pct(b.difference)+" | "+b.status+" |")),"","## Limitaciones",...report.limitations.map(x=>"- "+x)].join("\n")+"\n";
await writeFile(resolve(out,"latest.md"),md,"utf8");console.log(md);
