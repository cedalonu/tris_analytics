#!/usr/bin/env tsx
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve} from "node:path";
import {generateIntuitionCandidates} from "../src/research/intuition-candidate-generator";
import type {FrozenForecast,ResolvedForecast} from "../src/research/intuition-prospective";
import type {ProspectivePortfolioManifest} from "../src/research/prospective-portfolio-monitor";
import {summarizeProspectiveFamilyConcordance} from "../src/research/prospective-family-concordance";
import {summarizeProspectiveFamilyConcordanceStability} from "../src/research/prospective-family-concordance-stability";
const dir=resolve(process.argv[2]??"data/prospective-portfolio");
async function json<T>(name:string):Promise<T>{return JSON.parse(await readFile(resolve(dir,name),"utf8")) as T;}
async function jsonl<T>(name:string):Promise<T[]>{return(await readFile(resolve(dir,name),"utf8")).split(/\r?\n/).filter(Boolean).map(x=>JSON.parse(x) as T);}
const manifest=await json<ProspectivePortfolioManifest>("portfolio-manifest.json");
const latest=await json<{summary:{lastObservedDrawId:number};manifest:{portfolioId:string}}>("latest-summary.json");
if(latest.manifest?.portfolioId!==manifest.portfolioId){console.error("latest-summary.json no corresponde al manifiesto.");process.exit(1);}
const forecasts=await jsonl<FrozenForecast>("forecasts.jsonl"),results=await jsonl<ResolvedForecast>("results.jsonl");
if(!results.length){console.error("No hay resultados prospectivos resueltos; no se genera estabilidad observada.");process.exit(2);}
const observed=summarizeProspectiveFamilyConcordance(manifest,generateIntuitionCandidates(),forecasts,results,latest.summary.lastObservedDrawId);
const stability=summarizeProspectiveFamilyConcordanceStability(observed,{blockSize:Number(process.env.TRIS_CONCORDANCE_BLOCK_SIZE??25),minimumDrawSupport:Number(process.env.TRIS_CONCORDANCE_MIN_BLOCK_DRAWS??10)});
const out=resolve(dir,"family-concordance-stability");await mkdir(out,{recursive:true});
await writeFile(resolve(out,"latest.json"),JSON.stringify({generatedAt:new Date().toISOString(),observed,stability},null,2)+"\n","utf8");
const pct=(x:number|null)=>x===null?"n/d":(100*x).toFixed(1)+"%";
const md=["# TRIS — estabilidad temporal de concordancia","", "- Portafolio: "+stability.portfolioId,"- Concursos: "+stability.firstTargetDrawId+"–"+stability.lastObservedDrawId,"- Tamaño de bloque: "+stability.blockSize,"- Soporte mínimo: "+stability.minimumDrawSupport,"","## Resumen por pareja de familias","| Familias | Bloques válidos | Positivos | Negativos | Mixtos | Insuficientes | Correlación media | Rango correlación | Desv. estándar | Acuerdo direccional | Racha + máx. | Racha − máx. |","|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",...stability.pairs.map(p=>"| "+p.familyA+" / "+p.familyB+" | "+p.supportedBlocks+" | "+p.positiveBlocks+" | "+p.negativeBlocks+" | "+p.mixedBlocks+" | "+p.underpoweredBlocks+" | "+(p.meanCorrelation?.toFixed(3)??"n/d")+" | "+(p.correlationRange?.toFixed(3)??"n/d")+" | "+(p.correlationStdDev?.toFixed(3)??"n/d")+" | "+pct(p.meanDirectionAgreement)+" | "+p.longestPositiveRun+" | "+p.longestNegativeRun+" |"),"","## Detalle por bloque","| Pareja | Bloque | Concursos | Comunes | Correlación | Acuerdo | Estado |","|---|---:|---|---:|---:|---:|---|",...stability.pairs.flatMap(p=>p.blocks.map(b=>"| "+p.familyA+" / "+p.familyB+" | "+b.blockIndex+" | "+b.startDrawId+"–"+b.endDrawId+(b.partial?" (parcial)":"")+" | "+b.commonDraws+" | "+(b.correlation?.toFixed(3)??"n/d")+" | "+pct(b.directionAgreement)+" | "+b.status+" |")),"","## Limitaciones",...stability.limitations.map(x=>"- "+x)].join("\n")+"\n";
await writeFile(resolve(out,"latest.md"),md,"utf8");console.log(md);
